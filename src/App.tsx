import React, { useState } from 'react';
import { CandidateCaseFile, RoleSetup, ReviewMode } from './types';
import { DEFAULT_ROLE, SINGLE_SAMPLE_CASE, SAMPLE_CASE_FILES } from './data/sampleCases';

// Components
import { LandingPage } from './components/LandingPage';
import { OnboardingWizard } from './components/OnboardingWizard';
import { CaseBoardDashboard } from './components/CaseBoardDashboard';
import { CaseFileDetailModal } from './components/CaseFileDetailModal';
import { InterviewKitModal } from './components/InterviewKitModal';
import { CandidateCompareModal } from './components/CandidateCompareModal';
import { UploadCandidateModal } from './components/UploadCandidateModal';

export function App() {
  // Top-level Navigation View State
  const [view, setView] = useState<'landing' | 'onboarding' | 'dashboard'>('landing');

  // Role Configuration (Fully customizable)
  const [role, setRole] = useState<RoleSetup>(DEFAULT_ROLE);

  // Candidate Pool (Starts with 1 sample reference case, but can be cleared or populated dynamically)
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

  // Handlers for Onboarding
  const handleStartOnboarding = () => {
    setView('onboarding');
  };

  const handleTrySampleCase = () => {
    setRole(DEFAULT_ROLE);
    setCandidates([SINGLE_SAMPLE_CASE]);
    setSelectedCandidateId(SINGLE_SAMPLE_CASE.id);
    setView('dashboard');
  };

  const handleLoadSingleDemoCase = () => {
    setCandidates([SINGLE_SAMPLE_CASE]);
    setSelectedCandidateId(SINGLE_SAMPLE_CASE.id);
  };

  const handleClearBoard = () => {
    setCandidates([]);
    setSelectedCandidateId('');
  };

  const handleOnboardingComplete = (
    newRole: RoleSetup,
    uploadedCandidates: CandidateCaseFile[],
    newReviewMode: ReviewMode
  ) => {
    setRole(newRole);
    setReviewMode(newReviewMode);

    if (uploadedCandidates.length > 0) {
      setCandidates(uploadedCandidates);
      setSelectedCandidateId(uploadedCandidates[0].id);
    } else {
      // If no files uploaded during wizard, start with an empty board ready for upload
      setCandidates([]);
      setSelectedCandidateId('');
    }

    setView('dashboard');
  };

  // Quick Ingestion of candidates from dashboard
  const handleCandidatesUploaded = (newCandidates: CandidateCaseFile[]) => {
    setCandidates(prev => [...newCandidates, ...prev]);
    setSelectedCandidateId(newCandidates[0]?.id || selectedCandidateId);
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
          return {
            ...c,
            teamNotes: [newNote, ...c.teamNotes]
          };
        }
        return c;
      })
    );

    // Also update modal instance if currently open
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
          return {
            ...c,
            reviewStatus: status,
            auditTrail: [auditEntry, ...c.auditTrail]
          };
        }
        return c;
      })
    );

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
    setCandidates(prev =>
      prev.map(c => {
        if (c.id === candidateId) {
          return {
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
        }
        return c;
      })
    );
  };

  return (
    <div className="min-h-screen bg-case-bg text-slate-200">
      
      {/* 1. Opening Landing Page */}
      {view === 'landing' && (
        <LandingPage
          onStartOnboarding={handleStartOnboarding}
          onTrySampleCase={handleTrySampleCase}
        />
      )}

      {/* 2. Onboarding Wizard */}
      {view === 'onboarding' && (
        <OnboardingWizard
          initialRole={role}
          onComplete={handleOnboardingComplete}
          onCancel={() => setView('dashboard')}
        />
      )}

      {/* 3. Main 3-Column Case Board Dashboard */}
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
          onLoadSingleDemoCase={handleLoadSingleDemoCase}
          onClearBoard={handleClearBoard}
          onSetReviewMode={setReviewMode}
          onAddNote={handleAddNote}
          onUpdateStatus={handleUpdateStatus}
          onOpenCompare={comp => setCompareCandidates(comp)}
          onBackToLanding={() => setView('landing')}
        />
      )}

      {/* MODAL 1: Candidate Case File Full Detail Modal */}
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

      {/* MODAL 4: Quick Candidate Upload Modal */}
      {isUploadModalOpen && (
        <UploadCandidateModal
          role={role}
          onClose={() => setIsUploadModalOpen(false)}
          onCandidatesUploaded={handleCandidatesUploaded}
        />
      )}

    </div>
  );
}

export default App;
