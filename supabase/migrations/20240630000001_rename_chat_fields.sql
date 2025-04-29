-- Migration: rename_chat_fields
-- Ändert den Spaltennamen von 'name' zu 'title', falls beide existieren

DO $$ 
BEGIN
    -- Prüfe, ob die Spalte 'name' existiert und 'title' nicht existiert
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'name'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'title'
    ) THEN
        -- Umbenennen der Spalte 'name' zu 'title'
        ALTER TABLE chats RENAME COLUMN name TO title;
        RAISE NOTICE 'Spalte name wurde zu title umbenannt';
    END IF;
    
    -- Stelle sicher, dass description existiert
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'description'
    ) THEN
        -- Füge description-Spalte hinzu
        ALTER TABLE chats ADD COLUMN description TEXT;
        
        -- Aktualisiere description mit title als Standardwert
        UPDATE chats SET description = title WHERE description IS NULL;
        
        RAISE NOTICE 'Spalte description wurde hinzugefügt und mit title-Werten gefüllt';
    END IF;
END $$; 