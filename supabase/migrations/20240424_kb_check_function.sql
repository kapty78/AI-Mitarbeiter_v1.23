-- Function to check if a knowledge base exists
-- This function can be called with RPC and bypasses RLS
CREATE OR REPLACE FUNCTION public.check_knowledge_base_exists(kb_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER -- Run with privileges of the function creator
SET search_path = public
AS $$
DECLARE
  exists_check boolean;
BEGIN
  -- Simple check if the knowledge base exists
  SELECT EXISTS(
    SELECT 1 FROM knowledge_bases WHERE id = kb_id
  ) INTO exists_check;
  
  RETURN exists_check;
END;
$$;

-- Permissions: only authenticated users can call this function
REVOKE ALL ON FUNCTION public.check_knowledge_base_exists(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_knowledge_base_exists(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_knowledge_base_exists(uuid) TO service_role;
