-- SQL-Skript zum Hinzufügen der 'name'-Spalte zur tasks-Tabelle

-- Überprüfen, ob die Spalte 'name' bereits existiert
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'name'
    ) THEN
        -- Hinzufügen der 'name'-Spalte
        ALTER TABLE tasks ADD COLUMN name TEXT;
        
        -- Falls die Spalte 'title' existiert, kopiere die Werte von 'title' nach 'name'
        IF EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = 'tasks' AND column_name = 'title'
        ) THEN
            UPDATE tasks SET name = title;
        END IF;
    END IF;
END $$;

-- Gib eine Nachricht aus zur Bestätigung
SELECT 'Tasks-Tabelle wurde aktualisiert' as message; 