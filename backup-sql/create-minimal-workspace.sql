-- Minimales Workspace-Erstellungsskript
-- Verwendet nur die garantiert vorhandenen Felder

-- Workspace mit minimalen Feldern einfügen
INSERT INTO workspaces (
    id,
    user_id,
    name,
    is_home
) VALUES (
    uuid_generate_v4(),
    'dd47281a-e62a-43a2-9d69-8e32f598c3c7', -- Benutzer-ID aus den Logs
    'Home',
    true
);

-- Überprüfen, ob der Workspace erstellt wurde
SELECT * FROM workspaces WHERE user_id = 'dd47281a-e62a-43a2-9d69-8e32f598c3c7'; 