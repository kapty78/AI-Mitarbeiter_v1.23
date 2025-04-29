-- Lösche alle Daten für den Benutzer in der richtigen Reihenfolge
DELETE FROM workspaces WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'nick.wirth@ecomtask.de');
DELETE FROM profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'nick.wirth@ecomtask.de');
DELETE FROM company_admins WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'nick.wirth@ecomtask.de');
DELETE FROM auth.users WHERE email = 'nick.wirth@ecomtask.de';

-- Überprüfe, ob alle Daten gelöscht wurden
SELECT * FROM auth.users WHERE email = 'nick.wirth@ecomtask.de';
SELECT * FROM profiles WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'nick.wirth@ecomtask.de');
SELECT * FROM workspaces WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'nick.wirth@ecomtask.de'); 