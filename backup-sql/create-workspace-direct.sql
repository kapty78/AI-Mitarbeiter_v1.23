-- Dieses Skript erstellt einen Workspace für den angegebenen Benutzer
-- Direkte Erstellung ohne Überprüfung, ob der Benutzer existiert

-- Workspace direkt einfügen
INSERT INTO workspaces (
    id,
    user_id,
    name,
    description,
    is_home,
    created_at
) VALUES (
    uuid_generate_v4(),
    'dd47281a-e62a-43a2-9d69-8e32f598c3c7', -- Benutzer-ID aus den Logs
    'Home',
    'My personal workspace',
    true,
    NOW()
);

-- Optionale Prüfung, ob der Workspace erstellt wurde
SELECT * FROM workspaces WHERE user_id = 'dd47281a-e62a-43a2-9d69-8e32f598c3c7'; 