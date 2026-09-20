import React, { useState, useEffect } from 'react';
import { CandidateCaseFile, RoleSetup } from '../types';
import { AutonomousScreenerAgent, AutonomousScreeningResult } from '../services/autonomousScreenerAgent';
import { 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Brain, 
  ShieldCheck, 
  Activity, 
  X, 
  Check,
  ChevronRight
} from 'lucide-react';

interface AutonomousScreenerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateCaseFile[];
  role: RoleSetup;
  onApplyResults: (updatedCandidates: CandidateCaseFile[]) => void;
  onTriggerEmailSync?: (candidates: CandidateCaseFile[]) => void;
}

export const AutonomousScreenerModal: React.FC<AutonomousScreenerModalProps> = ({
  isOpen,
  onClose,
  candidates,
  role,
  onApplyResults,
  onTriggerEmailSync
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentProgressText, setCurrentProgressText] = useState('');
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentCandidateIndex, setCurrentCandidateIndex] = useState(0);
  const [result, setResult] = useState<AutonomousScreeningResult | null>(null);
  const [selectedLogFilter, setSelectedLogFilter] = useState<'all' | 'interview' | 'review' | 'rejected'>('all');

  useEffect(() => {
    if (!isOpen || isRunning) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isRunning, onClose]);

  if (!isOpen) return null;

  const handleRunScreening = async () => {
    setIsRunning(true);
    setResult(null);
    setCurrentStepIndex(1);

    try {
      const res = await AutonomousScreenerAgent.runAutonomousScreening(
        candidates,
        role,
        (stepText, current, total) => {
          setCurrentProgressText(stepText);
          setCurrentCandidateIndex(current);
          if (current === 0) setCurrentStepIndex(1);
          else if (current < total) setCurrentStepIndex(2);
          else setCurrentStepIndex(3);
        }
      );

      setCurrentStepIndex(4);
      setResult(res);
    } catch (err) {
      console.error('Autonomous screening failed:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleApplyAndClose = () => {
    if (result) {
      onApplyResults(result.updatedCandidates);
    }
    onClose();
  };

  const filteredLogs = (result?.actionLogs || []).filter(log => {
    if (selectedLogFilter === 'interview') return log.newStatus === 'Interview Ready';
    if (selectedLogFilter === 'review') return log.newStatus === 'Needs Review';
    if (selectedLogFilter === 'rejected') return log.newStatus === 'Rejected';
    return true;
  });


  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRunning) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Zap className="w-5 h-5 fill-indigo-400 text-indigo-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white tracking-tight">Autonomous Screener Agent</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  Autonomous ReAct Engine
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Multi-step candidate evaluation, requirement verification & decisive pipeline triage for <strong className="text-white">{role.title}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="px-3 py-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/15 bg-white/10 border border-white/15 transition-colors disabled:opacity-40 cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
            title="Close Screener (Esc)"
            aria-label="Close Screener"
          >
            <X className="w-4 h-4 text-slate-400 hover:text-white" />
            <span>Close</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Agent Status Stepper */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">
              <span>Agentic Execution Pipeline</span>
              {isRunning && (
                <span className="flex items-center gap-1.5 text-indigo-600 font-bold normal-case">
                  <Activity className="w-3.5 h-3.5 animate-spin" />
                  Processing {currentCandidateIndex} of {candidates.length}...
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
              <div className={`p-2.5 rounded-lg border transition-all ${
                currentStepIndex >= 1 
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-medium' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStepIndex > 1 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {currentStepIndex > 1 ? '✓' : '1'}
                  </span>
                  <span>Ingest Blueprint</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                currentStepIndex >= 2 
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-medium' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStepIndex > 2 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {currentStepIndex > 2 ? '✓' : '2'}
                  </span>
                  <span>Evidence Triage</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                currentStepIndex >= 3 
                  ? 'bg-indigo-50/80 border-indigo-200 text-indigo-900 font-medium' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStepIndex > 3 ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {currentStepIndex > 3 ? '✓' : '3'}
                  </span>
                  <span>Decisive Classification</span>
                </div>
              </div>

              <div className={`p-2.5 rounded-lg border transition-all ${
                currentStepIndex >= 4 
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900 font-medium' 
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    currentStepIndex >= 4 ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {currentStepIndex >= 4 ? '✓' : '4'}
                  </span>
                  <span>Audit Commit</span>
                </div>
              </div>
            </div>

            {isRunning && currentProgressText && (
              <div className="mt-3 flex items-center gap-2 text-xs text-indigo-700 bg-white border border-indigo-100 rounded-lg p-2.5 shadow-sm">
                <Brain className="w-4 h-4 text-indigo-600 animate-pulse shrink-0" />
                <span className="font-mono truncate">{currentProgressText}</span>
              </div>
            )}
          </div>

          {/* Initial State / Start Screening */}
          {!result && !isRunning && (
            <div className="text-center py-10 px-4 space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mx-auto shadow-sm">
                <Zap className="w-8 h-8 fill-indigo-100" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h4 className="text-lg font-bold text-slate-900">Autonomous Candidate Screening Ready</h4>
                <p className="text-sm text-slate-600">
                  The Screener Agent will autonomously evaluate all <strong>{candidates.length} candidate dossier{candidates.length === 1 ? '' : 's'}</strong> against the <strong>{role.title}</strong> must-have criteria, make stage advancement decisions, write internal audit justifications, and commit results.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto text-xs text-slate-600 pt-2">
                <span className="font-semibold text-slate-700">Must-Have Skills to verify:</span>
                {role.mustHaveSkills.map((skill, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleRunScreening}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Zap className="w-4 h-4 fill-white" />
                  <span>Execute Autonomous Screening</span>
                </button>
              </div>
            </div>
          )}

          {/* Loading Animation */}
          {isRunning && (
            <div className="text-center py-12 space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin" />
                <div className="absolute inset-2 rounded-full bg-indigo-50 flex items-center justify-center">
                  <Brain className="w-6 h-6 text-indigo-600 animate-pulse" />
                </div>
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-base">Autonomous Agent in Progress...</h4>
                <p className="text-xs text-slate-500 font-mono">
                  Synthesizing candidate evidence, verifying skills & evaluating risk flags...
                </p>
              </div>
            </div>
          )}

          {/* Screening Results View */}
          {result && (
            <div className="space-y-6">
              {/* Metric Summary Triage Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setSelectedLogFilter('interview')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedLogFilter === 'interview' 
                      ? 'ring-2 ring-emerald-500 bg-emerald-50/70 border-emerald-200' 
                      : 'bg-emerald-50/30 border-emerald-100 hover:bg-emerald-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Interview Ready
                    </span>
                    <span className="text-xl font-extrabold text-emerald-900">{result.promotedToInterview}</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 mt-1 font-medium">Passed all must-have criteria with score ≥80%</p>
                </button>

                <button
                  onClick={() => setSelectedLogFilter('review')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedLogFilter === 'review' 
                      ? 'ring-2 ring-amber-500 bg-amber-50/70 border-amber-200' 
                      : 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-800 uppercase tracking-wide flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-amber-600" />
                      Needs Review
                    </span>
                    <span className="text-xl font-extrabold text-amber-900">{result.needsReview}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 mt-1 font-medium">Borderline fit or single skill verification gap</p>
                </button>

                <button
                  onClick={() => setSelectedLogFilter('rejected')}
                  className={`p-4 rounded-xl border text-left transition-all ${
                    selectedLogFilter === 'rejected' 
                      ? 'ring-2 ring-rose-500 bg-rose-50/70 border-rose-200' 
                      : 'bg-rose-50/30 border-rose-100 hover:bg-rose-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-800 uppercase tracking-wide flex items-center gap-1.5">
                      <XCircle className="w-4 h-4 text-rose-600" />
                      Screened Out
                    </span>
                    <span className="text-xl font-extrabold text-rose-900">{result.rejected}</span>
                  </div>
                  <p className="text-[11px] text-rose-700 mt-1 font-medium">Critical gaps in mandatory role criteria</p>
                </button>
              </div>

              {/* Executive Summary Quote */}
              <div className="bg-slate-900 text-slate-100 rounded-xl p-4 border border-slate-800 shadow-inner flex items-start gap-3">
                <Brain className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider">Agent Executive Synthesis</div>
                  <p className="text-xs text-slate-200 leading-relaxed font-sans">{result.summary}</p>
                </div>
              </div>

              {/* Action Log Table / Dossier Receipts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    Autonomous Action Receipts ({filteredLogs.length})
                  </h4>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSelectedLogFilter('all')}
                      className={`px-2 py-1 rounded text-[11px] font-medium transition-colors ${
                        selectedLogFilter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      All ({result.actionLogs.length})
                    </button>
                  </div>
                </div>

                <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
                  {filteredLogs.map((log, idx) => {
                    const isPromoted = log.newStatus === 'Interview Ready';
                    const isNeedsReview = log.newStatus === 'Needs Review';

                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-sm transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-sm text-slate-900">{log.candidateName}</span>
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                              {log.matchScore}% Match
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-slate-400 line-through">{log.previousStatus}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                              isPromoted
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : isNeedsReview
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-rose-100 text-rose-800 border border-rose-200'
                            }`}>
                              {log.newStatus}
                            </span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-sans leading-relaxed">
                          <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold mb-1 uppercase tracking-wider">
                            <span>Evaluated by: {log.decisionSource}</span>
                            <span>{log.timestamp}</span>
                          </div>
                          <strong className="text-slate-700">Reasoning: </strong>
                          {log.reasoning}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {result ? 'All actions logged to immutable audit trail.' : 'Deterministic multi-step candidate evaluation.'}
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
            >
              Cancel
            </button>

            {result ? (
              <button
                onClick={handleApplyAndClose}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Apply & Update Pipeline</span>
              </button>
            ) : (
              <button
                onClick={handleRunScreening}
                disabled={isRunning}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-white" />
                <span>{isRunning ? 'Screening...' : 'Run Screener'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
