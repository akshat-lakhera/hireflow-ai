export type CandidateGroup = 
  | 'Top Contender' 
  | 'Strong Technical Fit' 
  | 'Needs Technical Validation' 
  | 'High Gap Risk';

export type RequirementStatus = 'fulfilled' | 'partial' | 'missing';

export interface RequirementMatch {
  requirement: string;
  status: RequirementStatus;
  evidenceSnippet: string;
  resumeLineRef?: string;
  relevanceWeight: number; // 1-5
}

export interface SkillGap {
  skillOrArea: string;
  severity: 'critical' | 'moderate' | 'minor';
  rationale: string;
  suggestedValidation: string;
}

export interface WorkExperience {
  company: string;
  role: string;
  duration: string;
  highlights: string[];
  citations: string[];
}

export interface ProjectEvidence {
  name: string;
  description: string;
  techStack: string[];
  claims: string[];
}

export interface InterviewQuestion {
  id: string;
  questionText: string;
  category: 'architecture' | 'distributed_systems' | 'concurrency' | 'system_design' | 'resume_probe' | 'behavioral';
  targetResumeClaim: string;
  rationale: string;
  mappedJDRequirement: string;
  candidateAnswer?: string;
  answerDepthRating?: 'shallow' | 'moderate' | 'deep';
  criticFeedback?: string;
  wasProbed: boolean;
  probeQuestion?: string;
  probeAnswer?: string;
  finalScore?: number; // 1-10
}

export interface CandidateScorecard {
  overallScore: number; // 0-100
  recommendation: 'STRONG_HIRE' | 'HIRE' | 'LEANING_HIRE' | 'LEANING_NO_HIRE' | 'NO_HIRE';
  executiveSummary: string;
  strengths: string[];
  validatedCompetencies: {
    skill: string;
    evidenceQuote: string;
    rating: number; // 1-5
  }[];
  identifiedWeaknessesOrGaps: {
    area: string;
    details: string;
    suggestedFollowUp: string;
  }[];
  unansweredEvaluationAreas: string[];
  auditTrail: {
    claim: string;
    sourceInResume: string;
    verifiedInInterview: boolean;
    interviewerNote: string;
  }[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  roleApplied: string;
  experienceYears: number;
  location: string;
  summary: string;
  skills: string[];
  experiences: WorkExperience[];
  education: {
    degree: string;
    institution: string;
    year: string;
  }[];
  projects: ProjectEvidence[];
  
  // Evaluation Telemetry
  matchScore: number; // 0-100
  matchBreakdown: {
    technicalSkills: number; // 0-100
    architectureDepth: number; // 0-100
    experienceRelevance: number; // 0-100
    communicationPotential: number; // 0-100
    riskPenalty: number; // 0-100
  };
  matchedRequirements: RequirementMatch[];
  missingGaps: SkillGap[];
  grouping: CandidateGroup;
  
  // Interview state
  interviewStatus: 'pending' | 'in_progress' | 'completed';
  questions: InterviewQuestion[];
  scorecard?: CandidateScorecard;
  notes?: string;
}

export interface JobDescription {
  id: string;
  title: string;
  department: string;
  level: string;
  location: string;
  summary: string;
  coreRequirements: string[];
  preferredQualifications: string[];
  keyResponsibilities: string[];
  minimumYearsExperience: number;
}
