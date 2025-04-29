-- Dieses Skript fügt die has_messages Spalte zur Tabelle chat_sessions hinzu

DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chat_sessions'
  ) THEN
    -- Prüfen und hinzufügen der has_messages Spalte
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chat_sessions' 
      AND column_name = 'has_messages'
    ) THEN
      ALTER TABLE public.chat_sessions 
      ADD COLUMN has_messages BOOLEAN DEFAULT false;
      
      -- Aktualisiere bestehende Einträge, die Nachrichten haben
      UPDATE public.chat_sessions
      SET has_messages = true
      WHERE id IN (
        SELECT DISTINCT chat_session_id 
        FROM public.chat_messages
      );
      
      RAISE NOTICE 'Spalte has_messages zur Tabelle chat_sessions hinzugefügt und bestehende Einträge aktualisiert';
    ELSE
      RAISE NOTICE 'Spalte has_messages existiert bereits in der Tabelle chat_sessions';
    END IF;
    
    -- Prüfen und hinzufügen des workspace_id Fremdschlüssels, falls noch nicht vorhanden
    IF NOT EXISTS (
      SELECT FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'chat_sessions' 
      AND column_name = 'workspace_id'
    ) THEN
      ALTER TABLE public.chat_sessions 
      ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
      
      RAISE NOTICE 'Spalte workspace_id zur Tabelle chat_sessions hinzugefügt';
    ELSE
      RAISE NOTICE 'Spalte workspace_id existiert bereits in der Tabelle chat_sessions';
    END IF;
  ELSE
    RAISE EXCEPTION 'Tabelle chat_sessions existiert nicht. Bitte zuerst die chat_sessions-Tabelle erstellen.';
  END IF;
END $$;

-- Trigger für automatische Aktualisierung von has_messages hinzufügen
CREATE OR REPLACE FUNCTION update_chat_session_has_messages()
RETURNS TRIGGER AS $BODY$
BEGIN
  UPDATE public.chat_sessions
  SET has_messages = true
  WHERE id = NEW.chat_session_id;
  
  RETURN NEW;
END;
$BODY$ language 'plpgsql';

-- Trigger erstellen, falls er noch nicht existiert
DROP TRIGGER IF EXISTS update_chat_session_has_messages_trigger ON public.chat_messages;

CREATE TRIGGER update_chat_session_has_messages_trigger
AFTER INSERT ON public.chat_messages
FOR EACH ROW
EXECUTE FUNCTION update_chat_session_has_messages(); 