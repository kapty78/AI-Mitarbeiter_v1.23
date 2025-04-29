-- Funktion zum Erstellen eines Company Admin Eintrags mit erweiterten Rechten
CREATE OR REPLACE FUNCTION create_company_admin(p_user_id UUID, p_company_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Diese Funktion wird mit den Rechten des Erstellers ausgeführt
AS $$
BEGIN
  -- Admin-Eintrag direkt in die Tabelle einfügen, umgeht RLS
  INSERT INTO company_admins (user_id, company_id)
  VALUES (p_user_id, p_company_id);
END;
$$; 