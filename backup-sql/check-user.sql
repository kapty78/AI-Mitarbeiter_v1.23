-- Überprüfen, ob der Benutzer in verschiedenen Tabellen existiert

-- In der auth.users Tabelle suchen
SELECT * FROM auth.users WHERE id = 'dd47281a-e62a-43a2-9d69-8e32f598c3c7';

-- Überprüfen, ob es einen Eintrag in der profiles Tabelle gibt
SELECT * FROM profiles WHERE user_id = 'dd47281a-e62a-43a2-9d69-8e32f598c3c7';

-- Alle vorhandenen Workspaces für diesen Benutzer anzeigen
SELECT * FROM workspaces WHERE user_id = 'dd47281a-e62a-43a2-9d69-8e32f598c3c7';

-- Information über alle Benutzer, um zu sehen, ob der Benutzer unter einer anderen ID existiert
SELECT id, email FROM auth.users LIMIT 10; 