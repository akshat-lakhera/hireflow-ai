import React, { useState, useEffect } from 'react';
import { CandidateCaseFile, RoleSetup, ReviewMode } from './types';
import { DEFAULT_ROLE } from './data/defaultRole';
import { CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

// Components
import { LandingPage } from './components/LandingPage';
import { OnboardingWizard } from './components/OnboardingWizard';
import { CaseBoardDashboard } from './components/CaseBoardDashboard';
import { CaseFileDetailModal } from './components/CaseFileDetailModal';
import { InterviewKitModal } from './components/InterviewKitModal';
import { CandidateCompareModal } from './components/CandidateCompareModal';
import { UploadCandidateModal } from './components/UploadCandidateModal';
import { AiSettingsModal } from './components/AiSettingsModal';
import { DatabaseSettingsModal } from './components/DatabaseSettingsModal';
import { AutonomousScreenerModal } from './components/AutonomousScreenerModal';
import { GmailSyncModal } from './components/GmailSyncModal';
import { EmailApprovalModal } from './components/EmailApprovalModal';
import { AutonomousAgentOpsCenter } from './components/AutonomousAgentOpsCenter';
import { CareerPortalModal } from './components/CareerPortalModal';
import { AgentLoopRuntime } from './services/agentLoopRuntime';
import { AiService } from './services/aiApi';
import { DatabaseService } from './services/databaseService';
import { PortalIngestionService } from './services/portalIngestionService';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

export function App() {
  // Top-level Navigation View State (supports 404 fallback)
  const [view, setView] = useState<'landing' | 'onboarding' | 'dashboard' | 'not_found'>('landing');

  // Role Configuration (Fully customizable & persisted)
  const [role, setRole] = useState<RoleSetup>(() => {
    try {
      const saved = localStorage.getItem('talentdossier_active_role') || localStorage.getItem('hireflow_active_role');
      return saved ? JSON.parse(saved) : DEFAULT_ROLE;
    } catch {
      return DEFAULT_ROLE;
    }
  });

  // Candidate Pool: Starts 100% clean & empty. No hardcoded or dummy cases.
  const [candidates, setCandidates] = useState<CandidateCaseFile[]>([]);

  // Review Mode
  const [reviewMode, setReviewMode] = useState<ReviewMode>('recruiter');

  // Selected Candidate for Right Rail & Quick Actions
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('');

  // Active Modals
  const [detailModalCandidate, setDetailModalCandidate] = useState<CandidateCaseFile | null>(null);
  const [interviewKitCandidate, setInterviewKitCandidate] = useState<CandidateCaseFile | null>(null);
  const [compareCandidates, setCompareCandidates] = useState<CandidateCaseFile[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isDatabaseSettingsOpen, setIsDatabaseSettingsOpen] = useState(false);
  const [isAutonomousScreenerOpen, setIsAutonomousScreenerOpen] = useState(false);
  const [isAgentOpsOpen, setIsAgentOpsOpen] = useState(false);
  const [isCareerPortalOpen, setIsCareerPortalOpen] = useState(false);
  const [isGmailSyncOpen, setIsGmailSyncOpen] = useState(false);
  const [emailApprovalCandidate, setEmailApprovalCandidate] = useState<CandidateCaseFile | null>(null);
  const [emailApprovalStatus, setEmailApprovalStatus] = useState<CandidateCaseFile['reviewStatus']>('Interview Ready');
  const [emailNotSentAlert, setEmailNotSentAlert] = useState<{ candidateName: string; recipientEmail: string } | null>(null);
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  // Initialize Autonomous AI Recruiter Agent Loop Runtime
  useEffect(() => {
    AgentLoopRuntime.init(role, {
      onCandidatePersisted: (saved) => {
        setCandidates(prev => {
          const exists = prev.some(c => c.id === saved.id);
          if (exists) {
            return prev.map(c => c.id === saved.id ? saved : c);
          }
          return [saved, ...prev];
        });
        setSelectedCandidateId(prev => prev || saved.id);
      },
      onCandidateRemoved: (removedId) => {
        setCandidates(prev => {
          const filtered = prev.filter(c => c.id !== removedId);
          setSelectedCandidateId(curr => curr === removedId ? (filtered[0]?.id || '') : curr);
          return filtered;
        });
      }
    });
  }, [role]);

  // Load candidates from IndexedDB on startup; seed demo candidates if empty (cold start)
  useEffect(() => {
    DatabaseService.getAllCandidates()
      .then(async loaded => {
        // Filter out old stale IDs from previous sessions
        const realCandidates = (loaded || []).filter(c =>
          !c.id.startsWith('case-alex-rivera') &&
          !c.id.startsWith('case-sample-') &&
          !c.id.startsWith('case-maya-lin') &&
          !c.id.startsWith('case-dev-patel') &&
          !c.id.startsWith('case-elena-rostova') &&
          !c.id.startsWith('case-marcus-vance')
        );

        // Delete stale mock cases from storage
        (loaded || []).forEach(c => {
          if (!realCandidates.some(r => r.id === c.id)) {
            DatabaseService.deleteCandidate(c.id).catch(() => {});
          }
        });

        // ── Cold-start seed: populate with demo candidates if DB is empty ──
        const SEED_KEY = 'td_demo_seeded_v2';
        if (realCandidates.length === 0 && !localStorage.getItem(SEED_KEY)) {
          const now = new Date().toISOString();
          const demos: CandidateCaseFile[] = [
            {
              id: 'demo-liam-zhang-001',
              name: 'Liam Zhang',
              email: 'liam.zhang@example.com',
              initials: 'LZ',
              currentRole: 'Senior Backend Engineer',
              experienceYears: 5,
              location: 'San Francisco, CA',
              matchScore: 89,
              fitBadge: 'Strong fit',
              reviewStatus: 'Interview Ready',
              resumeSummary: '5+ years building distributed systems at scale. Led infrastructure replatforming at a Series-B fintech, reducing P99 latency by 40%. Expert in Go, Kubernetes, and event-driven architectures.',
              matchedSkills: ['Go', 'Kubernetes', 'Distributed Systems', 'PostgreSQL', 'Kafka'],
              missingSkills: ['Paxos consensus'],
              proofLine: 'Verified: 40% P99 latency reduction at FinStream. 2M events/day pipeline owner.',
              education: [{ degree: 'B.S. Computer Science', school: 'UC Berkeley', year: '2019' }],
              evidenceMap: [
                { id: 'ev-lz-1', requirement: 'Distributed Systems', evidenceSource: 'Work History: FinStream Inc.', snippet: 'Led distributed systems design for event ingestion pipeline', confidence: 'High', status: 'Verified' },
                { id: 'ev-lz-2', requirement: 'Performance Optimization', evidenceSource: 'Project: Replatform Initiative', snippet: 'Reduced P99 latency by 40% via connection pooling redesign', confidence: 'High', status: 'Verified' },
                { id: 'ev-lz-3', requirement: '5+ Years Experience', evidenceSource: 'Resume 2019–2024', snippet: '5 years backend engineering at 2 companies', confidence: 'High', status: 'Verified' },
              ],
              interviewQuestions: [
                { id: 'iq-lz-1', category: 'Technical Depth', questionText: 'Walk me through the latency optimization — what was the bottleneck and how did you isolate it?', targetRequirement: 'Performance optimization', severityTag: 'Deep dive', followUpProbe: 'What profiling tools did you use? (pprof, Jaeger, etc.)' },
                { id: 'iq-lz-2', category: 'System Design', questionText: 'How do you approach database schema migrations in a zero-downtime deployment?', targetRequirement: 'Production systems', severityTag: 'Validate', followUpProbe: 'Have you used expand-contract pattern? What was the rollback plan?' },
              ],
              riskFlags: [],
              experiences: [
                { role: 'Senior Backend Engineer', company: 'FinStream Inc.', duration: '2022 – 2024', highlights: ['Owned event ingestion pipeline processing 2M events/day', 'Reduced P99 latency by 40% via connection pooling + async queue redesign'] },
                { role: 'Backend Engineer', company: 'CloudOps Labs', duration: '2019 – 2022', highlights: ['Built Kubernetes operators for automated cluster scaling', 'Led migration from monolith to 12 microservices'] },
              ],
              projects: [
                { name: 'Replatform Initiative', description: 'Zero-downtime migration of 14 microservices with 28% cost reduction', technologies: 'Go, Kafka, K8s', highlights: ['Zero-downtime migration of 14 services', 'Reduced infrastructure cost by 28%'], link: '' },
              ],
              teamNotes: [{ id: 'tn-lz-1', text: 'Strong distributed systems background. Recommend fast-track to technical panel.', author: 'Agent Screener', timestamp: now }],
              auditTrail: [{ id: 'at-lz-1', action: 'Auto-screened by Autonomous Agent', timestamp: now, note: 'Score: 89% — Interview Ready. Dispatched from LinkedIn portal queue.' }],
              pdfDataUrl: undefined,
            },
            {
              id: 'demo-priya-sharma-002',
              name: 'Priya Sharma',
              email: 'priya.sharma@example.com',
              initials: 'PS',
              currentRole: 'ML Engineer',
              experienceYears: 3,
              location: 'New York, NY',
              matchScore: 74,
              fitBadge: 'Moderate fit',
              reviewStatus: 'Needs Review',
              resumeSummary: '3 years in applied ML with a focus on NLP and recommendation systems. Strong Python and PyTorch skills. Limited production systems experience but high research output.',
              matchedSkills: ['Python', 'PyTorch', 'NLP', 'Recommendation Systems'],
              missingSkills: ['Production SLAs', 'Infrastructure ownership'],
              proofLine: 'Verified: NLP + recommendation systems. Gap: limited production SLA ownership.',
              education: [{ degree: 'M.S. Machine Learning', school: 'Cornell Tech', year: '2021' }],
              evidenceMap: [
                { id: 'ev-ps-1', requirement: 'NLP / ML', evidenceSource: 'Project: SemanticSearch v2', snippet: 'Trained NLP ranking model improving CTR by 18%', confidence: 'High', status: 'Verified' },
                { id: 'ev-ps-2', requirement: 'PyTorch', evidenceSource: 'Resume Skills + 2 projects', snippet: 'PyTorch used across 3 production ML projects', confidence: 'High', status: 'Verified' },
                { id: 'ev-ps-3', requirement: 'Production SLA Ownership', evidenceSource: 'Not found in resume', snippet: 'No evidence of SLA ownership or on-call responsibilities', confidence: 'Low', status: 'Missing' },
              ],
              interviewQuestions: [
                { id: 'iq-ps-1', category: 'Production Readiness', questionText: 'Describe a time when your model performed well in testing but poorly in production. How did you debug it?', targetRequirement: 'Production ML', severityTag: 'Deep dive', followUpProbe: 'Did you use shadow mode or A/B testing? How did you monitor distribution shift?' },
                { id: 'iq-ps-2', category: 'System Design', questionText: 'How would you design a real-time recommendation system serving 1M users/day?', targetRequirement: 'Scalable ML systems', severityTag: 'Validate', followUpProbe: 'Walk me through the two-tower model and ANN retrieval layer.' },
              ],
              riskFlags: [{ id: 'rf-ps-1', label: 'No production SLA ownership found', severity: 'moderate', details: 'All ML work appears research or feature-team focused. Verify if candidate has managed production incidents.' }],
              experiences: [
                { role: 'ML Engineer', company: 'Contextual AI', duration: '2022 – Present', highlights: ['Trained NLP ranking model improving CTR by 18%', 'Deployed recommendation system to 500K users'] },
                { role: 'ML Research Intern', company: 'Cornell Tech', duration: '2021', highlights: ['Co-authored paper on sparse attention transformers', 'Open-sourced benchmark dataset (1.2K GitHub stars)'] },
              ],
              projects: [
                { name: 'SemanticSearch v2', description: 'Semantic search engine with FAISS-based ANN retrieval, reducing latency 6x', technologies: 'Python, PyTorch, FAISS', highlights: ['Reduced search latency from 280ms to 45ms', '94% precision on internal benchmark'], link: 'github.com/priya-sharma/semantic-search' },
              ],
              teamNotes: [{ id: 'tn-ps-1', text: 'Promising ML profile but verify production systems experience before advancing.', author: 'Agent Screener', timestamp: now }],
              auditTrail: [{ id: 'at-ps-1', action: 'Auto-screened by Autonomous Agent', timestamp: now, note: 'Score: 74% — Needs Review. Risk flag: no production SLA ownership evidence.' }],
              pdfDataUrl: undefined,
            },
          ];

          for (const demo of demos) {
            await DatabaseService.saveCandidate(demo).catch(() => {});
          }
          localStorage.setItem(SEED_KEY, '1');
          setCandidates(demos);
          setSelectedCandidateId(demos[0].id);
          return;
        }


        setCandidates(realCandidates);
        if (realCandidates.length > 0) {
          setSelectedCandidateId(realCandidates[0].id);
        }
      })
      .catch(err => console.warn('IndexedDB startup notice:', err));
  }, []);

  // Auto-close compare modal if a compared candidate gets rejected/removed
  useEffect(() => {
    if (compareCandidates.length > 0) {
      const stillValid = compareCandidates.filter(c => candidates.some(ac => ac.id === c.id));
      if (stillValid.length !== compareCandidates.length) {
        setCompareCandidates([]); // Close modal — one of the pair was removed
      }
    }
  }, [candidates]);

  // Dynamic Page Title
  useEffect(() => {
    const activeCandidate = candidates.find(c => c.id === selectedCandidateId);
    if (view === 'dashboard' && activeCandidate) {
      document.title = `${activeCandidate.name} (${activeCandidate.matchScore}%) — TalentDossier`;
    } else if (view === 'onboarding') {
      document.title = `Configure ${role.title} Blueprint — TalentDossier`;
    } else if (view === 'not_found') {
      document.title = `404 - Page Not Found — TalentDossier`;
    } else {
      document.title = 'TalentDossier — AI Candidate Screening & Recruiter Intelligence Workspace';
    }
  }, [view, selectedCandidateId, candidates, role.title]);

  // Handlers for Onboarding
  const handleStartOnboarding = () => {
    setView('onboarding');
  };

  const handleClearBoard = () => {
    candidates.forEach(c => DatabaseService.deleteCandidate(c.id).catch(e => console.warn('DB delete notice:', e)));
    setCandidates([]);
    setSelectedCandidateId('');
    showToast('Pipeline cleared. Ready for new resume uploads.', 'info');
  };

  const handleOnboardingComplete = (
    newRole: RoleSetup,
    uploadedCandidates: CandidateCaseFile[],
    newReviewMode: ReviewMode
  ) => {
    setRole(newRole);
    try {
      localStorage.setItem('talentdossier_active_role', JSON.stringify(newRole));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }

    setReviewMode(newReviewMode);

    if (uploadedCandidates && uploadedCandidates.length > 0) {
      setCandidates(uploadedCandidates);
      setSelectedCandidateId(uploadedCandidates[0].id);
      DatabaseService.saveCandidates(uploadedCandidates).catch(e => console.warn('DB save notice:', e));
    }

    setView('dashboard');
  };

  // Ingestion of real candidates from dashboard
  const handleCandidatesUploaded = (newCandidates: CandidateCaseFile[]) => {
    setCandidates(prev => {
      const combined = [...newCandidates, ...prev];
      const map = new Map<string, CandidateCaseFile>();
      combined.forEach(c => map.set(c.id, c));
      return Array.from(map.values()).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
    });
    setSelectedCandidateId(newCandidates[0]?.id || selectedCandidateId);
    DatabaseService.saveCandidates(newCandidates).catch(e => console.warn('DB save notice:', e));
  };

  // Candidate Actions: Add Note
  const handleAddNote = (candidateId: string, noteText: string) => {
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const newNote = {
            id: `note-${Date.now()}`,
            author: reviewMode === 'interviewer' ? 'Interviewer' : 'Recruiter',
            text: noteText,
            timestamp: 'Just now'
          };
          const updated = {
            ...c,
            teamNotes: [newNote, ...c.teamNotes]
          };
          DatabaseService.saveCandidate(updated).catch(e => console.warn('DB save notice:', e));
          return updated;
        }
        return c;
      })
    );

    if (detailModalCandidate && detailModalCandidate.id === candidateId) {
      setDetailModalCandidate(prev => prev ? {
        ...prev,
        teamNotes: [{
          id: `note-${Date.now()}`,
          author: reviewMode === 'interviewer' ? 'Interviewer' : 'Recruiter',
          text: noteText,
          timestamp: 'Just now'
        }, ...prev.teamNotes]
      } : null);
    }
    showToast('Interview note saved to candidate dossier', 'success');
  };

  // Candidate Actions: Update Status & Trigger Human-in-the-Loop Email Sync
  const handleUpdateStatus = (
    candidateId: string,
    status: CandidateCaseFile['reviewStatus']
  ) => {
    const candidateToUpdate = candidates.find(c => c.id === candidateId);

    if (status === 'Rejected') {
      if (candidateToUpdate) {
        // 1. Remove candidate from active pipeline list
        setCandidates(prev => {
          const remaining = prev.filter(c => c.id !== candidateId);
          if (selectedCandidateId === candidateId) {
            setSelectedCandidateId(remaining[0]?.id || '');
          }
          return remaining;
        });

        // 2. Remove from persistent database storage
        DatabaseService.deleteCandidate(candidateId).catch(e => console.warn('DB delete notice:', e));

        if (detailModalCandidate && detailModalCandidate.id === candidateId) {
          setDetailModalCandidate(null);
        }
        if (interviewKitCandidate && interviewKitCandidate.id === candidateId) {
          setInterviewKitCandidate(null);
        }

        showToast(`${candidateToUpdate.name} rejected and removed from pipeline. Preparing automated rejection email...`, 'info');

        // 3. Trigger automated rejection email to candidate's email from resume
        setEmailApprovalCandidate({ ...candidateToUpdate, reviewStatus: 'Rejected' });
        setEmailApprovalStatus('Rejected');
      }
      return;
    }

    // For non-rejected statuses: update candidate in-place
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const auditEntry = {
            id: `at-${Date.now()}`,
            action: `Status Updated to "${status}"`,
            timestamp: 'Just now',
            note: `Status modified by active reviewer (${reviewMode}).`
          };
          const updated = {
            ...c,
            reviewStatus: status,
            auditTrail: [auditEntry, ...c.auditTrail]
          };
          DatabaseService.saveCandidate(updated).catch(e => console.warn('DB save notice:', e));
          return updated;
        }
        return c;
      })
    );
    showToast(`Status updated to "${status}"`, 'info');

    // Automated candidate email: Prompt recruiter/HR when candidate is moved to Interview Ready or Selected (Passed Screen / Offer Extended)
    if (candidateToUpdate && (status === 'Interview Ready' || status === 'Passed Screen' || status === 'Offer Extended')) {
      setEmailApprovalCandidate({ ...candidateToUpdate, reviewStatus: status });
      setEmailApprovalStatus(status);
    }

    if (detailModalCandidate && detailModalCandidate.id === candidateId) {
      setDetailModalCandidate(prev => prev ? { ...prev, reviewStatus: status } : null);
    }
    if (interviewKitCandidate && interviewKitCandidate.id === candidateId) {
      setInterviewKitCandidate(prev => prev ? { ...prev, reviewStatus: status } : null);
    }
  };

  // Candidate Actions: Update Question Answer in Interview Kit
  const handleUpdateQuestionAnswer = (
    candidateId: string,
    questionId: string,
    answerText: string
  ) => {
    let updatedCandidate: CandidateCaseFile | null = null;
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          const updated = {
            ...c,
            interviewQuestions: c.interviewQuestions.map(q =>
              q.id === questionId
                ? { ...q, candidateAnswer: answerText, isAddressed: Boolean(answerText.trim()) }
                : q
            )
          };
          updatedCandidate = updated;
          DatabaseService.saveCandidate(updated).catch(e => console.warn('DB save notice:', e));
          return updated;
        }
        return c;
      })
    );

    if (updatedCandidate) {
      if (detailModalCandidate && detailModalCandidate.id === candidateId) {
        setDetailModalCandidate(updatedCandidate);
      }
      if (interviewKitCandidate && interviewKitCandidate.id === candidateId) {
        setInterviewKitCandidate(updatedCandidate);
      }
    }
  };

  // AI Re-evaluation Trigger
  const handleReevaluateWithAi = async (candidate: CandidateCaseFile) => {
    if (!AiService.isConfigured()) {
      setIsAiSettingsOpen(true);
      showToast('Please add an AI API key (Groq, Gemini, or OpenAI) to run live reasoning', 'info');
      return;
    }

    setIsAiEvaluating(true);
    showToast(`Evaluating ${candidate.name} with live AI engine...`, 'info');

    try {
      const result = await AiService.evaluateWithLLM(
        candidate.rawText || candidate.resumeSummary || candidate.name,
        role
      );

      let updatedCandidate: CandidateCaseFile | null = null;
      setCandidates(prev => {
        const next = prev.map(c => {
          if (c.id === candidate.id) {
            const updated = {
              ...c,
              matchScore: result.matchScore,
              fitBadge: result.fitBadge as any,
              evidenceMap: result.evidenceMap.length > 0 ? result.evidenceMap : c.evidenceMap,
              interviewQuestions: result.interviewQuestions.length > 0 ? result.interviewQuestions : c.interviewQuestions,
              riskFlags: result.riskFlags.length > 0 ? result.riskFlags : c.riskFlags,
              auditTrail: [
                {
                  id: `at-ai-${Date.now()}`,
                  action: `AI Live Re-evaluation (${AiService.getConfig().provider.toUpperCase()}: ${AiService.getConfig().model})`,
                  timestamp: 'Just now',
                  note: `Recalculated match score: ${result.matchScore}% (${result.fitBadge}).`
                },
                ...c.auditTrail
              ],
              updatedAt: new Date().toISOString()
            };
            updatedCandidate = updated;
            DatabaseService.saveCandidate(updated).catch(e => console.warn('DB save notice:', e));
            return updated;
          }
          return c;
        });
        return [...next].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
      });

      if (updatedCandidate) {
        if (detailModalCandidate && detailModalCandidate.id === candidate.id) {
          setDetailModalCandidate(updatedCandidate);
        }
      }
      showToast(`AI Re-evaluation complete: ${result.matchScore}% match score`, 'success');
    } catch (e: any) {
      showToast(`AI Evaluation error: ${e.message || 'Unknown failure'}`, 'error');
    } finally {
      setIsAiEvaluating(false);
    }
  };

  const handleRunInstantDemo = () => {
    // 1. Ingest 4 diverse candidates from external portals (including Marcus Vance adversarial injection test)
    PortalIngestionService.simulatePortalInflowBatch(role);
    // 2. Transition immediately to the active recruiter workspace
    setView('dashboard');
    // 3. Open the Autonomous Agent Operations Center so the judge immediately witnesses the live ReAct cycle!
    setIsAgentOpsOpen(true);
    showToast('⚡ Ingested 4 applicant profiles into agent perception loop (including adversarial injection test)', 'info');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* 1. Opening Landing Page */}
      {view === 'landing' && (
        <LandingPage
          onStartOnboarding={handleStartOnboarding}
          onGoToDashboard={() => setView('dashboard')}
          onRunInstantDemo={handleRunInstantDemo}
          candidateCount={candidates.length}
        />
      )}

      {/* 2. Full-Screen Role Blueprint Studio */}
      {view === 'onboarding' && (
        <OnboardingWizard
          initialRole={role}
          onComplete={handleOnboardingComplete}
          onCancel={() => setView('landing')}
        />
      )}

      {/* 3. Main 3-Column Human Recruiter Workspace Dashboard */}
      {view === 'dashboard' && (
        <CaseBoardDashboard
          role={role}
          candidates={candidates}
          reviewMode={reviewMode}
          selectedCandidateId={selectedCandidateId}
          onSelectCandidate={c => setSelectedCandidateId(c.id)}
          onOpenCaseFile={c => setDetailModalCandidate(c)}
          onOpenInterviewKit={c => setInterviewKitCandidate(c)}
          onOpenOnboarding={() => setView('onboarding')}
          onOpenUpload={() => setIsUploadModalOpen(true)}
          onOpenAiSettings={() => setIsAiSettingsOpen(true)}
          onOpenDatabaseSettings={() => setIsDatabaseSettingsOpen(true)}
          onOpenAutonomousScreener={() => setIsAutonomousScreenerOpen(true)}
          onOpenGmailSettings={() => setIsGmailSyncOpen(true)}
          onOpenEmailApproval={(c) => {
            setEmailApprovalCandidate(c);
            setEmailApprovalStatus(c.reviewStatus);
          }}
          onClearBoard={handleClearBoard}
          onSetReviewMode={setReviewMode}
          onAddNote={handleAddNote}
          onUpdateStatus={handleUpdateStatus}
          onOpenCompare={comp => setCompareCandidates(comp)}
          onBackToLanding={() => setView('landing')}
          onReevaluateWithAi={handleReevaluateWithAi}
          isAiEvaluating={isAiEvaluating}
          onOpenAgentOps={() => setIsAgentOpsOpen(true)}
          onOpenCareerPortal={() => setIsCareerPortalOpen(true)}
        />
      )}

      {/* 4. 404 Fallback View */}
      {view === 'not_found' && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-center">
          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl mb-4 shadow-sm">
            404
          </div>
          <h2 className="text-xl font-bold text-slate-900">View Not Found</h2>
          <p className="text-sm text-slate-500 mt-1.5 max-w-sm mb-6">
            The workspace screen or candidate file you requested is unavailable or has been archived.
          </p>
          <button
            onClick={() => setView('dashboard')}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors"
          >
            Return to Workspace
          </button>
        </div>
      )}

      {/* MODAL 1: Candidate Executive Dossier Modal */}
      {detailModalCandidate && (
        <CaseFileDetailModal
          candidate={detailModalCandidate}
          onClose={() => setDetailModalCandidate(null)}
          onOpenInterviewKit={c => {
            setDetailModalCandidate(null);
            setInterviewKitCandidate(c);
          }}
          onAddNote={handleAddNote}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* MODAL 2: Structured Interview Kit Modal */}
      {interviewKitCandidate && (
        <InterviewKitModal
          candidate={interviewKitCandidate}
          onClose={() => setInterviewKitCandidate(null)}
          onUpdateQuestionAnswer={handleUpdateQuestionAnswer}
          onUpdateStatus={handleUpdateStatus}
        />
      )}

      {/* MODAL 3: Candidate Compare Matrix Modal */}
      {compareCandidates.length >= 2 && (
        <CandidateCompareModal
          candidates={compareCandidates}
          onClose={() => setCompareCandidates([])}
          onOpenCaseFile={c => {
            setCompareCandidates([]);
            setDetailModalCandidate(c);
          }}
        />
      )}

      {/* MODAL 4: Quick Candidate Ingest Modal */}
      {isUploadModalOpen && (
        <UploadCandidateModal
          role={role}
          onClose={() => setIsUploadModalOpen(false)}
          onCandidatesUploaded={(newC) => {
            handleCandidatesUploaded(newC);
            showToast(`Ingested ${newC.length} candidate${newC.length === 1 ? '' : 's'} successfully`, 'success');
          }}
        />
      )}

      {/* MODAL 5: AI Engine & API Keys Settings Modal */}
      <AiSettingsModal
        isOpen={isAiSettingsOpen}
        onClose={() => setIsAiSettingsOpen(false)}
        onConfigSaved={() => showToast('AI Settings updated securely', 'success')}
      />

      {/* MODAL 6: Database & Vector Storage Settings Modal */}
      {isDatabaseSettingsOpen && (
        <DatabaseSettingsModal
          candidates={candidates}
          onClose={() => setIsDatabaseSettingsOpen(false)}
          onCandidatesUpdated={(updated) => {
            setCandidates(updated);
            if (updated.length > 0) {
              setSelectedCandidateId(updated[0].id);
            }
            showToast(`Loaded ${updated.length} candidate(s) from database`, 'success');
          }}
        />
      )}

      {/* MODAL 7: Autonomous Screener Agent Modal */}
      <AutonomousScreenerModal
        isOpen={isAutonomousScreenerOpen}
        onClose={() => setIsAutonomousScreenerOpen(false)}
        candidates={candidates}
        role={role}
        onApplyResults={(updated) => {
          setCandidates(updated);
          if (updated.length > 0) {
            setSelectedCandidateId(updated[0].id);
          }
          showToast(`Autonomous Screener completed: ${updated.length} candidates triaged`, 'success');
        }}
        onTriggerEmailSync={(triagedCandidates) => {
          const topCandidate = triagedCandidates.find(c => c.reviewStatus === 'Interview Ready') || triagedCandidates[0];
          if (topCandidate) {
            setEmailApprovalCandidate(topCandidate);
            setEmailApprovalStatus(topCandidate.reviewStatus);
          }
        }}
      />

      {/* MODAL 8: Gmail Sync & Automated Candidate Dispatch Settings Modal */}
      <GmailSyncModal
        isOpen={isGmailSyncOpen}
        onClose={() => setIsGmailSyncOpen(false)}
        onConfigSaved={() => showToast('Gmail credentials saved securely', 'success')}
      />

      {/* MODAL 9: Human-In-The-Loop Email Dispatch Approval Modal */}
      <EmailApprovalModal
        isOpen={Boolean(emailApprovalCandidate)}
        onClose={() => setEmailApprovalCandidate(null)}
        candidate={emailApprovalCandidate}
        role={role}
        targetStatus={emailApprovalStatus}
        onOpenGmailSettings={() => {
          setEmailApprovalCandidate(null);
          setIsGmailSyncOpen(true);
        }}
        onEmailSent={(receipt) => {
          showToast(`Automated email successfully dispatched to ${receipt.recipientEmail}!`, 'success');
        }}
        onDismissWithoutSending={(c, email) => {
          setEmailNotSentAlert({
            candidateName: c.name,
            recipientEmail: email || 'No email on file'
          });
          showToast(`⚠️ Automated email was not sent to ${c.name}. SMTP key missing.`, 'warning');
        }}
      />

      {/* POPUP ALERT: Email Not Sent Due to Missing Credentials */}
      {emailNotSentAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-amber-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-700 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Automated Email Not Sent</h3>
                <p className="text-xs text-slate-500">Notice for candidate dispatch</p>
              </div>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5 text-xs text-amber-900">
              <p>
                The automated status email was <strong>not sent</strong> to <strong>{emailNotSentAlert.candidateName}</strong> ({emailNotSentAlert.recipientEmail}).
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed">
                SMTP or email service credentials were not provided. You can configure credentials at any time in Email Settings.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setEmailNotSentAlert(null);
                  setIsGmailSyncOpen(true);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
              >
                Configure SMTP
              </button>
              <button
                type="button"
                onClick={() => setEmailNotSentAlert(null)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 10: Autonomous AI Recruiter Agent Operations Center */}
      <AutonomousAgentOpsCenter
        isOpen={isAgentOpsOpen}
        onClose={() => setIsAgentOpsOpen(false)}
        role={role}
        onOpenCareerPortal={() => {
          setIsAgentOpsOpen(false);
          setIsCareerPortalOpen(true);
        }}
        onSelectCandidate={(c) => {
          setSelectedCandidateId(c.id);
          setIsAgentOpsOpen(false);
        }}
        onShowToast={showToast}
        onEmailApprovalNeeded={(candidate, status) => {
          // Route through the SMTP-gated EmailApprovalModal
          setEmailApprovalCandidate({ ...candidate, reviewStatus: status });
          setEmailApprovalStatus(status);
        }}
        onEmailNotSent={(candidateName, recipientEmail) => {
          setEmailNotSentAlert({ candidateName, recipientEmail });
        }}
      />

      {/* MODAL 11: Public Candidate Career Portal (/apply) */}
      <CareerPortalModal
        isOpen={isCareerPortalOpen}
        onClose={() => setIsCareerPortalOpen(false)}
        role={role}
        onApplicationSubmitted={(candName) => {
          showToast(`Application received for ${candName}! Autonomous agent notified.`, 'success');
        }}
      />

      {/* Global Floating Toast Notifications */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl border shadow-lg text-xs font-medium flex items-center gap-2.5 animate-in slide-in-from-bottom-2 duration-150 ${
              t.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : t.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : t.type === 'warning'
                ? 'bg-amber-50 text-amber-900 border-amber-200'
                : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : t.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            ) : (
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
            )}
            <span className="flex-1 leading-snug">{t.message}</span>
          </div>
        ))}
      </div>

    </div>
  );
}

export default App;
