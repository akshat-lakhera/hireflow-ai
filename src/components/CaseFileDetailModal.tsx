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
  ExternalLink
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
  // Expanded evidence row IDs
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
          <span className="px-2 py-0.5 rounded bg-accent-green/15 text-accent-green border border-accent-green/30 font-mono text-[10px] font-semibold flex items-center gap-1">
            <CheckCircle2 className="w-2.5 h-2.5" />
            Verified
          </span>
        );
      case 'Needs validation':
        return (
          <span className="px-2 py-0.5 rounded bg-accent-amber/15 text-accent-amber border border-accent-amber/30 font-mono text-[10px] font-semibold flex items-center gap-1">
            <AlertTriangle className="w-2.5 h-2.5" />
            Needs validation
          </span>
        );
      case 'Missing':
        return (
          <span className="px-2 py-0.5 rounded bg-accent-red/15 text-accent-red border border-accent-red/30 font-mono text-[10px] font-semibold flex items-center gap-1">
            <X className="w-2.5 h-2.5" />
            Missing
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="case-card rounded-2xl w-full max-w-7xl max-h-[94vh] flex flex-col shadow-2xl border border-case-borderLight animate-in fade-in zoom-in-95 duration-200 overflow-hidden font-sans">
        
        {/* Top Strip */}
        <div className="p-4 bg-case-bgAlt border-b border-case-border flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-case-surface border border-case-border flex items-center justify-center text-accent-blue font-mono font-bold text-sm">
              {candidate.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-slate-400">CASE FILE #{candidate.id.toUpperCase()}</span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-case-surfaceElevated border border-case-border text-slate-300">
                  {candidate.location}
                </span>
              </div>
              <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                {candidate.name}
                <span className="text-xs font-normal text-slate-400 font-mono">
                  ({candidate.currentRole})
                </span>
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            {/* Overall Score */}
            <div className="bg-case-surface px-3 py-1.5 rounded-xl border border-case-border flex items-center gap-2">
              <span className="text-slate-400">Match Score:</span>
              <span className="text-base font-bold text-accent-green">{candidate.matchScore}%</span>
            </div>

            {/* Confidence Level */}
            <div className="bg-case-surface px-3 py-1.5 rounded-xl border border-case-border flex items-center gap-2">
              <span className="text-slate-400">Confidence:</span>
              <span className="text-white font-bold">High (3 Sources)</span>
            </div>

            {/* Review Status */}
            <div className="bg-case-surface px-3 py-1.5 rounded-xl border border-case-border flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className="text-accent-blue font-bold">{candidate.reviewStatus}</span>
            </div>

            {/* Action Buttons: Move forward, mark unclear, close */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateStatus(candidate.id, 'Interview Ready')}
                className="px-3 py-1.5 rounded-lg bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border border-accent-green/40 font-semibold text-xs transition-colors"
              >
                Move Forward
              </button>
              <button
                onClick={() => onUpdateStatus(candidate.id, 'Needs Validation')}
                className="px-3 py-1.5 rounded-lg bg-accent-amber/20 hover:bg-accent-amber/30 text-accent-amber border border-accent-amber/40 font-semibold text-xs transition-colors"
              >
                Mark Unclear
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg bg-case-surface hover:bg-case-surfaceLight border border-case-border flex items-center justify-center text-slate-400 hover:text-white transition-colors ml-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

        </div>

        {/* Main 3-Column Body */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-case-border bg-case-bg text-xs">
          
          {/* LEFT SIDE (3 cols): Resume Sections (Education, Experience, Projects) */}
          <div className="lg:col-span-3 p-5 overflow-y-auto space-y-6 bg-case-bgAlt/50">
            
            {/* Candidate Summary */}
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5 text-accent-blue" />
                <span>Executive Summary</span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11px] bg-case-surface p-3 rounded-xl border border-case-border">
                {candidate.resumeSummary}
              </p>
            </div>

            {/* Experience */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <Briefcase className="w-3.5 h-3.5 text-accent-blue" />
                <span>Career Experience ({candidate.experienceYears}y)</span>
              </div>
              <div className="space-y-3">
                {candidate.experiences.map((exp, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-case-surface border border-case-border space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-bold text-white text-xs">{exp.role}</div>
                        <div className="text-[11px] text-accent-blue font-mono">{exp.company}</div>
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
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <Code className="w-3.5 h-3.5 text-accent-green" />
                <span>Verified Projects & Repos</span>
              </div>
              <div className="space-y-2">
                {candidate.projects.map((proj, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-case-surface border border-case-border space-y-1">
                    <div className="flex items-center justify-between font-bold text-white text-xs">
                      <span>{proj.name}</span>
                      {proj.link && (
                        <span className="text-[10px] font-mono text-accent-blue flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" />
                          code
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
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                <span>Education</span>
              </div>
              <div className="space-y-2">
                {candidate.education.map((edu, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-case-surface border border-case-border text-[11px]">
                    <div className="font-bold text-white">{edu.degree}</div>
                    <div className="text-slate-400 flex items-center justify-between mt-0.5">
                      <span>{edu.school}</span>
                      <span className="font-mono text-[10px]">{edu.year}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* CENTER (5 cols): Evidence Map (THE MOST IMPORTANT PART) */}
          <div className="lg:col-span-5 p-5 overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between border-b border-case-border pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-accent-green" />
                  <h3 className="font-bold text-sm text-white">Requirement Evidence Map</h3>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Click any row to expand exact ground-truth source citations
                </p>
              </div>
              <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-case-surface border border-case-border text-slate-300">
                {candidate.evidenceMap.length} Criteria Audited
              </span>
            </div>

            {/* Vertical List of Evidence */}
            <div className="space-y-2.5">
              {candidate.evidenceMap.map((ev) => {
                const isExpanded = !!expandedEvidenceIds[ev.id];
                return (
                  <div
                    key={ev.id}
                    onClick={() => toggleEvidenceExpand(ev.id)}
                    className={`rounded-xl border transition-all cursor-pointer ${
                      isExpanded
                        ? 'bg-case-surfaceElevated border-accent-blue/50'
                        : 'bg-case-surface border-case-border hover:border-slate-600'
                    }`}
                  >
                    {/* Collapsed/Expanded Header Row */}
                    <div className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-accent-blue flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-500 flex-shrink-0" />
                        )}
                        <span className="font-bold text-white text-xs">{ev.requirement}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-mono text-[10px] text-slate-400">
                          {ev.confidence} Conf.
                        </span>
                        {getStatusBadge(ev.status)}
                      </div>
                    </div>

                    {/* Quick Source preview row */}
                    <div className="px-3 pb-2 text-[11px] text-slate-400 font-mono flex items-center gap-1.5 pl-9">
                      <span className="text-slate-500">Source:</span>
                      <span className="text-slate-300">{ev.evidenceSource}</span>
                    </div>

                    {/* Expanded Snippet */}
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-1 border-t border-case-border/60 pl-9 space-y-2">
                        <div className="text-[10px] font-mono uppercase text-slate-500 tracking-wider">
                          Ground-Truth Source Citation
                        </div>
                        <div className="p-2.5 rounded-lg bg-case-bg border border-case-border text-[11px] font-mono text-slate-200 leading-relaxed">
                          "{ev.snippet}"
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1">
                          <span>Evidence status: <strong className="text-white">{ev.status}</strong></span>
                          <span className="text-accent-blue">Ground-truth verified</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Evidence Bottom Note */}
            <div className="p-3 rounded-xl bg-case-surface border border-case-border text-[11px] text-slate-400 flex items-center justify-between">
              <span>Need deeper technical validation on flagged items?</span>
              <button
                onClick={() => onOpenInterviewKit(candidate)}
                className="text-accent-blue hover:underline font-semibold font-mono"
              >
                Launch Interview Prep Kit →
              </button>
            </div>

          </div>

          {/* RIGHT SIDE (4 cols): Interview Questions, Missing Proof, Notes, Audit Trail */}
          <div className="lg:col-span-4 p-5 overflow-y-auto space-y-5 bg-case-bgAlt/40">
            
            {/* Interview Questions Preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5 text-accent-blue">
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Interview Questions ({candidate.interviewQuestions.length})</span>
                </div>
                <button
                  onClick={() => onOpenInterviewKit(candidate)}
                  className="text-accent-blue hover:underline text-[10px] lowercase"
                >
                  open kit
                </button>
              </div>

              <div className="space-y-2">
                {candidate.interviewQuestions.map((q) => (
                  <div key={q.id} className="p-3 rounded-xl bg-case-surface border border-case-border space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="text-slate-400">{q.targetRequirement}</span>
                      <span className="px-1.5 py-0.5 rounded bg-case-surfaceElevated border border-case-border text-accent-blue font-semibold">
                        {q.severityTag}
                      </span>
                    </div>
                    <p className="text-[11px] text-white italic leading-snug">
                      "{q.questionText}"
                    </p>
                    {q.followUpProbe && (
                      <div className="text-[10px] text-slate-400 font-mono pt-1 border-t border-case-border/60">
                        <span className="text-slate-500">Probe:</span> {q.followUpProbe}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Team Notes & Observations */}
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <span>Team Notes & Review Log ({candidate.teamNotes.length})</span>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {candidate.teamNotes.map((note) => (
                  <div key={note.id} className="p-2.5 rounded-lg bg-case-surface border border-case-border space-y-1 text-[11px]">
                    <div className="flex items-center justify-between font-mono text-[10px] text-slate-400">
                      <span className="font-semibold text-white">{note.author}</span>
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
                  className="flex-1 bg-case-bg border border-case-border rounded-lg px-2.5 py-2 text-white text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!newNote.trim()}
                  className="px-3 py-2 bg-accent-blue hover:bg-accent-blueHover disabled:opacity-40 text-black font-semibold rounded-lg transition-colors flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Post</span>
                </button>
              </form>
            </div>

            {/* Audit Trail */}
            <div className="space-y-3 border-t border-case-border pt-4">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Audit Trail & Decision Provenance</span>
              </div>

              <div className="space-y-2">
                {candidate.auditTrail.map((at) => (
                  <div key={at.id} className="p-2 rounded-lg bg-case-bg border border-case-border text-[10px] font-mono space-y-0.5">
                    <div className="flex items-center justify-between text-slate-400">
                      <span className="font-semibold text-slate-200">{at.action}</span>
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
