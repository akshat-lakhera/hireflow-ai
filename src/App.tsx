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
import { AiService } from './services/aiApi';
import { DatabaseService } from './services/databaseService';
import { GmailSyncService } from './services/gmailSyncService';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info';
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
  const [isGmailSyncOpen, setIsGmailSyncOpen] = useState(false);
  const [emailApprovalCandidate, setEmailApprovalCandidate] = useState<CandidateCaseFile | null>(null);
  const [emailApprovalStatus, setEmailApprovalStatus] = useState<CandidateCaseFile['reviewStatus']>('Interview Ready');
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Load real candidates from local IndexedDB vector database on startup
  useEffect(() => {
    DatabaseService.getAllCandidates()
      .then(loaded => {
        // Purge any stale sample/demo cases with dummy IDs
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

        setCandidates(realCandidates);
        if (realCandidates.length > 0) {
          setSelectedCandidateId(realCandidates[0].id);
        }
      })
      .catch(err => console.warn('IndexedDB startup notice:', err));
  }, []);

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

  // Candidate Actions: Update Status & Trigger Human-in-the-Loop Gmail Sync
  const handleUpdateStatus = (
    candidateId: string,
    status: CandidateCaseFile['reviewStatus']
  ) => {
    const candidateToUpdate = candidates.find(c => c.id === candidateId);

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

    // Human-in-the-loop: Prompt HR if candidate is moved to Interview Ready or Passed Screen
    if (candidateToUpdate && (status === 'Interview Ready' || status === 'Passed Screen')) {
      const gmailCfg = GmailSyncService.getConfig();
      if (gmailCfg.autoPromptOnSync) {
        setEmailApprovalCandidate({ ...candidateToUpdate, reviewStatus: status });
        setEmailApprovalStatus(status);
      }
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      
      {/* 1. Opening Landing Page */}
      {view === 'landing' && (
        <LandingPage
          onStartOnboarding={handleStartOnboarding}
          onGoToDashboard={() => setView('dashboard')}
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
          showToast(`Email dispatched to ${receipt.candidateName} via Gmail!`, 'success');
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
                : 'bg-white text-slate-900 border-slate-200'
            }`}
          >
            {t.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : t.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
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
