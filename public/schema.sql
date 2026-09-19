-- =========================================================
-- TalentDossier PostgreSQL + pgvector Schema Migration
-- Compatible with Supabase & Self-Hosted PostgreSQL 15+
-- =========================================================

-- 1. Enable the vector extension for 384-dimensional embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create the candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  initials TEXT,
  current_role TEXT,
  experience_years INT DEFAULT 0,
  location TEXT,
  email TEXT,
  phone TEXT,
  match_score INT DEFAULT 0,
  fit_badge TEXT DEFAULT 'Needs validation',
  matched_skills JSONB DEFAULT '[]'::jsonb,
  missing_skills JSONB DEFAULT '[]'::jsonb,
  proof_line TEXT,
  review_status TEXT DEFAULT 'Under Review',
  resume_summary TEXT,
  education JSONB DEFAULT '[]'::jsonb,
  experiences JSONB DEFAULT '[]'::jsonb,
  projects JSONB DEFAULT '[]'::jsonb,
  evidence_map JSONB DEFAULT '[]'::jsonb,
  interview_questions JSONB DEFAULT '[]'::jsonb,
  risk_flags JSONB DEFAULT '[]'::jsonb,
  team_notes JSONB DEFAULT '[]'::jsonb,
  audit_trail JSONB DEFAULT '[]'::jsonb,
  -- 384-dimensional vector embedding actively provided by client
  embedding VECTOR(384),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create HNSW Cosine Index for ultra-fast ANN similarity search
CREATE INDEX IF NOT EXISTS candidates_embedding_hnsw_idx 
ON candidates USING hnsw (embedding vector_cosine_ops);

-- 4. Vector Cosine Similarity Search RPC Function
CREATE OR REPLACE FUNCTION match_candidates (
  query_embedding VECTOR(384),
  match_threshold FLOAT DEFAULT 0.2,
  match_count INT DEFAULT 10
)
RETURNS TABLE (
  id TEXT,
  name TEXT,
  current_role TEXT,
  match_score INT,
  fit_badge TEXT,
  matched_skills JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.current_role,
    c.match_score,
    c.fit_badge,
    c.matched_skills,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM candidates c
  WHERE c.embedding IS NOT NULL
    AND 1 - (c.embedding <=> query_embedding) > match_threshold
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- 5. Row Level Security policies (Public Demo Mode)
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon select on candidates"
ON candidates FOR SELECT
TO anon
USING (true);

CREATE POLICY "Allow anon insert/upsert on candidates"
ON candidates FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Allow anon update on candidates"
ON candidates FOR UPDATE
TO anon
USING (true);

CREATE POLICY "Allow anon delete on candidates"
ON candidates FOR DELETE
TO anon
USING (true);
