-- Überprüfe Benutzer
SELECT id, email, confirmed_at 
FROM auth.users 
WHERE email = 'nick.wirth@ecomtask.de';

-- Überprüfe Profile
SELECT * FROM profiles 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'nick.wirth@ecomtask.de'
);

-- Überprüfe Workspaces
SELECT * FROM workspaces 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'nick.wirth@ecomtask.de'
);

-- Überprüfe Company Admins
SELECT * FROM company_admins 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email = 'nick.wirth@ecomtask.de'
);

-- Überprüfe Companies
SELECT * FROM companies 
WHERE domain = 'ecomtask.de'; 