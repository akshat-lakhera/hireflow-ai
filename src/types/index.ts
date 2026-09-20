export type ReviewMode = 'recruiter' | 'interviewer' | 'team_review';

export type CandidateFitBadge = 
  | 'Strong fit' 
  | 'Needs validation' 
  | 'High risk' 
  | 'Moderate fit' 
  | 'Potential gap';

export type EvidenceConfidence = 'High' | 'Medium' | 'Low';

export type EvidenceStatus = 'Verified' | 'Needs validation' | 'Missing';

export type QuestionSeverity = 'Clarify' | 'Validate' | 'Deep dive';

export interface EvidenceItem {
  id: string;
  requirement: string;
  evidenceSource: string;
  snippet: string;
  confidence: EvidenceConfidence;
  status: EvidenceStatus;
}

export interface InterviewKitQuestion {
  id: string;
  category?: string;
  questionText: string;
  targetRequirement: string;
  severityTag: QuestionSeverity;
  followUpProbe: string;
  concernNote?: string;
  candidateAnswer?: string;
  isAddressed?: boolean;
}

export interface RiskFlag {
  id: string;
  label: string;
  severity: 'critical' | 'moderate' | 'low' | 'high' | 'medium';
  details: string;
}

export interface TeamNote {
  id: string;
  author: string;
  text: string;
  timestamp: string;
}

export interface AuditTrailEntry {
  id: string;
  action: string;
  timestamp: string;
  note: string;
}

export interface CandidateProject {
  name: string;
  description: string;
  technologies?: string;
  highlights?: string[];
  link?: string;
}

export interface CandidateCaseFile {
  id: string;
  initials: string;
  name: string;
  currentRole: string;
  experienceYears: number;
  location: string;
  email?: string;
  phone?: string;
  matchScore: number; // 0-100
  fitBadge: CandidateFitBadge;
  matchedSkills: string[]; // key matched
  missingSkills: string[]; // missing / gaps
  proofLine: string; // e.g. "3 projects, 1 GitHub repo, 1 portfolio"
  reviewStatus: 
    | 'Under Review' 
    | 'Interview Ready' 
    | 'Needs Validation' 
    | 'Decision Pending'
    | 'Needs Review'
    | 'Passed Screen'
    | 'Offer Extended'
    | 'Rejected'
    | 'Archived';
  
  // Detailed Case File
  resumeSummary: string;
  education: { degree: string; school: string; year: string }[];
  experiences: { company: string; role: string; duration: string; highlights: string[] }[];
  projects: CandidateProject[];
  
  // Intelligence & Mapping
  evidenceMap: EvidenceItem[];
  interviewQuestions: InterviewKitQuestion[];
  riskFlags: RiskFlag[];
  teamNotes: TeamNote[];
  auditTrail: AuditTrailEntry[];

  // 384-dimensional vector embedding for local & Supabase pgvector search
  embedding?: number[];
  rawText?: string;
  pdfDataUrl?: string;
  createdAt?: string;
  updatedAt?: string;

  // Enterprise Security & Guardrail Telemetry
  adversarialShieldTriggered?: boolean;
  securityAuditNote?: string;
}

export type DatabaseMode = 'indexeddb_vector' | 'supabase_pgvector';

export interface DatabaseConfig {
  mode: DatabaseMode;
  supabaseUrl: string;
  supabaseAnonKey: string;
  tableName: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface DatabaseSyncResult {
  success: boolean;
  syncedCount: number;
  message?: string;
  error?: string;
}

export interface ParseTelemetryStep {
  step: 1 | 2 | 3 | 4;
  title: string;
  detail: string;
  progress: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  timestamp: number;
}

export type TelemetryCallback = (telemetry: ParseTelemetryStep) => void | Promise<void>;

export interface RoleSetup {
  title: string;
  seniority: 'Junior' | 'Mid' | 'Senior' | 'Staff/Principal' | 'Lead' | 'Director/VP' | string;
  teamType: string;
  mustHaveSkills: string[];
  niceToHaveSkills: string[];
  summary: string;
}

// Legacy compatibility types
export interface RequirementMatch {
  requirement: string;
  isMet: boolean;
  evidenceSnippet?: string;
  confidence: number;
  sourceDoc?: string;
}

export interface SkillGap {
  skill: string;
  type: 'hard' | 'soft' | 'domain';
  suggestedAction: string;
}

