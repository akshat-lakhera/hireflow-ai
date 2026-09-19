import React, { useState } from 'react';
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
  Sparkles
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
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

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
    // Badge filter
    if (badgeFilter !== 'all' && c.fitBadge !== badgeFilter) {
      return false;
    }
    // Search query
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
    <div className="min-h-screen bg-case-bg text-slate-200 flex flex-col font-sans">
      
      {/* Top Application Bar */}
      <header className="w-full border-b border-case-border bg-case-bgAlt/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1720px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & Role Pill */}
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToLanding}
              className="flex items-center gap-2.5 hover:opacity-90 transition-opacity"
              title="Return to Overview"
            >
              <div className="w-8 h-8 rounded-lg bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center text-accent-blue font-bold text-sm">
                HF
              </div>
              <span className="font-bold text-base tracking-tight text-white hidden sm:inline">
                HireFlow
              </span>
            </button>

            <span className="text-slate-600">/</span>

            <div className="flex items-center gap-2 bg-case-surface px-2.5 py-1 rounded-lg border border-case-border text-xs font-mono">
              <FolderLock className="w-3.5 h-3.5 text-accent-blue" />
              <span className="text-slate-300 font-medium truncate max-w-[200px] sm:max-w-xs">
                {role.title}
              </span>
            </div>
          </div>

          {/* Center Mode Switcher */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-case-surface border border-case-border text-xs font-mono">
            <button
              onClick={() => onSetReviewMode('recruiter')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                reviewMode === 'recruiter'
                  ? 'bg-case-surfaceElevated text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Recruiter Mode
            </button>
            <button
              onClick={() => onSetReviewMode('interviewer')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                reviewMode === 'interviewer'
                  ? 'bg-case-surfaceElevated text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Interviewer Mode
            </button>
            <button
              onClick={() => onSetReviewMode('team_review')}
              className={`px-3 py-1 rounded-lg transition-colors ${
                reviewMode === 'team_review'
                  ? 'bg-case-surfaceElevated text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Team Review
            </button>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            
            {comparingIds.length > 0 && (
              <button
                onClick={() => {
                  const compCandidates = candidates.filter(c => comparingIds.includes(c.id));
                  if (compCandidates.length >= 2) onOpenCompare(compCandidates);
                }}
                className="px-3 py-1.5 rounded-lg bg-accent-violet/20 border border-accent-violet/40 text-accent-violet text-xs font-mono font-semibold flex items-center gap-1.5 animate-pulse"
              >
                <Scale className="w-3.5 h-3.5" />
                <span>Compare ({comparingIds.length}/2)</span>
              </button>
            )}

            <button
              onClick={onOpenUpload}
              className="px-3 py-1.5 rounded-lg bg-case-surface hover:bg-case-surfaceLight border border-case-border text-slate-200 text-xs font-medium transition-colors flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5 text-accent-blue" />
              <span className="hidden sm:inline">Upload Candidate</span>
            </button>

            <button
              onClick={onOpenOnboarding}
              className="px-3 py-1.5 rounded-lg bg-accent-blue hover:bg-accent-blueHover text-black text-xs font-semibold transition-colors flex items-center gap-1.5 shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Role Setup</span>
            </button>

            {candidates.length === 0 ? (
              <button
                onClick={onLoadSingleDemoCase}
                className="px-3 py-1.5 rounded-lg bg-case-surface hover:bg-case-surfaceLight border border-case-border text-accent-blue text-xs font-mono transition-colors"
                title="Load 1 reference case to inspect"
              >
                Demo Case
              </button>
            ) : (
              <button
                onClick={onClearBoard}
                className="p-1.5 rounded-lg bg-case-surface hover:bg-case-surfaceLight border border-case-border text-slate-400 hover:text-accent-red transition-colors"
                title="Clear board (start completely fresh)"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}

          </div>

        </div>
      </header>

      {/* Main Investigation Room: 3 Columns */}
      <main className="flex-1 max-w-[1720px] mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
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
          <div className="case-card rounded-xl p-4 border border-case-border space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FolderLock className="w-4 h-4 text-accent-blue" />
                <h2 className="font-bold text-sm text-white">Candidate Case Files</h2>
                <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-case-bg border border-case-border text-slate-300">
                  {filteredCandidates.length}
                </span>
              </div>

              {/* Badges Filter */}
              <div className="flex items-center gap-1 text-[11px] font-mono">
                <button
                  onClick={() => setBadgeFilter('all')}
                  className={`px-2 py-0.5 rounded ${badgeFilter === 'all' ? 'bg-case-surfaceElevated text-white font-semibold' : 'text-slate-400'}`}
                >
                  All
                </button>
                <button
                  onClick={() => setBadgeFilter('Strong fit')}
                  className={`px-2 py-0.5 rounded ${badgeFilter === 'Strong fit' ? 'bg-accent-green/20 text-accent-green font-semibold' : 'text-slate-400'}`}
                >
                  Strong
                </button>
                <button
                  onClick={() => setBadgeFilter('Needs validation')}
                  className={`px-2 py-0.5 rounded ${badgeFilter === 'Needs validation' ? 'bg-accent-amber/20 text-accent-amber font-semibold' : 'text-slate-400'}`}
                >
                  Needs Val.
                </button>
                <button
                  onClick={() => setBadgeFilter('High risk')}
                  className={`px-2 py-0.5 rounded ${badgeFilter === 'High risk' ? 'bg-accent-red/20 text-accent-red font-semibold' : 'text-slate-400'}`}
                >
                  Risk
                </button>
              </div>
            </div>

            {/* Natural Language / Keyword Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search candidates by name, skill, or experience..."
                className="w-full bg-case-bg border border-case-border rounded-xl pl-9 pr-3 py-2 text-white text-xs placeholder:text-slate-500 focus:outline-none focus:border-accent-blue"
              />
            </div>
          </div>

          {/* Candidate Cards List or States */}
          {isLoading ? (
            /* Loading State: Realistic Skeleton Screen */
            <div className="space-y-3">
              {[1, 2, 3].map(n => (
                <div key={n} className="case-card rounded-xl p-4 border border-case-border animate-pulse space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-case-bg" />
                      <div className="space-y-1.5">
                        <div className="w-32 h-3.5 bg-case-bg rounded" />
                        <div className="w-24 h-2.5 bg-case-bg rounded" />
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-case-bg" />
                  </div>
                  <div className="w-full h-8 bg-case-bg rounded-lg" />
                </div>
              ))}
            </div>
          ) : hasError ? (
            /* Error State: Soft Warning Panel */
            <div className="case-card rounded-xl p-6 border border-accent-red/30 bg-accent-red/5 space-y-2 text-center text-xs">
              <AlertTriangle className="w-8 h-8 text-accent-amber mx-auto mb-1" />
              <h3 className="font-bold text-white text-sm">We could not parse one resume</h3>
              <p className="text-slate-300 max-w-sm mx-auto">
                Try another file or inspect the upload log. Supports PDF and text dossiers.
              </p>
              <button
                onClick={() => setHasError(false)}
                className="mt-3 px-3 py-1.5 bg-case-surface hover:bg-case-surfaceLight border border-case-border rounded-lg text-slate-200 font-mono"
              >
                Dismiss Warning
              </button>
            </div>
          ) : filteredCandidates.length === 0 ? (
            /* Empty State: File Folder Illustration */
            <div className="case-card rounded-2xl p-10 border border-case-border text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-case-bg border border-case-border flex items-center justify-center mx-auto text-accent-blue shadow-inner">
                <FolderOpen className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">No candidates loaded yet</h3>
                <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
                  Upload a role to begin review, or try the 1 sample case.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={onOpenUpload}
                  className="px-5 py-2.5 rounded-xl bg-accent-blue hover:bg-accent-blueHover text-black font-semibold text-xs shadow transition-colors inline-flex items-center gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Upload Candidate Resumes</span>
                </button>
                <button
                  onClick={onLoadSingleDemoCase}
                  className="px-4 py-2.5 rounded-xl bg-case-surface hover:bg-case-surfaceLight border border-case-border text-slate-200 font-medium text-xs transition-colors"
                >
                  Try 1 Demo Case
                </button>
              </div>
            </div>
          ) : (
            /* Scrollable Real Candidate Cards */
            <div className="space-y-3 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1">
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
