import { CandidateCaseFile, RoleSetup } from '../types';
import { PortalIngestionService, PortalApplication } from './portalIngestionService';
import { parseStructuredResume } from './pdfParser';
import { CaseEvaluator } from './caseEvaluator';
import { AiService } from './aiApi';
import { GmailSyncService, EmailDispatchLog } from './gmailSyncService';
import { DatabaseService } from './databaseService';

export type AgentStatus = 
  | 'idle' 
  | 'perceiving' 
  | 'planning' 
  | 'executing_tools' 
  | 'reflecting' 
  | 'awaiting_human_approval' 
  | 'paused';

export interface PlanTask {
  id: string;
  title: string;
  toolName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'replanned';
  details: string;
  outputSummary?: string;
  durationMs?: number;
}

export interface PlanDAG {
  id: string;
  goal: string;
  candidateName?: string;
  portalSource?: string;
  tasks: PlanTask[];
  currentTaskIndex: number;
  startedAt: string;
  completedAt?: string;
}

export interface ReActLogEntry {
  id: string;
  timestamp: string;
  type: 'thought' | 'plan' | 'action' | 'observation' | 'reflection' | 'human_gate';
  message: string;
  tool?: string;
  toolInput?: Record<string, any>;
  toolOutput?: Record<string, any> | string;
  candidateId?: string;
}

export interface StagedDecision {
  id: string;
  applicationId: string;
  candidate: CandidateCaseFile;
  recommendedStatus: CandidateCaseFile['reviewStatus'];
  rationale: string;
  confidenceScore: number;
  draftedSubject: string;
  draftedBody: string;
  recipientEmail: string;
  createdAt: string;
  portalSource: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'overridden';
}

type TelemetryListener = (state: {
  status: AgentStatus;
  activeGoal: string;
  activePlan: PlanDAG | null;
  logs: ReActLogEntry[];
  stagedDecisions: StagedDecision[];
  cycleCount: number;
  daemonActive: boolean;
}) => void;

const STAGED_STORAGE_KEY = 'talentdossier_staged_decisions_v1';
const LOGS_STORAGE_KEY = 'talentdossier_agent_react_logs_v1';

export class AgentLoopRuntime {
  private static status: AgentStatus = 'idle';
  private static activeGoal = 'Autonomously monitor portals, cross-reference applications, and advance qualified talent.';
  private static activePlan: PlanDAG | null = null;
  private static logs: ReActLogEntry[] = [];
  private static stagedDecisions: StagedDecision[] = [];
  private static cycleCount = 0;
  private static daemonActive = false;
  private static daemonTimer: any = null;
  private static isProcessingCycle = false;
  private static listeners: Set<TelemetryListener> = new Set();
  private static currentRole: RoleSetup | null = null;
  private static onCandidatePersistedCallback?: (candidate: CandidateCaseFile) => void;
  private static onCandidateRemovedCallback?: (candidateId: string) => void;

  /**
   * Initialize runtime with initial state from storage
   */
  public static init(
    role: RoleSetup,
    callbacks?: {
      onCandidatePersisted?: (candidate: CandidateCaseFile) => void;
      onCandidateRemoved?: (candidateId: string) => void;
    }
  ): void {
    this.currentRole = role;
    if (callbacks?.onCandidatePersisted) {
      this.onCandidatePersistedCallback = callbacks.onCandidatePersisted;
    }
    if (callbacks?.onCandidateRemoved) {
      this.onCandidateRemovedCallback = callbacks.onCandidateRemoved;
    }

    try {
      const savedStaged = localStorage.getItem(STAGED_STORAGE_KEY);
      if (savedStaged) {
        this.stagedDecisions = JSON.parse(savedStaged);
      }
      const savedLogs = localStorage.getItem(LOGS_STORAGE_KEY);
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs).slice(-100);
      }
    } catch {
      // ignore
    }

    // Listen to portal inflow events
    if (typeof window !== 'undefined') {
      window.addEventListener('talentdossier:portal_inflow', () => {
        if (this.daemonActive && !this.isProcessingCycle) {
          this.executeCycle();
        }
      });
    }

    this.notifySubscribers();
  }

  public static updateRole(role: RoleSetup): void {
    this.currentRole = role;
  }

  public static subscribe(listener: TelemetryListener): () => void {
    this.listeners.add(listener);
    // Initial emit
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  public static getState() {
    return {
      status: this.status,
      activeGoal: this.activeGoal,
      activePlan: this.activePlan,
      logs: [...this.logs],
      stagedDecisions: [...this.stagedDecisions],
      cycleCount: this.cycleCount,
      daemonActive: this.daemonActive
    };
  }

  private static notifySubscribers(): void {
    const state = this.getState();
    this.listeners.forEach(l => {
      try {
        l(state);
      } catch (err) {
        console.warn('Telemetry listener error:', err);
      }
    });

    try {
      localStorage.setItem(STAGED_STORAGE_KEY, JSON.stringify(this.stagedDecisions));
      localStorage.setItem(LOGS_STORAGE_KEY, JSON.stringify(this.logs.slice(-80)));
    } catch {
      // ignore
    }
  }

  private static appendLog(
    type: ReActLogEntry['type'],
    message: string,
    tool?: string,
    toolInput?: Record<string, any>,
    toolOutput?: Record<string, any> | string,
    candidateId?: string
  ): void {
    const entry: ReActLogEntry = {
      id: `react-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      type,
      message,
      tool,
      toolInput,
      toolOutput,
      candidateId
    };
    this.logs.push(entry);
    if (this.logs.length > 150) {
      this.logs = this.logs.slice(-100);
    }
    this.notifySubscribers();
  }

  /**
   * Start the continuous autonomous background loop
   */
  public static startDaemon(intervalMs = 12000): void {
    if (this.daemonActive) return;
    this.daemonActive = true;
    this.appendLog('thought', `Autonomous Agent Loop activated. Monitoring portal ingress buffer every ${intervalMs / 1000}s.`);
    
    // Immediate initial check
    this.executeCycle();

    this.daemonTimer = setInterval(() => {
      if (this.daemonActive && !this.isProcessingCycle) {
        this.executeCycle();
      }
    }, intervalMs);

    this.notifySubscribers();
  }

  /**
   * Pause the continuous autonomous background loop
   */
  public static pauseDaemon(): void {
    this.daemonActive = false;
    if (this.daemonTimer) {
      clearInterval(this.daemonTimer);
      this.daemonTimer = null;
    }
    this.status = 'paused';
    this.appendLog('thought', 'Autonomous loop paused by recruiter. Standing by for manual cycle or resume.');
    this.notifySubscribers();
  }

  /**
   * Trigger a single on-demand cycle
   */
  public static async triggerSingleCycle(): Promise<void> {
    await this.executeCycle();
  }

  /**
   * CORE AUTONOMOUS AGENT LOOP: PERCEIVE ➔ PLAN ➔ ACT ➔ REFLECT ➔ HUMAN GATE
   */
  public static async executeCycle(): Promise<void> {
    if (this.isProcessingCycle || !this.currentRole) return;
    this.isProcessingCycle = true;
    this.cycleCount++;

    const role = this.currentRole;

    try {
      // 1. PERCEIVE: Check environment
      this.status = 'perceiving';
      this.appendLog('thought', `[Cycle #${this.cycleCount}] Perceiving environment: scanning portal buffer for new candidate submissions...`);
      
      const pendingApps = PortalIngestionService.getPendingApplications();

      if (pendingApps.length === 0) {
        this.appendLog('observation', 'Portal buffer empty: 0 pending applications. Pipeline is synchronized.');
        this.status = this.daemonActive ? 'idle' : 'paused';
        this.isProcessingCycle = false;
        this.notifySubscribers();
        return;
      }

      this.appendLog(
        'observation',
        `Perceived ${pendingApps.length} pending candidate application(s) from portal sources (${pendingApps.map(a => `${a.candidateName} via ${a.source}`).join(', ')}).`
      );

      // Process one application per sub-loop to ensure strict observable planning
      const app = pendingApps[0];

      // 2. PLAN: Dynamic DAG Generation
      this.status = 'planning';
      this.activeGoal = `Autonomously triage application for ${app.candidateName} against ${role.title} requirements.`;

      // Build dynamic task DAG based on applicant payload
      const dynamicTasks: PlanTask[] = [
        {
          id: 'task-1',
          title: 'Document Parsing & OCR',
          toolName: 'tool_pdf_document_ocr',
          status: 'pending',
          details: `Extract structured profile and text tokens from ${app.fileName || 'resume input'}.`
        },
        {
          id: 'task-2',
          title: 'Grounded Evidence Cross-Referencing',
          toolName: 'tool_evidence_crossref',
          status: 'pending',
          details: `Map candidate claims against ${role.mustHaveSkills.length} required competencies with verbatim citations.`
        }
      ];

      // Dynamic Adaptive Replanning check: if AI engine is active, insert live LLM deliberation task
      if (AiService.isConfigured()) {
        dynamicTasks.push({
          id: 'task-3',
          title: 'Live LLM Frontier Deliberation',
          toolName: 'tool_llm_reasoning',
          status: 'pending',
          details: `Invoke live frontier LLM (${AiService.getConfig().provider.toUpperCase()}) for nuanced holistic fit analysis.`
        });
      }

      dynamicTasks.push(
        {
          id: 'task-4',
          title: 'Scoring & Status Decision Matrix',
          toolName: 'tool_eval_matrix',
          status: 'pending',
          details: 'Compute match score, fit badge, risk flags, and assign recommended status.'
        },
        {
          id: 'task-5',
          title: 'Draft Tailored Candidate Communication',
          toolName: 'tool_draft_communication',
          status: 'pending',
          details: 'Generate personalized email with verified skills, role context, and team alignment.'
        },
        {
          id: 'task-6',
          title: 'Stage Candidate Decision in Human Review Deck',
          toolName: 'tool_stage_human_signoff',
          status: 'pending',
          details: 'Package candidate case file, reasoning trace, and communication draft for 1-click recruiter sign-off.'
        }
      );

      this.activePlan = {
        id: `dag-${Date.now()}`,
        goal: this.activeGoal,
        candidateName: app.candidateName,
        portalSource: app.source,
        tasks: dynamicTasks,
        currentTaskIndex: 0,
        startedAt: new Date().toISOString()
      };

      this.appendLog(
        'plan',
        `Generated dynamic plan with ${dynamicTasks.length} sub-tasks for ${app.candidateName}. Commencing tool execution.`,
        undefined,
        { tasks: dynamicTasks.map(t => t.title) }
      );

      // 3. ACT: ReAct Tool Execution Loop
      this.status = 'executing_tools';

      // --- Task 1: Document Parsing ---
      await this.runPlanTask(0, async () => {
        this.appendLog('thought', `Calling tool_pdf_document_ocr to extract structured data from ${app.candidateName}'s resume...`);
        const parsed = parseStructuredResume(
          app.rawResumeText,
          app.rawResumeText.split('\n'),
          app.candidateName
        );
        // Enrich with portal contact data if missing
        if (!parsed.email && app.email) parsed.email = app.email;
        if (!parsed.phone && app.phone) parsed.phone = app.phone;
        if (!parsed.location && app.location) parsed.location = app.location;

        this.appendLog(
          'action',
          `Executed tool_pdf_document_ocr on ${app.candidateName}'s resume.`,
          'tool_pdf_document_ocr',
          { words: app.rawResumeText.split(/\s+/).length },
          { 
            name: parsed.name, 
            skillsExtracted: parsed.skills.length, 
            projectsExtracted: parsed.projects.length,
            rolesExtracted: parsed.experiences.length 
          }
        );
        return parsed;
      });

      const parsedResume = this.activePlan.tasks[0].outputSummary as any;

      // --- Task 2: Grounded Evidence Cross-Referencing ---
      await this.runPlanTask(1, async () => {
        this.appendLog('thought', `Calling tool_evidence_crossref to map evidence against must-have skills (${role.mustHaveSkills.join(', ')})...`);
        
        const evaluatedCase = CaseEvaluator.evaluate(
          parsedResume || app.rawResumeText,
          role,
          app.candidateName,
          app.portfolioUrl
        );

        // Retain candidate contact info from portal application
        evaluatedCase.email = app.email || evaluatedCase.email;
        evaluatedCase.phone = app.phone || evaluatedCase.phone;
        evaluatedCase.location = app.location || evaluatedCase.location;

        this.appendLog(
          'action',
          `Executed tool_evidence_crossref: Identified ${evaluatedCase.matchedSkills.length} matched skills, ${evaluatedCase.missingSkills.length} gaps.`,
          'tool_evidence_crossref',
          { required: role.mustHaveSkills },
          { 
            matched: evaluatedCase.matchedSkills, 
            missing: evaluatedCase.missingSkills,
            verifiedEvidenceCount: evaluatedCase.evidenceMap.filter(e => e.status === 'Verified').length
          }
        );
        return evaluatedCase;
      });

      let evaluatedCase: CandidateCaseFile = (this.activePlan.tasks[1] as any).evaluatedCaseObj || 
        CaseEvaluator.evaluate(app.rawResumeText, role, app.candidateName);
      evaluatedCase.email = app.email || evaluatedCase.email;

      // --- Optional Task 3: Live LLM Reasoning ---
      let nextIndex = 2;
      if (AiService.isConfigured()) {
        await this.runPlanTask(nextIndex, async () => {
          this.appendLog('thought', `Calling tool_llm_reasoning to evaluate nuanced fit via live AI engine...`);
          try {
            const aiRes = await AiService.evaluateWithLLM(app.rawResumeText, role);
            evaluatedCase.matchScore = aiRes.matchScore;
            evaluatedCase.fitBadge = aiRes.fitBadge as any;
            if (aiRes.evidenceMap?.length) evaluatedCase.evidenceMap = aiRes.evidenceMap;
            if (aiRes.riskFlags?.length) evaluatedCase.riskFlags = aiRes.riskFlags;
            
            this.appendLog(
              'action',
              `Live AI deliberation complete: Match Score: ${aiRes.matchScore}%, Fit: ${aiRes.fitBadge}.`,
              'tool_llm_reasoning',
              { provider: AiService.getConfig().provider },
              { score: aiRes.matchScore, flags: aiRes.riskFlags.map(f => f.label) }
            );
          } catch (err: any) {
            this.appendLog('observation', `AI reasoning notice: falling back to deterministic score (${evaluatedCase.matchScore}%).`);
          }
          return evaluatedCase;
        });
        nextIndex++;
      }

      // --- Task 4: Scoring & Status Decision Matrix ---
      let recommendedStatus: CandidateCaseFile['reviewStatus'] = 'Needs Review';
      let decisionRationale = '';

      await this.runPlanTask(nextIndex, async () => {
        this.appendLog('thought', `Calling tool_eval_matrix to synthesize match score (${evaluatedCase.matchScore}%) into recommended status...`);
        
        if (evaluatedCase.matchScore >= 78) {
          recommendedStatus = 'Interview Ready';
          decisionRationale = `High alignment (${evaluatedCase.matchScore}%): Strong evidence across ${evaluatedCase.matchedSkills.slice(0, 3).join(', ')}. Recommend technical interview.`;
        } else if (evaluatedCase.matchScore >= 55) {
          recommendedStatus = 'Needs Review';
          decisionRationale = `Moderate alignment (${evaluatedCase.matchScore}%): Candidate demonstrates relevant experience but has verification gaps in ${evaluatedCase.missingSkills.slice(0, 2).join(', ')}.`;
        } else {
          recommendedStatus = 'Rejected';
          decisionRationale = `Low alignment (${evaluatedCase.matchScore}%): Candidate qualifications miss core required competencies (${evaluatedCase.missingSkills.slice(0, 3).join(', ')}).`;
        }

        evaluatedCase.reviewStatus = recommendedStatus;

        this.appendLog(
          'action',
          `Status decision formulated: ${recommendedStatus} (${decisionRationale})`,
          'tool_eval_matrix',
          { score: evaluatedCase.matchScore },
          { recommendedStatus, rationale: decisionRationale }
        );
        return { recommendedStatus, decisionRationale };
      });
      nextIndex++;

      // --- Task 5: Draft Communication ---
      let draftedEmail: { subject: string; body: string; to: string } = { subject: '', body: '', to: '' };

      await this.runPlanTask(nextIndex, async () => {
        this.appendLog('thought', `Calling tool_draft_communication to draft tailored candidate email for status "${recommendedStatus}"...`);
        
        draftedEmail = GmailSyncService.generateCandidateEmail(
          evaluatedCase,
          role,
          recommendedStatus
        );

        this.appendLog(
          'action',
          `Tailored candidate email drafted: "${draftedEmail.subject}" addressed to ${draftedEmail.to}.`,
          'tool_draft_communication',
          { to: draftedEmail.to, status: recommendedStatus },
          { subject: draftedEmail.subject, preview: draftedEmail.body.slice(0, 120) + '...' }
        );
        return draftedEmail;
      });
      nextIndex++;

      // --- Task 6: Stage Human Sign-off ---
      await this.runPlanTask(nextIndex, async () => {
        this.appendLog('thought', 'Calling tool_stage_human_signoff: enqueuing candidate package in Human Review Deck...');

        const stagedRecord: StagedDecision = {
          id: `stage-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          applicationId: app.id,
          candidate: evaluatedCase,
          recommendedStatus,
          rationale: decisionRationale,
          confidenceScore: evaluatedCase.matchScore,
          draftedSubject: draftedEmail.subject,
          draftedBody: draftedEmail.body,
          recipientEmail: draftedEmail.to,
          createdAt: new Date().toISOString(),
          portalSource: app.source,
          status: 'pending_review'
        };

        // Remove from portal pending queue
        PortalIngestionService.updateApplicationStatus(app.id, 'staged_for_review');

        // Add to staged decisions queue
        this.stagedDecisions.unshift(stagedRecord);

        // Also persist candidate to active database so it is visible in dashboard
        await DatabaseService.saveCandidate(evaluatedCase);
        this.onCandidatePersistedCallback?.(evaluatedCase);

        this.appendLog(
          'human_gate',
          `Decision Staged for Recruiter Review: ${evaluatedCase.name} [${recommendedStatus} - ${evaluatedCase.matchScore}%]. Human-in-the-loop signoff required before dispatch.`,
          'tool_stage_human_signoff',
          { candidate: evaluatedCase.name, status: recommendedStatus },
          { stagedId: stagedRecord.id }
        );

        return stagedRecord;
      });

      // 4. REFLECTION
      this.status = 'awaiting_human_approval';
      this.activePlan.completedAt = new Date().toISOString();
      this.appendLog(
        'reflection',
        `Cycle #${this.cycleCount} successfully completed for ${app.candidateName}. Plan execution took all sub-tasks to completion. 1 decision is now awaiting human recruiter review in the Action Deck.`
      );

    } catch (err: any) {
      console.error('Agent loop execution anomaly:', err);
      this.status = 'idle';
      this.appendLog('observation', `Agent loop encountered an anomaly: ${err?.message || 'Execution halted'}. Replanning on next cycle.`);
    } finally {
      this.isProcessingCycle = false;
      this.notifySubscribers();
    }
  }

  private static async runPlanTask(index: number, action: () => Promise<any>): Promise<any> {
    if (!this.activePlan || !this.activePlan.tasks[index]) return;
    const task = this.activePlan.tasks[index];
    task.status = 'running';
    this.activePlan.currentTaskIndex = index;
    this.notifySubscribers();

    const start = Date.now();
    await new Promise(r => setTimeout(r, 450)); // Observable pace for recruiter UI

    try {
      const output = await action();
      task.status = 'completed';
      task.durationMs = Date.now() - start;
      if (typeof output === 'string') {
        task.outputSummary = output;
      } else if (output) {
        task.outputSummary = JSON.stringify(output).slice(0, 100);
        (task as any).evaluatedCaseObj = output;
      }
    } catch (err: any) {
      task.status = 'failed';
      task.details += ` (Error: ${err?.message || 'Unknown'})`;
      throw err;
    } finally {
      this.notifySubscribers();
    }
  }

  /**
   * Recruiter approves a staged decision:
   * 1. Updates candidate status in database.
   * 2. If rejected, removes from pipeline.
   * 3. Dispatches automated candidate email via GmailSyncService.
   */
  public static async approveStagedDecision(
    decisionId: string,
    customSubject?: string,
    customBody?: string
  ): Promise<{ success: boolean; log?: EmailDispatchLog; message: string }> {
    const decision = this.stagedDecisions.find(d => d.id === decisionId);
    if (!decision) return { success: false, message: 'Decision record not found' };

    const candidate = decision.candidate;
    const subject = customSubject || decision.draftedSubject;
    const body = customBody || decision.draftedBody;

    try {
      this.appendLog('action', `Recruiter Approved candidate decision for ${candidate.name} (${decision.recommendedStatus}). Initiating email dispatch...`);

      // 1. Dispatch email
      const log = await GmailSyncService.dispatchEmail(candidate, subject, body);

      // 2. Status update & pipeline synchronization
      if (decision.recommendedStatus === 'Rejected') {
        await DatabaseService.deleteCandidate(candidate.id);
        this.onCandidateRemovedCallback?.(candidate.id);
        this.appendLog('observation', `${candidate.name} marked Rejected: removed from active pipeline and rejection email logged (${log.deliveryReceiptId}).`);
      } else {
        const updatedCandidate: CandidateCaseFile = {
          ...candidate,
          reviewStatus: decision.recommendedStatus,
          auditTrail: [
            {
              id: `at-${Date.now()}`,
              action: `Status Approved by Recruiter: ${decision.recommendedStatus}`,
              timestamp: 'Just now',
              note: `Autonomous decision approved and automated email sent to ${decision.recipientEmail}.`
            },
            ...candidate.auditTrail
          ]
        };
        await DatabaseService.saveCandidate(updatedCandidate);
        this.onCandidatePersistedCallback?.(updatedCandidate);
        this.appendLog('observation', `${candidate.name} status updated to ${decision.recommendedStatus} in active pipeline.`);
      }

      // Mark decision as approved
      decision.status = 'approved';
      this.stagedDecisions = this.stagedDecisions.filter(d => d.id !== decisionId);
      this.notifySubscribers();

      return { success: true, log, message: `Successfully approved & dispatched email to ${decision.recipientEmail}` };
    } catch (err: any) {
      console.error('Approval dispatch error:', err);
      return { success: false, message: `Dispatch failed: ${err?.message || 'SMTP Gateway error'}` };
    }
  }

  /**
   * Recruiter rejects/dismisses a staged decision without sending email
   */
  public static dismissStagedDecision(decisionId: string): void {
    const decision = this.stagedDecisions.find(d => d.id === decisionId);
    if (decision) {
      decision.status = 'rejected';
      this.stagedDecisions = this.stagedDecisions.filter(d => d.id !== decisionId);
      this.appendLog('thought', `Recruiter dismissed staged action for ${decision.candidate.name}. No email dispatched.`);
      this.notifySubscribers();
    }
  }

  /**
   * Batch approve all pending staged decisions
   */
  public static async batchApproveAll(): Promise<{ approvedCount: number }> {
    const pending = [...this.stagedDecisions.filter(d => d.status === 'pending_review')];
    let count = 0;

    for (const d of pending) {
      const res = await this.approveStagedDecision(d.id);
      if (res.success) count++;
    }

    this.appendLog('reflection', `Batch approval complete: ${count} candidate decisions executed.`);
    return { approvedCount: count };
  }

  /**
   * Clear all telemetry logs
   */
  public static clearLogs(): void {
    this.logs = [];
    localStorage.removeItem(LOGS_STORAGE_KEY);
    this.notifySubscribers();
  }
}
