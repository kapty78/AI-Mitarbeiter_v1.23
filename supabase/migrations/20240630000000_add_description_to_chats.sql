-- Migration: add_description_to_chats
-- Fügt eine description-Spalte zur chats-Tabelle hinzu, falls sie nicht existiert

-- Prüfen, ob die Spalte bereits existiert
DO $$ 
BEGIN
    -- Hinzufügen der Spalte, wenn sie nicht existiert
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'chats' 
        AND column_name = 'description'
    ) THEN
        ALTER TABLE chats ADD COLUMN description TEXT;
    END IF;
END $$; 