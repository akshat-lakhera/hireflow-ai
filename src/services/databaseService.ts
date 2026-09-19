import { CandidateCaseFile, DatabaseConfig, DatabaseSyncResult } from '../types';
import { VectorEmbeddingService } from './vectorEmbeddingService';

const DB_NAME = 'hireflow_local_db';
const DB_VERSION = 1;
const STORE_CANDIDATES = 'candidates';
const STORE_CONFIG = 'database_config';

const DEFAULT_CONFIG: DatabaseConfig = {
  mode: 'indexeddb_vector',
  supabaseUrl: '',
  supabaseAnonKey: '',
  tableName: 'candidates',
  autoSync: false,
};

export interface VectorSearchResult {
  candidate: CandidateCaseFile;
  similarity: number;
}

export class DatabaseService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static configCache: DatabaseConfig | null = null;

  /**
   * Initializes or returns the open IndexedDB instance
   */
  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB is not supported in this environment.'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;

        // Store 1: Candidates with 384-dim vector embeddings
        if (!db.objectStoreNames.contains(STORE_CANDIDATES)) {
          const candidateStore = db.createObjectStore(STORE_CANDIDATES, { keyPath: 'id' });
          candidateStore.createIndex('name', 'name', { unique: false });
          candidateStore.createIndex('matchScore', 'matchScore', { unique: false });
          candidateStore.createIndex('reviewStatus', 'reviewStatus', { unique: false });
        }

        // Store 2: Database Configuration
        if (!db.objectStoreNames.contains(STORE_CONFIG)) {
          db.createObjectStore(STORE_CONFIG, { keyPath: 'key' });
        }
      };

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        this.dbPromise = null;
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  /**
   * Loads current database configuration
   */
  public static async getConfig(): Promise<DatabaseConfig> {
    if (this.configCache) {
      return this.configCache;
    }

    try {
      const saved = localStorage.getItem('hireflow_db_config');
      if (saved) {
        this.configCache = { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
        return this.configCache;
      }
    } catch (e) {
      console.warn('Failed reading db config from localStorage:', e);
    }

    this.configCache = { ...DEFAULT_CONFIG };
    return this.configCache;
  }

  /**
   * Saves database configuration
   */
  public static async saveConfig(config: DatabaseConfig): Promise<void> {
    this.configCache = { ...config };
    try {
      localStorage.setItem('hireflow_db_config', JSON.stringify(config));
    } catch (e) {
      console.warn('Failed saving db config to localStorage:', e);
    }
  }

  /**
   * Generates or ensures a 384-dimensional embedding for a candidate
   */
  public static ensureEmbedding(candidate: CandidateCaseFile): number[] {
    if (candidate.embedding && Array.isArray(candidate.embedding) && candidate.embedding.length === VectorEmbeddingService.VECTOR_DIMENSION) {
      return candidate.embedding;
    }

    const textPayload = [
      candidate.name,
      candidate.currentRole,
      candidate.resumeSummary,
      candidate.matchedSkills.join(' '),
      candidate.projects.map(p => `${p.name} ${p.technologies || ''} ${p.description}`).join(' '),
      candidate.experiences.map(e => `${e.company} ${e.role} ${e.highlights?.join(' ') || ''}`).join(' ')
    ].filter(Boolean).join(' ');

    const vector = VectorEmbeddingService.generateEmbedding(textPayload);
    candidate.embedding = vector;
    return vector;
  }

  /**
   * Fetches all candidates from local IndexedDB
   */
  public static async getAllCandidates(): Promise<CandidateCaseFile[]> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CANDIDATES, 'readonly');
      const store = tx.objectStore(STORE_CANDIDATES);
      const req = store.getAll();

      req.onsuccess = () => {
        const candidates = (req.result as CandidateCaseFile[]) || [];
        // Ensure every loaded candidate has a valid 384-dim embedding
        candidates.forEach(c => this.ensureEmbedding(c));
        resolve(candidates);
      };

      req.onerror = () => reject(req.error);
    });
  }

  /**
   * Saves a single candidate to local IndexedDB, actively maintaining its 384-dim embedding
   */
  public static async saveCandidate(candidate: CandidateCaseFile): Promise<CandidateCaseFile> {
    this.ensureEmbedding(candidate);
    candidate.updatedAt = new Date().toISOString();
    if (!candidate.createdAt) {
      candidate.createdAt = new Date().toISOString();
    }

    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CANDIDATES, 'readwrite');
      const store = tx.objectStore(STORE_CANDIDATES);
      const req = store.put(candidate);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // If Supabase autoSync is enabled, trigger cloud sync in the background
    const config = await this.getConfig();
    if (config.mode === 'supabase_pgvector' && config.autoSync && config.supabaseUrl && config.supabaseAnonKey) {
      this.syncCandidateToSupabase(candidate, config).catch(err => {
        console.warn('Background Supabase sync notice:', err);
      });
    }

    return candidate;
  }

  /**
   * Bulk saves candidates to local IndexedDB
   */
  public static async saveCandidates(candidates: CandidateCaseFile[]): Promise<void> {
    const db = await this.getDB();
    candidates.forEach(c => this.ensureEmbedding(c));

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CANDIDATES, 'readwrite');
      const store = tx.objectStore(STORE_CANDIDATES);

      let pending = candidates.length;
      if (pending === 0) {
        resolve();
        return;
      }

      for (const candidate of candidates) {
        const req = store.put(candidate);
        req.onsuccess = () => {
          pending--;
          if (pending === 0) resolve();
        };
        req.onerror = () => reject(req.error);
      }
    });

    const config = await this.getConfig();
    if (config.mode === 'supabase_pgvector' && config.autoSync && config.supabaseUrl && config.supabaseAnonKey) {
      this.syncToSupabase(candidates).catch(err => {
        console.warn('Background Supabase bulk sync notice:', err);
      });
    }
  }

  /**
   * Deletes a candidate by ID
   */
  public static async deleteCandidate(id: string): Promise<void> {
    const db = await this.getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CANDIDATES, 'readwrite');
      const store = tx.objectStore(STORE_CANDIDATES);
      const req = store.delete(id);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    const config = await this.getConfig();
    if (config.mode === 'supabase_pgvector' && config.supabaseUrl && config.supabaseAnonKey) {
      try {
        const url = `${config.supabaseUrl.replace(/\/$/, '')}/rest/v1/${config.tableName}?id=eq.${encodeURIComponent(id)}`;
        await fetch(url, {
          method: 'DELETE',
          headers: {
            apikey: config.supabaseAnonKey,
            Authorization: `Bearer ${config.supabaseAnonKey}`
          }
        });
      } catch (err) {
        console.warn('Cloud delete notice:', err);
      }
    }
  }

  /**
   * Local 384-dimensional vector similarity search
   */
  public static async searchCandidatesVector(
    queryText: string,
    topK = 5,
    similarityThreshold = 0.12
  ): Promise<VectorSearchResult[]> {
    const all = await this.getAllCandidates();
    if (all.length === 0 || !queryText.trim()) {
      return [];
    }

    // 1. Generate 384-dimensional embedding for the natural language query
    const queryVector = VectorEmbeddingService.generateEmbedding(queryText);

    // 2. Compute cosine similarity against all candidates
    const scored: VectorSearchResult[] = [];

    for (const candidate of all) {
      const candidateVec = this.ensureEmbedding(candidate);
      const similarity = VectorEmbeddingService.cosineSimilarity(queryVector, candidateVec);
      if (similarity >= similarityThreshold) {
        scored.push({ candidate, similarity });
      }
    }

    // 3. Sort descending by similarity
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, topK);
  }

  /**
   * CRITICAL ARCHITECTURAL SYNC:
   * Actively delivers the generated 384-dimensional vector array from client-side
   * to Supabase PostgreSQL pgvector column on INSERT/UPSERT.
   */
  public static async syncToSupabase(candidates?: CandidateCaseFile[]): Promise<DatabaseSyncResult> {
    const config = await this.getConfig();
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return {
        success: false,
        syncedCount: 0,
        error: 'Supabase URL and Anon Key must be configured in Database Settings.'
      };
    }

    const toSync = candidates || (await this.getAllCandidates());
    if (toSync.length === 0) {
      return {
        success: true,
        syncedCount: 0,
        message: 'No candidates in local database to sync.'
      };
    }

    const baseUrl = config.supabaseUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/rest/v1/${config.tableName}?on_conflict=id`;

    // Map candidates to PostgreSQL schema, ACTIVELY passing 384-dim array
    const records = toSync.map(candidate => {
      const embedding384 = this.ensureEmbedding(candidate);

      return {
        id: candidate.id,
        name: candidate.name,
        initials: candidate.initials,
        current_role: candidate.currentRole,
        experience_years: candidate.experienceYears,
        location: candidate.location,
        email: candidate.email || null,
        phone: candidate.phone || null,
        match_score: candidate.matchScore,
        fit_badge: candidate.fitBadge,
        matched_skills: candidate.matchedSkills,
        missing_skills: candidate.missingSkills,
        proof_line: candidate.proofLine,
        review_status: candidate.reviewStatus,
        resume_summary: candidate.resumeSummary,
        education: candidate.education,
        experiences: candidate.experiences,
        projects: candidate.projects,
        evidence_map: candidate.evidenceMap,
        interview_questions: candidate.interviewQuestions,
        risk_flags: candidate.riskFlags,
        team_notes: candidate.teamNotes,
        audit_trail: candidate.auditTrail,
        // Actively deliver the generated 384-dimensional vector array for pgvector
        embedding: embedding384,
        updated_at: new Date().toISOString()
      };
    });

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${config.supabaseAnonKey}`,
          Prefer: 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(records)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Supabase PostgREST error (${response.status}): ${errorText}`);
      }

      config.lastSyncedAt = new Date().toISOString();
      await this.saveConfig(config);

      return {
        success: true,
        syncedCount: records.length,
        message: `Successfully synchronized ${records.length} candidate(s) with 384-dim pgvector embeddings to Supabase PostgreSQL.`
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        error: err.message || 'Unknown network error during Supabase sync.'
      };
    }
  }

  /**
   * Helper to sync a single candidate actively delivering its 384-dim vector
   */
  private static async syncCandidateToSupabase(candidate: CandidateCaseFile, config: DatabaseConfig): Promise<void> {
    const baseUrl = config.supabaseUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/rest/v1/${config.tableName}?on_conflict=id`;
    const embedding384 = this.ensureEmbedding(candidate);

    const payload = [{
      id: candidate.id,
      name: candidate.name,
      initials: candidate.initials,
      current_role: candidate.currentRole,
      experience_years: candidate.experienceYears,
      location: candidate.location,
      email: candidate.email || null,
      phone: candidate.phone || null,
      match_score: candidate.matchScore,
      fit_badge: candidate.fitBadge,
      matched_skills: candidate.matchedSkills,
      missing_skills: candidate.missingSkills,
      proof_line: candidate.proofLine,
      review_status: candidate.reviewStatus,
      resume_summary: candidate.resumeSummary,
      education: candidate.education,
      experiences: candidate.experiences,
      projects: candidate.projects,
      evidence_map: candidate.evidenceMap,
      interview_questions: candidate.interviewQuestions,
      risk_flags: candidate.riskFlags,
      team_notes: candidate.teamNotes,
      audit_trail: candidate.auditTrail,
      embedding: embedding384,
      updated_at: new Date().toISOString()
    }];

    await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: config.supabaseAnonKey,
        Authorization: `Bearer ${config.supabaseAnonKey}`,
        Prefer: 'resolution=merge-duplicates'
      },
      body: JSON.stringify(payload)
    });
  }

  /**
   * Pulls candidate records from Supabase into local IndexedDB
   */
  public static async pullFromSupabase(): Promise<DatabaseSyncResult> {
    const config = await this.getConfig();
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return {
        success: false,
        syncedCount: 0,
        error: 'Supabase URL and Anon Key must be configured.'
      };
    }

    const baseUrl = config.supabaseUrl.replace(/\/$/, '');
    const endpoint = `${baseUrl}/rest/v1/${config.tableName}?select=*`;

    try {
      const response = await fetch(endpoint, {
        headers: {
          apikey: config.supabaseAnonKey,
          Authorization: `Bearer ${config.supabaseAnonKey}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch from Supabase (${response.status}): ${errorText}`);
      }

      const rows: any[] = await response.json();
      if (!Array.isArray(rows) || rows.length === 0) {
        return {
          success: true,
          syncedCount: 0,
          message: 'No candidate records found in cloud table.'
        };
      }

      const candidates: CandidateCaseFile[] = rows.map(r => {
        // Parse vector if returned as string "[0.1,0.2,...]"
        let embeddingArray: number[] | undefined;
        if (typeof r.embedding === 'string') {
          try {
            embeddingArray = JSON.parse(r.embedding);
          } catch {
            embeddingArray = r.embedding.replace(/[\[\]]/g, '').split(',').map((n: string) => parseFloat(n.trim()));
          }
        } else if (Array.isArray(r.embedding)) {
          embeddingArray = r.embedding;
        }

        return {
          id: r.id,
          initials: r.initials || (r.name ? r.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'CD'),
          name: r.name,
          currentRole: r.current_role,
          experienceYears: r.experience_years || 0,
          location: r.location || 'Remote',
          email: r.email,
          phone: r.phone,
          matchScore: r.match_score || 0,
          fitBadge: r.fit_badge || 'Needs validation',
          matchedSkills: Array.isArray(r.matched_skills) ? r.matched_skills : [],
          missingSkills: Array.isArray(r.missing_skills) ? r.missing_skills : [],
          proofLine: r.proof_line || '',
          reviewStatus: r.review_status || 'Under Review',
          resumeSummary: r.resume_summary || '',
          education: Array.isArray(r.education) ? r.education : [],
          experiences: Array.isArray(r.experiences) ? r.experiences : [],
          projects: Array.isArray(r.projects) ? r.projects : [],
          evidenceMap: Array.isArray(r.evidence_map) ? r.evidence_map : [],
          interviewQuestions: Array.isArray(r.interview_questions) ? r.interview_questions : [],
          riskFlags: Array.isArray(r.risk_flags) ? r.risk_flags : [],
          teamNotes: Array.isArray(r.team_notes) ? r.team_notes : [],
          auditTrail: Array.isArray(r.audit_trail) ? r.audit_trail : [],
          embedding: embeddingArray
        };
      });

      await this.saveCandidates(candidates);

      config.lastSyncedAt = new Date().toISOString();
      await this.saveConfig(config);

      return {
        success: true,
        syncedCount: candidates.length,
        message: `Imported ${candidates.length} candidate(s) from Supabase into local IndexedDB.`
      };
    } catch (err: any) {
      return {
        success: false,
        syncedCount: 0,
        error: err.message || 'Error pulling candidates from Supabase.'
      };
    }
  }

  /**
   * Tests Supabase connectivity
   */
  public static async testSupabaseConnection(url: string, anonKey: string, tableName = 'candidates'): Promise<{ ok: boolean; message: string }> {
    if (!url || !anonKey) {
      return { ok: false, message: 'URL and Anon Key are required.' };
    }

    try {
      const baseUrl = url.replace(/\/$/, '');
      const endpoint = `${baseUrl}/rest/v1/${tableName}?select=count&limit=1`;
      const res = await fetch(endpoint, {
        method: 'HEAD',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`
        }
      });

      if (res.ok) {
        return { ok: true, message: 'Connection successful! PostgreSQL table is accessible.' };
      } else if (res.status === 404) {
        return { ok: false, message: `Table "${tableName}" was not found. Please run schema.sql in your Supabase SQL Editor.` };
      } else {
        return { ok: false, message: `Authentication failed (HTTP ${res.status}). Verify your Anon Key.` };
      }
    } catch (err: any) {
      return { ok: false, message: `Network error connecting to Supabase: ${err.message}` };
    }
  }

  /**
   * Standalone SQL migration script for Supabase pgvector setup
   */
  public static getPostgresSchemaSQL(): string {
    return `-- =========================================================
-- TalentDossier PostgreSQL + pgvector Schema Migration
-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
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

-- 5. Row Level Security (Allow read/write with anon key for demo)
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
`;
  }
}
