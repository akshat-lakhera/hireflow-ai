import React, { useState, useEffect } from 'react';
import { CandidateCaseFile, RoleSetup, ReviewMode } from './types';
import { DEFAULT_ROLE, SINGLE_SAMPLE_CASE, SAMPLE_CASE_FILES } from './data/sampleCases';
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
import { AiService } from './services/aiApi';
import { DatabaseService } from './services/databaseService';

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

  // Candidate Pool (Starts with 1 sample reference case)
  const [candidates, setCandidates] = useState<CandidateCaseFile[]>(SAMPLE_CASE_FILES);

  // Review Mode
  const [reviewMode, setReviewMode] = useState<ReviewMode>('recruiter');

  // Selected Candidate for Right Rail & Quick Actions
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>(
    SAMPLE_CASE_FILES[0]?.id || ''
  );

  // Active Modals
  const [detailModalCandidate, setDetailModalCandidate] = useState<CandidateCaseFile | null>(null);
  const [interviewKitCandidate, setInterviewKitCandidate] = useState<CandidateCaseFile | null>(null);
  const [compareCandidates, setCompareCandidates] = useState<CandidateCaseFile[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isAiSettingsOpen, setIsAiSettingsOpen] = useState(false);
  const [isDatabaseSettingsOpen, setIsDatabaseSettingsOpen] = useState(false);
  const [isAutonomousScreenerOpen, setIsAutonomousScreenerOpen] = useState(false);
  const [isAiEvaluating, setIsAiEvaluating] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `toast-${Date.now()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  // Load candidates from local IndexedDB vector database on startup
  useEffect(() => {
    DatabaseService.getAllCandidates()
      .then(loaded => {
        if (loaded && loaded.length > 0) {
          setCandidates(loaded);
          setSelectedCandidateId(loaded[0].id);
        } else {
          // Seed initial benchmark candidate cases into local database with 384-dim vectors
          DatabaseService.saveCandidates(SAMPLE_CASE_FILES).catch(e => console.warn('DB seed notice:', e));
        }
      })
      .catch(err => console.warn('IndexedDB startup notice:', err));
  }, []);

  // Item 4: Dynamic Page Title
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

  const handleTrySampleCase = () => {
    setRole(DEFAULT_ROLE);
    try {
      localStorage.setItem('talentdossier_active_role', JSON.stringify(DEFAULT_ROLE));
    } catch (e) {
      console.warn('LocalStorage error:', e);
    }
    setCandidates([SINGLE_SAMPLE_CASE]);
    setSelectedCandidateId(SINGLE_SAMPLE_CASE.id);
    DatabaseService.saveCandidate(SINGLE_SAMPLE_CASE).catch(e => console.warn('DB save notice:', e));
    setView('dashboard');
  };

  const handleLoadSingleDemoCase = () => {
    setCandidates([SINGLE_SAMPLE_CASE]);
    setSelectedCandidateId(SINGLE_SAMPLE_CASE.id);
    DatabaseService.saveCandidate(SINGLE_SAMPLE_CASE).catch(e => console.warn('DB save notice:', e));
  };

  const handleClearBoard = () => {
    candidates.forEach(c => DatabaseService.deleteCandidate(c.id).catch(e => console.warn('DB delete notice:', e)));
    setCandidates([]);
    setSelectedCandidateId('');
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

    if (uploadedCandidates.length > 0) {
      setCandidates(uploadedCandidates);
      setSelectedCandidateId(uploadedCandidates[0].id);
      DatabaseService.saveCandidates(uploadedCandidates).catch(e => console.warn('DB save notice:', e));
    } else {
      setCandidates([]);
      setSelectedCandidateId('');
    }

    setView('dashboard');
  };

  // Quick Ingestion of candidates from dashboard
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

  // Candidate Actions: Update Status
  const handleUpdateStatus = (
    candidateId: string,
    status: CandidateCaseFile['reviewStatus']
  ) => {
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
            interviewQuestions: c.interviewQuestions.map(q => {
              if (q.id === questionId) {
                return {
                  ...q,
                  candidateAnswer: answerText,
                  isAddressed: true
                };
              }
              return q;
            })
          };
          updatedCandidate = updated;
          DatabaseService.saveCandidate(updated).catch(e => console.warn('DB save notice:', e));
          return updated;
        }
        return c;
      })
    );
    if (updatedCandidate) {
      setInterviewKitCandidate(updatedCandidate);
      if (detailModalCandidate && detailModalCandidate.id === candidateId) {
        setDetailModalCandidate(updatedCandidate);
      }
    }
    showToast('Interview response saved to dossier', 'success');
  };

  // Deep AI Re-evaluation via live Gemini/OpenAI API
  const handleReevaluateWithAi = async (candidate: CandidateCaseFile) => {
    if (!AiService.isConfigured()) {
      setIsAiSettingsOpen(true);
      return;
    }

    setIsAiEvaluating(true);
    try {
      const resumeContent = [
        candidate.resumeSummary,
        candidate.proofLine,
        candidate.experiences.map(e => `${e.company} ${e.role} ${e.highlights.join(' ')}`).join(' '),
        candidate.projects?.map(p => `${p.name} ${p.description}`).join(' ') || ''
      ].join('\n\n');

      const result = await AiService.evaluateWithLLM(resumeContent, role);
      let updatedCandidate: CandidateCaseFile | null = null;

      setCandidates(prev => {
        const next = prev.map(c => {
          if (c.id === candidate.id) {
            const updated = {
              ...c,
              matchScore: result.matchScore,
              fitBadge: result.fitBadge,
              evidenceMap: result.evidenceMap.length > 0 ? result.evidenceMap : c.evidenceMap,
              interviewQuestions: result.interviewQuestions.length > 0 ? result.interviewQuestions : c.interviewQuestions,
              riskFlags: result.riskFlags.length > 0 ? result.riskFlags : c.riskFlags,
              auditTrail: [
                {
                  id: `at-ai-${Date.now()}`,
                  action: 'Deep AI LLM Evaluation Completed',
                  timestamp: 'Just now',
                  note: `Live analysis completed via ${AiService.getConfig().provider.toUpperCase()} (${AiService.getConfig().model}).`
                },
                ...c.auditTrail
              ]
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
          onTrySampleCase={handleTrySampleCase}
          onGoToDashboard={() => setView('dashboard')}
          candidateCount={candidates.length}
        />
      )}

      {/* 2. Full-Screen Role Blueprint Studio */}
      {view === 'onboarding' && (
        <OnboardingWizard
          initialRole={role}
          onComplete={handleOnboardingComplete}
          onCancel={() => setView('dashboard')}
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
          onLoadSingleDemoCase={handleLoadSingleDemoCase}
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

      {/* 4. 404 Fallback View (Item 16: Add 404 page) */}
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
      />


      {/* Global Floating Toast Notifications (Item 14 & 15: Error & Success Messages) */}
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
