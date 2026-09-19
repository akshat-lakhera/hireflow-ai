import React from 'react';
import { CandidateCaseFile } from '../types';
import { 
  FileText, 
  MessageSquare, 
  Scale, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface CandidateCaseFileCardProps {
  candidate: CandidateCaseFile;
  isSelected: boolean;
  isCompared: boolean;
  onSelect: () => void;
  onViewCase: () => void;
  onGenerateQuestions: () => void;
  onToggleCompare: () => void;
}

export const CandidateCaseFileCard: React.FC<CandidateCaseFileCardProps> = ({
  candidate,
  isSelected,
  isCompared,
  onSelect,
  onViewCase,
  onGenerateQuestions,
  onToggleCompare
}) => {
  const getBadgeStyle = () => {
    switch (candidate.fitBadge) {
      case 'Strong fit':
        return 'bg-verified-subtle text-verified-400 border-verified-border';
      case 'Needs validation':
        return 'bg-caution-subtle text-caution-500 border-caution-border';
      case 'High risk':
        return 'bg-flag-subtle text-flag-500 border-flag-border';
      default:
        return 'bg-ink-850 text-slate-400 border-ink-border';
    }
  };

  const getScoreColor = () => {
    if (candidate.matchScore >= 85) return '#10B981';
    if (candidate.matchScore >= 70) return '#F59E0B';
    return '#F87171';
  };

  // Circular ring calculations
  const radius = 17;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (candidate.matchScore / 100) * circumference;

  return (
    <div 
      onClick={onSelect}
      className={`dossier-card dossier-card-lift rounded-2xl p-5 border transition-all cursor-pointer relative ${
        isSelected 
          ? 'border-gold-500 bg-ink-800 ring-1 ring-gold-500/40 shadow-xl' 
          : 'border-ink-border bg-ink-850 hover:border-slate-600'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-4 mb-4">
        
        {/* Avatar and Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-ink-900 border border-ink-border flex items-center justify-center font-mono font-bold text-sm text-gold-400 shadow-inner flex-shrink-0">
            {candidate.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-white hover:text-gold-400 transition-colors">
                {candidate.name}
              </h3>
              <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold border ${getBadgeStyle()}`}>
                {candidate.fitBadge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
              {candidate.currentRole} • {candidate.experienceYears}y exp
            </p>
          </div>
        </div>

        {/* Match Score Small Ring */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-12 h-12 -rotate-90">
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke="currentColor"
                strokeWidth="3.5"
                className="text-ink-950"
                fill="none"
              />
              <circle
                cx="24"
                cy="24"
                r={radius}
                stroke={getScoreColor()}
                strokeWidth="3.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute font-mono font-extrabold text-xs text-white">
              {candidate.matchScore}%
            </span>
          </div>
        </div>

      </div>

      {/* Matched & Missing Skills */}
      <div className="space-y-2 my-3.5">
        {/* Matched Skills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-400 mr-1 font-semibold">Matched:</span>
          {candidate.matchedSkills.slice(0, 3).map((skill, idx) => (
            <span 
              key={`match-${idx}`}
              className="px-2.5 py-1 rounded-lg bg-ink-900 border border-ink-border text-[11px] font-mono text-slate-200 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3 h-3 text-verified-400" />
              <span>{skill}</span>
            </span>
          ))}
        </div>

        {/* Missing Skills */}
        {candidate.missingSkills && candidate.missingSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 mr-1 font-semibold">Missing:</span>
            {candidate.missingSkills.slice(0, 2).map((skill, idx) => (
              <span 
                key={`miss-${idx}`}
                className="px-2.5 py-1 rounded-lg bg-ink-900 border border-caution-border/50 text-[11px] font-mono text-caution-500 flex items-center gap-1.5"
              >
                <AlertTriangle className="w-3 h-3 text-caution-500" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Proof Line */}
      <div className="text-[11px] font-mono text-slate-300 bg-ink-900/80 p-3 rounded-xl border border-ink-border flex items-center justify-between mb-4">
        <span className="truncate pr-2">Proof: {candidate.proofLine}</span>
        <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">
          {candidate.evidenceMap.length} verified items
        </span>
      </div>

      {/* Action Buttons: View case, Generate questions, Compare */}
      <div className="flex items-center gap-2 pt-3 border-t border-ink-border" onClick={e => e.stopPropagation()}>
        <button
          onClick={onViewCase}
          className="flex-1 py-2 px-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View Dossier</span>
        </button>

        <button
          onClick={onGenerateQuestions}
          className="py-2 px-3 rounded-xl bg-ink-900 hover:bg-ink-800 border border-ink-border text-slate-200 font-medium text-xs transition-colors flex items-center justify-center gap-1.5"
          title="Open structured interview prep kit"
        >
          <MessageSquare className="w-3.5 h-3.5 text-gold-400" />
          <span>Questions</span>
        </button>

        <button
          onClick={onToggleCompare}
          className={`py-2 px-3 rounded-xl border text-xs font-mono transition-colors flex items-center justify-center gap-1.5 ${
            isCompared 
              ? 'bg-gold-subtle border-gold-border text-gold-400 font-bold' 
              : 'bg-ink-900 border-ink-border text-slate-400 hover:text-slate-200'
          }`}
          title="Compare candidate side-by-side"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{isCompared ? 'Comparing' : 'Compare'}</span>
        </button>
      </div>

    </div>
  );
};
