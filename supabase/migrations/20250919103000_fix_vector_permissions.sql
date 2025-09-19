-- Ensure vector search function can access vecs schema on behalf of callers
ALTER FUNCTION search_items_by_vector(vector(512), int, text)
  SECURITY DEFINER;

-- Guard against search_path hijacking when executing the function
ALTER FUNCTION search_items_by_vector(vector(512), int, text)
  SET search_path = vecs, public;

-- Re-grant execute permission explicitly
GRANT EXECUTE ON FUNCTION search_items_by_vector(vector(512), int, text)
  TO authenticated, anon, service_role;

-- Grant select permissions on ec_item_vectors if the collection table already exists
DO $$
BEGIN
  IF to_regclass('vecs.ec_item_vectors') IS NOT NULL THEN
    EXECUTE 'GRANT SELECT ON TABLE vecs.ec_item_vectors TO authenticated, anon, service_role';
  END IF;
END
$$;

-- Ensure future vecs tables created by postgres role inherit the required privileges
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA vecs
  GRANT SELECT ON TABLES TO authenticated, anon, service_role;
