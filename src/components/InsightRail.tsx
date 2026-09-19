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
  ExternalLink,
  ChevronRight
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
      <div className="dossier-card rounded-2xl p-8 border border-ink-border text-center space-y-3 font-sans text-xs">
        <div className="w-12 h-12 rounded-xl bg-ink-900 border border-ink-border flex items-center justify-center mx-auto text-slate-500">
          <FileQuestion className="w-6 h-6" />
        </div>
        <div className="text-white font-bold text-sm">No Candidate Selected</div>
        <p className="text-slate-400 text-xs leading-relaxed">
          Select any candidate dossier in the center board to inspect verified evidence, risk flags, and generated interview probes.
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
      <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-2.5">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <span>INTELLIGENCE TERMINAL</span>
          <span className="font-mono text-gold-400 font-bold">{candidate.name}</span>
        </div>
        
        <div className="flex items-center justify-between pt-1">
          <div>
            <div className="text-white font-extrabold text-base">{candidate.reviewStatus}</div>
            <div className="text-[11px] text-slate-400 font-mono">Evidence Grounded • {candidate.matchScore}% Match</div>
          </div>
          <button
            onClick={() => onOpenCaseFile(candidate)}
            className="text-xs text-gold-400 hover:text-gold-300 font-mono flex items-center gap-1 font-bold"
          >
            <span>Full File</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 1. Missing Evidence / Validation Needed */}
      <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-3">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-caution-500 font-bold">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>UNVERIFIED / GAPS ({missingEvidence.length})</span>
          </div>
        </div>

        {missingEvidence.length === 0 ? (
          <div className="p-3 rounded-xl bg-verified-subtle border border-verified-border text-xs text-verified-400 flex items-center gap-2 font-mono">
            <CheckCircle2 className="w-4 h-4" />
            <span>All core criteria verified with source evidence!</span>
          </div>
        ) : (
          <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
            {missingEvidence.map((ev, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-ink-900 border border-ink-border space-y-1">
                <div className="flex items-center justify-between font-bold text-white text-xs">
                  <span>{ev.requirement}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-semibold ${
                    ev.status === 'Missing' ? 'bg-flag-subtle text-flag-500' : 'bg-caution-subtle text-caution-500'
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
      <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-3">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5 text-gold-400 font-bold">
            <MessageSquare className="w-3.5 h-3.5 text-gold-500" />
            <span>INTERVIEW PROBES ({candidate.interviewQuestions.length})</span>
          </div>
          <button
            onClick={() => onOpenInterviewKit(candidate)}
            className="text-[11px] text-gold-400 hover:text-gold-300 font-mono font-bold"
          >
            Launch Kit
          </button>
        </div>

        <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
          {candidate.interviewQuestions.slice(0, 2).map((q, idx) => (
            <div key={idx} className="p-3 rounded-xl bg-ink-900 border border-ink-border space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">{q.targetRequirement}</span>
                <span className="px-2 py-0.5 rounded bg-ink-850 border border-ink-border text-gold-400 font-bold">
                  {q.severityTag}
                </span>
              </div>
              <p className="text-xs text-slate-200 italic leading-snug">
                "{q.questionText}"
              </p>
              {q.followUpProbe && (
                <div className="text-[11px] text-slate-400 pt-1 border-t border-ink-border/60">
                  <span className="font-mono text-slate-500">Probe: </span>
                  {q.followUpProbe}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3. Risk Flags */}
      <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-3">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <ShieldAlert className="w-3.5 h-3.5 text-flag-500" />
          <span>RISK FLAGS ({candidate.riskFlags.length})</span>
        </div>

        {candidate.riskFlags.length === 0 ? (
          <div className="text-xs text-slate-400 italic">No critical risks flagged.</div>
        ) : (
          <div className="space-y-2">
            {candidate.riskFlags.map((rf, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-ink-900 border border-ink-border space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white">{rf.label}</span>
                  <span className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                    rf.severity === 'critical' ? 'bg-flag-subtle text-flag-500' : 'bg-caution-subtle text-caution-500'
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
      <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-3">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <StickyNote className="w-3.5 h-3.5 text-gold-500" />
          <span>TEAM NOTES ({candidate.teamNotes.length})</span>
        </div>

        <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
          {candidate.teamNotes.length === 0 ? (
            <div className="text-xs text-slate-500 italic">No notes logged yet.</div>
          ) : (
            candidate.teamNotes.map((note, idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-ink-900 border border-ink-border space-y-0.5 text-xs">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span className="text-slate-200 font-semibold">{note.author}</span>
                  <span>{note.timestamp}</span>
                </div>
                <div className="text-slate-300">{note.text}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleNoteSubmit} className="flex gap-2 pt-1">
          <input
            type="text"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            placeholder="Add brief observation..."
            className="flex-1 bg-ink-900 border border-ink-border rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-gold-500"
          />
          <button
            type="submit"
            disabled={!newNote.trim()}
            className="px-3 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-ink-950 font-bold rounded-xl transition-colors shadow"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 5. Primary Next Action Button */}
      <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-3">
        <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
          Decision Action
        </div>
        <button
          onClick={() => onOpenInterviewKit(candidate)}
          className="w-full py-3 px-4 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-extrabold text-xs transition-all shadow-lg flex items-center justify-center gap-2"
        >
          <span>Launch Interview Kit</span>
          <ArrowRight className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={() => onUpdateStatus(candidate.id, 'Interview Ready')}
            className="py-2 px-2.5 rounded-xl bg-verified-subtle hover:bg-verified-subtle/80 border border-verified-border text-verified-400 text-xs font-semibold transition-colors text-center"
          >
            Advance File
          </button>
          <button
            onClick={() => onUpdateStatus(candidate.id, 'Needs Validation')}
            className="py-2 px-2.5 rounded-xl bg-caution-subtle hover:bg-caution-subtle/80 border border-caution-border text-caution-500 text-xs font-semibold transition-colors text-center"
          >
            Mark Unclear
          </button>
        </div>
      </div>

    </div>
  );
};
