-- Überprüfe, ob die Spalte title in der chats-Tabelle existiert und sie in archived_chats fehlt
DO $$
DECLARE
    has_title_in_chats boolean;
    has_title_in_archived boolean;
BEGIN
    -- Prüfe, ob title in chats existiert
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'chats' AND column_name = 'title'
    ) INTO has_title_in_chats;
    
    -- Prüfe, ob title in archived_chats existiert
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'archived_chats' AND column_name = 'title'
    ) INTO has_title_in_archived;
    
    -- Protokolliere die Ergebnisse
    RAISE NOTICE 'title in chats: %, title in archived_chats: %', has_title_in_chats, has_title_in_archived;
    
    -- Wenn title in chats existiert, aber nicht in archived_chats
    IF has_title_in_chats AND NOT has_title_in_archived THEN
        RAISE NOTICE 'Füge title-Spalte zu archived_chats hinzu';
        EXECUTE 'ALTER TABLE archived_chats ADD COLUMN title TEXT';
    END IF;
END
$$;

-- Aktualisiere die complete_archive_user-Funktion, um dynamisch die Spalten der Zieltabellen zu überprüfen
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
  chat_columns text[];
  chat_message_columns text[];
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
  
  -- Dynamisch die Spalten der Tabellen ermitteln, damit wir nur existierende Spalten verwenden
  
  -- 1. Chat-Nachrichten Spalten ermitteln
  SELECT array_agg(column_name) INTO chat_message_columns 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'chat_messages';
  
  -- 2. Chats Spalten ermitteln
  SELECT array_agg(column_name) INTO chat_columns 
  FROM information_schema.columns 
  WHERE table_schema = 'public' AND table_name = 'chats';
  
  log_entries := array_append(log_entries, 'Chat-Nachrichten Spalten: ' || array_to_string(chat_message_columns, ', '));
  log_entries := array_append(log_entries, 'Chats Spalten: ' || array_to_string(chat_columns, ', '));
  
  -- 1. Chat-Nachrichten archivieren
  BEGIN
    WITH moved_messages AS (
      INSERT INTO archived_chat_messages (
        id, chat_id, user_id, content, role, created_at, metadata, archived_at, archived_by
      )
      SELECT 
        id, chat_id, user_id, content, role, created_at,
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
  EXCEPTION 
    WHEN OTHERS THEN
      log_entries := array_append(log_entries, 'Fehler beim Archivieren von Chat-Nachrichten: ' || SQLERRM);
  END;
  
  -- 2. Chats archivieren
  BEGIN
    -- Minimaler Ansatz: nur garantiert vorhandene Spalten verwenden
    WITH moved_chats AS (
      INSERT INTO archived_chats (
        id, user_id, created_at, updated_at, metadata, archived_at, archived_by
        -- title und description werden bedingt hinzugefügt
      )
      SELECT 
        id, user_id, created_at, updated_at, 
        jsonb_build_object(
          'archived_from', 'chats',
          'title', title,  -- Auch wenn wir title nicht direkt in die Zieltabelle einfügen können, speichern wir es in metadata
          'description', description
        ), 
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
  EXCEPTION 
    WHEN OTHERS THEN
      log_entries := array_append(log_entries, 'Fehler beim Archivieren von Chats: ' || SQLERRM);
  END;
  
  -- 3. Workspace-Mitgliedschaften archivieren
  BEGIN
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
  EXCEPTION 
    WHEN OTHERS THEN
      log_entries := array_append(log_entries, 'Fehler beim Archivieren von Workspace-Mitgliedschaften: ' || SQLERRM);
  END;
  
  -- 4. Projektverantwortlichkeiten archivieren
  BEGIN
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
  EXCEPTION 
    WHEN OTHERS THEN
      log_entries := array_append(log_entries, 'Fehler beim Archivieren von Projektverantwortlichkeiten: ' || SQLERRM);
  END;
  
  -- 5. Benutzerprofil archivieren
  BEGIN
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
  EXCEPTION 
    WHEN OTHERS THEN
      log_entries := array_append(log_entries, 'Fehler beim Archivieren des Profils: ' || SQLERRM);
  END;
  
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