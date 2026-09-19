import React, { useState } from 'react';
import { CandidateCaseFile, ReviewMode } from '../types';
import { 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  Send, 
  Sparkles, 
  AlertTriangle,
  MessageSquare,
  Volume2
} from 'lucide-react';
import { AudioService } from '../services/audioService';

interface InsightRailProps {
  candidate: CandidateCaseFile | null;
  reviewMode: ReviewMode;
  onUpdateStatus: (candidateId: string, status: CandidateCaseFile['reviewStatus']) => void;
  onAddNote: (candidateId: string, noteText: string) => void;
  onOpenInterviewKit: (c: CandidateCaseFile) => void;
}

export const InsightRail: React.FC<InsightRailProps> = ({
  candidate,
  onUpdateStatus,
  onAddNote,
  onOpenInterviewKit
}) => {
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [newNote, setNewNote] = useState('');
  const [playingTTS, setPlayingTTS] = useState<string | null>(null);

  if (!candidate) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-center text-slate-500 text-xs">
        Select a candidate to view decision actions and interview probes.
      </div>
    );
  }

  const handleCopyQuestion = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedQuestionId(id);
    setTimeout(() => setCopiedQuestionId(null), 1800);
  };

  const handleToggleTTS = (id: string, text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (playingTTS === id) {
      AudioService.cancelSpeech();
      setPlayingTTS(null);
    } else {
      setPlayingTTS(id);
      AudioService.speak(text, () => setPlayingTTS(null));
    }
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(candidate.id, newNote.trim());
      setNewNote('');
    }
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Quick Decision Action Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-3">
          Recruiter Decision
        </h4>

        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => onUpdateStatus(candidate.id, 'Interview Ready')}
            className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              candidate.reviewStatus === 'Interview Ready'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-600/30'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Approve</span>
          </button>

          <button
            onClick={() => onUpdateStatus(candidate.id, 'Needs Review')}
            className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              candidate.reviewStatus === 'Needs Review'
                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-600/30'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <HelpCircle className="w-4 h-4" />
            <span>Request Info</span>
          </button>

          <button
            onClick={() => onUpdateStatus(candidate.id, 'Rejected')}
            className={`py-2 px-2.5 rounded-lg text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
              candidate.reviewStatus === 'Rejected'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            <XCircle className="w-4 h-4" />
            <span>Reject</span>
          </button>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Current Status:</span>
          <span className="font-semibold text-slate-800">{candidate.reviewStatus}</span>
        </div>
      </div>

      {/* 2. Suggested Interview Probes Accordion */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
              Interview Probes ({candidate.interviewQuestions.length})
            </h4>
          </div>
          <button
            onClick={() => onOpenInterviewKit(candidate)}
            className="text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
          >
            Open Full Kit
          </button>
        </div>

        <div className="space-y-2">
          {candidate.interviewQuestions.map((q) => {
            const isExpanded = expandedQuestionId === q.id;
            return (
              <div
                key={q.id}
                className="rounded-lg border border-slate-200 bg-slate-50/50 overflow-hidden text-xs transition-colors hover:border-slate-300"
              >
                {/* Accordion Header */}
                <div
                  onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                  className="p-3 cursor-pointer flex items-start justify-between gap-2"
                >
                  <div className="font-medium text-slate-800 leading-snug">
                    {q.questionText}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 text-slate-400">
                    <button
                      onClick={(e) => handleCopyQuestion(q.id, q.questionText, e)}
                      title="Copy Question"
                      className="p-1 hover:text-slate-700 rounded hover:bg-slate-200/60"
                    >
                      {copiedQuestionId === q.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                  </div>
                </div>

                {/* Accordion Body */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-200/60 bg-white space-y-2">
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Target Requirement
                      </div>
                      <div className="text-xs text-slate-700 mt-0.5">
                        {q.targetRequirement}
                      </div>
                    </div>

                    <div className="p-2 bg-amber-50/60 border border-amber-200/60 rounded text-[11px] text-amber-900">
                      <div className="font-semibold text-amber-800 flex items-center gap-1 mb-0.5">
                        <HelpCircle className="w-3 h-3" />
                        <span>What to Look For:</span>
                      </div>
                      {q.followUpProbe}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <button
                        onClick={(e) => handleToggleTTS(q.id, q.questionText, e)}
                        className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>{playingTTS === q.id ? 'Stop audio' : 'Listen'}</span>
                      </button>

                      <button
                        onClick={() => onOpenInterviewKit(candidate)}
                        className="text-[11px] text-indigo-600 hover:underline font-medium"
                      >
                        Score in Kit →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Quick Team Note Box */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide mb-2 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
          <span>Internal Note</span>
        </h4>

        <form onSubmit={handleNoteSubmit} className="space-y-2">
          <textarea
            rows={2}
            placeholder="Add a recruiter screening note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white resize-none"
          />
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={!newNote.trim()}
              className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none rounded-lg shadow-sm flex items-center gap-1 transition-colors"
            >
              <Send className="w-3 h-3" />
              <span>Post Note</span>
            </button>
          </div>
        </form>

        {/* Recent Notes Preview */}
        {candidate.teamNotes.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Recent Notes
            </div>
            {candidate.teamNotes.slice(0, 2).map((n) => (
              <div key={n.id} className="text-xs bg-slate-50 p-2 rounded border border-slate-200/60">
                <div className="flex items-center justify-between text-[10px] text-slate-500 mb-0.5">
                  <span className="font-semibold text-slate-700">{n.author}</span>
                  <span>{n.timestamp}</span>
                </div>
                <div className="text-slate-800">{n.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
