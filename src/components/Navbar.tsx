import React from 'react';
import { Shield, Sparkles, Users, RefreshCcw, BookOpen, UserCheck } from 'lucide-react';

interface NavbarProps {
  activePersona: 'recruiter' | 'candidate';
  onSelectPersona: (persona: 'recruiter' | 'candidate') => void;
  onResetData: () => void;
  candidateCount: number;
  topMatchScore: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePersona,
  onSelectPersona,
  onResetData,
  candidateCount,
  topMatchScore
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-obsidian-border bg-obsidian-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center text-black font-bold shadow-md shadow-gold-500/15">
            <Shield className="w-5 h-5 text-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-slate-100 tracking-tight">HireFlow</span>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-gold-500/15 text-gold-400 border border-gold-500/30">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 hidden sm:block">
              AI Candidate Screening & Interview Intelligence
            </div>
          </div>
        </div>

        {/* Persona Switcher */}
        <div className="flex items-center p-1 rounded-xl bg-obsidian-900 border border-obsidian-border">
          <button
            onClick={() => onSelectPersona('recruiter')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePersona === 'recruiter'
                ? 'bg-gold-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Recruiter Console (PS3)</span>
          </button>

          <button
            onClick={() => onSelectPersona('candidate')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activePersona === 'candidate'
                ? 'bg-gold-500 text-black shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>EduPath Learner Hub (PS1)</span>
          </button>
        </div>

        {/* Telemetry & Clear Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-3 font-mono text-xs text-slate-400 border-r border-obsidian-border pr-3">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Pool: <strong className="text-slate-200">{candidateCount}</strong></span>
            </div>
            {candidateCount > 0 && (
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Top Match: <strong className="text-emerald-400">{topMatchScore}%</strong></span>
              </div>
            )}
          </div>

          <button
            onClick={onResetData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-obsidian-850 hover:bg-obsidian-800 border border-obsidian-border text-slate-300 hover:text-white text-xs font-medium transition-colors"
            title="Reload reference candidate benchmarks"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reference Pool</span>
          </button>
        </div>

      </div>
    </header>
  );
};
