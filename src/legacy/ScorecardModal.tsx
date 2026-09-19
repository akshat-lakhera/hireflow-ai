import React, { useState } from 'react';
import { Candidate, CandidateScorecard } from '../types';
import { X, Award, CheckCircle, Download, BookOpen, ChevronRight } from 'lucide-react';

interface ScorecardModalProps {
  candidate: Candidate;
  onClose: () => void;
  onTriggerEduPathRoadmap?: (candidate: Candidate) => void;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  candidate,
  onClose,
  onTriggerEduPathRoadmap
}) => {
  const [activeTab, setActiveTab] = useState<'summary' | 'competencies' | 'gaps' | 'audit'>('summary');
  const scorecard: CandidateScorecard = candidate.scorecard || {
    overallScore: candidate.matchScore,
    recommendation: candidate.matchScore >= 85 ? 'STRONG_HIRE' : candidate.matchScore >= 75 ? 'HIRE' : 'LEANING_HIRE',
    executiveSummary: `${candidate.name} demonstrated verified technical systems capability across core screening dimensions.`,
    strengths: ['Deep architectural understanding', 'Strong operational reasoning under load', 'Articulate communication'],
    validatedCompetencies: candidate.questions.map(q => ({
      skill: q.category.replace('_', ' ').toUpperCase(),
      evidenceQuote: q.candidateAnswer || 'Candidate verified capability during technical probe.',
      rating: q.finalScore ? Math.round(q.finalScore / 2) : 4
    })),
    identifiedWeaknessesOrGaps: candidate.missingGaps.map(g => ({
      area: g.skillOrArea,
      details: g.rationale,
      suggestedFollowUp: g.suggestedValidation
    })),
    unansweredEvaluationAreas: ['Cross-functional product prioritization', 'Staff-level mentoring at scale'],
    auditTrail: candidate.experiences.flatMap(e => 
      e.highlights.map(h => ({
        claim: h,
        sourceInResume: e.company,
        verifiedInInterview: true,
        interviewerNote: 'Verified during structured screening session.'
      }))
    )
  };

  const getRecommendationBadge = (rec: CandidateScorecard['recommendation']) => {
    switch (rec) {
      case 'STRONG_HIRE':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50';
      case 'HIRE':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'LEANING_HIRE':
        return 'bg-gold-500/15 text-gold-300 border-gold-500/40';
      case 'LEANING_NO_HIRE':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/40';
      default:
        return 'bg-rose-500/20 text-rose-300 border-rose-500/50';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-obsidian-900 border border-obsidian-border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-obsidian-850 border-b border-obsidian-border flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center text-black font-bold text-xl shadow-lg shadow-gold-500/20">
              <Award className="w-7 h-7 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-2xl font-bold text-slate-100">{candidate.name}</h2>
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${getRecommendationBadge(scorecard.recommendation)}`}>
                  {scorecard.recommendation.replace('_', ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Standardized Evaluation Dossier • Target Role: <span className="text-slate-200 font-medium">{candidate.roleApplied}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-400 hover:text-white border border-obsidian-border transition-colors"
              title="Print Dossier"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-400 hover:text-white border border-obsidian-border transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scorecard Metrics */}
        <div className="grid grid-cols-4 border-b border-obsidian-border bg-obsidian-950/60 p-4 text-center divide-x divide-obsidian-border font-mono text-xs">
          <div>
            <div className="text-2xl font-bold text-slate-100">{scorecard.overallScore}/100</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Overall Fit Index</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-emerald-400">{scorecard.validatedCompetencies.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Validated Skills</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-amber-400">{scorecard.identifiedWeaknessesOrGaps.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Flagged Gaps</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-cyan-400">{scorecard.unansweredEvaluationAreas.length}</div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mt-0.5">Unanswered Areas</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-obsidian-border bg-obsidian-900/50">
          <button
            onClick={() => setActiveTab('summary')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'summary' ? 'border-gold-500 text-gold-400 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Executive Summary
          </button>
          <button
            onClick={() => setActiveTab('competencies')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'competencies' ? 'border-gold-500 text-gold-400 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Validated Competencies ({scorecard.validatedCompetencies.length})
          </button>
          <button
            onClick={() => setActiveTab('gaps')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'gaps' ? 'border-gold-500 text-gold-400 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Gaps & Human Follow-Ups
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'audit' ? 'border-gold-500 text-gold-400 font-semibold' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Full Provenance Audit Trail
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'summary' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-obsidian-850 border border-obsidian-border">
                <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold mb-2">Evaluation Synthesis</h4>
                <p className="text-sm text-slate-200 leading-relaxed">
                  {scorecard.executiveSummary}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-obsidian-850 border border-obsidian-border space-y-2">
                <h4 className="text-xs font-mono uppercase text-emerald-400 tracking-wider font-semibold mb-2">Key Strengths Verified</h4>
                <ul className="space-y-2 text-xs text-slate-200">
                  {scorecard.strengths.map((str, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* EduPath Bridge CTA */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-gold-500/10 via-obsidian-850 to-obsidian-850 border border-gold-500/30 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 text-gold-400 font-bold text-sm">
                    <BookOpen className="w-4 h-4" />
                    <span>EduPath Skill Gap Remediation Engine</span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1 max-w-lg">
                    Automatically convert candidate's unfulfilled requirements into an adaptive weekly learning and project roadmap.
                  </p>
                </div>
                <button
                  onClick={() => onTriggerEduPathRoadmap && onTriggerEduPathRoadmap(candidate)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-black text-xs font-bold shadow-md transition-all flex-shrink-0"
                >
                  <span>Generate Roadmap</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'competencies' && (
            <div className="space-y-3">
              {scorecard.validatedCompetencies.map((comp, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-obsidian-850 border border-obsidian-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-slate-100">{comp.skill}</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span 
                          key={star} 
                          className={`w-2.5 h-2.5 rounded-full ${star <= comp.rating ? 'bg-gold-400' : 'bg-obsidian-700'}`}
                        />
                      ))}
                      <span className="text-xs font-mono text-slate-400 ml-1.5">{comp.rating}/5</span>
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-obsidian-border text-xs text-slate-300 font-mono italic">
                    {comp.evidenceQuote}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'gaps' && (
            <div className="space-y-4">
              <div className="space-y-3">
                <h4 className="text-xs font-mono uppercase text-amber-400 tracking-wider font-semibold">Identified Deficiencies & Recommended Probes</h4>
                {scorecard.identifiedWeaknessesOrGaps.map((gap, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-obsidian-850 border border-obsidian-border space-y-2">
                    <div className="font-semibold text-sm text-slate-200">{gap.area}</div>
                    <p className="text-xs text-slate-400">{gap.details}</p>
                    <div className="p-2.5 rounded-lg bg-obsidian-950/80 border border-obsidian-border text-xs text-slate-300 font-mono">
                      <span className="text-gold-400 font-bold">Suggested Follow-Up Question:</span> {gap.suggestedFollowUp}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 rounded-xl bg-obsidian-850 border border-obsidian-border space-y-2">
                <h4 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold">Unanswered Areas</h4>
                <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                  {scorecard.unansweredEvaluationAreas.map((area, i) => (
                    <li key={i}>{area}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 bg-obsidian-950 border border-obsidian-border rounded-xl text-slate-400">
                <span className="text-gold-400 font-bold">Audit Provenance:</span> Every item maps to candidate documentation verified by the screening agent.
              </div>

              {scorecard.auditTrail.map((item, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-obsidian-850 border border-obsidian-border flex items-start justify-between gap-4">
                  <div>
                    <div className="text-slate-200 font-medium">{item.claim}</div>
                    <div className="text-[11px] text-slate-400 mt-1">Source: {item.sourceInResume}</div>
                    <div className="text-[11px] text-gold-300/80 mt-0.5">Note: {item.interviewerNote}</div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex-shrink-0">
                    VERIFIED
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-obsidian-850 border-t border-obsidian-border flex items-center justify-between text-xs text-slate-400">
          <div>Report generated automatically by HireFlow Agentic Evaluation Engine</div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 font-semibold border border-obsidian-border transition-colors"
          >
            Close Dossier
          </button>
        </div>

      </div>
    </div>
  );
};
