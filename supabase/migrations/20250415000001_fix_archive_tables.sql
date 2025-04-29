-- Korrigiere die Struktur der archived_chat_messages-Tabelle
ALTER TABLE archived_chat_messages 
  DROP COLUMN IF EXISTS model,
  DROP COLUMN IF EXISTS sentfrom;

-- Auch wichtig: Stellen wir sicher, dass die anderen Tabellen korrekt sind
-- Prüfen wir, ob die Tabellen und Spalten mit denen der Quelltabellen übereinstimmen

DO $$
DECLARE
    missing_column boolean;
BEGIN
    -- Protokolliere Nachricht
    RAISE NOTICE 'Überprüfe Archivtabellen auf Konsistenz...';

    -- Überprüfe chat_messages -> archived_chat_messages
    SELECT NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'chat_messages' AND table_schema = 'public'
          AND column_name NOT IN ('archived', 'archived_at')
          AND column_name NOT IN (
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = 'archived_chat_messages' AND table_schema = 'public'
          )
    ) INTO missing_column;
    
    IF NOT missing_column THEN
        RAISE NOTICE 'chat_messages hat Spalten, die in archived_chat_messages fehlen!';
    END IF;

    -- Überprüfe chats -> archived_chats
    SELECT NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'chats' AND table_schema = 'public'
          AND column_name NOT IN ('archived', 'archived_at')
          AND column_name NOT IN (
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = 'archived_chats' AND table_schema = 'public'
          )
    ) INTO missing_column;
    
    IF NOT missing_column THEN
        RAISE NOTICE 'chats hat Spalten, die in archived_chats fehlen!';
    END IF;

    -- Überprüfe profiles -> archived_profiles
    SELECT NOT EXISTS (
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'profiles' AND table_schema = 'public'
          AND column_name NOT IN ('archived', 'archived_at')
          AND column_name NOT IN (
              SELECT column_name 
              FROM information_schema.columns 
              WHERE table_name = 'archived_profiles' AND table_schema = 'public'
          )
    ) INTO missing_column;
    
    IF NOT missing_column THEN
        RAISE NOTICE 'profiles hat Spalten, die in archived_profiles fehlen!';
    END IF;
END
$$; 