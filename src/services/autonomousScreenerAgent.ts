import { CandidateCaseFile, RoleSetup } from '../types';
import { DatabaseService } from './databaseService';

export interface AgentActionLog {
  candidateId: string;
  candidateName: string;
  previousStatus: CandidateCaseFile['reviewStatus'];
  newStatus: CandidateCaseFile['reviewStatus'];
  action: string;
  reasoning: string;
  matchScore: number;
  timestamp: string;
}

export interface AutonomousScreeningResult {
  totalEvaluated: number;
  promotedToInterview: number;
  needsReview: number;
  rejected: number;
  actionLogs: AgentActionLog[];
  updatedCandidates: CandidateCaseFile[];
  summary: string;
}

export class AutonomousScreenerAgent {
  /**
   * Autonomously screens the entire candidate pool against the active role blueprint,
   * takes decisive action on candidate stages, writes audit notes, and persists to the database.
   */
  public static async runAutonomousScreening(
    candidates: CandidateCaseFile[],
    role: RoleSetup,
    onProgress?: (step: string, current: number, total: number) => void
  ): Promise<AutonomousScreeningResult> {
    const actionLogs: AgentActionLog[] = [];
    const total = candidates.length;
    const now = new Date().toISOString();

    onProgress?.('Ingesting role blueprint & candidate embeddings...', 0, total);

    const updatedCandidates: CandidateCaseFile[] = [];

    for (let i = 0; i < candidates.length; i++) {
      const candidate = candidates[i];
      onProgress?.(`Evaluating ${candidate.name} against ${role.title}...`, i + 1, total);

      // Evaluate required skills coverage across matchedSkills and evidenceMap
      const missingRequired = role.mustHaveSkills.filter(req => {
        const reqLower = req.toLowerCase();
        const inSkills = candidate.matchedSkills.some(m => {
          const mLower = m.toLowerCase();
          if (mLower.includes(reqLower) || reqLower.includes(mLower)) return true;
          const tokens = mLower.split(/[\s/,-]+/).filter(t => t.length >= 3);
          return tokens.some(token => reqLower.includes(token));
        });
        if (inSkills) return false;

        const inEvidence = (candidate.evidenceMap || []).some(ev => {
          const evReqLower = ev.requirement.toLowerCase();
          return (evReqLower.includes(reqLower) || reqLower.includes(evReqLower)) &&
                 ev.status === 'Verified';
        });
        return !inEvidence;
      });

      let targetStatus: CandidateCaseFile['reviewStatus'] = candidate.reviewStatus;
      let actionReason = '';

      if (candidate.matchScore >= 80 && missingRequired.length === 0) {
        targetStatus = 'Interview Ready';
        actionReason = `Autonomous Agent: Exceptional match (${candidate.matchScore}%). Verified all ${role.mustHaveSkills.length} must-have criteria. Auto-promoted to Interview Ready.`;
      } else if (candidate.matchScore >= 65 && missingRequired.length <= 1) {
        targetStatus = 'Needs Review';
        actionReason = `Autonomous Agent: Moderate fit (${candidate.matchScore}%). Flagged verification item: ${missingRequired[0] || 'Domain alignment'}. Held for team review.`;
      } else {
        targetStatus = 'Rejected';
        actionReason = `Autonomous Agent: High gap risk (${candidate.matchScore}%). Missing critical must-have criteria (${missingRequired.join(', ') || 'Insufficient technical depth'}). Screened out.`;
      }

      const statusChanged = targetStatus !== candidate.reviewStatus;

      const agentAuditEntry = {
        id: `audit-agent-${Date.now()}-${i}`,
        action: `Autonomous Agent Decision: ${targetStatus}`,
        timestamp: 'Just now',
        note: actionReason
      };

      const agentTeamNote = {
        id: `note-agent-${Date.now()}-${i}`,
        author: 'Autonomous Screener Agent',
        text: actionReason,
        timestamp: 'Just now'
      };

      const updated: CandidateCaseFile = {
        ...candidate,
        reviewStatus: targetStatus,
        teamNotes: [agentTeamNote, ...candidate.teamNotes],
        auditTrail: [agentAuditEntry, ...candidate.auditTrail],
        updatedAt: now
      };

      actionLogs.push({
        candidateId: candidate.id,
        candidateName: candidate.name,
        previousStatus: candidate.reviewStatus,
        newStatus: targetStatus,
        action: statusChanged ? `Status updated: ${candidate.reviewStatus} → ${targetStatus}` : `Status confirmed: ${targetStatus}`,
        reasoning: actionReason,
        matchScore: candidate.matchScore,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });

      updatedCandidates.push(updated);
    }

    // Sort by match score descending
    updatedCandidates.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

    // Persist all updated candidates to database
    onProgress?.('Committing autonomous decisions to vector database...', total, total);
    await DatabaseService.saveCandidates(updatedCandidates).catch(e => console.warn('Agent DB commit notice:', e));

    const promotedCount = actionLogs.filter(l => l.newStatus === 'Interview Ready').length;
    const needsReviewCount = actionLogs.filter(l => l.newStatus === 'Needs Review').length;
    const rejectedCount = actionLogs.filter(l => l.newStatus === 'Rejected').length;

    const summary = `Autonomous Screening Complete: Evaluated ${total} candidate${total === 1 ? '' : 's'}. Advanced ${promotedCount} to Interview Ready, held ${needsReviewCount} for recruiter review, and screened out ${rejectedCount} based on must-have role requirements.`;

    return {
      totalEvaluated: total,
      promotedToInterview: promotedCount,
      needsReview: needsReviewCount,
      rejected: rejectedCount,
      actionLogs,
      updatedCandidates,
      summary
    };
  }
}
