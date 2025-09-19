-- Enable the vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create function for vector similarity search
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
      (ev.embedding <#> query_embedding) * -1 as similarity
    FROM vecs.ec_item_vectors ev
    WHERE ev.metadata->>'category' = filter_category
    ORDER BY ev.embedding <#> query_embedding
    LIMIT match_count;
  ELSE
    RETURN QUERY
    SELECT
      ev.id::uuid as item_id,
      (ev.embedding <#> query_embedding) * -1 as similarity
    FROM vecs.ec_item_vectors ev
    ORDER BY ev.embedding <#> query_embedding
    LIMIT match_count;
  END IF;
END;
$$;

-- Create vecs schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS vecs;

-- Grant usage permission on vecs schema
GRANT USAGE ON SCHEMA vecs TO authenticated;
GRANT USAGE ON SCHEMA vecs TO anon;
GRANT USAGE ON SCHEMA vecs TO service_role;

-- Grant select permission on vecs tables
GRANT SELECT ON ALL TABLES IN SCHEMA vecs TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA vecs TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA vecs TO service_role;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_items_by_vector(vector(512), int, text) TO authenticated;