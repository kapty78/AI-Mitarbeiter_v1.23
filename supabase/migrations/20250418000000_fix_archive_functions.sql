-- Verbesserte Archivierungsfunktion, die Transaktionen verwendet, um sicherzustellen, dass Daten korrekt archiviert werden

-- Löschen bestehender Funktionen, um sie neu zu erstellen
DROP FUNCTION IF EXISTS public.admin_delete_profile(UUID);
DROP FUNCTION IF EXISTS public.force_delete_profile(UUID);

-- Transaktionale Archivierungs- und Löschfunktion
CREATE OR REPLACE FUNCTION public.complete_archive_user_transaction(target_user_id UUID, admin_user_id UUID DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_entries text[] := '{}';
  stats jsonb := '{}'::jsonb;
  archiving_user_id UUID;
  archived_count int;
  profile_record profiles;
  chats_cursor refcursor;
  workspace_members_cursor refcursor;
  current_chat chats;
  current_member workspace_members;
BEGIN
  -- Transaktion starten
  -- WICHTIG: Die ganze Funktion läuft in einer Transaktion
  
  -- Falls kein admin_user_id angegeben wurde, Benutzer-ID des Aufrufers verwenden
  archiving_user_id := COALESCE(admin_user_id, auth.uid());
  
  -- 1. Profildaten laden und archivieren
  SELECT * INTO profile_record FROM profiles WHERE id = target_user_id;
  
  IF profile_record IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Benutzer nicht gefunden',
      'log', log_entries,
      'stats', stats
    );
  END IF;
  
  -- Profil in archived_profiles einfügen, vor dem Löschen
  INSERT INTO archived_profiles (
    id, updated_at, full_name, avatar_url, website, email, role, company_id,
    archived_at, archived_by
  )
  VALUES (
    profile_record.id, 
    profile_record.updated_at,
    profile_record.full_name,
    profile_record.avatar_url,
    profile_record.website,
    profile_record.email,
    profile_record.role,
    profile_record.company_id,
    NOW(),
    archiving_user_id
  )
  ON CONFLICT (id) DO UPDATE
  SET archived_at = EXCLUDED.archived_at,
      archived_by = EXCLUDED.archived_by;
  
  log_entries := array_append(log_entries, 'Profil in Archivtabelle gesichert');
  
  -- 2. Chats archivieren
  OPEN chats_cursor FOR 
    SELECT * FROM chats WHERE user_id = target_user_id;
  
  archived_count := 0;
  LOOP
    FETCH chats_cursor INTO current_chat;
    EXIT WHEN NOT FOUND;
    
    -- Chat in Archivtabelle verschieben
    INSERT INTO archived_chats (
      id, title, user_id, created_at, updated_at, description, 
      archived_at, archived_by
    )
    VALUES (
      current_chat.id,
      current_chat.title,
      current_chat.user_id,
      current_chat.created_at,
      current_chat.updated_at,
      current_chat.description,
      NOW(),
      archiving_user_id
    )
    ON CONFLICT (id) DO UPDATE
    SET archived_at = EXCLUDED.archived_at,
        archived_by = EXCLUDED.archived_by;
    
    archived_count := archived_count + 1;
  END LOOP;
  CLOSE chats_cursor;
  
  stats := stats || jsonb_build_object('archived_chats', archived_count);
  log_entries := array_append(log_entries, 'Chats archiviert: ' || archived_count);
  
  -- Chat-Nachrichten werden bereits korrekt archiviert, das behalten wir bei
  
  -- 3. Workspace-Mitgliedschaften archivieren
  OPEN workspace_members_cursor FOR 
    SELECT * FROM workspace_members WHERE user_id = target_user_id;
  
  archived_count := 0;
  LOOP
    FETCH workspace_members_cursor INTO current_member;
    EXIT WHEN NOT FOUND;
    
    -- Mitgliedschaft in Archivtabelle verschieben
    INSERT INTO archived_workspace_members (
      id, workspace_id, user_id, role, created_at,
      archived_at, archived_by
    )
    VALUES (
      current_member.id,
      current_member.workspace_id,
      current_member.user_id,
      current_member.role,
      current_member.created_at,
      NOW(),
      archiving_user_id
    )
    ON CONFLICT (id) DO UPDATE
    SET archived_at = EXCLUDED.archived_at,
        archived_by = EXCLUDED.archived_by;
    
    archived_count := archived_count + 1;
  END LOOP;
  CLOSE workspace_members_cursor;
  
  stats := stats || jsonb_build_object('archived_workspace_members', archived_count);
  log_entries := array_append(log_entries, 'Workspace-Mitgliedschaften archiviert: ' || archived_count);
  
  -- 4. Jetzt alle Daten löschen (in umgekehrter Reihenfolge der Abhängigkeiten)
  -- Zuerst abhängige Daten löschen, erst dann das Profil
  
  -- 4.1 Chat-Nachrichten löschen
  DELETE FROM chat_messages WHERE user_id = target_user_id;
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  log_entries := array_append(log_entries, 'Chat-Nachrichten gelöscht: ' || archived_count);
  
  -- 4.2 Chats löschen
  DELETE FROM chats WHERE user_id = target_user_id;
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  log_entries := array_append(log_entries, 'Chats gelöscht: ' || archived_count);
  
  -- 4.3 Workspace-Mitgliedschaften löschen
  DELETE FROM workspace_members WHERE user_id = target_user_id;
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  log_entries := array_append(log_entries, 'Workspace-Mitgliedschaften gelöscht: ' || archived_count);
  
  -- 4.4 Projektverantwortlichkeiten löschen
  DELETE FROM project_responsibilities WHERE user_id = target_user_id;
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  log_entries := array_append(log_entries, 'Projektverantwortlichkeiten gelöscht: ' || archived_count);
  
  -- 4.5 Zuletzt das Profil löschen
  DELETE FROM profiles WHERE id = target_user_id;
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  
  IF archived_count > 0 THEN
    log_entries := array_append(log_entries, 'Profil gelöscht');
  ELSE
    log_entries := array_append(log_entries, 'Profil bereits gelöscht oder nicht gefunden');
  END IF;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Benutzer erfolgreich archiviert',
    'log', log_entries,
    'stats', stats
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Bei Fehler Transaktion rückgängig machen und Fehler zurückgeben
  log_entries := array_append(log_entries, 'Fehler bei der Archivierung: ' || SQLERRM);
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'log', log_entries,
    'stats', stats
  );
END;
$$;

-- Umbenannte Funktion für die API-Kompatibilität
CREATE OR REPLACE FUNCTION public.complete_archive_user(target_user_id UUID, admin_user_id UUID DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Einfach an die transaktionale Funktion weiterleiten
  RETURN public.complete_archive_user_transaction(target_user_id, admin_user_id);
END;
$$;

-- Kommentare für die Funktionen
COMMENT ON FUNCTION public.complete_archive_user_transaction IS 'Archiviert einen Benutzer vollständig mit Transaktionsschutz';
COMMENT ON FUNCTION public.complete_archive_user IS 'Archiviert einen Benutzer, Wrapper für die transaktionale Funktion';

-- Berechtigungen
REVOKE ALL ON FUNCTION public.complete_archive_user_transaction FROM PUBLIC;
REVOKE ALL ON FUNCTION public.complete_archive_user FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_archive_user_transaction TO authenticated;
GRANT EXECUTE ON FUNCTION public.complete_archive_user TO authenticated; 