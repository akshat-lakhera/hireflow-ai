import React, { useState, useEffect } from 'react';
import { CandidateCaseFile, RoleSetup, ReviewMode } from '../types';
import { RolePanel } from './RolePanel';
import { CandidateCaseFileCard } from './CandidateCaseFileCard';
import { InsightRail } from './InsightRail';
import { 
  Briefcase, 
  UploadCloud, 
  FolderLock, 
  Search, 
  Users, 
  Plus, 
  RotateCcw, 
  FolderOpen, 
  AlertTriangle,
  Scale,
  SlidersHorizontal,
  FileText,
  Trash2,
  Sparkles,
  Layers,
  Clock
} from 'lucide-react';

interface CaseBoardDashboardProps {
  role: RoleSetup;
  candidates: CandidateCaseFile[];
  reviewMode: ReviewMode;
  selectedCandidateId: string;
  onSelectCandidate: (candidate: CandidateCaseFile) => void;
  onOpenCaseFile: (candidate: CandidateCaseFile) => void;
  onOpenInterviewKit: (candidate: CandidateCaseFile) => void;
  onOpenOnboarding: () => void;
  onOpenUpload: () => void;
  onLoadSingleDemoCase: () => void;
  onClearBoard: () => void;
  onSetReviewMode: (mode: ReviewMode) => void;
  onAddNote: (candidateId: string, noteText: string) => void;
  onUpdateStatus: (candidateId: string, status: CandidateCaseFile['reviewStatus']) => void;
  onOpenCompare: (candidates: CandidateCaseFile[]) => void;
  onBackToLanding: () => void;
}

export const CaseBoardDashboard: React.FC<CaseBoardDashboardProps> = ({
  role,
  candidates,
  reviewMode,
  selectedCandidateId,
  onSelectCandidate,
  onOpenCaseFile,
  onOpenInterviewKit,
  onOpenOnboarding,
  onOpenUpload,
  onLoadSingleDemoCase,
  onClearBoard,
  onSetReviewMode,
  onAddNote,
  onUpdateStatus,
  onOpenCompare,
  onBackToLanding
}) => {
  const [activeReqFilter, setActiveReqFilter] = useState<'all' | 'must_have' | 'nice_to_have' | 'missing'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [badgeFilter, setBadgeFilter] = useState<'all' | 'Strong fit' | 'Needs validation' | 'High risk'>('all');
  const [comparingIds, setComparingIds] = useState<string[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    update();
    const interval = setInterval(update, 30000);
    return () => clearInterval(interval);
  }, []);

  // Selected candidate object
  const selectedCandidate = candidates.find(c => c.id === selectedCandidateId) || candidates[0] || null;

  // Toggle candidate for comparison
  const handleToggleCompare = (id: string) => {
    setComparingIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(item => item !== id);
      } else {
        const next = [...prev, id];
        if (next.length === 2) {
          const compCandidates = candidates.filter(c => next.includes(c.id));
          onOpenCompare(compCandidates);
        }
        return next;
      }
    });
  };

  // Filter candidates based on search & badge
  const filteredCandidates = candidates.filter(c => {
    if (badgeFilter !== 'all' && c.fitBadge !== badgeFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchRole = c.currentRole.toLowerCase().includes(q);
      const matchSkills = c.matchedSkills.some(s => s.toLowerCase().includes(q));
      return matchName || matchRole || matchSkills;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-ink-950 text-slate-200 flex flex-col font-sans ambient-glow">
      
      {/* Top Command Bar */}
      <header className="w-full border-b border-ink-border bg-ink-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-6 sm:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Logo & Active Role Spec Pill */}
          <div className="flex items-center gap-4">
            <button 
              onClick={onBackToLanding}
              className="flex items-center gap-3 hover:opacity-90 transition-opacity"
              title="Return to Overview"
            >
              <div className="w-9 h-9 rounded-xl bg-gold-glow border border-gold-border flex items-center justify-center text-gold-500 font-bold text-sm shadow-md">
                HF
              </div>
              <div className="text-left hidden sm:block">
                <span className="font-extrabold text-base tracking-tight text-white block leading-none">
                  HireFlow
                </span>
                <span className="text-[10px] font-mono text-gold-400 leading-none">
                  Investigation Room
                </span>
              </div>
            </button>

            <span className="text-slate-700 hidden sm:inline">/</span>

            <div className="flex items-center gap-2.5 bg-ink-850 px-3 py-1.5 rounded-xl border border-ink-border text-xs font-mono">
              <FolderLock className="w-3.5 h-3.5 text-gold-500" />
              <span className="text-slate-200 font-semibold truncate max-w-[200px] md:max-w-xs">
                {role.title}
              </span>
              <span className="px-2 py-0.5 rounded bg-ink-950 text-gold-400 text-[10px] font-bold">
                {role.seniority}
              </span>
            </div>
          </div>

          {/* Center Persona Switcher */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-ink-850 border border-ink-border text-xs font-mono">
            <button
              onClick={() => onSetReviewMode('recruiter')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                reviewMode === 'recruiter'
                  ? 'bg-gold-500 text-ink-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recruiter Mode
            </button>
            <button
              onClick={() => onSetReviewMode('interviewer')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                reviewMode === 'interviewer'
                  ? 'bg-gold-500 text-ink-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interviewer Mode
            </button>
            <button
              onClick={() => onSetReviewMode('team_review')}
              className={`px-3.5 py-1.5 rounded-lg transition-colors ${
                reviewMode === 'team_review'
                  ? 'bg-gold-500 text-ink-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Team Review
            </button>
          </div>

          {/* Right Action Terminal */}
          <div className="flex items-center gap-2.5">
            
            {currentTime && (
              <div className="hidden xl:flex items-center gap-1.5 text-xs font-mono text-slate-500 px-2.5 py-1 rounded-lg bg-ink-900 border border-ink-border mr-1">
                <Clock className="w-3.5 h-3.5 text-gold-500" />
                <span>{currentTime}</span>
              </div>
            )}

            {comparingIds.length > 0 && (
              <button
                onClick={() => {
                  const compCandidates = candidates.filter(c => comparingIds.includes(c.id));
                  if (compCandidates.length >= 2) onOpenCompare(compCandidates);
                }}
                className="px-3 py-2 rounded-xl bg-gold-subtle border border-gold-border text-gold-400 text-xs font-mono font-bold flex items-center gap-1.5 animate-pulse"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare ({comparingIds.length}/2)</span>
              </button>
            )}

            <button
              onClick={onOpenUpload}
              className="px-4 py-2 rounded-xl bg-ink-850 hover:bg-ink-800 border border-ink-border text-slate-200 text-xs font-semibold transition-colors flex items-center gap-2"
            >
              <UploadCloud className="w-4 h-4 text-gold-500" />
              <span className="hidden sm:inline">Upload Candidate</span>
            </button>

            <button
              onClick={onOpenOnboarding}
              className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 text-xs font-extrabold transition-colors flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Role Studio</span>
            </button>

            {candidates.length === 0 ? (
              <button
                onClick={onLoadSingleDemoCase}
                className="px-3 py-2 rounded-xl bg-ink-850 hover:bg-ink-800 border border-ink-border text-gold-400 text-xs font-mono font-bold transition-colors"
                title="Load 1 reference case to inspect"
              >
                Demo Case
              </button>
            ) : (
              <button
                onClick={onClearBoard}
                className="p-2 rounded-xl bg-ink-850 hover:bg-ink-800 border border-ink-border text-slate-400 hover:text-flag-500 transition-colors"
                title="Clear board (start completely fresh)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Main Full-Screen Deck: 3 Columns */}
      <main className="flex-1 max-w-[1800px] mx-auto w-full p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* COLUMN 1 (3 cols): Role Panel */}
        <aside className="lg:col-span-3 space-y-4">
          <RolePanel
            role={role}
            activeFilter={activeReqFilter}
            onFilterChange={setActiveReqFilter}
            onEditRole={onOpenOnboarding}
          />
        </aside>

        {/* COLUMN 2 (5 cols): Candidate Case Files */}
        <section className="lg:col-span-5 space-y-4">
          
          {/* Middle Column Header & Filters */}
          <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <FolderLock className="w-4 h-4 text-gold-500" />
                <h2 className="font-extrabold text-sm text-white">Candidate Case Dossiers</h2>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-ink-900 border border-ink-border text-gold-400 font-bold">
                  {filteredCandidates.length}
                </span>
              </div>

              {/* Badges Filter */}
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <button
                  onClick={() => setBadgeFilter('all')}
                  className={`px-2.5 py-1 rounded-lg ${badgeFilter === 'all' ? 'bg-gold-500 text-ink-950 font-bold' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setBadgeFilter('Strong fit')}
                  className={`px-2.5 py-1 rounded-lg ${badgeFilter === 'Strong fit' ? 'bg-verified-subtle text-verified-400 font-bold border border-verified-border' : 'text-slate-400'}`}
                >
                  Strong
                </button>
                <button
                  onClick={() => setBadgeFilter('Needs validation')}
                  className={`px-2.5 py-1 rounded-lg ${badgeFilter === 'Needs validation' ? 'bg-caution-subtle text-caution-500 font-bold border border-caution-border' : 'text-slate-400'}`}
                >
                  Needs Val.
                </button>
                <button
                  onClick={() => setBadgeFilter('High risk')}
                  className={`px-2.5 py-1 rounded-lg ${badgeFilter === 'High risk' ? 'bg-flag-subtle text-flag-500 font-bold border border-flag-border' : 'text-slate-400'}`}
                >
                  Risk
                </button>
              </div>
            </div>

            {/* Keyword Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search candidates by name, skill, or verified project..."
                className="w-full bg-ink-900 border border-ink-border rounded-xl pl-10 pr-4 py-2.5 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-gold-500 font-mono"
              />
            </div>
          </div>

          {/* Candidate Cards List or States */}
          {filteredCandidates.length === 0 ? (
            /* Empty State: File Folder Illustration */
            <div className="dossier-card rounded-3xl p-12 border border-ink-border text-center space-y-5 bg-ink-900/40">
              <div className="w-16 h-16 rounded-2xl bg-ink-850 border border-ink-border flex items-center justify-center mx-auto text-gold-500 shadow-inner">
                <FolderOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-white">No candidates loaded yet</h3>
                <p className="text-slate-400 text-xs mt-1.5 max-w-sm mx-auto leading-relaxed">
                  Upload candidate resumes for <strong className="text-white">{role.title}</strong>, or try the 1 sample case.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <button
                  onClick={onOpenUpload}
                  className="px-6 py-3 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs shadow-lg transition-colors inline-flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Candidate Resumes</span>
                </button>
                <button
                  onClick={onLoadSingleDemoCase}
                  className="px-5 py-3 rounded-xl bg-ink-850 hover:bg-ink-800 border border-ink-border text-slate-200 font-semibold text-xs transition-colors"
                >
                  Try 1 Demo Case
                </button>
              </div>
            </div>
          ) : (
            /* Scrollable Real Candidate Cards */
            <div className="space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
              {filteredCandidates.map(candidate => (
                <CandidateCaseFileCard
                  key={candidate.id}
                  candidate={candidate}
                  isSelected={candidate.id === selectedCandidate?.id}
                  isCompared={comparingIds.includes(candidate.id)}
                  onSelect={() => onSelectCandidate(candidate)}
                  onViewCase={() => onOpenCaseFile(candidate)}
                  onGenerateQuestions={() => onOpenInterviewKit(candidate)}
                  onToggleCompare={() => handleToggleCompare(candidate.id)}
                />
              ))}
            </div>
          )}

        </section>

        {/* COLUMN 3 (4 cols): Insight Rail */}
        <aside className="lg:col-span-4 space-y-4">
          <InsightRail
            candidate={selectedCandidate}
            onOpenCaseFile={onOpenCaseFile}
            onOpenInterviewKit={onOpenInterviewKit}
            onAddNote={onAddNote}
            onUpdateStatus={onUpdateStatus}
          />
        </aside>

      </main>

    </div>
  );
};
