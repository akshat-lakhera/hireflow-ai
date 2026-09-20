import React, { useState } from 'react';
import { CandidateCaseFile, ReviewMode, EvidenceItem } from '../types';
import { 
  Briefcase, 
  MapPin, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Sparkles, 
  Copy, 
  Check, 
  ExternalLink, 
  GraduationCap, 
  Clock, 
  HelpCircle,
  Volume2,
  Send,
  Download,
  Search,
  Layers,
  ShieldAlert
} from 'lucide-react';
import { AudioService } from '../services/audioService';

interface CandidateExecutiveDossierProps {
  candidate: CandidateCaseFile;
  reviewMode: ReviewMode;
  onOpenInterviewKit: (c: CandidateCaseFile) => void;
  onUpdateStatus: (candidateId: string, status: CandidateCaseFile['reviewStatus']) => void;
  onAddNote: (candidateId: string, noteText: string) => void;
  onReevaluateWithAi?: () => void;
  isAiEvaluating?: boolean;
  onOpenResumeViewer?: () => void;
}

export const CandidateExecutiveDossier: React.FC<CandidateExecutiveDossierProps> = ({
  candidate,
  reviewMode,
  onOpenInterviewKit,
  onUpdateStatus,
  onAddNote,
  onReevaluateWithAi,
  isAiEvaluating,
  onOpenResumeViewer
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'evidence' | 'probes' | 'notes' | 'resume'>('overview');
  const [resumeViewMode, setResumeViewMode] = useState<'pdf' | 'text'>(candidate.pdfDataUrl ? 'pdf' : 'text');
  const [resumeSearchQuery, setResumeSearchQuery] = useState('');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [playingTTS, setPlayingTTS] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 1800);
  };

  const handleToggleTTS = (id: string, text: string) => {
    if (playingTTS === id) {
      AudioService.cancelSpeech();
      setPlayingTTS(null);
    } else {
      setPlayingTTS(id);
      AudioService.speak(text, () => setPlayingTTS(null));
    }
  };

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (noteInput.trim()) {
      onAddNote(candidate.id, noteInput.trim());
      setNoteInput('');
    }
  };

  const getStatusBadge = (status: EvidenceItem['status']) => {
    switch (status) {
      case 'Verified':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Verified</span>
          </span>
        );
      case 'Needs validation':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Needs validation</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>Missing</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* 1. Header Section: Profile, Title, Contact, Fit Score */}
      <div className="p-6 border-b border-slate-200 bg-white">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 font-bold text-lg shrink-0 shadow-sm">
              {candidate.initials}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {candidate.name}
                </h2>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                  candidate.fitBadge === 'Strong fit'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : candidate.fitBadge === 'Moderate fit'
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  {candidate.fitBadge} ({candidate.matchScore}%)
                </span>
              </div>

              <div className="text-sm font-medium text-slate-600 mt-1">
                {candidate.currentRole}
              </div>

              {/* Contact and Links (Clickable Email & Phone) */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5 text-xs text-slate-500">
                {candidate.email && (
                  <a
                    href={`mailto:${candidate.email}`}
                    className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 hover:underline transition-colors"
                    title="Send email to candidate"
                  >
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.email}</span>
                  </a>
                )}
                {candidate.phone && (
                  <a
                    href={`tel:${candidate.phone}`}
                    className="flex items-center gap-1 text-slate-600 hover:text-indigo-600 hover:underline transition-colors"
                    title="Call candidate phone"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.phone}</span>
                  </a>
                )}
                {candidate.location && candidate.location !== 'Not specified' && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400" />
                    {candidate.location}
                  </span>
                )}
                {candidate.education && candidate.education[0] && (
                  <span className="flex items-center gap-1 truncate max-w-xs">
                    <GraduationCap className="w-3.5 h-3.5 text-slate-400" />
                    <span className="truncate">{candidate.education[0].school}</span>
                  </span>
                )}
                {candidate.projects && candidate.projects.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                    <span>{candidate.projects.length} Documented Projects</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Status Dropdown & Actions */}
          <div className="flex items-center gap-2 self-start shrink-0">
            {/* View Original Resume Button */}
            <button
              onClick={() => {
                if (onOpenResumeViewer) {
                  onOpenResumeViewer();
                } else {
                  setActiveTab('resume');
                }
              }}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-800 hover:text-indigo-600 hover:border-indigo-300 hover:bg-indigo-50/50 flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Inspect verbatim resume text or uploaded PDF document"
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>View Resume</span>
              {candidate.pdfDataUrl && (
                <span className="bg-indigo-100 text-indigo-700 px-1 py-0.2 rounded text-[9px] font-mono font-bold">
                  PDF
                </span>
              )}
            </button>

            {onReevaluateWithAi && (
              <button
                onClick={onReevaluateWithAi}
                disabled={isAiEvaluating}
                className="px-3 py-1.5 text-xs font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                title="Deep AI analysis with Gemini / OpenAI / Groq"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isAiEvaluating ? 'animate-spin' : ''}`} />
                <span>{isAiEvaluating ? 'Analyzing...' : 'AI Deep Analysis'}</span>
              </button>
            )}

            <select
              value={candidate.reviewStatus}
              onChange={(e) => onUpdateStatus(candidate.id, e.target.value as any)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="Interview Ready">Interview Ready</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Passed Screen">Passed Screen</option>
              <option value="Offer Extended">Offer Extended</option>
              <option value="Rejected">Rejected</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

        </div>

        {/* Adversarial Prompt-Injection Quarantined Banner */}
        {candidate.adversarialShieldTriggered && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-left animate-in fade-in duration-300">
            <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-300 flex items-center justify-center text-rose-700 shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wide">
                  Adversarial Prompt-Injection Quarantined
                </h4>
                <span className="text-[10px] font-mono bg-rose-200/80 text-rose-800 px-1.5 py-0.5 rounded font-bold">
                  SECURITY SHIELD ACTIVE
                </span>
              </div>
              <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                {candidate.securityAuditNote || 'Candidate submitted resume with covert instruction override directives. The attack was quarantined and neutralized. Candidate profile has been flagged for recruiter compliance review.'}
              </p>
            </div>
          </div>
        )}

        {/* 2. Structured Tabs System - Clean border alignment */}
        <div className="flex items-center border-b border-slate-200 mt-5 pt-1 space-x-4 sm:space-x-6 text-xs font-medium whitespace-nowrap overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`pb-2.5 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Experience
          </button>
          <button
            onClick={() => setActiveTab('evidence')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'evidence'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Verified Evidence Map</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {candidate.evidenceMap.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('probes')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'probes'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Interview Probes</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {candidate.interviewQuestions.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'notes'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Notes & Activity</span>
            <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded-full text-[10px]">
              {candidate.teamNotes.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('resume')}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'resume'
                ? 'border-indigo-600 text-indigo-600 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Original Resume</span>
            {candidate.pdfDataUrl && (
              <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-1.5 py-0.2 rounded text-[10px] font-mono">
                PDF
              </span>
            )}
          </button>
        </div>

      </div>

      {/* 3. Tab Content Area with Breathing Room */}
      <div className="p-6 flex-1 overflow-y-auto space-y-6">
        
        {/* TAB 1: OVERVIEW & EXPERIENCE */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Executive Summary: Sleek boundary line layout (No AI-slop box) */}
            {candidate.resumeSummary && (
              <div className="pb-6 border-b border-slate-200/80 space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Executive Summary
                  </h4>
                </div>
                <p className="text-sm text-slate-800 leading-relaxed font-sans pl-3.5 border-l-2 border-indigo-400">
                  {candidate.resumeSummary}
                </p>
              </div>
            )}

            {/* Documented Projects: Refined boundary section without bulky cards */}
            {candidate.projects && candidate.projects.length > 0 && (
              <div className="pb-6 border-b border-slate-200/80 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                      Documented Projects & Systems ({candidate.projects.length})
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">Extracted verbatim</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {candidate.projects.map((proj, idx) => (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                      <div className="flex items-baseline justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <h5 className="text-sm font-bold text-slate-900">
                            {proj.name}
                          </h5>
                          {proj.technologies && (
                            <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50/80 border border-indigo-100 px-2 py-0.5 rounded">
                              {proj.technologies}
                            </span>
                          )}
                        </div>
                        {proj.link && (
                          <a
                            href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-indigo-600 hover:underline flex items-center gap-1 font-mono"
                          >
                            <span>{proj.link}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>

                      {proj.highlights && proj.highlights.length > 0 && (
                        <ul className="space-y-1 text-xs text-slate-600 pl-3 border-l border-slate-200">
                          {proj.highlights.map((hl, hIdx) => (
                            <li key={hIdx} className="leading-relaxed">
                              {hl}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Work History: Sleek timeline boundary */}
            {candidate.experiences && candidate.experiences.length > 0 && (
              <div className="pb-6 border-b border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Work History ({candidate.experiences.length})
                  </h4>
                </div>
                <div className="divide-y divide-slate-100">
                  {candidate.experiences.map((exp, idx) => (
                    <div key={idx} className="py-3.5 first:pt-0 last:pb-0 space-y-1.5">
                      <div className="flex items-baseline justify-between">
                        <h5 className="text-sm font-bold text-slate-900">{exp.role}</h5>
                        <span className="text-xs font-mono text-slate-500">{exp.duration}</span>
                      </div>
                      <div className="text-xs font-medium text-slate-600">{exp.company}</div>
                      {exp.highlights && exp.highlights.length > 0 && (
                        <ul className="space-y-1 mt-1 text-xs text-slate-600 pl-3 border-l border-slate-200">
                          {exp.highlights.map((hl, hIdx) => (
                            <li key={hIdx} className="leading-relaxed">
                              {hl}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education & Credentials: Minimalist clean metadata */}
            {candidate.education && candidate.education.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                  <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono">
                    Education & Credentials
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {candidate.education.map((edu, idx) => (
                    <div key={idx} className="py-2 pl-3 border-l-2 border-slate-200 text-xs space-y-0.5">
                      <div className="font-semibold text-slate-900">{edu.degree}</div>
                      <div className="text-slate-600">{edu.school}</div>
                      <div className="text-slate-400 font-mono text-[11px]">{edu.year}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: VERIFIED EVIDENCE MAP TABLE */}
        {activeTab === 'evidence' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Role Requirement Evaluation Matrix
                </h4>
                <p className="text-xs text-slate-500">
                  Evidence cited directly from candidate documents with confidence ratings
                </p>
              </div>
            </div>

            {/* Clean Enterprise Evidence Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-xl shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                    <th className="py-3 px-4 w-1/4">Requirement Name</th>
                    <th className="py-3 px-3 w-1/6">Status & Confidence</th>
                    <th className="py-3 px-4 w-1/4">Source Evidence</th>
                    <th className="py-3 px-4">Direct Citation Snippet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {candidate.evidenceMap.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Requirement */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 align-top">
                        {ev.requirement}
                      </td>

                      {/* Status / Confidence */}
                      <td className="py-3.5 px-3 align-top space-y-1">
                        <div>{getStatusBadge(ev.status)}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Confidence: {ev.confidence}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4 text-slate-600 align-top font-medium">
                        {ev.evidenceSource}
                      </td>

                      {/* Snippet */}
                      <td className="py-3.5 px-4 text-slate-700 align-top leading-relaxed">
                        <div className="bg-slate-50 p-2 rounded border border-slate-200/60 font-mono text-[11px] text-slate-800">
                          "{ev.snippet}"
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: INTERVIEW PROBES */}
        {activeTab === 'probes' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Targeted Interview Questions & Evaluation Rubric
                </h4>
                <p className="text-xs text-slate-500">
                  Engineered probes targeting qualifications, system design ownership, and verification gaps
                </p>
              </div>
              <button
                onClick={() => onOpenInterviewKit(candidate)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
              >
                Launch Interview Kit
              </button>
            </div>

            <div className="space-y-4">
              {candidate.interviewQuestions.map((q) => (
                <div
                  key={q.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                          {q.category}
                        </span>
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                          q.severityTag === 'Deep dive'
                            ? 'bg-purple-50 text-purple-700 border-purple-200'
                            : q.severityTag === 'Validate'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {q.severityTag}
                        </span>
                      </div>
                      <h5 className="text-sm font-bold text-slate-900 leading-snug">
                        {q.questionText}
                      </h5>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleToggleTTS(q.id, q.questionText)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded hover:bg-slate-100"
                        title="Read aloud"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleCopy(q.questionText, q.id)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded hover:bg-slate-100"
                        title="Copy question"
                      >
                        {copiedText === q.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* What to look for in response */}
                  <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-950 space-y-1">
                    <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
                      <span>What to Look For in Candidate's Answer:</span>
                    </div>
                    <p className="leading-relaxed pl-5">
                      {q.followUpProbe}
                    </p>
                  </div>

                  {/* Candidate recorded answer (if any) */}
                  {q.candidateAnswer && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                      <div className="font-semibold text-slate-700">Recorded Answer / Notes:</div>
                      <p className="text-slate-800">{q.candidateAnswer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: NOTES & ACTIVITY */}
        {activeTab === 'notes' && (
          <div className="space-y-5">
            {/* Add note */}
            <form onSubmit={handleNoteSubmit} className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Add Interview / Screening Note
              </label>
              <textarea
                rows={3}
                placeholder="Type screening notes, strengths, concerns, or follow-up items..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!noteInput.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:pointer-events-none rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Note</span>
                </button>
              </div>
            </form>

            {/* Notes List */}
            <div className="space-y-3">
              <h4 className="text-xs font-semibold text-slate-900 uppercase tracking-wide">
                Team Notes History ({candidate.teamNotes.length})
              </h4>
              {candidate.teamNotes.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 text-center">
                  No notes recorded yet. Add the first screening note above.
                </div>
              ) : (
                candidate.teamNotes.map((n) => (
                  <div key={n.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-500">
                      <span className="font-semibold text-slate-800">{n.author}</span>
                      <span className="font-mono text-[11px]">{n.timestamp}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{n.text}</p>
                  </div>
                ))
              )}
            </div>

            {/* Audit Trail */}
            {candidate.auditTrail && candidate.auditTrail.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-slate-100">
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Candidate Audit Trail
                </h4>
                <div className="space-y-1.5">
                  {candidate.auditTrail.map((at) => (
                    <div key={at.id} className="text-[11px] text-slate-500 flex items-center gap-2">
                      <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-700">{at.action}</span>
                      <span>•</span>
                      <span>{at.timestamp}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: ORIGINAL RESUME DOCUMENT */}
        {activeTab === 'resume' && (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Original Resume Document</h4>
                  <p className="text-[11px] text-slate-500">
                    {candidate.pdfDataUrl ? 'PDF Document Ingest' : 'Direct Text Extraction'} • {(candidate.rawText || candidate.resumeSummary).split(/\s+/).filter(Boolean).length} words
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {candidate.pdfDataUrl && (
                  <div className="bg-white p-0.5 rounded-lg border border-slate-200 flex items-center gap-1 text-xs">
                    <button
                      onClick={() => setResumeViewMode('pdf')}
                      className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                        resumeViewMode === 'pdf' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      PDF Preview
                    </button>
                    <button
                      onClick={() => setResumeViewMode('text')}
                      className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                        resumeViewMode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Parsed Text
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleCopy(candidate.rawText || candidate.resumeSummary, 'resume-full')}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Copy full raw resume text"
                >
                  {copiedText === 'resume-full' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copiedText === 'resume-full' ? 'Copied' : 'Copy Text'}</span>
                </button>

                {candidate.pdfDataUrl && (
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = candidate.pdfDataUrl!;
                      a.download = `${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`;
                      a.click();
                    }}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    title="Download original PDF document"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                )}
              </div>
            </div>

            {/* Resume Body */}
            {resumeViewMode === 'pdf' && candidate.pdfDataUrl ? (
              <div className="w-full h-[640px] rounded-xl border border-slate-200 overflow-hidden shadow-xs bg-slate-900">
                <iframe
                  src={candidate.pdfDataUrl}
                  title={`${candidate.name} Resume PDF`}
                  className="w-full h-full border-0"
                />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search / Filter in Resume Text */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search keywords within resume text (e.g. Kafka, Rust, Lead, Kubernetes)..."
                    value={resumeSearchQuery}
                    onChange={(e) => setResumeSearchQuery(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {resumeSearchQuery && (
                    <button
                      onClick={() => setResumeSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Verbatim Document Paper Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-1">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100 text-xs font-semibold text-slate-700">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Verbatim Extracted Resume Stream</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      UTF-8 Decoded • Authentic Pipeline Data
                    </span>
                  </div>

                  {(candidate.rawText || candidate.resumeSummary) ? (
                    <div className="space-y-1 font-mono text-xs">
                      {(candidate.rawText || candidate.resumeSummary)
                        .split('\n')
                        .filter(l => l.trim().length > 0)
                        .map((line, idx) => {
                          if (!resumeSearchQuery.trim()) {
                            return (
                              <div key={idx} className="flex items-start gap-3 py-0.5 hover:bg-slate-50 px-2 rounded">
                                <span className="select-none text-slate-300 w-8 text-right shrink-0">{idx + 1}</span>
                                <span className="text-slate-800 leading-relaxed whitespace-pre-wrap">{line}</span>
                              </div>
                            );
                          }
                          const regex = new RegExp(`(${resumeSearchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
                          const parts = line.split(regex);
                          const hasMatch = regex.test(line);
                          return (
                            <div key={idx} className={`flex items-start gap-3 py-0.5 px-2 rounded ${hasMatch ? 'bg-amber-50 text-amber-950 font-medium' : 'hover:bg-slate-50 text-slate-800'}`}>
                              <span className="select-none text-slate-300 w-8 text-right shrink-0">{idx + 1}</span>
                              <span className="leading-relaxed whitespace-pre-wrap">
                                {parts.map((part, pIdx) => part.toLowerCase() === resumeSearchQuery.toLowerCase() ? (
                                  <mark key={pIdx} className="bg-amber-300 text-slate-900 px-0.5 rounded font-bold">{part}</mark>
                                ) : part)}
                              </span>
                            </div>
                          );
                        })}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 py-8 text-center">
                      No raw text recorded for this candidate.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
};
