-- Fix vector column name from 'embedding' to 'vec' in search function
CREATE OR REPLACE FUNCTION search_items_by_vector(
  query_embedding vector(512),
  match_count int DEFAULT 10,
  filter_category text DEFAULT NULL
)
RETURNS TABLE (
  item_id uuid,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  IF filter_category IS NOT NULL THEN
    RETURN QUERY
    SELECT
      ev.id::uuid as item_id,
      (ev.vec <#> query_embedding) * -1 as similarity
    FROM vecs.ec_item_vectors ev
    WHERE ev.metadata->>'category' = filter_category
    ORDER BY ev.vec <#> query_embedding
    LIMIT match_count;
  ELSE
    RETURN QUERY
    SELECT
      ev.id::uuid as item_id,
      (ev.vec <#> query_embedding) * -1 as similarity
    FROM vecs.ec_item_vectors ev
    ORDER BY ev.vec <#> query_embedding
    LIMIT match_count;
  END IF;
END;
$$;