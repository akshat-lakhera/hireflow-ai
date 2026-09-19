import React, { useState } from 'react';
import { CandidateCaseFile, TeamNote } from '../types';
import { 
  AlertTriangle, 
  MessageSquare, 
  FileQuestion, 
  StickyNote, 
  ArrowRight, 
  CheckCircle2, 
  ShieldAlert,
  Send,
  PlusCircle,
  ExternalLink
} from 'lucide-react';

interface InsightRailProps {
  candidate: CandidateCaseFile | null;
  onOpenCaseFile: (candidate: CandidateCaseFile) => void;
  onOpenInterviewKit: (candidate: CandidateCaseFile) => void;
  onAddNote: (candidateId: string, noteText: string) => void;
  onUpdateStatus: (candidateId: string, status: CandidateCaseFile['reviewStatus']) => void;
}

export const InsightRail: React.FC<InsightRailProps> = ({
  candidate,
  onOpenCaseFile,
  onOpenInterviewKit,
  onAddNote,
  onUpdateStatus
}) => {
  const [newNote, setNewNote] = useState('');

  if (!candidate) {
    return (
      <div className="case-card rounded-xl p-6 border border-case-border text-center space-y-3 font-sans text-xs">
        <div className="w-10 h-10 rounded-lg bg-case-bg border border-case-border flex items-center justify-center mx-auto text-slate-500">
          <FileQuestion className="w-5 h-5" />
        </div>
        <div className="text-white font-semibold">No Candidate Selected</div>
        <p className="text-slate-400 text-[11px]">
          Select any case file in the center board to inspect verified evidence, risk flags, and interview questions.
        </p>
      </div>
    );
  }

  // Filter missing evidence
  const missingEvidence = candidate.evidenceMap.filter(
    ev => ev.status === 'Missing' || ev.status === 'Needs validation'
  );

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(candidate.id, newNote.trim());
      setNewNote('');
    }
  };

  return (
    <div className="flex flex-col gap-4 font-sans text-xs">
      
      {/* Header Summary */}
      <div className="case-card rounded-xl p-4 border border-case-border space-y-2">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <span>INVESTIGATION RAIL</span>
          <span className="font-mono text-accent-blue">{candidate.name}</span>
        </div>
        
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-white font-bold text-sm">{candidate.reviewStatus}</div>
            <div className="text-[11px] text-slate-400">Confidence: High Evidence Grounding</div>
          </div>
          <button
            onClick={() => onOpenCaseFile(candidate)}
            className="text-[11px] text-accent-blue hover:underline font-mono flex items-center gap-1"
          >
            <span>Full File</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* 1. Missing Evidence / Validation Needed */}
      <div className="case-card rounded-xl p-4 border border-case-border space-y-3">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-accent-amber">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>MISSING EVIDENCE ({missingEvidence.length})</span>
          </div>
        </div>

        {missingEvidence.length === 0 ? (
          <div className="p-2.5 rounded-lg bg-case-bg border border-case-border text-[11px] text-accent-green flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>All core JD requirements verified with evidence!</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {missingEvidence.map((ev, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-case-bg border border-case-border space-y-1">
                <div className="flex items-center justify-between font-semibold text-white text-[11px]">
                  <span>{ev.requirement}</span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    ev.status === 'Missing' ? 'bg-accent-red/15 text-accent-red' : 'bg-accent-amber/15 text-accent-amber'
                  }`}>
                    {ev.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  {ev.snippet}
                </div>
                <div className="text-[10px] font-mono text-slate-500 pt-0.5">
                  Source: {ev.evidenceSource}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Suggested Interview Questions */}
      <div className="case-card rounded-xl p-4 border border-case-border space-y-3">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-accent-blue">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SUGGESTED QUESTIONS ({candidate.interviewQuestions.length})</span>
          </div>
          <button
            onClick={() => onOpenInterviewKit(candidate)}
            className="text-[10px] text-accent-blue hover:underline font-mono"
          >
            Launch Kit
          </button>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {candidate.interviewQuestions.slice(0, 2).map((q, idx) => (
            <div key={idx} className="p-2.5 rounded-lg bg-case-bg border border-case-border space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">{q.targetRequirement}</span>
                <span className="px-1.5 py-0.5 rounded bg-case-surfaceElevated border border-case-border text-accent-blue font-semibold">
                  {q.severityTag}
                </span>
              </div>
              <p className="text-[11px] text-slate-200 italic leading-snug">
                "{q.questionText}"
              </p>
              {q.followUpProbe && (
                <div className="text-[10px] text-slate-400 pt-1 border-t border-case-border/60">
                  <span className="font-mono text-slate-500">Probe: </span>
                  {q.followUpProbe}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Risk Flags */}
      <div className="case-card rounded-xl p-4 border border-case-border space-y-3">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <ShieldAlert className="w-3.5 h-3.5 text-accent-red" />
          <span>RISK FLAGS ({candidate.riskFlags.length})</span>
        </div>

        {candidate.riskFlags.length === 0 ? (
          <div className="text-[11px] text-slate-400 italic">No critical risks flagged.</div>
        ) : (
          <div className="space-y-2">
            {candidate.riskFlags.map((rf, idx) => (
              <div key={idx} className="p-2 rounded-lg bg-case-bg border border-case-border space-y-0.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-white">{rf.label}</span>
                  <span className={`text-[10px] font-mono uppercase px-1 rounded ${
                    rf.severity === 'critical' ? 'bg-accent-red/20 text-accent-red' : 'bg-accent-amber/20 text-accent-amber'
                  }`}>
                    {rf.severity}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 leading-snug">
                  {rf.details}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Notes Summary & Quick Add */}
      <div className="case-card rounded-xl p-4 border border-case-border space-y-3">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <StickyNote className="w-3.5 h-3.5 text-accent-blue" />
          <span>NOTES SUMMARY ({candidate.teamNotes.length})</span>
        </div>

        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {candidate.teamNotes.length === 0 ? (
            <div className="text-[11px] text-slate-500 italic">No notes logged yet.</div>
          ) : (
            candidate.teamNotes.map((note, idx) => (
              <div key={idx} className="p-2 rounded bg-case-bg border border-case-border space-y-0.5 text-[11px]">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-slate-300 font-semibold">{note.author}</span>
                  <span>{note.timestamp}</span>
                </div>
                <div className="text-slate-300">{note.text}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleNoteSubmit} className="flex gap-1.5 pt-1">
          <input
            type="text"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Add brief observation..."
            className="flex-1 bg-case-bg border border-case-border rounded-lg px-2.5 py-1.5 text-white text-xs focus:outline-none"
          />
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="p-1.5 bg-accent-blue hover:bg-accent-blueHover disabled:opacity-40 text-black rounded-lg transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 5. Primary Next Action Button */}
      <div className="case-card rounded-xl p-4 border border-case-border space-y-2">
        <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
          Decision Action
        </div>
        <button
          onClick={() => onOpenInterviewKit(candidate)}
          className="w-full py-2.5 px-4 rounded-xl bg-accent-blue hover:bg-accent-blueHover text-black font-semibold text-xs transition-all shadow flex items-center justify-center gap-2"
        >
          <span>Generate Interview Kit</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onUpdateStatus(candidate.id, 'Interview Ready')}
            className="py-1.5 px-2 rounded-lg bg-case-bg hover:bg-case-surface border border-case-border text-accent-green text-[11px] font-medium transition-colors"
          >
            Move Forward
          </button>
          <button
            onClick={() => onUpdateStatus(candidate.id, 'Needs Validation')}
            className="py-1.5 px-2 rounded-lg bg-case-bg hover:bg-case-surface border border-case-border text-accent-amber text-[11px] font-medium transition-colors"
          >
            Mark Unclear
          </button>
        </div>
      </div>

    </div>
  );
};
