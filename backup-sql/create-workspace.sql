-- Dieses Skript erstellt einen Workspace für den angegebenen Benutzer
-- Ersetzen Sie USER_ID mit der ID Ihres Benutzers (aus den Logs: dd47281a-e62a-43a2-9d69-8e32f598c3c7)

-- Zuerst überprüfen wir, ob der Benutzer existiert
DO $$
DECLARE
    user_exists boolean;
    user_id uuid := 'dd47281a-e62a-43a2-9d69-8e32f598c3c7'; -- Hier die Benutzer-ID einsetzen
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM auth.users WHERE id = user_id
    ) INTO user_exists;

    IF user_exists THEN
        -- Prüfen, ob bereits ein Home-Workspace existiert
        IF NOT EXISTS (
            SELECT 1 FROM workspaces WHERE user_id = user_id AND is_home = true
        ) THEN
            -- Home-Workspace erstellen
            INSERT INTO workspaces (
                id,
                user_id,
                name,
                description,
                is_home,
                created_at,
                updated_at
            ) VALUES (
                uuid_generate_v4(),
                user_id,
                'Home',
                'My personal workspace',
                true,
                NOW(),
                NOW()
            );
            
            RAISE NOTICE 'Home-Workspace für Benutzer % erstellt', user_id;
        ELSE
            RAISE NOTICE 'Home-Workspace für Benutzer % existiert bereits', user_id;
        END IF;
    ELSE
        RAISE EXCEPTION 'Benutzer mit ID % existiert nicht', user_id;
    END IF;
END $$; 