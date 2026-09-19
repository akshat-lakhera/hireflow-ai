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
  GripVertical
} from 'lucide-react';
import { AiService } from '../services/aiApi';

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
      return saved ? Math.max(220, Math.min(520, Number(saved))) : 290;
    } catch {
      return 290;
    }
  });

  const [rightWidth, setRightWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('hireflow_right_width');
      return saved ? Math.max(260, Math.min(520, Number(saved))) : 340;
    } catch {
      return 340;
    }
  });

  const [isDraggingLeft, setIsDraggingLeft] = useState(false);
  const [isDraggingRight, setIsDraggingRight] = useState(false);

  const startDraggingLeft = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingLeft(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const newWidth = Math.max(220, Math.min(520, moveEvent.clientX));
      setLeftWidth(newWidth);
      localStorage.setItem('hireflow_left_width', String(newWidth));
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
      const newWidth = Math.max(260, Math.min(520, window.innerWidth - moveEvent.clientX));
      setRightWidth(newWidth);
      localStorage.setItem('hireflow_right_width', String(newWidth));
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
      
      {/* 1. TOP GLOBAL NAVIGATION (Ashby / Lever Benchmark) */}
      <header className="h-14 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 z-20 shadow-sm">
        
        {/* Left: Brand + Active Role */}
        <div className="flex items-center gap-4">
          <div 
            onClick={onBackToLanding}
            className="flex items-center gap-2 cursor-pointer hover:opacity-85 transition-opacity"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              HF
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900">HireFlow</span>
              <span className="ml-1.5 text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                RECRUITER WORKSPACE
              </span>
            </div>
          </div>

          <div className="h-5 w-px bg-slate-200" />

          {/* Active Role Switcher Pill */}
          <button
            onClick={onOpenOnboarding}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80 transition-colors"
          >
            <Briefcase className="w-3.5 h-3.5 text-indigo-600" />
            <span className="truncate max-w-[200px]">{role.title}</span>
            <span className="text-[10px] text-slate-400 font-mono">({role.seniority})</span>
          </button>
        </div>

        {/* Center: AI Engine Status Pill */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={onOpenAiSettings}
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all ${
              isAiActive
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60'
            }`}
          >
            <Sparkles className={`w-3.5 h-3.5 ${isAiActive ? 'text-indigo-600' : 'text-slate-400'}`} />
            <span>
              {isAiActive 
                ? `${aiConfig.provider === 'groq' ? '⚡ Groq' : aiConfig.provider === 'gemini' ? 'Gemini' : 'OpenAI'} (${aiConfig.model}) Active`
                : '⚡ Local Engine (Click to add Groq/Gemini key)'}
            </span>
          </button>
        </div>

        {/* Right: Actions (Compare, Add Candidate, Demo/Clear) */}
        <div className="flex items-center gap-2.5">
          {selectedForCompare.length >= 2 && (
            <button
              onClick={handleLaunchCompare}
              className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Compare Matrix ({selectedForCompare.length})</span>
            </button>
          )}

          <button
            onClick={onOpenUpload}
            className="px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-sm transition-colors"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Add Candidate</span>
          </button>

          <div className="h-5 w-px bg-slate-200" />

          {candidates.length === 0 ? (
            <button
              onClick={onLoadSingleDemoCase}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
              title="Load 1 reference demo case"
            >
              Load Demo Case
            </button>
          ) : (
            <button
              onClick={onClearBoard}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Clear Candidate Pipeline"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

      </header>

      {/* 2. THREE-COLUMN RESIZABLE HUMAN RECRUITER WORKSPACE (IDE SPLIT) */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* COLUMN 1: LEFT PANEL (Resizable) — Active Role & Candidate Pipeline List */}
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
                    Upload a resume PDF to start evaluating candidates against this role.
                  </p>
                </div>
                <button
                  onClick={onOpenUpload}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-block"
                >
                  Upload Resume PDF
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
            setLeftWidth(290);
            localStorage.setItem('hireflow_left_width', '290');
          }}
          className={`w-2 -ml-1 cursor-col-resize flex items-center justify-center group relative shrink-0 z-20 transition-colors ${
            isDraggingLeft ? 'bg-indigo-500' : 'bg-transparent hover:bg-indigo-500/20'
          }`}
          title="Drag to resize panel (Double-click to reset)"
        >
          <div className={`w-0.5 h-8 rounded-full transition-colors ${
            isDraggingLeft ? 'bg-white' : 'bg-slate-300 group-hover:bg-indigo-500'
          }`} />
        </div>

        {/* COLUMN 2: CENTER PANEL (FLEX EXPAND) — Candidate Executive Dossier */}
        <main className="flex-1 min-w-0 flex flex-col p-4 bg-slate-100/60 overflow-hidden">
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

        {/* DRAGGABLE SPLITTER 2 (Between Center & Right) */}
        <div
          onMouseDown={startDraggingRight}
          onDoubleClick={() => {
            setRightWidth(340);
            localStorage.setItem('hireflow_right_width', '340');
          }}
          className={`w-2 -mr-1 cursor-col-resize flex items-center justify-center group relative shrink-0 z-20 transition-colors ${
            isDraggingRight ? 'bg-indigo-500' : 'bg-transparent hover:bg-indigo-500/20'
          }`}
          title="Drag to resize panel (Double-click to reset)"
        >
          <div className={`w-0.5 h-8 rounded-full transition-colors ${
            isDraggingRight ? 'bg-white' : 'bg-slate-300 group-hover:bg-indigo-500'
          }`} />
        </div>

        {/* COLUMN 3: RIGHT PANEL (Resizable) — Contextual Actions & AI Probes */}
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

      </div>

    </div>
  );
};
