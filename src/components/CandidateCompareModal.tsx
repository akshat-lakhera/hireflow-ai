import React from 'react';
import { CandidateCaseFile } from '../types';
import { X, Scale, CheckCircle2, AlertTriangle, ShieldCheck, FileText } from 'lucide-react';

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
  if (candidates.length < 2) {
    return null;
  }

  const c1 = candidates[0];
  const c2 = candidates[1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto font-sans text-xs">
      <div className="case-card rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border border-case-borderLight animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-case-bgAlt border-b border-case-border flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-sm">
            <Scale className="w-4 h-4 text-accent-blue" />
            <span>Case Comparison Matrix</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-case-surface hover:bg-case-surfaceLight border border-case-border flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Side-by-side grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-case-border overflow-y-auto flex-1 p-6 gap-6 md:gap-0 bg-case-bg">
          
          {/* Candidate 1 */}
          <div className="md:pr-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] text-accent-blue uppercase">Candidate A</span>
                <h3 className="text-base font-bold text-white">{c1.name}</h3>
                <p className="text-slate-400 text-[11px]">{c1.currentRole}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-accent-green">{c1.matchScore}%</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-case-surface border border-case-border text-slate-300">
                  {c1.fitBadge}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-case-surface border border-case-border space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Proof Summary</div>
              <p className="text-slate-300 text-[11px]">{c1.proofLine}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Top Matched Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {c1.matchedSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-case-surface border border-case-border text-[10px] font-mono text-accent-blue flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-accent-green" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Missing / Validation Needed</div>
              <div className="flex flex-wrap gap-1.5">
                {c1.missingSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-case-surface border border-case-border text-[10px] font-mono text-accent-amber flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-accent-amber" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => { onClose(); onOpenCaseFile(c1); }}
              className="w-full py-2 rounded-xl bg-accent-blue/15 hover:bg-accent-blue/25 text-accent-blue border border-accent-blue/30 font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Inspect {c1.name}'s File</span>
            </button>
          </div>

          {/* Candidate 2 */}
          <div className="md:pl-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] text-accent-blue uppercase">Candidate B</span>
                <h3 className="text-base font-bold text-white">{c2.name}</h3>
                <p className="text-slate-400 text-[11px]">{c2.currentRole}</p>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold font-mono text-accent-green">{c2.matchScore}%</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-case-surface border border-case-border text-slate-300">
                  {c2.fitBadge}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-case-surface border border-case-border space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Proof Summary</div>
              <p className="text-slate-300 text-[11px]">{c2.proofLine}</p>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Top Matched Skills</div>
              <div className="flex flex-wrap gap-1.5">
                {c2.matchedSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-case-surface border border-case-border text-[10px] font-mono text-accent-blue flex items-center gap-1">
                    <CheckCircle2 className="w-2.5 h-2.5 text-accent-green" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase">Missing / Validation Needed</div>
              <div className="flex flex-wrap gap-1.5">
                {c2.missingSkills.map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-case-surface border border-case-border text-[10px] font-mono text-accent-amber flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5 text-accent-amber" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => { onClose(); onOpenCaseFile(c2); }}
              className="w-full py-2 rounded-xl bg-accent-blue/15 hover:bg-accent-blue/25 text-accent-blue border border-accent-blue/30 font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Inspect {c2.name}'s File</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
