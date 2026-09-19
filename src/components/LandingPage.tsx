import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  FolderLock,
  Sparkles,
  Terminal,
  Layers,
  ChevronRight
} from 'lucide-react';

interface LandingPageProps {
  onStartOnboarding: () => void;
  onTrySampleCase: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartOnboarding,
  onTrySampleCase
}) => {
  return (
    <div className="min-h-screen bg-ink-950 text-slate-100 flex flex-col font-sans ambient-glow">
      
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-ink-border bg-ink-900/80 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-12 h-18 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gold-glow border border-gold-border flex items-center justify-center text-gold-500 font-bold text-sm">
            HF
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-base tracking-tight text-white">HireFlow</span>
            <span className="text-[10px] font-mono text-gold-400 px-2 py-0.5 rounded bg-ink-800 border border-ink-border">
              Candidate Case Board
            </span>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-mono text-slate-400">
          <button onClick={onStartOnboarding} className="hover:text-white transition-colors">
            Role Studio
          </button>
          <button 
            onClick={onTrySampleCase} 
            className="hover:text-gold-400 transition-colors text-slate-300 font-semibold"
          >
            Demo Case
          </button>
          <span className="text-slate-700">|</span>
          <button 
            onClick={onStartOnboarding}
            className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs shadow-md transition-colors"
          >
            Launch Board
          </button>
        </nav>
      </header>

      {/* Main Full-Bleed Hero Section */}
      <main className="flex-1 max-w-[1600px] mx-auto w-full px-6 sm:px-12 py-16 lg:py-24 flex flex-col lg:flex-row items-center justify-between gap-14">
        
        {/* Left Hero Command Column */}
        <div className="max-w-2xl space-y-8">
          
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-ink-900 border border-ink-border text-xs font-mono text-gold-400">
            <span className="w-2 h-2 rounded-full bg-gold-500 animate-pulse" />
            <span>Recruiter Investigation Room</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
            Turn resumes into <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-400 via-yellow-200 to-gold-500">evidence-backed</span> hiring decisions.
          </h1>

          <p className="text-lg text-slate-300 leading-relaxed font-normal">
            Upload a custom role and candidate files, cross-reference proof directly against requirements, and generate rigorous interview probe trees in seconds.
          </p>

          {/* Three Proof Chips */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-ink-900 border border-ink-border text-xs font-mono text-slate-200">
              <ShieldCheck className="w-4 h-4 text-verified-400" />
              <span>Evidence Mapping</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-ink-900 border border-ink-border text-xs font-mono text-slate-200">
              <MessageSquare className="w-4 h-4 text-gold-400" />
              <span>Interview Questions</span>
            </div>
            <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-ink-900 border border-ink-border text-xs font-mono text-slate-200">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Audit Trail</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-4">
            <button
              onClick={onStartOnboarding}
              className="px-8 py-4 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-extrabold text-sm shadow-xl transition-all flex items-center justify-center gap-2.5"
            >
              <span>Upload Job Description</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onTrySampleCase}
              className="px-7 py-4 rounded-xl bg-ink-850 hover:bg-ink-800 text-slate-200 font-semibold text-sm border border-ink-border hover:border-slate-600 transition-colors flex items-center justify-center gap-2"
            >
              <span>Try 1 Demo Case</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 pt-2 leading-relaxed">
            Eliminate buzzword bluffing. Built for technical leads and hiring panels to audit real source artifacts rather than generic CV summaries.
          </p>

        </div>

        {/* Right Live Preview Panel: Luxury Dossier Preview */}
        <div className="w-full max-w-xl">
          <div className="dossier-card rounded-3xl p-7 border-2 border-gold-border/70 shadow-2xl relative bg-gradient-to-b from-ink-850 to-ink-900 overflow-hidden">
            
            {/* Top Case Label */}
            <div className="flex items-center justify-between border-b border-ink-border pb-4 mb-5 font-mono text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <FolderLock className="w-4 h-4 text-gold-500" />
                <span className="text-white font-semibold">DOSSIER #2026-AR</span>
              </div>
              <span className="px-2.5 py-1 rounded bg-verified-subtle text-verified-400 border border-verified-border font-semibold text-[11px]">
                Strong fit
              </span>
            </div>

            {/* Candidate Header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h3 className="font-extrabold text-xl text-white">Alex Rivera</h3>
                <p className="text-xs text-slate-400 mt-1">Principal Systems Architect • 8y Experience</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-extrabold font-mono text-verified-400">94%</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Role Fit</div>
              </div>
            </div>

            {/* Evidence Sample Mapping */}
            <div className="space-y-2.5 mb-6">
              <div className="text-[11px] font-mono text-gold-400 uppercase tracking-wider font-semibold">
                Verified Proof Sample
              </div>
              
              <div className="p-3.5 rounded-xl bg-ink-950 border border-ink-border text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Raft Consensus Internals</span>
                  <span className="text-[10px] font-mono text-verified-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    High • Verified
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Source: GitHub repo "raft-kv-engine" • Jepsen linearizable tests
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-ink-950 border border-ink-border text-xs space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Active-Active Disaster Recovery</span>
                  <span className="text-[10px] font-mono text-caution-500 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Needs validation
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Source: Resume work history only • Flagged for interview probe
                </div>
              </div>
            </div>

            {/* Interview Question Preview */}
            <div className="p-4 rounded-xl bg-ink-950 border border-ink-border text-xs space-y-2">
              <div className="flex items-center gap-2 text-gold-400 font-mono font-semibold text-[11px]">
                <MessageSquare className="w-3.5 h-3.5 text-gold-500" />
                <span>Generated Technical Probe [Deep dive]</span>
              </div>
              <p className="text-slate-200 text-xs italic leading-relaxed">
                "Walk me through how you tuned Raft election timeouts to achieve 240ms failover without inducing split-vote storms."
              </p>
            </div>

            {/* Bottom Inspect Action */}
            <div className="mt-6 pt-4 border-t border-ink-border flex items-center justify-between text-xs text-slate-400">
              <span>Proof line: 2 systems, 1 GitHub repo, 1 paper</span>
              <button 
                onClick={onTrySampleCase}
                className="text-gold-400 hover:text-gold-300 font-semibold font-mono flex items-center gap-1.5"
              >
                <span>Inspect in board</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>

      </main>

      {/* Minimal Editorial Footer */}
      <footer className="w-full border-t border-ink-border py-6 text-center text-xs font-mono text-slate-400">
        HireFlow — Candidate Case Board • Turn resumes into evidence-backed hiring decisions
      </footer>

    </div>
  );
};
