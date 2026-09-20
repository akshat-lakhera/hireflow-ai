import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  MessageSquare, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  Users,
  Briefcase,
  Layers,
  ChevronRight,
  Mic,
  Cpu,
  Zap,
  ShieldAlert
} from 'lucide-react';

interface LandingPageProps {
  onStartOnboarding: () => void;
  onGoToDashboard?: () => void;
  onRunInstantDemo?: () => void;
  onOpenPresentationDeck?: () => void;
  candidateCount?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartOnboarding,
  onGoToDashboard,
  onRunInstantDemo,
  onOpenPresentationDeck,
  candidateCount = 0
}) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Top Navigation Bar */}
      <header className="w-full border-b border-slate-200 bg-white sticky top-0 z-30 px-6 sm:px-12 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            TD
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-slate-900">TalentDossier</span>
            <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-wider">
              Autonomous Recruiter Agent
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-3 text-xs">
          {onOpenPresentationDeck && (
            <button
              onClick={onOpenPresentationDeck}
              className="px-3 py-1.5 font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="View 10-slide Agentic AI Pitch Deck (PPT)"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Pitch Deck (PPT)</span>
            </button>
          )}
          {onRunInstantDemo && (
            <button
              onClick={onRunInstantDemo}
              className="px-3.5 py-1.5 font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-all flex items-center gap-1.5 shadow-xs"
              title="Launch instant 4-candidate simulation"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-600" />
              <span>1-Click Demo</span>
            </button>
          )}
          {candidateCount > 0 && onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="px-3.5 py-1.5 font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors flex items-center gap-1.5 shadow-xs"
              title="Return to active candidate workspace"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Workspace ({candidateCount})</span>
            </button>
          )}
          <button 
            onClick={onStartOnboarding}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Configure Role</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-14 sm:py-18 flex flex-col items-center text-center">
        
        {/* Subtle Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold mb-6 shadow-xs animate-pulse">
          <Zap className="w-3.5 h-3.5 text-emerald-600" />
          <span>Zero-Setup Hackathon Demo • Autonomous ReAct Loop + Adversarial Guardrails</span>
        </div>

        {/* High-Contrast Clear Headline */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl leading-tight">
          From raw resumes to hiring decisions — <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">completely autonomous</span>.
        </h1>

        <p className="mt-5 text-base text-slate-600 max-w-2xl leading-relaxed">
          Monitors applicant inflow, maps verified project proof, neutralizes adversarial prompt-injections, and drafts personalized emails — while keeping recruiters in final control at the human gate.
        </p>

        {/* High-Impact CTA Row */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3.5 w-full sm:w-auto">
          {onRunInstantDemo && (
            <button
              onClick={onRunInstantDemo}
              className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 group scale-105"
            >
              <Zap className="w-4 h-4 text-emerald-200 group-hover:rotate-12 transition-transform" />
              <span>⚡ 1-Click Interactive Demo (Stream 4 Resumes)</span>
            </button>
          )}

          <button
            onClick={onStartOnboarding}
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
          >
            <span>Custom Role Studio</span>
            <ArrowRight className="w-4 h-4 text-slate-400" />
          </button>

          {onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-semibold text-sm shadow-xs transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4 text-slate-500" />
              <span>Open Workspace</span>
            </button>
          )}
        </div>

        {/* Feature Cards Grid (4 Column Responsive) */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full text-left">
          
          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5 hover:border-slate-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Evidence Mapping</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every score cites verbatim project lines and verified commits. No hallucinations, no black-box percentages.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-rose-100 bg-rose-50/20 shadow-xs space-y-2.5 hover:border-rose-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Adversarial Defense</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Proactive heuristic & LLM guardrails detect hidden prompt overrides, jailbreaks, and white-text cheats in submitted resumes.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5 hover:border-slate-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tailored Probes & STT</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates project-specific interview kits with evaluation rubrics and live Speech-to-Text note dictation.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-2.5 hover:border-slate-300 transition-colors">
            <div className="w-9 h-9 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Cpu className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Continuous ReAct Loop</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Autonomous daemon perceives applicant queues, plans DAG tasks, dispatches tools, and halts at the human sign-off gate.
            </p>
          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 px-12 text-center text-xs text-slate-500">
        TalentDossier Recruiter Intelligence • Privacy-First Candidate Screening Platform
      </footer>

    </div>
  );
};
