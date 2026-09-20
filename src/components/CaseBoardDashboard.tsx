import React, { useState, useMemo } from 'react';
import { CandidateCaseFile, RoleSetup, ReviewMode } from '../types';
import { RolePanel } from './RolePanel';
import { CandidateCaseFileCard } from './CandidateCaseFileCard';
import { CandidateExecutiveDossier } from './CandidateExecutiveDossier';
import { InsightRail } from './InsightRail';
import { 
  UploadCloud, 
  Sparkles, 
  Trash2, 
  Users, 
  Briefcase, 
  FileSpreadsheet, 
  PanelLeft, 
  PanelRight, 
  ChevronLeft, 
  ChevronRight, 
  Bot, 
  Database, 
  Scale, 
  Zap,
  Mail,
  Settings,
  Globe,
  Radio,
  ShieldAlert,
  Layers
} from 'lucide-react';
import { AiService } from '../services/aiApi';
import { AgentLoopRuntime } from '../services/agentLoopRuntime';
import { PortalIngestionService } from '../services/portalIngestionService';
import { RecruiterAgentCopilot } from './RecruiterAgentCopilot';
import { ResumeViewerModal } from './ResumeViewerModal';

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
  onOpenAutonomousScreener?: () => void;
  onOpenGmailSettings?: () => void;
  onOpenEmailApproval?: (candidate: CandidateCaseFile) => void;
  onClearBoard: () => void;
  onSetReviewMode: (mode: ReviewMode) => void;
  onAddNote: (candidateId: string, noteText: string) => void;
  onUpdateStatus: (candidateId: string, status: CandidateCaseFile['reviewStatus']) => void;
  onOpenCompare: (candidates: CandidateCaseFile[]) => void;
  onBackToLanding: () => void;
  onReevaluateWithAi?: (candidate: CandidateCaseFile) => void;
  isAiEvaluating?: boolean;
  onOpenAgentOps?: () => void;
  onOpenCareerPortal?: () => void;
  onOpenPresentationDeck?: () => void;
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
  onOpenAutonomousScreener,
  onOpenGmailSettings,
  onOpenEmailApproval,
  onClearBoard,
  onSetReviewMode,
  onAddNote,
  onUpdateStatus,
  onOpenCompare,
  onBackToLanding,
  onReevaluateWithAi,
  isAiEvaluating,
  onOpenAgentOps,
  onOpenCareerPortal,
  onOpenPresentationDeck
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [daemonActive, setDaemonActive] = useState(false);
  const [stagedCount, setStagedCount] = useState(0);

  React.useEffect(() => {
    const unsub = AgentLoopRuntime.subscribe(state => {
      setDaemonActive(state.daemonActive);
      setStagedCount(state.stagedDecisions.length);
    });
    return unsub;
  }, []);

  // Resizable Panels State (like Antigravity IDE / VS Code)
  const [leftWidth, setLeftWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('talentdossier_left_width') || localStorage.getItem('hireflow_left_width');
      return saved ? Math.max(180, Math.min(600, Number(saved))) : 280;
    } catch {
      return 280;
    }
  });

  const [rightWidth, setRightWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('talentdossier_right_width') || localStorage.getItem('hireflow_right_width');
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

  // Resume Viewer & Settings Dropdown states
  const [resumeViewerCandidate, setResumeViewerCandidate] = useState<CandidateCaseFile | null>(null);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);

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
        localStorage.setItem('talentdossier_left_width', String(newWidth));
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
        localStorage.setItem('talentdossier_right_width', String(newWidth));
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

  const [compareNotice, setCompareNotice] = useState<string | null>(null);

  // Auto-clean compare selection when a candidate is removed (e.g. rejected)
  React.useEffect(() => {
    const validIds = new Set(candidates.map(c => c.id));
    setSelectedForCompare(prev => {
      const cleaned = prev.filter(id => validIds.has(id));
      if (cleaned.length !== prev.length) {
        // A candidate was removed from pipeline while selected for compare
        if (cleaned.length < prev.length) {
          setCompareNotice('A selected candidate was removed from the pipeline and deselected from comparison.');
          setTimeout(() => setCompareNotice(null), 3500);
        }
      }
      return cleaned;
    });
  }, [candidates]);

  const toggleCompare = (candidateId: string) => {
    setSelectedForCompare(prev => {
      if (prev.includes(candidateId)) {
        return prev.filter(id => id !== candidateId);
      }
      if (prev.length >= 2) {
        // Enforce maximum of exactly 2 candidates
        setCompareNotice('Comparison matrix supports 2 candidates at a time. Replaced earliest selection.');
        setTimeout(() => setCompareNotice(null), 3500);
        return [prev[1], candidateId];
      }
      return [...prev, candidateId];
    });
  };

  const handleLaunchCompare = () => {
    const compareList = candidates.filter(c => selectedForCompare.slice(0, 2).includes(c.id));
    if (compareList.length >= 2) {
      onOpenCompare(compareList.slice(0, 2));
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

        {/* Center: Sleek AI Status Badge */}
        <div className="flex items-center">
          <button
            onClick={onOpenAiSettings}
            className={`px-3 py-1 rounded-full text-xs font-medium border flex items-center gap-2 transition-all shadow-2xs cursor-pointer ${
              isAiActive
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200/60'
            }`}
            title="Configure AI Engine & API Keys"
          >
            <span className={`w-2 h-2 rounded-full ${isAiActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-[11px] font-semibold">
              {isAiActive 
                ? `${aiConfig.provider === 'groq' ? '⚡ Groq' : aiConfig.provider === 'gemini' ? 'Gemini' : 'OpenAI'} (${aiConfig.model})`
                : '⚡ Local Engine (Add API Key)'}
            </span>
          </button>
        </div>

        {/* Right: Focused Primary Actions & Settings Menu */}
        <div className="flex items-center gap-2">
          {selectedForCompare.length >= 2 && (
            <button
              onClick={handleLaunchCompare}
              className="px-2.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Scale className="w-3.5 h-3.5 text-indigo-600" />
              <span>Compare ({selectedForCompare.length})</span>
            </button>
          )}

          {/* Quick 1-Click Stream 4 Resumes Button */}
          <button
            onClick={() => {
              PortalIngestionService.simulatePortalInflowBatch(role);
              if (onOpenAgentOps) onOpenAgentOps();
            }}
            className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
            title="Stream 4 candidates (including an adversarial prompt injection attack) into the agent loop"
          >
            <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
            <span className="hidden md:inline">Stream 4 Resumes</span>
          </button>

          {/* Autonomous AI Agent Ops Center Button */}
          {onOpenAgentOps && (
            <button
              onClick={onOpenAgentOps}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                daemonActive
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'
              }`}
              title="Autonomous AI Agent Operations Center (Continuous Loop, Inflow & Human Review Deck)"
            >
              <Bot className="w-3.5 h-3.5 text-indigo-600" />
              <span className="hidden sm:inline">Autonomous Agent</span>
              {stagedCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-600 text-white animate-pulse">
                  {stagedCount}
                </span>
              ) : daemonActive ? (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              ) : null}
            </button>
          )}

          {/* Autonomous Screener Agent */}
          {onOpenAutonomousScreener && (
            <button
              onClick={onOpenAutonomousScreener}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
              title="Run Autonomous Candidate Screener Agent (Multi-step pipeline evaluation & triage)"
            >
              <Zap className="w-3.5 h-3.5 fill-indigo-200" />
              <span className="hidden sm:inline">Screen Pipeline</span>
            </button>
          )}

          {/* Add Candidate */}
          <button
            onClick={onOpenUpload}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Add Candidate</span>
          </button>

          {/* Settings & System Integrations Menu */}
          <div className="relative">
            <button
              onClick={() => setIsSettingsMenuOpen(!isSettingsMenuOpen)}
              className={`p-1.5 rounded-lg border transition-colors shadow-2xs cursor-pointer ${
                isSettingsMenuOpen
                  ? 'bg-slate-100 text-slate-900 border-slate-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
              title="Integrations & Settings (Gmail Sync, Vector DB, AI Keys)"
            >
              <Settings className="w-4 h-4" />
            </button>

            {isSettingsMenuOpen && (
              <div 
                className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100 divide-y divide-slate-100"
                onMouseLeave={() => setIsSettingsMenuOpen(false)}
              >
                <div className="py-1">
                  {onOpenAgentOps && (
                    <button
                      onClick={() => { setIsSettingsMenuOpen(false); onOpenAgentOps(); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Bot className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800">Autonomous Agent Ops</div>
                        <div className="text-[10px] text-slate-400 truncate">Continuous loop & human review deck</div>
                      </div>
                    </button>
                  )}

                  {onOpenCareerPortal && (
                    <button
                      onClick={() => { setIsSettingsMenuOpen(false); onOpenCareerPortal(); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800">Public Application Link (/apply)</div>
                        <div className="text-[10px] text-slate-400 truncate">Copy or share link with job applicants</div>
                      </div>
                    </button>
                  )}
                  {onOpenPresentationDeck && (
                    <button
                      onClick={() => { setIsSettingsMenuOpen(false); onOpenPresentationDeck(); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Layers className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800">Pitch Deck (PPT Presentation)</div>
                        <div className="text-[10px] text-slate-400 truncate">10-slide interactive presentation & download</div>
                      </div>
                    </button>
                  )}

                  {onOpenGmailSettings && (
                    <button
                      onClick={() => { setIsSettingsMenuOpen(false); onOpenGmailSettings(); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Mail className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800">Gmail Candidate Sync</div>
                        <div className="text-[10px] text-slate-400 truncate">Automated candidate email dispatch</div>
                      </div>
                    </button>
                  )}

                  {onOpenDatabaseSettings && (
                    <button
                      onClick={() => { setIsSettingsMenuOpen(false); onOpenDatabaseSettings(); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Database className="w-4 h-4 text-indigo-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800">Vector Storage & DB</div>
                        <div className="text-[10px] text-slate-400 truncate">Supabase pgvector & local IndexedDB</div>
                      </div>
                    </button>
                  )}

                  {onOpenAiSettings && (
                    <button
                      onClick={() => { setIsSettingsMenuOpen(false); onOpenAiSettings(); }}
                      className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800">AI Engine & API Keys</div>
                        <div className="text-[10px] text-slate-400 truncate">Groq, Gemini & OpenAI configs</div>
                      </div>
                    </button>
                  )}
                </div>

                {candidates.length > 0 && onClearBoard && (
                  <div className="py-1">
                    <button
                      onClick={() => { setIsSettingsMenuOpen(false); onClearBoard(); }}
                      className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-500 shrink-0" />
                      <span className="font-semibold">Clear Candidate Pipeline</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

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
                      <div className="text-xs font-semibold text-slate-800">Pipeline is empty</div>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Upload a resume PDF or stream a live demo batch.
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => {
                          PortalIngestionService.simulatePortalInflowBatch(role);
                          if (onOpenAgentOps) onOpenAgentOps();
                        }}
                        className="px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors inline-flex items-center justify-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500" />
                        ⚡ Load Demo Pipeline
                      </button>
                      <button
                        onClick={onOpenUpload}
                        className="px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors inline-block"
                      >
                        Upload PDF Resume
                      </button>
                    </div>
                  </div>
                ) : (
                  filteredCandidates.map((c) => (
                    <CandidateCaseFileCard
                      key={c.id}
                      candidate={c}
                      isSelected={selectedCandidate?.id === c.id}
                      isCompareSelected={selectedForCompare.includes(c.id)}
                      reviewMode={reviewMode}
                      onSelect={() => onSelectCandidate(c)}
                      onOpenDetail={() => onOpenCaseFile(c)}
                      onOpenInterviewKit={() => onOpenInterviewKit(c)}
                      onOpenResume={() => setResumeViewerCandidate(c)}
                      onToggleCompare={() => toggleCompare(c.id)}
                    />
                  ))
                )}
              </div>

              {/* Docked Comparison Tray in Left Pipeline Panel (Strict 2 candidates max) */}
              {selectedForCompare.length > 0 && (
                <div className="mt-2.5 p-2.5 bg-indigo-50/95 border border-indigo-200 rounded-xl flex items-center justify-between gap-2 shadow-sm shrink-0 animate-in fade-in duration-150">
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold text-indigo-900 flex items-center gap-1.5">
                      <Scale className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span>{selectedForCompare.length} / 2 selected</span>
                    </div>
                    <p className="text-[10px] text-indigo-700 truncate mt-0.5">
                      {compareNotice || (selectedForCompare.length >= 2 ? '2 candidates ready for matrix comparison' : 'Pick 1 more to compare')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedForCompare([])}
                      className="px-2 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-800 rounded transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleLaunchCompare}
                      disabled={selectedForCompare.length < 2}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-colors ${
                        selectedForCompare.length >= 2
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs cursor-pointer'
                          : 'bg-indigo-200 text-indigo-400 cursor-not-allowed'
                      }`}
                    >
                      Compare
                    </button>
                  </div>
                </div>
              )}
            </aside>

            {/* DRAGGABLE SPLITTER 1 (Between Left & Center) */}
            <div
              onMouseDown={startDraggingLeft}
              onDoubleClick={() => {
                setLeftWidth(280);
                localStorage.setItem('talentdossier_left_width', '280');
              }}
              className={`w-1 hover:w-1.5 active:w-1.5 transition-all cursor-col-resize z-10 flex items-center justify-center group shrink-0 ${
                isDraggingLeft ? 'bg-indigo-600 w-1.5' : 'bg-transparent hover:bg-indigo-400'
              }`}
              title="Drag to resize pipeline panel (Double click to reset)"
            >
              <div className="h-8 w-0.5 rounded-full bg-slate-300 group-hover:bg-indigo-600 transition-colors" />
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
              onOpenResumeViewer={() => setResumeViewerCandidate(selectedCandidate)}
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
                localStorage.setItem('talentdossier_right_width', '320');
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
        onOpenCompare={onOpenCompare}
        onUpdateStatus={onUpdateStatus}
        onOpenInterviewKit={onOpenInterviewKit}
        onAddNote={onAddNote}
        onFilterPipeline={(q) => setSearchQuery(q)}
        onRunAutonomousScreener={onOpenAutonomousScreener}
      />

      {/* Standalone Original Resume & PDF Viewer Modal */}
      <ResumeViewerModal
        candidate={resumeViewerCandidate}
        isOpen={!!resumeViewerCandidate}
        onClose={() => setResumeViewerCandidate(null)}
      />

    </div>
  );
};
