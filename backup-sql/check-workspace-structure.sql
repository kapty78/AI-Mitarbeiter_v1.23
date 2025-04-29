-- Überprüfen der Struktur der workspaces Tabelle

-- Spalten der workspaces Tabelle anzeigen
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'workspaces';

-- Eine Zeile aus der workspaces Tabelle anzeigen (falls vorhanden)
SELECT * FROM workspaces 
LIMIT 1; 