import React, { useState } from 'react';
import { Candidate, JobDescription } from '../types';
import { X, CheckCircle, AlertTriangle, XCircle, Mic, Link as LinkIcon, ExternalLink, ShieldCheck } from 'lucide-react';

interface CandidateDetailModalProps {
  candidate: Candidate;
  jobDescription: JobDescription;
  onClose: () => void;
  onStartInterview: (candidate: Candidate) => void;
}

export const CandidateDetailModal: React.FC<CandidateDetailModalProps> = ({
  candidate,
  jobDescription,
  onClose,
  onStartInterview
}) => {
  const [activeTab, setActiveTab] = useState<'requirements' | 'gaps' | 'resume'>('requirements');
  const [highlightedCitation, setHighlightedCitation] = useState<string | null>(null);

  const getStatusIcon = (status: 'fulfilled' | 'partial' | 'missing') => {
    switch (status) {
      case 'fulfilled':
        return <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />;
      case 'partial':
        return <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />;
      case 'missing':
        return <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />;
    }
  };

  const getStatusBadge = (status: 'fulfilled' | 'partial' | 'missing') => {
    switch (status) {
      case 'fulfilled':
        return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
      case 'partial':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'missing':
        return 'bg-rose-500/10 text-rose-300 border-rose-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-obsidian-900 border border-obsidian-border rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-obsidian-border flex items-start justify-between bg-obsidian-850">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-slate-100">{candidate.name}</h2>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 font-semibold">
                {candidate.grouping}
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold">
                {candidate.matchScore}% Match
              </span>
            </div>
            <p className="text-sm text-slate-400 mt-1">
              Screened against: <span className="text-slate-200 font-medium">{jobDescription.title}</span> • {candidate.experienceYears} Years Production Experience
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                onClose();
                onStartInterview(candidate);
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-black text-sm font-bold shadow-lg transition-all"
            >
              <Mic className="w-4 h-4" />
              <span>Launch AI Screen</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 border-b border-obsidian-border bg-obsidian-900/50">
          <button
            onClick={() => setActiveTab('requirements')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'requirements'
                ? 'border-gold-500 text-gold-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Job Requirement Evidence ({candidate.matchedRequirements.length})
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'gaps'
                ? 'border-gold-500 text-gold-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Skill Gaps & Probes ({candidate.missingGaps.length})
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'resume'
                ? 'border-gold-500 text-gold-400 font-semibold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Grounded Citations & Resume Trace
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* TAB 1: Requirements Evidence */}
          {activeTab === 'requirements' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 pb-1">
                <span>Active JD Criteria vs Parsed Resume Evidence</span>
                <span>Deterministic Grounding</span>
              </div>

              {candidate.matchedRequirements.map((req, idx) => (
                <div 
                  key={idx}
                  className={`p-4 rounded-xl border transition-all ${
                    highlightedCitation === req.resumeLineRef
                      ? 'bg-gold-950/20 border-gold-500/60 shadow-md ring-1 ring-gold-500/40'
                      : 'bg-obsidian-850/80 border-obsidian-border hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      {getStatusIcon(req.status)}
                      <div>
                        <h4 className="text-sm font-semibold text-slate-100">{req.requirement}</h4>
                        <p className="text-xs text-slate-300 mt-1.5 leading-relaxed bg-obsidian-950/60 p-2.5 rounded-lg border border-obsidian-border/50">
                          {req.evidenceSnippet}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-md border flex-shrink-0 ${getStatusBadge(req.status)}`}>
                      {req.status}
                    </span>
                  </div>

                  {req.resumeLineRef && (
                    <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400 font-mono pt-2 border-t border-obsidian-border/60">
                      <span className="flex items-center gap-1.5 text-gold-300">
                        <LinkIcon className="w-3 h-3" />
                        <span>Citation: {req.resumeLineRef}</span>
                      </span>
                      <button
                        onClick={() => {
                          setHighlightedCitation(req.resumeLineRef || null);
                          setActiveTab('resume');
                        }}
                        className="text-[11px] text-gold-400 hover:underline flex items-center gap-1"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 2: Skill Gaps */}
          {activeTab === 'gaps' && (
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold">Recruiter Audit Notice:</span> Specific areas where candidate documentation lacks verified depth. These will be probed automatically during the interview screen.
                </div>
              </div>

              {candidate.missingGaps.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-mono text-sm">
                  <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  No critical skill gaps detected. Candidate fulfills all core role criteria.
                </div>
              ) : (
                candidate.missingGaps.map((gap, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-obsidian-850 border border-obsidian-border space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-slate-200">{gap.skillOrArea}</span>
                      <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded border ${
                        gap.severity === 'critical' 
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/30' 
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                      }`}>
                        {gap.severity} severity
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      <span className="text-slate-300 font-medium">Gap Analysis:</span> {gap.rationale}
                    </p>
                    <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-obsidian-border text-xs text-slate-300 font-mono">
                      <span className="text-gold-400 font-bold">Suggested Probe:</span> {gap.suggestedValidation}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 3: Resume Citations */}
          {activeTab === 'resume' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="p-3 bg-obsidian-950 border border-obsidian-border rounded-xl text-slate-400">
                <span className="text-emerald-400 font-bold">Provenance Audit:</span> Every claim is grounded in verified documentation.
              </div>

              {candidate.experiences.map((exp, expIdx) => (
                <div key={expIdx} className="p-4 rounded-xl bg-obsidian-850 border border-obsidian-border space-y-2">
                  <div className="flex items-center justify-between text-slate-200 font-sans font-semibold">
                    <span>{exp.role} @ {exp.company}</span>
                    <span className="text-xs font-mono text-slate-400">{exp.duration}</span>
                  </div>

                  <ul className="space-y-2 mt-2">
                    {exp.highlights.map((highlight, hIdx) => {
                      const citation = exp.citations[hIdx] || exp.citations[0];
                      const isHighlighted = highlightedCitation && citation?.includes(highlightedCitation);
                      return (
                        <li 
                          key={hIdx}
                          className={`p-2.5 rounded-lg border leading-relaxed transition-all ${
                            isHighlighted 
                              ? 'bg-gold-950/30 border-gold-500/50 text-slate-100 shadow-md' 
                              : 'bg-obsidian-950/40 border-obsidian-border/60 text-slate-300'
                          }`}
                        >
                          <div>{highlight}</div>
                          {citation && (
                            <div className="mt-1 text-[10px] text-gold-400/80 flex items-center gap-1">
                              <LinkIcon className="w-2.5 h-2.5" />
                              <span>{citation}</span>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-obsidian-850 border-t border-obsidian-border flex items-center justify-between text-xs text-slate-400">
          <div>Verified against: <span className="text-slate-200 font-medium">{jobDescription.title}</span></div>
          <button
            onClick={() => {
              onClose();
              onStartInterview(candidate);
            }}
            className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-black font-bold transition-colors flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Launch Interactive Interview</span>
          </button>
        </div>

      </div>
    </div>
  );
};
