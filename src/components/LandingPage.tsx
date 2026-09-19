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
  Cpu
} from 'lucide-react';

interface LandingPageProps {
  onStartOnboarding: () => void;
  onTrySampleCase: () => void;
  onGoToDashboard?: () => void;
  candidateCount?: number;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStartOnboarding,
  onTrySampleCase,
  onGoToDashboard,
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
              Recruiter Workspace
            </span>
          </div>
        </div>

        <nav className="flex items-center gap-3 text-xs">
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
            onClick={onTrySampleCase} 
            className="px-3 py-1.5 font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Try 1 Demo Case
          </button>
          <button 
            onClick={onStartOnboarding}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm transition-colors flex items-center gap-1.5"
          >
            <span>Configure Role & Launch</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-6xl mx-auto px-6 py-16 sm:py-20 flex flex-col items-center text-center">
        
        {/* Subtle Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Evidence-Based Candidate Screening for Modern Teams</span>
        </div>

        {/* High-Contrast Clear Headline */}
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl leading-tight">
          Turn raw resumes into grounded hiring decisions.
        </h1>

        <p className="mt-4 text-base text-slate-600 max-w-2xl leading-relaxed">
          Upload custom job descriptions and candidate resumes. Automatically cross-reference qualifications against real proof, uncover verification gaps, and generate structured technical interview kits.
        </p>

        {/* CTA Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          {candidateCount > 0 && onGoToDashboard && (
            <button
              onClick={onGoToDashboard}
              className="w-full sm:w-auto px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Resume Workspace ({candidateCount} Candidates)</span>
            </button>
          )}

          <button
            onClick={onStartOnboarding}
            className={`w-full sm:w-auto px-6 py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
              candidateCount > 0 
                ? 'bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-sm'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow'
            }`}
          >
            <span>Open Role Blueprint Studio</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onTrySampleCase}
            className="w-full sm:w-auto px-6 py-3 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-sm shadow-sm transition-all"
          >
            Explore 1 Demo Candidate File
          </button>
        </div>

        {/* Feature Cards Grid (Ashby Style) */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 w-full text-left">
          
          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Grounded Evidence Mapping</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every qualification is cited directly to a candidate's actual projects, code commits, or work history. No hallucinations, no generic scores.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Tailored Interview Probes</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Generates deep-dive technical interview questions with clear "What to Look For" evaluation rubrics, complete with live speech-to-text notes.
            </p>
          </div>

          <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">Dual Engine: Local + AI</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Runs client-side with 100% data privacy using coordinate-sorted line reconstruction. Connect Google Gemini or OpenAI for optional deep LLM reasoning.
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
