import React from 'react';
import { CandidateCaseFile } from '../types';
import { 
  FileText, 
  MessageSquare, 
  Scale, 
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
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
  // Determine badge styling based on candidate.fitBadge
  const getBadgeStyle = () => {
    switch (candidate.fitBadge) {
      case 'Strong fit':
        return 'bg-accent-green/15 text-accent-green border-accent-green/30';
      case 'Needs validation':
        return 'bg-accent-amber/15 text-accent-amber border-accent-amber/30';
      case 'High risk':
        return 'bg-accent-red/15 text-accent-red border-accent-red/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getScoreColor = () => {
    if (candidate.matchScore >= 85) return '#55D38A';
    if (candidate.matchScore >= 70) return '#F4B860';
    return '#E26D6D';
  };

  // Circular ring calculations
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (candidate.matchScore / 100) * circumference;

  return (
    <div 
      onClick={onSelect}
      className={`case-card case-card-lift rounded-xl p-4 border transition-all cursor-pointer relative ${
        isSelected 
          ? 'border-accent-blue/80 bg-case-surfaceElevated ring-1 ring-accent-blue/40' 
          : 'border-case-border bg-case-surface hover:border-slate-600'
      }`}
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3 mb-3">
        
        {/* Avatar and Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-case-bg border border-case-border flex items-center justify-center font-mono font-bold text-sm text-accent-blue shadow-inner flex-shrink-0">
            {candidate.initials}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-white hover:text-accent-blue transition-colors">
                {candidate.name}
              </h3>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold border ${getBadgeStyle()}`}>
                {candidate.fitBadge}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {candidate.currentRole} • {candidate.experienceYears}y exp
            </p>
          </div>
        </div>

        {/* Match Score Small Ring */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="relative w-11 h-11 flex items-center justify-center">
            <svg className="w-11 h-11 -rotate-90">
              <circle
                cx="22"
                cy="22"
                r={radius}
                stroke="currentColor"
                strokeWidth="3"
                className="text-case-bgAlt"
                fill="none"
              />
              <circle
                cx="22"
                cy="22"
                r={radius}
                stroke={getScoreColor()}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-500 ease-out"
              />
            </svg>
            <span className="absolute font-mono font-bold text-[11px] text-white">
              {candidate.matchScore}%
            </span>
          </div>
        </div>

      </div>

      {/* Matched & Missing Skills */}
      <div className="space-y-1.5 my-3">
        {/* 3 Key Matched Skills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-mono text-slate-500 mr-1">Matched:</span>
          {candidate.matchedSkills.slice(0, 3).map((skill, idx) => (
            <span 
              key={`match-${idx}`}
              className="px-2 py-0.5 rounded bg-case-bg border border-case-border text-[10px] font-mono text-slate-300 flex items-center gap-1"
            >
              <CheckCircle2 className="w-2.5 h-2.5 text-accent-green" />
              <span>{skill}</span>
            </span>
          ))}
        </div>

        {/* 2 Missing Skills */}
        {candidate.missingSkills && candidate.missingSkills.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-500 mr-1">Missing:</span>
            {candidate.missingSkills.slice(0, 2).map((skill, idx) => (
              <span 
                key={`miss-${idx}`}
                className="px-2 py-0.5 rounded bg-case-bg border border-case-border text-[10px] font-mono text-accent-amber/90 flex items-center gap-1"
              >
                <AlertTriangle className="w-2.5 h-2.5 text-accent-amber" />
                <span>{skill}</span>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Proof Line */}
      <div className="text-[11px] font-mono text-slate-400 bg-case-bg/60 p-2 rounded-lg border border-case-border/60 flex items-center justify-between mb-3">
        <span className="truncate pr-2">Proof: {candidate.proofLine}</span>
        <span className="text-[10px] text-slate-500 flex-shrink-0">
          {candidate.evidenceMap.length} items
        </span>
      </div>

      {/* Action Buttons: View case, Generate questions, Compare */}
      <div className="flex items-center gap-2 pt-2 border-t border-case-border" onClick={e => e.stopPropagation()}>
        <button
          onClick={onViewCase}
          className="flex-1 py-1.5 px-2.5 rounded-lg bg-accent-blue/15 hover:bg-accent-blue/25 text-accent-blue border border-accent-blue/30 font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5" />
          <span>View case</span>
        </button>

        <button
          onClick={onGenerateQuestions}
          className="py-1.5 px-2.5 rounded-lg bg-case-bg hover:bg-case-surface border border-case-border text-slate-300 font-medium text-[11px] transition-colors flex items-center justify-center gap-1.5"
          title="Open structured interview prep kit"
        >
          <MessageSquare className="w-3.5 h-3.5 text-accent-blue" />
          <span>Generate questions</span>
        </button>

        <button
          onClick={onToggleCompare}
          className={`py-1.5 px-2 rounded-lg border text-[11px] transition-colors flex items-center justify-center gap-1 ${
            isCompared 
              ? 'bg-accent-violet/20 border-accent-violet text-accent-violet font-semibold' 
              : 'bg-case-bg border-case-border text-slate-400 hover:text-slate-200'
          }`}
          title="Compare with another candidate"
        >
          <Scale className="w-3.5 h-3.5" />
          <span>{isCompared ? 'Comparing' : 'Compare'}</span>
        </button>
      </div>

    </div>
  );
};
