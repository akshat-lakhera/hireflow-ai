export type ReviewMode = 'recruiter' | 'interviewer' | 'team_review';

export type CandidateFitBadge = 'Strong fit' | 'Needs validation' | 'High risk';

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
  severity: 'critical' | 'moderate' | 'low';
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

export interface CandidateCaseFile {
  id: string;
  initials: string;
  name: string;
  currentRole: string;
  experienceYears: number;
  location: string;
  matchScore: number; // 0-100
  fitBadge: CandidateFitBadge;
  matchedSkills: string[]; // 3 key matched
  missingSkills: string[]; // 2 missing
  proofLine: string; // e.g. "2 projects, 1 GitHub repo, 1 portfolio"
  reviewStatus: 'Under Review' | 'Interview Ready' | 'Needs Validation' | 'Decision Pending';
  
  // Detailed Case File
  resumeSummary: string;
  education: { degree: string; school: string; year: string }[];
  experiences: { company: string; role: string; duration: string; highlights: string[] }[];
  projects: { name: string; description: string; link?: string }[];
  
  // Intelligence & Mapping
  evidenceMap: EvidenceItem[];
  interviewQuestions: InterviewKitQuestion[];
  riskFlags: RiskFlag[];
  teamNotes: TeamNote[];
  auditTrail: AuditTrailEntry[];
}

export interface RoleSetup {
  title: string;
  seniority: 'Junior' | 'Mid' | 'Senior' | 'Staff/Principal' | 'Lead';
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
  category: string;
  priority: 'high' | 'medium' | 'low';
  learningRoadmap?: string[];
}

export interface InterviewQuestion {
  id: string;
  text: string;
  rationale: string;
  targetSkill: string;
  suggestedFollowUps?: string[];
  candidateResponse?: string;
  aiScore?: number;
}

export interface CandidateScorecard {
  overallScore: number;
  competencyScores: { competency: string; score: number; notes: string }[];
  strengths: string[];
  growthAreas: string[];
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'LEAN_HIRE' | 'LEAN_NO_HIRE' | 'NO_HIRE';
  auditTrailNotes?: string[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  role: string;
  matchScore: number;
  grouping: string;
  matchedRequirements: RequirementMatch[];
  skillGaps: SkillGap[];
  interviewQuestions: InterviewQuestion[];
  scorecard: CandidateScorecard;
  resumeText: string;
  experienceYears?: number;
  workExperience?: any[];
  education?: any[];
  skills?: string[];
}

export interface JobDescription {
  id: string;
  title: string;
  department: string;
  seniority: string;
  requirements: string[];
  niceToHave: string[];
  fullText: string;
}
