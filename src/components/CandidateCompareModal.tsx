import React from 'react';
import { CandidateCaseFile } from '../types';
import { 
  X, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  MapPin, 
  Briefcase, 
  ArrowRight,
  Sparkles,
  Award
} from 'lucide-react';

interface CandidateCompareModalProps {
  candidates: CandidateCaseFile[];
  onClose: () => void;
  onOpenCaseFile: (candidate: CandidateCaseFile) => void;
}

export const CandidateCompareModal: React.FC<CandidateCompareModalProps> = ({
  candidates,
  onClose,
  onOpenCaseFile
}) => {
  if (candidates.length < 2) return null;

  const c1 = candidates[0];
  const c2 = candidates[1];

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-emerald-600';
    if (score >= 70) return 'text-indigo-600';
    return 'text-amber-600';
  };

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold shadow-xs">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Side-by-Side Candidate Comparison Matrix</h3>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-100">
                  Direct Benchmark
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Objective qualification matching, verifiable evidence & identified gaps</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
            title="Close comparison"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Comparative Telemetry Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3 grid grid-cols-2 divide-x divide-slate-200 text-xs text-slate-600">
          <div className="pr-4 flex items-center justify-between">
            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-600" />
              {c1.name}
            </span>
            <span className="font-mono font-bold text-slate-800">{c1.experienceYears}y exp • {c1.reviewStatus}</span>
          </div>
          <div className="pl-4 flex items-center justify-between">
            <span className="font-semibold text-slate-900 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-600" />
              {c2.name}
            </span>
            <span className="font-mono font-bold text-slate-800">{c2.experienceYears}y exp • {c2.reviewStatus}</span>
          </div>
        </div>

        {/* Side-by-side comparison body */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-y-auto flex-1 p-6 gap-6 md:gap-0 bg-slate-50/30">
          
          {/* Candidate 1 */}
          <div className="md:pr-6 space-y-5">
            <div className="flex items-start justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Candidate A</span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5 truncate">{c1.name}</h4>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 truncate">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c1.currentRole}</span>
                </p>
                {c1.location && c1.location !== 'Not specified' && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{c1.location}</span>
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className={`text-2xl font-bold font-mono ${getScoreColor(c1.matchScore)}`}>
                  {c1.matchScore}%
                </div>
                <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border mt-1 ${getBadgeClasses(c1.fitBadge)}`}>
                  {c1.fitBadge}
                </span>
              </div>
            </div>

            {/* Evidence Grounding */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Evidence Grounding & Proof Line</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">{c1.proofLine}</p>
            </div>

            {/* Matched Qualifications */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Matched Skills ({c1.matchedSkills.length})</span>
                <span className="text-emerald-700 font-semibold text-[10px]">Verified</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c1.matchedSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{s}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Gaps / Validation Items */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Gaps / Validation Items ({c1.missingSkills.length})</span>
                <span className="text-amber-700 font-semibold text-[10px]">Probe in interview</span>
              </div>
              {c1.missingSkills.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No critical skill gaps flagged.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {c1.missingSkills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{s}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Projects */}
            {c1.projects && c1.projects.length > 0 && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Key Projects On Record ({c1.projects.length})
                </div>
                <div className="space-y-1.5">
                  {c1.projects.slice(0, 2).map((p, i) => (
                    <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      {p.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{p.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { onClose(); onOpenCaseFile(c1); }}
              className="w-full py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Inspect {c1.name}'s Full Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Candidate 2 */}
          <div className="md:pl-6 space-y-5">
            <div className="flex items-start justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
              <div className="min-w-0 pr-2">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Candidate B</span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5 truncate">{c2.name}</h4>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5 truncate">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{c2.currentRole}</span>
                </p>
                {c2.location && c2.location !== 'Not specified' && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>{c2.location}</span>
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <div className={`text-2xl font-bold font-mono ${getScoreColor(c2.matchScore)}`}>
                  {c2.matchScore}%
                </div>
                <span className={`inline-block text-[10px] font-semibold px-2.5 py-0.5 rounded-full border mt-1 ${getBadgeClasses(c2.fitBadge)}`}>
                  {c2.fitBadge}
                </span>
              </div>
            </div>

            {/* Evidence Grounding */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-1.5">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                <span>Evidence Grounding & Proof Line</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-normal">{c2.proofLine}</p>
            </div>

            {/* Matched Qualifications */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Matched Skills ({c2.matchedSkills.length})</span>
                <span className="text-emerald-700 font-semibold text-[10px]">Verified</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {c2.matchedSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>{s}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Gaps / Validation Items */}
            <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Gaps / Validation Items ({c2.missingSkills.length})</span>
                <span className="text-amber-700 font-semibold text-[10px]">Probe in interview</span>
              </div>
              {c2.missingSkills.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No critical skill gaps flagged.</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {c2.missingSkills.map((s, i) => (
                    <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>{s}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Verified Projects */}
            {c2.projects && c2.projects.length > 0 && (
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2">
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Key Projects On Record ({c2.projects.length})
                </div>
                <div className="space-y-1.5">
                  {c2.projects.slice(0, 2).map((p, i) => (
                    <div key={i} className="p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                      <span className="font-semibold text-slate-800">{p.name}</span>
                      {p.description && (
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{p.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { onClose(); onOpenCaseFile(c2); }}
              className="w-full py-2.5 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Inspect {c2.name}'s Full Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
