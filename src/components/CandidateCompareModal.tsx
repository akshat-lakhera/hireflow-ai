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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md overflow-y-auto font-sans text-xs">
      <div className="dossier-card rounded-3xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl border-2 border-gold-border/60 bg-ink-950 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-ink-900 border-b border-ink-border flex items-center justify-between">
          <div className="flex items-center gap-3 text-white font-bold text-sm">
            <div className="w-8 h-8 rounded-xl bg-gold-glow border border-gold-border flex items-center justify-center text-gold-500">
              <Scale className="w-4 h-4" />
            </div>
            <div>
              <span className="font-extrabold text-base">Case Comparison Matrix</span>
              <span className="text-slate-400 font-mono text-[11px] block">Side-by-side evidence evaluation</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-ink-850 hover:bg-ink-800 border border-ink-border flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Side-by-side grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-ink-border overflow-y-auto flex-1 p-8 gap-8 md:gap-0 bg-ink-950">
          
          {/* Candidate 1 */}
          <div className="md:pr-8 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] text-gold-400 uppercase font-bold">Candidate A</span>
                <h3 className="text-lg font-extrabold text-white">{c1.name}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{c1.currentRole}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-verified-400">{c1.matchScore}%</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ink-850 border border-ink-border text-slate-300 font-bold">
                  {c1.fitBadge}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-ink-900 border border-ink-border space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Proof Summary</div>
              <p className="text-slate-300 text-xs leading-relaxed">{c1.proofLine}</p>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Top Matched Criteria</div>
              <div className="flex flex-wrap gap-1.5">
                {c1.matchedSkills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-ink-900 border border-ink-border text-[11px] font-mono text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-verified-400" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Missing / Validation Needed</div>
              <div className="flex flex-wrap gap-1.5">
                {c1.missingSkills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-ink-900 border border-caution-border/50 text-[11px] font-mono text-caution-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-caution-500" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => { onClose(); onOpenCaseFile(c1); }}
              className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>Inspect {c1.name}'s Dossier</span>
            </button>
          </div>

          {/* Candidate 2 */}
          <div className="md:pl-8 space-y-5">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] text-gold-400 uppercase font-bold">Candidate B</span>
                <h3 className="text-lg font-extrabold text-white">{c2.name}</h3>
                <p className="text-slate-400 text-xs mt-0.5">{c2.currentRole}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-extrabold font-mono text-verified-400">{c2.matchScore}%</div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-ink-850 border border-ink-border text-slate-300 font-bold">
                  {c2.fitBadge}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-ink-900 border border-ink-border space-y-1.5">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Proof Summary</div>
              <p className="text-slate-300 text-xs leading-relaxed">{c2.proofLine}</p>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Top Matched Criteria</div>
              <div className="flex flex-wrap gap-1.5">
                {c2.matchedSkills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-ink-900 border border-ink-border text-[11px] font-mono text-slate-200 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3 text-verified-400" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase font-bold">Missing / Validation Needed</div>
              <div className="flex flex-wrap gap-1.5">
                {c2.missingSkills.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-ink-900 border border-caution-border/50 text-[11px] font-mono text-caution-500 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3 text-caution-500" />
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <button
              onClick={() => { onClose(); onOpenCaseFile(c2); }}
              className="w-full py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold transition-colors flex items-center justify-center gap-2 shadow-md"
            >
              <FileText className="w-4 h-4" />
              <span>Inspect {c2.name}'s Dossier</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
