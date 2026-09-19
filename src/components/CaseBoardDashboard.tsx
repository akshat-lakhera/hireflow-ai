import React, { useState, useMemo, useEffect } from 'react';
import { CandidateCaseFile, RoleSetup, ReviewMode } from '../types';
import { RolePanel } from './RolePanel';
import { CandidateCaseFileCard } from './CandidateCaseFileCard';
import { CandidateExecutiveDossier } from './CandidateExecutiveDossier';
import { InsightRail } from './InsightRail';
import { 
  SlidersHorizontal, 
  UploadCloud, 
  Sparkles, 
  Trash2, 
  RotateCcw, 
  Users, 
  Briefcase,
  CheckCircle2,
  FileSpreadsheet,
  PanelLeft,
  PanelRight,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Bot,
  Database
} from 'lucide-react';
import { AiService } from '../services/aiApi';
import { RecruiterAgentCopilot } from './RecruiterAgentCopilot';

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
  onOpenAiSettings: () => void;
  onOpenDatabaseSettings?: () => void;
  onLoadSingleDemoCase: () => void;
  onClearBoard: () => void;
  onSetReviewMode: (mode: ReviewMode) => void;
  onAddNote: (candidateId: string, noteText: string) => void;
  onUpdateStatus: (candidateId: string, status: CandidateCaseFile['reviewStatus']) => void;
  onOpenCompare: (candidates: CandidateCaseFile[]) => void;
  onBackToLanding: () => void;
  onReevaluateWithAi?: (candidate: CandidateCaseFile) => void;
  isAiEvaluating?: boolean;
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
  onOpenAiSettings,
  onOpenDatabaseSettings,

  onLoadSingleDemoCase,
  onClearBoard,
  onSetReviewMode,
  onAddNote,
  onUpdateStatus,
  onOpenCompare,
  onBackToLanding,
  onReevaluateWithAi,
  isAiEvaluating
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);

  // Resizable Panels State (like Antigravity IDE / VS Code)
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hireflow_left_width');
      return saved ? Math.max(180, Math.min(600, Number(saved))) : 280;
    } catch {
      return 280;
    }
  });

  const [rightWidth, setRightWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hireflow_right_width');
      return saved ? Math.max(220, Math.min(600, Number(saved))) : 320;
    } catch {
      return 320;
    }
  });

  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(() => {
    return typeof window !== 'undefined' && window.innerWidth < 1050;
  });

  // Copilot and Mobile Tab Navigation
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'pipeline' | 'dossier' | 'actions'>('dossier');

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  // Direct mouse drag listeners for instantaneous response
  const startDraggingLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (moveEvent.clientX < 120) {
        setIsLeftCollapsed(true);
      } else {
        setIsLeftCollapsed(false);
        const newWidth = Math.max(180, Math.min(600, moveEvent.clientX));
        setLeftWidth(newWidth);
        localStorage.setItem('hireflow_left_width', String(newWidth));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingLeft(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const startDraggingRight = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingRight(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const distFromRight = window.innerWidth - moveEvent.clientX;
      if (distFromRight < 140) {
        setIsRightCollapsed(true);
      } else {
        setIsRightCollapsed(false);
        const newWidth = Math.max(200, Math.min(600, distFromRight));
        setRightWidth(newWidth);
        localStorage.setItem('hireflow_right_width', String(newWidth));
      }
    };

    const handleMouseUp = () => {
      setIsDraggingRight(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Filter candidates by search query
  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const q = searchQuery.toLowerCase();
    return candidates.filter(c => 
      c.name.toLowerCase().includes(q) ||
      c.currentRole.toLowerCase().includes(q) ||
      c.matchedSkills.some(s => s.toLowerCase().includes(q)) ||
      (c.projects && c.projects.some(p => p.name.toLowerCase().includes(q) || (p.technologies && p.technologies.toLowerCase().includes(q))))
    );
  }, [candidates, searchQuery]);

  // Selected candidate object
  const selectedCandidate = useMemo(() => {
    return candidates.find(c => c.id === selectedCandidateId) || candidates[0] || null;
  }, [candidates, selectedCandidateId]);

  const aiConfig = AiService.getConfig();
  const isAiActive = AiService.isConfigured();

  const toggleCompare = (candidateId: string) => {
    setSelectedForCompare(prev => 
      prev.includes(candidateId)
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  const handleLaunchCompare = () => {
    const compareList = candidates.filter(c => selectedForCompare.includes(c.id));
    if (compareList.length >= 2) {
      onOpenCompare(compareList);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 text-slate-900 font-sans overflow-hidden">
      
      {/* 1. TOP GLOBAL NAVIGATION */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between shrink-0 z-20 shadow-sm">
        
        {/* Left: Brand + Active Role + Panel Toggle */}
        <div className="flex items-center gap-3">
          
          {/* Toggle Left Sidebar Button (IDE Style) */}
          <button
            onClick={() => setIsLeftCollapsed(!isLeftCollapsed)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              isLeftCollapsed 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={isLeftCollapsed ? 'Show Pipeline Sidebar' : 'Collapse Pipeline Sidebar'}
          >
            <PanelLeft className="w-4 h-4" />
          </button>

          <div 
            onClick={onBackToLanding}
            className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              TD
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-sm tracking-tight text-slate-900">TalentDossier</span>
              <span className="ml-1.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                WORKSPACE
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200 hidden sm:block" />

          {/* Active Role Switcher Pill */}
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate max-w-[140px] md:max-w-[200px]">{role.title}</span>
            <span className="text-[10px] text-slate-400 font-mono hidden md:inline">({role.seniority})</span>
          </button>
        </div>

        {/* Center: AI Engine & Vector Database Status Pills */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAiSettings}
            className={`px-2.5 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isAiActive
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiActive ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span className="text-[11px] truncate max-w-[160px] md:max-w-none">
              {isAiActive 
                ? `${aiConfig.provider === 'groq' ? '⚡ Groq' : aiConfig.provider === 'gemini' ? 'Gemini' : 'OpenAI'} (${aiConfig.model})`
                : '⚡ Local Engine (Add API Key)'}
            </span>
          </button>

          {onOpenDatabaseSettings && (
            <button
              onClick={onOpenDatabaseSettings}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors shadow-2xs"
              title="Database & Vector Storage (IndexedDB + Supabase pgvector 384-dim)"
            >
              <Database className="w-3.5 h-3.5 text-indigo-600" />
              <span className="text-[11px] font-medium">PostgreSQL & Vector</span>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100">
                384-dim
              </span>
            </button>
          )}
        </div>


        {/* Right: Actions & Panel Toggle */}
        <div className="flex items-center gap-2">
          {selectedForCompare.length >= 2 && (
            <button
              onClick={handleLaunchCompare}
              className="px-2.5 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg flex items-center gap-1 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Compare</span> ({selectedForCompare.length})
            </button>
          )}

          {/* Recruiter RAG Copilot Agent Button */}
          <button
            onClick={() => setIsCopilotOpen(true)}
            className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs"
            title="Open AI Recruiter Copilot (Natural Language RAG Agent)"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden md:inline">AI Copilot</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Candidate</span>
          </button>

          {candidates.length === 0 ? (
            <button
              onClick={onLoadSingleDemoCase}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Load demo case"
            >
              Demo
            </button>
          ) : (
            <button
              onClick={onClearBoard}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Clear Pipeline"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="h-5 w-px bg-slate-200" />

          {/* Toggle Right Inspector Button (IDE Style) */}
          <button
            onClick={() => setIsRightCollapsed(!isRightCollapsed)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
              isRightCollapsed 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={isRightCollapsed ? 'Show Actions Panel' : 'Collapse Actions Panel'}
          >
            <PanelRight className="w-4 h-4" />
          </button>
        </div>

      </header>

      {/* 2. THREE-COLUMN RESIZABLE HUMAN RECRUITER WORKSPACE (IDE SPLIT) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* COLUMN 1: LEFT PANEL (Resizable & Collapsible) */}
        {isLeftCollapsed ? (
          <div className="w-12 border-r border-slate-200 bg-white flex flex-col items-center py-3 gap-3 shrink-0">
            <button
              onClick={() => setIsLeftCollapsed(false)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Expand Candidate Pipeline"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="w-6 h-px bg-slate-200" />
            <div className="text-[10px] font-bold text-slate-500 font-mono -rotate-90 whitespace-nowrap mt-4">
              PIPELINE ({filteredCandidates.length})
            </div>
            {/* Quick initials avatars */}
            <div className="flex flex-col gap-2 mt-auto">
              {filteredCandidates.slice(0, 3).map(c => (
                <div
                  key={c.id}
                  onClick={() => { onSelectCandidate(c); setIsLeftCollapsed(false); }}
                  className="w-7 h-7 rounded bg-slate-100 hover:bg-indigo-50 border border-slate-200 text-[10px] font-bold flex items-center justify-center cursor-pointer text-slate-700"
                  title={c.name}
                >
                  {c.initials}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <aside 
              style={{ width: `${leftWidth}px` }} 
              className="border-r border-slate-200 bg-slate-50/50 flex flex-col p-3.5 shrink-0 overflow-hidden select-text"
            >
              <RolePanel
                role={role}
                candidateCount={filteredCandidates.length}
                reviewMode={reviewMode}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onOpenRoleStudio={onOpenOnboarding}
                onOpenUpload={onOpenUpload}
              />

              {/* Candidate Card Stream */}
              <div className="flex-1 overflow-y-auto space-y-2.5 mt-3 pr-1">
                {filteredCandidates.length === 0 ? (
                  <div className="p-6 bg-white rounded-xl border border-slate-200 text-center space-y-3 mt-4">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-slate-800">No candidates found</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Upload a resume PDF to evaluate.
                      </p>
                    </div>
                    <button
                      onClick={onOpenUpload}
                      className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-block"
                    >
                      Upload PDF
                    </button>
                  </div>
                ) : (
                  filteredCandidates.map((c) => (
                    <div key={c.id} className="relative">
                      <CandidateCaseFileCard
                        candidate={c}
                        isSelected={selectedCandidate?.id === c.id}
                        reviewMode={reviewMode}
                        onSelect={() => onSelectCandidate(c)}
                        onOpenDetail={() => onOpenCaseFile(c)}
                        onOpenInterviewKit={() => onOpenInterviewKit(c)}
                      />
                      {/* Compare checkbox */}
                      <label className="absolute top-2 right-2 flex items-center gap-1 text-[10px] text-slate-400 hover:text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedForCompare.includes(c.id)}
                          onChange={() => toggleCompare(c.id)}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-3 h-3"
                        />
                      </label>
                    </div>
                  ))
                )}
              </div>
            </aside>

            {/* DRAGGABLE SPLITTER 1 (Between Left & Center) */}
            <div
              onMouseDown={startDraggingLeft}
              onDoubleClick={() => {
                setLeftWidth(280);
                localStorage.setItem('hireflow_left_width', '280');
              }}
              className={`w-2 -ml-1 cursor-col-resize flex items-center justify-center group relative shrink-0 z-20 transition-colors ${
                isDraggingLeft ? 'bg-indigo-500' : 'bg-transparent hover:bg-indigo-500/20'
              }`}
              title="Drag to resize (Double-click to reset, Drag left to collapse)"
            >
              <div className={`w-0.5 h-8 rounded-full transition-colors ${
                isDraggingLeft ? 'bg-white' : 'bg-slate-300 group-hover:bg-indigo-500'
              }`} />
            </div>
          </>
        )}

        {/* COLUMN 2: CENTER PANEL (FLEX EXPAND) — Candidate Executive Dossier */}
        <main className="flex-1 min-w-0 flex flex-col p-3 sm:p-4 bg-slate-100/60 overflow-hidden">
          {selectedCandidate ? (
            <CandidateExecutiveDossier
              candidate={selectedCandidate}
              reviewMode={reviewMode}
              onOpenInterviewKit={onOpenInterviewKit}
              onUpdateStatus={onUpdateStatus}
              onAddNote={onAddNote}
              onReevaluateWithAi={onReevaluateWithAi ? () => onReevaluateWithAi(selectedCandidate) : undefined}
              isAiEvaluating={isAiEvaluating}
            />
          ) : (
            <div className="flex-1 bg-white rounded-xl border border-slate-200 flex flex-col items-center justify-center p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                <Briefcase className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">No Candidate Selected</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  Select a candidate from the left pipeline or upload a resume to view their grounded executive dossier.
                </p>
              </div>
              <button
                onClick={onOpenUpload}
                className="px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
              >
                Upload Candidate PDF
              </button>
            </div>
          )}
        </main>

        {/* COLUMN 3: RIGHT PANEL (Resizable & Collapsible) */}
        {isRightCollapsed ? (
          <div className="w-12 border-l border-slate-200 bg-white flex flex-col items-center py-3 gap-3 shrink-0">
            <button
              onClick={() => setIsRightCollapsed(false)}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Expand Actions & Probes"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="w-6 h-px bg-slate-200" />
            <div className="text-[10px] font-bold text-slate-500 font-mono rotate-90 whitespace-nowrap mt-4">
              ACTIONS
            </div>
            {selectedCandidate && (
              <div className="mt-auto flex flex-col items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" title="Candidate active" />
              </div>
            )}
          </div>
        ) : (
          <>
            {/* DRAGGABLE SPLITTER 2 (Between Center & Right) */}
            <div
              onMouseDown={startDraggingRight}
              onDoubleClick={() => {
                setRightWidth(320);
                localStorage.setItem('hireflow_right_width', '320');
              }}
              className={`w-2 -mr-1 cursor-col-resize flex items-center justify-center group relative shrink-0 z-20 transition-colors ${
                isDraggingRight ? 'bg-indigo-500' : 'bg-transparent hover:bg-indigo-500/20'
              }`}
              title="Drag to resize (Double-click to reset, Drag right to collapse)"
            >
              <div className={`w-0.5 h-8 rounded-full transition-colors ${
                isDraggingRight ? 'bg-white' : 'bg-slate-300 group-hover:bg-indigo-500'
              }`} />
            </div>

            <aside 
              style={{ width: `${rightWidth}px` }} 
              className="border-l border-slate-200 bg-slate-50/50 flex flex-col p-3.5 shrink-0 overflow-y-auto select-text"
            >
              <InsightRail
                candidate={selectedCandidate}
                reviewMode={reviewMode}
                onUpdateStatus={onUpdateStatus}
                onAddNote={onAddNote}
                onOpenInterviewKit={onOpenInterviewKit}
              />
            </aside>
          </>
        )}

      </div>

      {/* Mobile Bottom Navigation Bar (Item 8: Mobile menu / navigation) */}
      <div className="md:hidden h-14 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-30 shrink-0 shadow-lg">
        <button
          onClick={() => setMobileTab('pipeline')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
            mobileTab === 'pipeline' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Pipeline ({filteredCandidates.length})</span>
        </button>

        <button
          onClick={() => setMobileTab('dossier')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
            mobileTab === 'dossier' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Dossier</span>
        </button>

        <button
          onClick={() => setMobileTab('actions')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold transition-colors ${
            mobileTab === 'actions' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Actions</span>
        </button>

        <button
          onClick={() => setIsCopilotOpen(true)}
          className="flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
        >
          <Bot className="w-4 h-4" />
          <span>AI Copilot</span>
        </button>
      </div>

      {/* In-App RAG Recruiter Agent Copilot Drawer */}
      <RecruiterAgentCopilot
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        candidates={candidates}
        role={role}
        onSelectCandidate={(c) => {
          onSelectCandidate(c);
          setMobileTab('dossier');
        }}
        onOpenAiSettings={onOpenAiSettings}
      />

    </div>
  );
};
