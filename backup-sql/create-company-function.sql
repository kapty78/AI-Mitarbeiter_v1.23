-- Erstelle eine Stored Procedure für die Firmenerstellung
CREATE OR REPLACE FUNCTION create_company(company_name TEXT, company_domain TEXT)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_company_id UUID;
  result_json json;
BEGIN
  -- Erstelle die Firma
  INSERT INTO public.companies (name, domain)
  VALUES (company_name, company_domain)
  RETURNING id INTO new_company_id;
  
  -- Erstelle das Ergebnis-JSON
  SELECT json_build_object(
    'id', new_company_id,
    'name', company_name,
    'domain', company_domain
  ) INTO result_json;
  
  RETURN result_json;
EXCEPTION
  WHEN others THEN
    RETURN json_build_object(
      'error', SQLERRM,
      'code', SQLSTATE
    );
END;
$$; 