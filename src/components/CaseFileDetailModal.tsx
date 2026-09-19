import React, { useState } from 'react';
import { CandidateCaseFile, EvidenceItem } from '../types';
import { 
  X, 
  FolderLock, 
  FileText, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  MessageSquare, 
  Clock, 
  ChevronDown, 
  ChevronRight, 
  Briefcase, 
  GraduationCap, 
  Code, 
  Plus, 
  Send,
  ExternalLink,
  Sparkles
} from 'lucide-react';

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
  const [expandedEvidenceIds, setExpandedEvidenceIds] = useState<Record<string, boolean>>({
    [candidate.evidenceMap[0]?.id || '']: true
  });

  const [newNote, setNewNote] = useState('');

  const toggleEvidenceExpand = (id: string) => {
    setExpandedEvidenceIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleAddNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newNote.trim()) {
      onAddNote(candidate.id, newNote.trim());
      setNewNote('');
    }
  };

  const getStatusBadge = (status: EvidenceItem['status']) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-verified-subtle text-verified-400 border border-verified-border font-mono text-[10px] font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3" />
            Verified
          </span>
        );
      case 'Needs validation':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-caution-subtle text-caution-500 border border-caution-border font-mono text-[10px] font-bold flex items-center gap-1.5">
            <AlertTriangle className="w-3 h-3" />
            Needs validation
          </span>
        );
      case 'Missing':
        return (
          <span className="px-2.5 py-1 rounded-lg bg-flag-subtle text-flag-500 border border-flag-border font-mono text-[10px] font-bold flex items-center gap-1.5">
            <X className="w-3 h-3" />
            Missing
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-8 bg-black/90 backdrop-blur-md overflow-y-auto font-sans">
      <div className="dossier-card rounded-3xl w-full max-w-[1600px] h-[92vh] flex flex-col shadow-2xl border-2 border-gold-border/60 bg-ink-950 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Top Strip */}
        <div className="p-5 bg-ink-900 border-b border-ink-border flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-ink-850 border border-ink-border flex items-center justify-center text-gold-400 font-mono font-extrabold text-sm shadow">
              {candidate.initials}
            </div>
            <div>
              <div className="flex items-center gap-2 font-mono text-xs">
                <span className="text-gold-400 font-bold">DOSSIER #{candidate.id.toUpperCase()}</span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] text-slate-400">{candidate.location}</span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
                {candidate.name}
                <span className="text-xs font-normal text-slate-400 font-mono">
                  ({candidate.currentRole})
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
            {/* Overall Score */}
            <div className="bg-ink-850 px-3.5 py-2 rounded-xl border border-ink-border flex items-center gap-2">
              <span className="text-slate-400">Match Score:</span>
              <span className="text-base font-extrabold text-verified-400">{candidate.matchScore}%</span>
            </div>

            {/* Review Status */}
            <div className="bg-ink-850 px-3.5 py-2 rounded-xl border border-ink-border flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className="text-gold-400 font-bold">{candidate.reviewStatus}</span>
            </div>

            {/* Action Buttons: Move forward, mark unclear, close */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateStatus(candidate.id, 'Interview Ready')}
                className="px-4 py-2 rounded-xl bg-verified-subtle hover:bg-verified-subtle/80 text-verified-400 border border-verified-border font-bold text-xs transition-colors"
              >
                Advance Candidate
              </button>
              <button
                onClick={() => onUpdateStatus(candidate.id, 'Needs Validation')}
                className="px-4 py-2 rounded-xl bg-caution-subtle hover:bg-caution-subtle/80 text-caution-500 border border-caution-border font-bold text-xs transition-colors"
              >
                Mark Unclear
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-xl bg-ink-850 hover:bg-ink-800 border border-ink-border flex items-center justify-center text-slate-400 hover:text-white transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Main 3-Column Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-ink-border bg-ink-950 text-xs">
          
          {/* LEFT SIDE (3 cols): Resume Sections */}
          <div className="lg:col-span-3 p-6 overflow-y-auto space-y-6 bg-ink-900/40">
            
            {/* Candidate Summary */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 font-mono text-xs text-gold-400 uppercase tracking-wider font-bold">
                <FileText className="w-4 h-4 text-gold-500" />
                <span>Executive Dossier Summary</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-xs bg-ink-850 p-4 rounded-2xl border border-ink-border">
                {candidate.resumeSummary}
              </p>
            </div>

            {/* Experience */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300 uppercase tracking-wider font-bold">
                <Briefcase className="w-4 h-4 text-gold-500" />
                <span>Career Experience ({candidate.experienceYears}y)</span>
              </div>
              <div className="space-y-3">
                {candidate.experiences.map((exp, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-ink-850 border border-ink-border space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{exp.role}</div>
                        <div className="text-[11px] text-gold-400 font-mono">{exp.company}</div>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">{exp.duration}</span>
                    </div>
                    <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                      {exp.highlights.map((hl, hIdx) => (
                        <li key={hIdx} className="leading-snug">{hl}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects & Artifacts */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300 uppercase tracking-wider font-bold">
                <Code className="w-4 h-4 text-verified-400" />
                <span>Verified Codebases & Repos</span>
              </div>
              <div className="space-y-2.5">
                {candidate.projects.map((proj, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-ink-850 border border-ink-border space-y-1">
                    <div className="flex items-center justify-between font-bold text-white text-xs">
                      <span>{proj.name}</span>
                      {proj.link && (
                        <span className="text-[10px] font-mono text-gold-400 flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          artifact
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 leading-snug">{proj.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Education */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400 uppercase tracking-wider font-bold">
                <GraduationCap className="w-4 h-4 text-slate-400" />
                <span>Education</span>
              </div>
              <div className="space-y-2">
                {candidate.education.map((edu, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-ink-850 border border-ink-border text-xs">
                    <div className="font-bold text-white">{edu.degree}</div>
                    <div className="text-slate-400 flex items-center justify-between mt-0.5 font-mono text-[11px]">
                      <span>{edu.school}</span>
                      <span>{edu.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* CENTER (5 cols): Evidence Map (THE MOST IMPORTANT PART) */}
          <div className="lg:col-span-5 p-6 overflow-y-auto space-y-5">
            
            <div className="flex items-center justify-between border-b border-ink-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-verified-400" />
                  <h3 className="font-extrabold text-base text-white">Requirement Evidence Map</h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click any row to reveal exact source citations and grounded proofs
                </p>
              </div>
              <span className="font-mono text-xs px-3 py-1 rounded-xl bg-ink-850 border border-ink-border text-gold-400 font-bold">
                {candidate.evidenceMap.length} Criteria Audited
              </span>
            </div>

            {/* Vertical List of Evidence */}
            <div className="space-y-3">
              {candidate.evidenceMap.map((ev) => {
                const isExpanded = !!expandedEvidenceIds[ev.id];
                return (
                  <div
                    key={ev.id}
                    onClick={() => toggleEvidenceExpand(ev.id)}
                    className={`rounded-2xl border transition-all cursor-pointer ${
                      isExpanded
                        ? 'bg-ink-850 border-gold-500 ring-1 ring-gold-500/40 shadow-lg'
                        : 'bg-ink-900 border-ink-border hover:border-slate-600'
                    }`}
                  >
                    {/* Collapsed/Expanded Header Row */}
                    <div className="p-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gold-500 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className="font-bold text-white text-xs">{ev.requirement}</span>
                      </div>

                      <div className="flex items-center gap-2.5 flex-shrink-0">
                        <span className="font-mono text-[10px] text-slate-400 font-semibold">
                          {ev.confidence} Conf.
                        </span>
                        {getStatusBadge(ev.status)}
                      </div>
                    </div>

                    {/* Quick Source preview row */}
                    <div className="px-4 pb-2.5 text-xs text-slate-400 font-mono flex items-center gap-1.5 pl-10">
                      <span className="text-slate-500">Source:</span>
                      <span className="text-slate-300">{ev.evidenceSource}</span>
                    </div>

                    {/* Expanded Snippet */}
                    {isExpanded && (
                      <div className="px-4 pb-4 pt-2 border-t border-ink-border/70 pl-10 space-y-2.5">
                        <div className="text-[10px] font-mono uppercase text-gold-400 tracking-wider font-bold">
                          Grounded Source Proof
                        </div>
                        <div className="p-3.5 rounded-xl bg-ink-950 border border-ink-border text-xs font-mono text-slate-200 leading-relaxed">
                          "{ev.snippet}"
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                          <span>Evidence status: <strong className="text-white">{ev.status}</strong></span>
                          <span className="text-gold-400 font-bold">Verified Citation</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Evidence Bottom Note */}
            <div className="p-4 rounded-2xl bg-ink-900 border border-ink-border text-xs text-slate-400 flex items-center justify-between">
              <span>Need deeper technical probing on unverified items?</span>
              <button
                onClick={() => onOpenInterviewKit(candidate)}
                className="text-gold-400 hover:text-gold-300 font-bold font-mono"
              >
                Launch Interview Prep Kit →
              </button>
            </div>

          </div>

          {/* RIGHT SIDE (4 cols): Questions, Notes, Audit Trail */}
          <div className="lg:col-span-4 p-6 overflow-y-auto space-y-6 bg-ink-900/30">
            
            {/* Interview Questions Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono text-xs text-slate-300 uppercase tracking-wider font-bold">
                <div className="flex items-center gap-2 text-gold-400">
                  <MessageSquare className="w-4 h-4 text-gold-500" />
                  <span>Interview Questions ({candidate.interviewQuestions.length})</span>
                </div>
                <button
                  onClick={() => onOpenInterviewKit(candidate)}
                  className="text-gold-400 hover:text-gold-300 text-[11px] font-bold lowercase"
                >
                  open kit
                </button>
              </div>

              <div className="space-y-2.5">
                {candidate.interviewQuestions.map((q) => (
                  <div key={q.id} className="p-3.5 rounded-2xl bg-ink-850 border border-ink-border space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-slate-400">{q.targetRequirement}</span>
                      <span className="px-2 py-0.5 rounded bg-ink-900 border border-ink-border text-gold-400 font-bold">
                        {q.severityTag}
                      </span>
                    </div>
                    <p className="text-xs text-white italic leading-snug">
                      "{q.questionText}"
                    </p>
                    {q.followUpProbe && (
                      <div className="text-[11px] text-slate-400 font-mono pt-1.5 border-t border-ink-border/60">
                        <span className="text-gold-400 font-bold">Probe:</span> {q.followUpProbe}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Team Notes & Observations */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-300 uppercase tracking-wider font-bold">
                <span>Team Notes & Review Log ({candidate.teamNotes.length})</span>
              </div>

              <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                {candidate.teamNotes.map((note) => (
                  <div key={note.id} className="p-3 rounded-xl bg-ink-850 border border-ink-border space-y-1 text-xs">
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span className="font-bold text-white">{note.author}</span>
                      <span>{note.timestamp}</span>
                    </div>
                    <p className="text-slate-300">{note.text}</p>
                  </div>
                ))}
              </div>

              {/* Add Note Form */}
              <form onSubmit={handleAddNoteSubmit} className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Add evaluation observation..."
                  className="flex-1 bg-ink-900 border border-ink-border rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-gold-500 font-mono"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="px-4 py-2 bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-ink-950 font-bold rounded-xl transition-colors shadow flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post</span>
                </button>
              </form>
            </div>

            {/* Audit Trail */}
            <div className="space-y-3 border-t border-ink-border pt-4">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400 uppercase tracking-wider font-bold">
                <Clock className="w-3.5 h-3.5 text-gold-500" />
                <span>Audit Trail & Provenance</span>
              </div>

              <div className="space-y-2">
                {candidate.auditTrail.map((at) => (
                  <div key={at.id} className="p-2.5 rounded-xl bg-ink-900 border border-ink-border text-[11px] font-mono space-y-0.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-bold text-slate-200">{at.action}</span>
                      <span>{at.timestamp}</span>
                    </div>
                    <div className="text-slate-400">{at.note}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
