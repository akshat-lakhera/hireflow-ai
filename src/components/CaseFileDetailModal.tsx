import React from 'react';
import { CandidateCaseFile, ReviewMode } from '../types';
import { CandidateExecutiveDossier } from './CandidateExecutiveDossier';
import { X } from 'lucide-react';

interface CaseFileDetailModalProps {
  candidate: CandidateCaseFile;
  onClose: () => void;
  onOpenInterviewKit: (candidate: CandidateCaseFile) => void;
  onAddNote: (candidateId: string, noteText: string) => void;
  onUpdateStatus: (candidateId: string, status: CandidateCaseFile['reviewStatus']) => void;
}

export const CaseFileDetailModal: React.FC<CaseFileDetailModalProps> = ({
  candidate,
  onClose,
  onOpenInterviewKit,
  onAddNote,
  onUpdateStatus
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <CandidateExecutiveDossier
          candidate={candidate}
          reviewMode="recruiter"
          onOpenInterviewKit={onOpenInterviewKit}
          onUpdateStatus={onUpdateStatus}
          onAddNote={onAddNote}
        />
      </div>
    </div>
  );
};
