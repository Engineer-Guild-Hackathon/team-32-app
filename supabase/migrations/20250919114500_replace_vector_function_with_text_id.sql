-- Replace search_items_by_vector to output text identifiers instead of uuid
DROP FUNCTION IF EXISTS search_items_by_vector(vector(512), int, text);

CREATE FUNCTION search_items_by_vector(
  query_embedding vector(512),
  match_count int DEFAULT 10,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  item_id text,
  similarity float
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = vecs, public
AS $$
BEGIN
  IF filter_category IS NOT NULL THEN
    RETURN QUERY
    SELECT
      ev.id AS item_id,
      (ev.vec <#> query_embedding) * -1 AS similarity
    FROM vecs.ec_item_vectors ev
    WHERE ev.metadata->>'category' = filter_category
    ORDER BY ev.vec <#> query_embedding
    LIMIT match_count;
  ELSE
    RETURN QUERY
    SELECT
      ev.id AS item_id,
      (ev.vec <#> query_embedding) * -1 AS similarity
    FROM vecs.ec_item_vectors ev
    ORDER BY ev.vec <#> query_embedding
    LIMIT match_count;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION search_items_by_vector(vector(512), int, text)
  TO authenticated, anon, service_role;
