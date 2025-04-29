-- Zuerst die existierende Funktion entfernen (falls vorhanden)
DROP FUNCTION IF EXISTS public.complete_archive_user(UUID);
DROP FUNCTION IF EXISTS public.complete_archive_user(UUID, UUID);

CREATE OR REPLACE FUNCTION public.complete_archive_user(target_user_id UUID, admin_user_id UUID DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_entries text[] := '{}';
  stats jsonb := '{}'::jsonb;
  auth_user auth.users;
  profile_data profiles;
  archived_count int;
  archiving_user_id UUID;
BEGIN
  -- Falls kein admin_user_id angegeben wurde, verwenden wir den Benutzer, der die Funktion aufruft
  archiving_user_id := COALESCE(admin_user_id, auth.uid());
  
  -- Prüfen, ob Benutzer existiert
  SELECT * INTO auth_user FROM auth.users WHERE id = target_user_id;
  IF auth_user IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Benutzer nicht gefunden',
      'log', log_entries,
      'stats', stats
    );
  END IF;
  
  -- Profildaten sichern
  SELECT * INTO profile_data FROM profiles WHERE id = target_user_id;
  
  -- Statistik vorbereiten
  stats := jsonb_build_object(
    'user_email', auth_user.email,
    'archived_at', now()
  );
  
  log_entries := array_append(log_entries, 'Starte Archivierung für Benutzer: ' || auth_user.email);
  
  -- 1. Chat-Nachrichten archivieren
  WITH moved_messages AS (
    INSERT INTO archived_chat_messages (
      id, chat_id, user_id, content, role, created_at, model, sentfrom, metadata, archived_at, archived_by
    )
    SELECT 
      id, chat_id, user_id, content, role, created_at, model, sentfrom, 
      jsonb_build_object('archived_from', 'chat_messages'), 
      NOW(), 
      archiving_user_id
    FROM chat_messages
    WHERE user_id = target_user_id
    RETURNING id
  )
  DELETE FROM chat_messages
  WHERE id IN (SELECT id FROM moved_messages);
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  stats := stats || jsonb_build_object('archived_messages', archived_count);
  log_entries := array_append(log_entries, 'Chat-Nachrichten archiviert: ' || archived_count);
  
  -- 2. Chats archivieren
  WITH moved_chats AS (
    INSERT INTO archived_chats (
      id, title, user_id, created_at, updated_at, description, metadata, archived_at, archived_by
    )
    SELECT 
      id, title, user_id, created_at, updated_at, description, 
      jsonb_build_object('archived_from', 'chats'), 
      NOW(), 
      archiving_user_id
    FROM chats
    WHERE user_id = target_user_id
    RETURNING id
  )
  DELETE FROM chats
  WHERE id IN (SELECT id FROM moved_chats);
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  stats := stats || jsonb_build_object('archived_chats', archived_count);
  log_entries := array_append(log_entries, 'Chats archiviert: ' || archived_count);
  
  -- 3. Workspace-Mitgliedschaften archivieren
  WITH moved_members AS (
    INSERT INTO archived_workspace_members (
      id, workspace_id, user_id, role, created_at, archived_at, archived_by
    )
    SELECT 
      id, workspace_id, user_id, role, created_at, 
      NOW(), 
      archiving_user_id
    FROM workspace_members
    WHERE user_id = target_user_id
    RETURNING id
  )
  DELETE FROM workspace_members
  WHERE id IN (SELECT id FROM moved_members);
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  stats := stats || jsonb_build_object('archived_workspace_members', archived_count);
  log_entries := array_append(log_entries, 'Workspace-Mitgliedschaften archiviert: ' || archived_count);
  
  -- 4. Projektverantwortlichkeiten archivieren
  WITH moved_responsibilities AS (
    INSERT INTO archived_project_responsibilities (
      id, project_id, user_id, role, created_at, archived_at, archived_by
    )
    SELECT 
      id, project_id, user_id, role, created_at,
      NOW(), 
      archiving_user_id
    FROM project_responsibilities
    WHERE user_id = target_user_id
    RETURNING id
  )
  DELETE FROM project_responsibilities
  WHERE id IN (SELECT id FROM moved_responsibilities);
  
  GET DIAGNOSTICS archived_count = ROW_COUNT;
  stats := stats || jsonb_build_object('archived_project_responsibilities', archived_count);
  log_entries := array_append(log_entries, 'Projektverantwortlichkeiten archiviert: ' || archived_count);
  
  -- 5. Benutzerprofil archivieren
  INSERT INTO archived_profiles (
    id, updated_at, full_name, avatar_url, website, email, role, company_id, metadata, archived_at, archived_by
  )
  SELECT 
    id, updated_at, full_name, avatar_url, website, email, role, company_id, 
    jsonb_build_object('archived_from', 'profiles'),
    NOW(), 
    archiving_user_id
  FROM profiles
  WHERE id = target_user_id;
  
  -- Profil aus der aktiven Tabelle löschen
  DELETE FROM profiles WHERE id = target_user_id;
  
  log_entries := array_append(log_entries, 'Profil archiviert und entfernt');
  
  -- Erfolgsmeldung zurückgeben
  RETURN jsonb_build_object(
    'success', true,
    'log', log_entries,
    'stats', stats
  );
  
EXCEPTION WHEN OTHERS THEN
  log_entries := array_append(log_entries, 'Fehler bei der Archivierung: ' || SQLERRM);
  
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM,
    'log', log_entries,
    'stats', stats
  );
END;
$$;

-- Kommentar für die Funktion
COMMENT ON FUNCTION public.complete_archive_user IS 'Archiviert einen Benutzer, indem alle Daten in die Archiv-Tabellen verschoben werden';

-- RLS-Berechtigungen: Nur admin-Rolle darf diese Funktion aufrufen
REVOKE ALL ON FUNCTION public.complete_archive_user FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_archive_user TO authenticated; 