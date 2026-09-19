import React from 'react';
import { CandidateCaseFile } from '../types';
import { X, Scale, CheckCircle2, AlertTriangle, FileText, ArrowRight } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Candidate Comparison Matrix</h3>
              <p className="text-xs text-slate-500">Side-by-side evidence and qualifications comparison</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Side-by-side comparison body */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 overflow-y-auto flex-1 p-6 gap-6 md:gap-0 bg-slate-50/50">
          
          {/* Candidate 1 */}
          <div className="md:pr-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Candidate A</span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5">{c1.name}</h4>
                <p className="text-xs text-slate-600">{c1.currentRole}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-slate-900">{c1.matchScore}%</div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  {c1.fitBadge}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evidence Grounding</div>
              <p className="text-xs text-slate-700 leading-relaxed">{c1.proofLine}</p>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matched Qualifications</div>
              <div className="flex flex-wrap gap-1.5">
                {c1.matchedSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gaps / Validation Items</div>
              <div className="flex flex-wrap gap-1.5">
                {c1.missingSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => { onClose(); onOpenCaseFile(c1); }}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Inspect {c1.name}'s Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Candidate 2 */}
          <div className="md:pl-6 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Candidate B</span>
                <h4 className="text-lg font-bold text-slate-900 mt-0.5">{c2.name}</h4>
                <p className="text-xs text-slate-600">{c2.currentRole}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-slate-900">{c2.matchScore}%</div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
                  {c2.fitBadge}
                </span>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evidence Grounding</div>
              <p className="text-xs text-slate-700 leading-relaxed">{c2.proofLine}</p>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Matched Qualifications</div>
              <div className="flex flex-wrap gap-1.5">
                {c2.matchedSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Gaps / Validation Items</div>
              <div className="flex flex-wrap gap-1.5">
                {c2.missingSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => { onClose(); onOpenCaseFile(c2); }}
              className="w-full py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm flex items-center justify-center gap-1.5"
            >
              <span>Inspect {c2.name}'s Dossier</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
