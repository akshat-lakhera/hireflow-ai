import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  FolderLock
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
    <div className="min-h-screen bg-case-bg text-slate-100 flex flex-col font-sans">
      
      {/* Top Navigation */}
      <header className="w-full border-b border-case-border bg-case-bgAlt/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center text-accent-blue font-bold text-sm">
              HF
            </div>
            <span className="font-semibold text-base tracking-tight text-white">HireFlow</span>
            <span className="text-[10px] font-mono text-slate-400 px-2 py-0.5 rounded bg-case-surface border border-case-border">
              Case Board
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-slate-400">
            <a href="#product" className="hover:text-slate-200 transition-colors">Product</a>
            <a href="#how-it-works" className="hover:text-slate-200 transition-colors">How it works</a>
            <button 
              onClick={onTrySampleCase} 
              className="hover:text-accent-blue transition-colors text-slate-300 font-medium"
            >
              Demo case
            </button>
            <span className="text-slate-600">|</span>
            <button className="text-slate-300 hover:text-white transition-colors">Sign in</button>
          </nav>
        </div>
      </header>

      {/* Main Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-16 lg:py-24 flex flex-col lg:flex-row items-center justify-between gap-12">
        
        {/* Left Hero Panel */}
        <div className="max-w-xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-case-surface border border-case-border text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-accent-green" />
            <span>Recruiter Investigation Room</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-white leading-[1.15]">
            Turn resumes into evidence-backed hiring decisions.
          </h1>

          <p className="text-base text-slate-300 leading-relaxed">
            Upload a role and candidate files, compare proof against requirements, and generate interview questions in seconds.
          </p>

          {/* Three Proof Chips */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-case-surface border border-case-border text-xs font-mono text-slate-200">
              <ShieldCheck className="w-4 h-4 text-accent-green" />
              <span>Evidence mapping</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-case-surface border border-case-border text-xs font-mono text-slate-200">
              <MessageSquare className="w-4 h-4 text-accent-blue" />
              <span>Interview questions</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-case-surface border border-case-border text-xs font-mono text-slate-200">
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Audit trail</span>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-4">
            <button
              onClick={onStartOnboarding}
              className="px-6 py-3.5 rounded-xl bg-accent-blue hover:bg-accent-blueHover text-black font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
            >
              <span>Upload Job Description</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onTrySampleCase}
              className="px-6 py-3.5 rounded-xl bg-case-surface hover:bg-case-surfaceLight text-slate-200 font-medium text-sm border border-case-border transition-colors flex items-center justify-center gap-2"
            >
              <span>Try Sample Case</span>
            </button>
          </div>

          <p className="text-xs text-slate-400 pt-2">
            Trusted by engineering leads and hiring teams to eliminate buzzword bluffing and ground every evaluation in verified sources.
          </p>
        </div>

        {/* Right Live Preview Panel (Real Candidate Case File Preview) */}
        <div className="w-full max-w-lg">
          <div className="case-card rounded-2xl p-6 border border-case-borderLight shadow-2xl relative">
            
            {/* Top Case Label */}
            <div className="flex items-center justify-between border-b border-case-border pb-4 mb-4 font-mono text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <FolderLock className="w-4 h-4 text-accent-blue" />
                <span>CASE FILE #2026-AR</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-accent-green/15 text-accent-green border border-accent-green/30 font-semibold text-[11px]">
                Strong fit
              </span>
            </div>

            {/* Candidate Header */}
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="font-bold text-lg text-white">Alex Rivera</h3>
                <p className="text-xs text-slate-400 mt-0.5">Principal Systems Architect • 8y Experience</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold font-mono text-accent-green">94%</div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Role Fit</div>
              </div>
            </div>

            {/* Evidence Sample Mapping */}
            <div className="space-y-2 mb-5">
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Verified Proof Sample</div>
              
              <div className="p-3 rounded-lg bg-case-bg border border-case-border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Raft Consensus Internals</span>
                  <span className="text-[10px] font-mono text-accent-green font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    High • Verified
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Source: GitHub repo "raft-kv-engine" • Jepsen linearizable tests
                </div>
              </div>

              <div className="p-3 rounded-lg bg-case-bg border border-case-border text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Active-Active Disaster Recovery</span>
                  <span className="text-[10px] font-mono text-accent-amber font-medium flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    Needs validation
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Source: Resume work history only • Flagged for interview probe
                </div>
              </div>
            </div>

            {/* Interview Question Preview */}
            <div className="p-3.5 rounded-xl bg-case-surfaceElevated border border-case-border text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-accent-blue font-mono font-semibold text-[11px]">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Generated Technical Probe [Deep dive]</span>
              </div>
              <p className="text-slate-200 text-xs italic">
                "Walk me through how you tuned Raft election timeouts to achieve 240ms failover without inducing split-vote storms."
              </p>
            </div>

            {/* Quick Open CTA on card */}
            <div className="mt-5 pt-4 border-t border-case-border flex items-center justify-between text-xs text-slate-400">
              <span>Proof line: 2 systems, 1 GitHub repo, 1 paper</span>
              <button 
                onClick={onTrySampleCase}
                className="text-accent-blue hover:underline font-medium flex items-center gap-1"
              >
                <span>Inspect in board</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>

      </main>

      {/* Minimal Footer */}
      <footer className="w-full border-t border-case-border py-6 text-center text-xs font-mono text-slate-400">
        HireFlow — Candidate Case Board • Turn resumes into evidence-backed hiring decisions
      </footer>

    </div>
  );
};
