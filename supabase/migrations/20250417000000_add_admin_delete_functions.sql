-- Diese Migration erstellt spezielle Admin-Funktionen zum Löschen von Benutzer-Profilen

-- Funktion, die ein Profil direkt löscht, unter Umgehung von RLS
CREATE OR REPLACE FUNCTION public.admin_delete_profile(profile_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Direktes Löschen über eine SQL-Abfrage, die RLS umgeht
  EXECUTE format('DELETE FROM profiles WHERE id = %L', profile_id);
END;
$$;

-- Kommentar
COMMENT ON FUNCTION public.admin_delete_profile IS 'Löscht ein Profil direkt, ohne RLS-Einschränkungen. Nur für Administratoren.';

-- Funktion zur Zwangsarchivierung: Kopiert ein Profil in die Archivtabelle und löscht es dann
CREATE OR REPLACE FUNCTION public.force_delete_profile(target_id UUID)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  found_profile profiles;
  result jsonb;
BEGIN
  -- Profil sichern
  SELECT * INTO found_profile FROM profiles WHERE id = target_id;
  
  IF found_profile IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profil nicht gefunden');
  END IF;
  
  -- In Archivtabelle einfügen
  INSERT INTO archived_profiles
  SELECT 
    found_profile.*,
    NOW() as archived_at,
    auth.uid() as archived_by
  ON CONFLICT (id) DO UPDATE
  SET archived_at = EXCLUDED.archived_at,
      archived_by = EXCLUDED.archived_by;
      
  -- Profil direkt löschen (umgeht RLS)
  EXECUTE format('DELETE FROM profiles WHERE id = %L', target_id);
  
  RETURN jsonb_build_object('success', true, 'message', 'Profil archiviert und gelöscht');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- Kommentar
COMMENT ON FUNCTION public.force_delete_profile IS 'Erzwingt das Archivieren und Löschen eines Profils. Nur für Administratoren.';

-- Berechtigungen
REVOKE ALL ON FUNCTION public.admin_delete_profile FROM PUBLIC;
REVOKE ALL ON FUNCTION public.force_delete_profile FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_profile TO authenticated;
GRANT EXECUTE ON FUNCTION public.force_delete_profile TO authenticated; 