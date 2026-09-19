import React, { useState, useEffect, useRef } from 'react';
import { RoleSetup, CandidateCaseFile } from '../types';
import { 
  AgentLoopRuntime, 
  AgentStatus, 
  PlanDAG, 
  ReActLogEntry, 
  StagedDecision 
} from '../services/agentLoopRuntime';
import { PortalIngestionService } from '../services/portalIngestionService';
import { GmailSyncService } from '../services/gmailSyncService';
import { 
  Bot, 
  Play, 
  Pause, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Send, 
  Sparkles, 
  Mail, 
  ExternalLink, 
  X, 
  ArrowRight, 
  FileText, 
  UserCheck, 
  UserX, 
  Trash2, 
  Terminal, 
  Activity, 
  Radio
} from 'lucide-react';

interface AutonomousAgentOpsCenterProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleSetup;
  onOpenCareerPortal: () => void;
  onSelectCandidate?: (candidate: CandidateCaseFile) => void;
  onShowToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  /** Called when agent wants to approve a decision but SMTP is not configured — pop the EmailApprovalModal */
  onEmailApprovalNeeded?: (candidate: CandidateCaseFile, status: CandidateCaseFile['reviewStatus']) => void;
  /** Called when recruiter dismisses approval without an SMTP key */
  onEmailNotSent?: (candidateName: string, recipientEmail: string) => void;
}

export const AutonomousAgentOpsCenter: React.FC<AutonomousAgentOpsCenterProps> = ({
  isOpen,
  onClose,
  role,
  onOpenCareerPortal,
  onSelectCandidate,
  onShowToast,
  onEmailApprovalNeeded,
  onEmailNotSent
}) => {
  const [agentStatus, setAgentStatus] = useState<AgentStatus>('idle');
  const [activeGoal, setActiveGoal] = useState('');
  const [activePlan, setActivePlan] = useState<PlanDAG | null>(null);
  const [logs, setLogs] = useState<ReActLogEntry[]>([]);
  const [stagedDecisions, setStagedDecisions] = useState<StagedDecision[]>([]);
  const [cycleCount, setCycleCount] = useState(0);
  const [daemonActive, setDaemonActive] = useState(false);
  const [logFilter, setLogFilter] = useState<'all' | 'thought' | 'action' | 'human_gate'>('all');
  const [isBatchApproving, setIsBatchApproving] = useState(false);
  const [expandedEmailId, setExpandedEmailId] = useState<string | null>(null);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = AgentLoopRuntime.subscribe(state => {
      setAgentStatus(state.status);
      setActiveGoal(state.activeGoal);
      setActivePlan(state.activePlan);
      setLogs(state.logs);
      setStagedDecisions(state.stagedDecisions);
      setCycleCount(state.cycleCount);
      setDaemonActive(state.daemonActive);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (!isOpen) return null;

  const handleToggleDaemon = () => {
    if (daemonActive) {
      AgentLoopRuntime.pauseDaemon();
      onShowToast('Autonomous loop paused. Agent standing by.', 'info');
    } else {
      AgentLoopRuntime.startDaemon(10000);
      onShowToast('Autonomous loop activated: Polling portal ingress buffer every 10s.', 'success');
    }
  };

  const handleRunSingleCycle = async () => {
    onShowToast('Initiating single autonomous execution cycle...', 'info');
    await AgentLoopRuntime.triggerSingleCycle();
  };

  const handleSimulateInflow = () => {
    const batch = PortalIngestionService.simulatePortalInflowBatch(role);
    onShowToast(`Simulated portal inflow: ${batch.length} candidate applications injected from LinkedIn, Greenhouse, and Indeed!`, 'success');
    // If daemon is active, it will auto-perceive; if not, trigger cycle
    if (!daemonActive) {
      AgentLoopRuntime.triggerSingleCycle();
    }
  };

  const handleApproveDecision = async (decisionId: string) => {
    const decision = AgentLoopRuntime.getState().stagedDecisions.find(d => d.id === decisionId);
    if (!decision) return;

    // SMTP Gate: if email service is not configured, route through EmailApprovalModal
    if (!GmailSyncService.isConfigured()) {
      if (onEmailApprovalNeeded) {
        // Surface the approval modal so recruiter can provide SMTP key inline
        onEmailApprovalNeeded(decision.candidate, decision.recommendedStatus);
        // Also execute the status update in the agent runtime (dismiss from staged queue)
        AgentLoopRuntime.dismissStagedDecision(decisionId);
        onShowToast(`⚠️ SMTP key missing — Email approval modal opened for ${decision.candidate.name}.`, 'warning');
      } else {
        // Fallback: notify email not sent
        onEmailNotSent?.(decision.candidate.name, decision.recipientEmail);
        AgentLoopRuntime.dismissStagedDecision(decisionId);
        onShowToast(`Automated email not sent to ${decision.candidate.name}. SMTP credentials not configured.`, 'warning');
      }
      return;
    }

    // SMTP is configured: approve and dispatch
    const res = await AgentLoopRuntime.approveStagedDecision(decisionId);
    if (res.success) {
      onShowToast(res.message, 'success');
    } else {
      onShowToast(res.message, 'error');
    }
  };

  const handleDismissDecision = (decisionId: string) => {
    AgentLoopRuntime.dismissStagedDecision(decisionId);
    onShowToast('Staged action dismissed without dispatching email.', 'info');
  };

  const handleBatchApprove = async () => {
    setIsBatchApproving(true);
    try {
      // If SMTP is not configured, dismiss all and surface the alert
      if (!GmailSyncService.isConfigured()) {
        const pending = AgentLoopRuntime.getState().stagedDecisions.filter(d => d.status === 'pending_review');
        for (const d of pending) {
          AgentLoopRuntime.dismissStagedDecision(d.id);
          onEmailNotSent?.(d.candidate.name, d.recipientEmail);
        }
        onShowToast(`⚠️ SMTP not configured — ${pending.length} decisions dismissed. No emails sent.`, 'warning');
        return;
      }
      const res = await AgentLoopRuntime.batchApproveAll();
      onShowToast(`Batch approval complete: ${res.approvedCount} decisions executed with automated communications!`, 'success');
    } finally {
      setIsBatchApproving(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    if (logFilter === 'all') return true;
    if (logFilter === 'thought') return l.type === 'thought' || l.type === 'reflection';
    if (logFilter === 'action') return l.type === 'action' || l.type === 'observation';
    if (logFilter === 'human_gate') return l.type === 'human_gate';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col">
        
        {/* 1. TOP OPERATIONS COMMAND BAR */}
        <header className="px-6 py-4 bg-slate-900 border-b border-slate-800 text-white flex flex-wrap items-center justify-between gap-4 shrink-0">
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-white tracking-tight">
                  Autonomous AI Recruiter Operations Center
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1.5 ${
                  daemonActive 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 animate-pulse' 
                    : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                }`}>
                  <Radio className="w-2.5 h-2.5" />
                  <span>{daemonActive ? `LOOP ACTIVE (#${cycleCount})` : 'LOOP PAUSED'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Continuous Perceive-Plan-Act runtime with dynamic DAG planning & human review gate.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Daemon Loop Toggle */}
            <button
              onClick={handleToggleDaemon}
              className={`px-3.5 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer ${
                daemonActive
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30 hover:bg-amber-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {daemonActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{daemonActive ? 'Pause Loop' : 'Activate Loop'}</span>
            </button>

            {/* Run Single Cycle */}
            <button
              onClick={handleRunSingleCycle}
              className="px-3 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-slate-200 rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Run a single perceive-plan-act iteration right now"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Step Cycle</span>
            </button>

            {/* Simulate Inflow */}
            <button
              onClick={handleSimulateInflow}
              className="px-3 py-2 text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 rounded-xl border border-indigo-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Inject realistic applications from LinkedIn, Greenhouse, and Indeed"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Simulate Portal Inflow</span>
            </button>

            {/* Open Career Portal Modal */}
            <button
              onClick={onOpenCareerPortal}
              className="px-3 py-2 text-xs font-semibold bg-white/5 hover:bg-white/15 text-slate-300 rounded-xl border border-white/10 flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open the public candidate application portal"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Career Portal</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
              title="Close Operations Center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

        </header>

        {/* 2. DUAL PANEL LAYOUT: LEFT = MIND & PLAN DAG, RIGHT = HUMAN ACTION DECK */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 min-h-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 overflow-hidden bg-slate-50">
          
          {/* LEFT COLUMN: DYNAMIC DAG PLANNER & REACT TELEMETRY TERMINAL (7 COLS) */}
          <div className="lg:col-span-7 flex flex-col min-h-0 bg-slate-900 text-slate-200 overflow-hidden">
            
            {/* Active Goal Banner */}
            <div className="p-3.5 bg-slate-950/70 border-b border-slate-800 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping shrink-0" />
                <span className="font-mono text-[11px] text-indigo-400 uppercase font-bold shrink-0">Current Goal:</span>
                <span className="font-mono text-slate-300 truncate">{activeGoal}</span>
              </div>
              <span className="font-mono text-[10px] text-slate-500 shrink-0 ml-2">
                Status: <strong className="text-indigo-300 uppercase">{agentStatus}</strong>
              </span>
            </div>

            {/* Dynamic Plan DAG Progress Checklist */}
            {activePlan && (
              <div className="p-3.5 bg-slate-900/90 border-b border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>DYNAMIC PLAN DAG ({activePlan.candidateName || 'Active Triage'})</span>
                  <span>{activePlan.tasks.filter(t => t.status === 'completed').length} / {activePlan.tasks.length} Completed</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {activePlan.tasks.map((task, idx) => (
                    <div
                      key={task.id}
                      className={`px-2.5 py-1.5 rounded-lg border text-[11px] flex items-center justify-between gap-2 font-mono transition-colors ${
                        task.status === 'completed'
                          ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                          : task.status === 'running'
                          ? 'bg-indigo-950/60 border-indigo-500/80 text-indigo-200 ring-1 ring-indigo-500/30'
                          : 'bg-slate-950/50 border-slate-800 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[10px] text-slate-500">#{idx + 1}</span>
                        <span className="truncate">{task.title}</span>
                      </div>
                      <span className="shrink-0">
                        {task.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        {task.status === 'running' && <Activity className="w-3.5 h-3.5 text-indigo-400 animate-spin" />}
                        {task.status === 'pending' && <Clock className="w-3 h-3 text-slate-600" />}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ReAct Telemetry Filter Bar */}
            <div className="px-4 py-2 bg-slate-950/90 border-b border-slate-800 text-[11px] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-mono font-bold text-slate-300">Agent Mind & ReAct Telemetry</span>
              </div>
              <div className="flex items-center gap-1">
                {(['all', 'thought', 'action', 'human_gate'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setLogFilter(f)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono capitalize transition-colors cursor-pointer ${
                      logFilter === f
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {f.replace('_', ' ')}
                  </button>
                ))}
                <button
                  onClick={() => AgentLoopRuntime.clearLogs()}
                  className="p-1 text-slate-500 hover:text-rose-400 ml-2"
                  title="Clear telemetry stream"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Streaming Terminal Log */}
            <div className="flex-1 p-4 overflow-y-auto font-mono text-[11px] space-y-2.5 select-text">
              {filteredLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center space-y-2">
                  <Terminal className="w-8 h-8 text-slate-700" />
                  <p>Telemetry stream ready. Activate loop or simulate inflow to observe agent reasoning.</p>
                </div>
              ) : (
                filteredLogs.map(entry => (
                  <div key={entry.id} className="space-y-1">
                    <div className="flex items-center gap-2 text-[10px]">
                      <span className="text-slate-500">{entry.timestamp}</span>
                      <span className={`px-1.5 py-0.2 rounded uppercase font-bold text-[9px] ${
                        entry.type === 'thought'
                          ? 'bg-indigo-950 text-indigo-400 border border-indigo-800/60'
                          : entry.type === 'action'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : entry.type === 'observation'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800/60'
                          : entry.type === 'plan'
                          ? 'bg-purple-950 text-purple-400 border border-purple-800/60'
                          : entry.type === 'human_gate'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {entry.type}
                      </span>
                      {entry.tool && (
                        <span className="text-indigo-300 font-bold">[{entry.tool}]</span>
                      )}
                    </div>
                    <div className="text-slate-300 pl-4 border-l-2 border-slate-800 leading-relaxed">
                      {entry.message}
                    </div>
                  </div>
                ))
              )}
              <div ref={terminalEndRef} />
            </div>

          </div>

          {/* RIGHT COLUMN: HUMAN-IN-THE-LOOP ACTION DECK (5 COLS) */}
          <div className="lg:col-span-5 flex flex-col min-h-0 bg-white overflow-hidden">
            
            {/* Header: Staged Action Counter & Batch Approval */}
            <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                <h3 className="font-bold text-sm text-slate-900">
                  Human Review Action Deck
                </h3>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700">
                  {stagedDecisions.length}
                </span>
              </div>

              {stagedDecisions.length > 1 && (
                <button
                  onClick={handleBatchApprove}
                  disabled={isBatchApproving}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Batch Approve All ({stagedDecisions.length})</span>
                </button>
              )}
            </div>

            {/* List of Staged Decisions */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5">
              {stagedDecisions.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-3 text-slate-400">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-700 text-sm">Action Deck Clear</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      All candidate applications have been reviewed. When new candidates apply from the Career Portal or webhooks, their decisions will stage here for 1-click approval.
                    </p>
                  </div>
                  <button
                    onClick={handleSimulateInflow}
                    className="px-3.5 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer"
                  >
                    Simulate Inflow Now
                  </button>
                </div>
              ) : (
                stagedDecisions.map(decision => {
                  const c = decision.candidate;
                  const isExpanded = expandedEmailId === decision.id;

                  return (
                    <div
                      key={decision.id}
                      className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-all space-y-3"
                    >
                      {/* Candidate Header */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-800 text-xs shrink-0">
                            {c.initials}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 
                                onClick={() => onSelectCandidate?.(c)}
                                className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer"
                              >
                                {c.name}
                              </h4>
                              <span className="text-[10px] font-mono text-slate-400 uppercase">
                                via {decision.portalSource}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500">
                              {c.currentRole} • {c.location || 'Remote'}
                            </div>
                          </div>
                        </div>

                        {/* Match Score & Status Pill */}
                        <div className="text-right shrink-0">
                          <div className="text-xs font-bold text-slate-900">
                            Match: <strong className="text-indigo-600">{decision.confidenceScore}%</strong>
                          </div>
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold mt-0.5 ${
                            decision.recommendedStatus === 'Interview Ready' || decision.recommendedStatus === 'Passed Screen'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : decision.recommendedStatus === 'Needs Review'
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {decision.recommendedStatus}
                          </span>
                        </div>
                      </div>

                      {/* Agent Rationale */}
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 text-xs text-slate-700 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900 text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Autonomous Agent Rationale:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-600 pl-4 border-l border-indigo-400">
                          {decision.rationale}
                        </p>
                      </div>

                      {/* Drafted Email Drawer */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                        <div
                          onClick={() => setExpandedEmailId(isExpanded ? null : decision.id)}
                          className="px-3 py-2 bg-slate-50 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Mail className="w-3.5 h-3.5 text-slate-500" />
                            <span className="font-semibold text-slate-800 truncate">
                              Draft: "{decision.draftedSubject}"
                            </span>
                          </div>
                          <span className="text-[10px] text-indigo-600 font-medium shrink-0 ml-2">
                            {isExpanded ? 'Collapse' : 'Preview Full Body'}
                          </span>
                        </div>

                        {isExpanded && (
                          <div className="p-3 bg-white text-[11px] text-slate-700 space-y-2 border-t border-slate-100 font-sans">
                            <div className="text-slate-500">
                              Recipient: <strong className="text-slate-800 font-mono">{decision.recipientEmail}</strong>
                            </div>
                            <div className="whitespace-pre-wrap bg-slate-50 p-2.5 rounded border border-slate-200 font-mono text-[10px] leading-relaxed">
                              {decision.draftedBody}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 1-Click Action Buttons */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={() => handleDismissDecision(decision.id)}
                          className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-600 rounded flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Dismiss</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onSelectCandidate?.(c)}
                            className="px-2.5 py-1.5 text-xs text-slate-700 hover:text-indigo-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>Inspect Dossier</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApproveDecision(decision.id)}
                            className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer ${
                              decision.recommendedStatus === 'Rejected'
                                ? 'bg-rose-600 hover:bg-rose-700'
                                : 'bg-emerald-600 hover:bg-emerald-700'
                            }`}
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>
                              {decision.recommendedStatus === 'Rejected'
                                ? 'Approve Rejection & Send Mail'
                                : 'Approve & Dispatch Mail'}
                            </span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
