import React from 'react';
import { CandidateCaseFile, ReviewMode } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Briefcase, 
  ArrowUpRight,
  Sparkles,
  Scale
} from 'lucide-react';

interface CandidateCaseFileCardProps {
  candidate: CandidateCaseFile;
  isSelected: boolean;
  isCompareSelected?: boolean;
  reviewMode: ReviewMode;
  onSelect: () => void;
  onOpenDetail: () => void;
  onOpenInterviewKit: () => void;
  onToggleCompare?: () => void;
}

export const CandidateCaseFileCard: React.FC<CandidateCaseFileCardProps> = ({
  candidate,
  isSelected,
  isCompareSelected = false,
  onSelect,
  onOpenDetail,
  onToggleCompare
}) => {
  const getBadgeClasses = (badge: CandidateCaseFile['fitBadge']) => {
    switch (badge) {
      case 'Strong fit':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Moderate fit':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Potential gap':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusClasses = (status: CandidateCaseFile['reviewStatus']) => {
    switch (status) {
      case 'Interview Ready':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'Needs Review':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Passed Screen':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'Offer Extended':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Archived':
      case 'Rejected':
        return 'bg-slate-100 text-slate-500 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  return (
    <div
      onClick={onSelect}
      className={`group cursor-pointer rounded-xl border p-4 transition-all relative ${
        isCompareSelected
          ? 'bg-indigo-50/40 border-indigo-500 ring-2 ring-indigo-500/70 shadow-sm'
          : isSelected
            ? 'bg-indigo-50/30 border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
            : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Top row: Avatar + Name + Fit Score */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs shrink-0">
            {candidate.initials || candidate.name.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
              {candidate.name}
            </h4>
            <div className="text-xs text-slate-500 truncate flex items-center gap-1.5 mt-0.5">
              <span className="truncate">{candidate.currentRole}</span>
              {candidate.location && candidate.location !== 'Not specified' && (
                <>
                  <span>•</span>
                  <span className="shrink-0 flex items-center gap-0.5">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    {candidate.location.split(',')[0]}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Fit Score Badge */}
        <div className="text-right shrink-0">
          <div className="text-base font-bold text-slate-900 font-mono">
            {candidate.matchScore}%
          </div>
          <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full border mt-0.5 ${getBadgeClasses(candidate.fitBadge)}`}>
            {candidate.fitBadge}
          </span>
        </div>
      </div>

      {/* Verified Skills / Projects pills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {candidate.matchedSkills.slice(0, 3).map((skill, i) => (
          <span
            key={i}
            className="text-[11px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200/60"
          >
            {skill}
          </span>
        ))}
        {candidate.projects && candidate.projects.length > 0 && (
          <span className="text-[11px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100">
            {candidate.projects[0].name}
          </span>
        )}
      </div>

      {/* Card Footer: Status + Compare + Details Action */}
      <div className="mt-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${getStatusClasses(candidate.reviewStatus)}`}>
            {candidate.reviewStatus}
          </span>
          {onToggleCompare && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleCompare();
              }}
              className={`text-[10px] font-medium px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                isCompareSelected
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs font-semibold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
              title={isCompareSelected ? 'Remove from comparison matrix' : 'Select for side-by-side comparison matrix'}
            >
              <Scale className="w-2.5 h-2.5" />
              <span>{isCompareSelected ? 'Comparing' : 'Compare'}</span>
            </button>
          )}
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail();
          }}
          className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-0.5 transition-colors shrink-0"
        >
          <span>View Dossier</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
