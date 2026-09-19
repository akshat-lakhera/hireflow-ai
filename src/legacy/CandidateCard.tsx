import React from 'react';
import { Candidate } from '../types';
import { ShieldCheck, AlertTriangle, FileSearch, Mic, CheckCircle2, ChevronRight } from 'lucide-react';

interface CandidateCardProps {
  candidate: Candidate;
  onOpenAudit: (candidate: Candidate) => void;
  onStartInterview: (candidate: Candidate) => void;
  onOpenScorecard?: (candidate: Candidate) => void;
}

export const CandidateCard: React.FC<CandidateCardProps> = ({
  candidate,
  onOpenAudit,
  onStartInterview,
  onOpenScorecard
}) => {
  const getScoreColor = (score: number) => {
    if (score >= 85) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', ring: '#10b981' };
    if (score >= 70) return { bg: 'bg-gold-500/10', border: 'border-gold-500/30', text: 'text-gold-400', ring: '#e5a93c' };
    if (score >= 60) return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', ring: '#f59e0b' };
    return { bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400', ring: '#f43f5e' };
  };

  const getGroupBadge = (group: Candidate['grouping']) => {
    switch (group) {
      case 'Top Contender':
        return 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300';
      case 'Strong Technical Fit':
        return 'bg-gold-950/60 border-gold-500/40 text-gold-300';
      case 'Needs Technical Validation':
        return 'bg-amber-950/60 border-amber-500/40 text-amber-300';
      default:
        return 'bg-rose-950/60 border-rose-500/40 text-rose-300';
    }
  };

  const scoreTheme = getScoreColor(candidate.matchScore);
  const fulfilledReqs = candidate.matchedRequirements.filter(r => r.status === 'fulfilled').length;
  const totalReqs = candidate.matchedRequirements.length;

  return (
    <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-obsidian-border flex flex-col justify-between relative overflow-hidden group">
      <div 
        className="absolute top-0 left-0 right-0 h-[2px] opacity-75 group-hover:opacity-100 transition-opacity"
        style={{ background: `linear-gradient(90deg, transparent, ${scoreTheme.ring}, transparent)` }}
      />

      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-lg text-slate-100 group-hover:text-gold-300 transition-colors">
                {candidate.name}
              </h3>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${getGroupBadge(candidate.grouping)}`}>
                {candidate.grouping}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 font-mono">
              <span>{candidate.experienceYears}y Exp</span>
              <span>•</span>
              <span>{candidate.location}</span>
            </p>
          </div>

          <div className={`flex flex-col items-center justify-center w-14 h-14 rounded-xl border ${scoreTheme.border} ${scoreTheme.bg} flex-shrink-0 shadow-inner`}>
            <span className={`font-mono font-bold text-lg leading-none ${scoreTheme.text}`}>
              {candidate.matchScore}%
            </span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400 mt-1 font-medium">Match</span>
          </div>
        </div>

        <p className="text-xs text-slate-300 line-clamp-2 mb-4 leading-relaxed">
          {candidate.summary}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-4">
          {candidate.skills.slice(0, 5).map((skill, idx) => (
            <span 
              key={idx}
              className="text-[11px] font-mono bg-obsidian-800/80 text-slate-300 px-2 py-0.5 rounded-md border border-obsidian-border"
            >
              {skill}
            </span>
          ))}
          {candidate.skills.length > 5 && (
            <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded">
              +{candidate.skills.length - 5} more
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-obsidian-950/60 border border-obsidian-border/80 text-xs mb-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <div>
              <div className="font-mono text-slate-200 font-semibold">{fulfilledReqs}/{totalReqs}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Criteria Match</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-4 h-4 flex-shrink-0 ${candidate.missingGaps.length > 0 ? 'text-amber-400' : 'text-slate-500'}`} />
            <div>
              <div className="font-mono text-slate-200 font-semibold">{candidate.missingGaps.length}</div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider">Gaps to Validate</div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 border-t border-obsidian-border">
        <button
          onClick={() => onOpenAudit(candidate)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-obsidian-800/80 hover:bg-obsidian-700 text-xs font-medium text-slate-200 border border-obsidian-border transition-colors"
          title="Inspect grounded line citations and gap breakdown"
        >
          <FileSearch className="w-3.5 h-3.5 text-gold-400" />
          <span>Audit Evidence</span>
        </button>

        {candidate.interviewStatus === 'completed' ? (
          <button
            onClick={() => onOpenScorecard && onOpenScorecard(candidate)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-xs font-semibold text-emerald-300 border border-emerald-500/40 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Scorecard</span>
          </button>
        ) : (
          <button
            onClick={() => onStartInterview(candidate)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gold-500 hover:bg-gold-600 text-xs font-bold text-black shadow-sm transition-all"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>AI Screen</span>
            <ChevronRight className="w-3 h-3 opacity-70" />
          </button>
        )}
      </div>
    </div>
  );
};
