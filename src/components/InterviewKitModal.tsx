import React, { useState } from 'react';
import { CandidateCaseFile, InterviewKitQuestion, QuestionSeverity } from '../types';
import { AudioService } from '../services/audioService';
import { 
  X, 
  MessageSquare, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  AlertTriangle, 
  ShieldAlert, 
  CheckCircle2, 
  ChevronRight, 
  GitFork, 
  Save,
  Check
} from 'lucide-react';

interface InterviewKitModalProps {
  candidate: CandidateCaseFile;
  onClose: () => void;
  onUpdateQuestionAnswer: (candidateId: string, questionId: string, answerText: string) => void;
  onUpdateStatus: (candidateId: string, status: CandidateCaseFile['reviewStatus']) => void;
}

export const InterviewKitModal: React.FC<InterviewKitModalProps> = ({
  candidate,
  onClose,
  onUpdateQuestionAnswer,
  onUpdateStatus
}) => {
  const [activeQuestionId, setActiveQuestionId] = useState<string>(
    candidate.interviewQuestions[0]?.id || ''
  );
  
  const activeQuestion = candidate.interviewQuestions.find(q => q.id === activeQuestionId) || candidate.interviewQuestions[0];
  
  const [candidateAnswer, setCandidateAnswer] = useState<string>(
    activeQuestion?.candidateAnswer || ''
  );

  // Audio / Speech State
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingTTS, setIsPlayingTTS] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // When user switches question
  const handleSelectQuestion = (q: InterviewKitQuestion) => {
    setActiveQuestionId(q.id);
    setCandidateAnswer(q.candidateAnswer || '');
    setSavedSuccess(false);
    AudioService.cancelSpeech();
    setIsPlayingTTS(false);
  };

  // Toggle Live Speech-to-text
  const toggleRecording = () => {
    if (isRecording) {
      AudioService.stopListening();
      setIsRecording(false);
    } else {
      const started = AudioService.startListening(
        (transcript, _isFinal) => {
          setCandidateAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
        },
        (error) => {
          console.warn('Speech recognition warning:', error);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
      if (started) {
        setIsRecording(true);
      }
    }
  };

  // Text to Speech
  const toggleTTS = () => {
    if (isPlayingTTS) {
      AudioService.cancelSpeech();
      setIsPlayingTTS(false);
    } else if (activeQuestion) {
      setIsPlayingTTS(true);
      AudioService.speak(`${activeQuestion.questionText}. Follow-up probe: ${activeQuestion.followUpProbe}`, () => {
        setIsPlayingTTS(false);
      });
    }
  };

  // Save answer
  const handleSaveAnswer = () => {
    if (activeQuestion) {
      onUpdateQuestionAnswer(candidate.id, activeQuestion.id, candidateAnswer);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    }
  };

  const getSeverityStyle = (severity: QuestionSeverity) => {
    switch (severity) {
      case 'Deep dive':
        return 'bg-accent-blue/15 text-accent-blue border-accent-blue/30';
      case 'Validate':
        return 'bg-accent-amber/15 text-accent-amber border-accent-amber/30';
      case 'Clarify':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto font-sans">
      <div className="case-card rounded-2xl w-full max-w-6xl max-h-[94vh] flex flex-col shadow-2xl border border-case-borderLight animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Top Strip: Candidate Summary */}
        <div className="p-4 bg-case-bgAlt border-b border-case-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-case-surface border border-case-border flex items-center justify-center text-accent-blue font-mono font-bold text-sm">
              {candidate.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] text-accent-blue uppercase tracking-wider">
                  INTERVIEW INTELLIGENCE KIT
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-case-surfaceElevated border border-case-border text-slate-300">
                  {candidate.fitBadge}
                </span>
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {candidate.name}
                <span className="text-xs font-normal text-slate-400 font-mono">
                  ({candidate.currentRole})
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-case-surface px-3 py-1.5 rounded-xl border border-case-border flex items-center gap-2">
              <span className="text-slate-400">Match Score:</span>
              <span className="text-base font-bold text-accent-green">{candidate.matchScore}%</span>
            </div>
            <div className="bg-case-surface px-3 py-1.5 rounded-xl border border-case-border flex items-center gap-2">
              <span className="text-slate-400">Status:</span>
              <span className="text-accent-blue font-bold">{candidate.reviewStatus}</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg bg-case-surface hover:bg-case-surfaceLight border border-case-border flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body: 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-case-border bg-case-bg text-xs">
          
          {/* LEFT (4 cols): Suggested Questions List */}
          <div className="lg:col-span-4 p-5 overflow-y-auto space-y-3 bg-case-bgAlt/40">
            <div className="flex items-center justify-between font-mono text-[11px] text-slate-400 uppercase tracking-wider pb-1">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-accent-blue" />
                <span>Suggested Questions ({candidate.interviewQuestions.length})</span>
              </div>
            </div>

            <div className="space-y-2.5">
              {candidate.interviewQuestions.map((q, idx) => {
                const isSelected = q.id === activeQuestion?.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-2 ${
                      isSelected
                        ? 'bg-case-surfaceElevated border-accent-blue ring-1 ring-accent-blue/50'
                        : 'bg-case-surface border-case-border hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 uppercase">
                        Question #{idx + 1}
                      </span>
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${getSeverityStyle(q.severityTag)}`}>
                        {q.severityTag}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-accent-blue truncate">
                      {q.targetRequirement}
                    </div>

                    <p className={`text-[11px] leading-snug line-clamp-2 ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                      "{q.questionText}"
                    </p>

                    {q.candidateAnswer && (
                      <div className="text-[10px] font-mono text-accent-green flex items-center gap-1 pt-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Answer recorded</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* MIDDLE (5 cols): Follow-Up Tree & Interactive Answer Space */}
          <div className="lg:col-span-5 p-5 overflow-y-auto space-y-5">
            {activeQuestion ? (
              <>
                {/* Active Question Focus Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                      Target Requirement: <strong className="text-white">{activeQuestion.targetRequirement}</strong>
                    </span>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-semibold border ${getSeverityStyle(activeQuestion.severityTag)}`}>
                      {activeQuestion.severityTag}
                    </span>
                  </div>

                  {/* Primary Question Box */}
                  <div className="p-4 rounded-xl bg-case-surface border border-case-border space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-white leading-relaxed">
                        "{activeQuestion.questionText}"
                      </p>
                      <button
                        onClick={toggleTTS}
                        className={`p-2 rounded-lg border transition-colors flex-shrink-0 ${
                          isPlayingTTS 
                            ? 'bg-accent-blue text-black border-accent-blue' 
                            : 'bg-case-bg border-case-border text-slate-300 hover:text-white'
                        }`}
                        title="Read question aloud via Speech Synthesis"
                      >
                        {isPlayingTTS ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Follow-up Tree Branch */}
                <div className="p-4 rounded-xl bg-case-surfaceElevated border border-case-border space-y-2 relative pl-6">
                  <div className="absolute left-2.5 top-5 bottom-5 w-0.5 bg-accent-blue/40" />
                  <div className="flex items-center gap-1.5 font-mono text-[11px] text-accent-blue">
                    <GitFork className="w-3.5 h-3.5 rotate-180" />
                    <span>FOLLOW-UP PROBE TREE</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono">
                    {activeQuestion.followUpProbe}
                  </p>
                </div>

                {/* Candidate Answer Recording Area */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                      Candidate Response / Evaluator Notes
                    </span>

                    <button
                      onClick={toggleRecording}
                      className={`px-2.5 py-1 rounded-lg border font-mono text-[11px] flex items-center gap-1.5 transition-colors ${
                        isRecording 
                          ? 'bg-accent-red/20 text-accent-red border-accent-red animate-pulse' 
                          : 'bg-case-surface hover:bg-case-surfaceLight border-case-border text-slate-300'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Stop Mic</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 text-accent-blue" />
                          <span>Record via Mic</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={candidateAnswer}
                    onChange={e => setCandidateAnswer(e.target.value)}
                    placeholder="Transcribe or type candidate answer, tradeoffs explained, and depth demonstrated..."
                    className="w-full bg-case-bg border border-case-border rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-accent-blue resize-none"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {candidateAnswer ? `${candidateAnswer.length} chars` : 'No response logged'}
                    </span>
                    <button
                      onClick={handleSaveAnswer}
                      className="px-4 py-2 rounded-xl bg-accent-blue hover:bg-accent-blueHover text-black font-semibold text-xs flex items-center gap-1.5 transition-colors shadow"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Saved</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-3.5 h-3.5" />
                          <span>Save to Case File</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Select a question on the left to begin probing.
              </div>
            )}
          </div>

          {/* RIGHT (3 cols): Concern List & Evidence Gaps */}
          <div className="lg:col-span-3 p-5 overflow-y-auto space-y-5 bg-case-bgAlt/30">
            
            {/* Concern List for Active Question */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-accent-amber uppercase tracking-wider">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Concern Focus</span>
              </div>
              <div className="p-3 rounded-xl bg-case-surface border border-case-border space-y-1">
                <div className="font-bold text-white text-xs">Evaluator Warning</div>
                <p className="text-[11px] text-slate-300 leading-snug">
                  {activeQuestion?.concernNote || 'Verify candidate demonstrates hands-on production depth rather than standard tutorials.'}
                </p>
              </div>
            </div>

            {/* Missing Evidence Gaps */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                <ShieldAlert className="w-3.5 h-3.5 text-accent-red" />
                <span>Unverified Gaps on File</span>
              </div>
              <div className="space-y-2">
                {candidate.evidenceMap
                  .filter(ev => ev.status !== 'Verified')
                  .map((ev, i) => (
                    <div key={i} className="p-2.5 rounded-lg bg-case-surface border border-case-border space-y-1 text-[11px]">
                      <div className="font-semibold text-white">{ev.requirement}</div>
                      <div className="text-slate-400 text-[10px] font-mono">{ev.snippet}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Next Action Outcome */}
            <div className="space-y-2.5 pt-2 border-t border-case-border">
              <div className="font-mono text-[11px] text-slate-400 uppercase tracking-wider">
                Interview Verdict
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => onUpdateStatus(candidate.id, 'Interview Ready')}
                  className="w-full py-2 px-3 rounded-xl bg-accent-green/20 hover:bg-accent-green/30 text-accent-green border border-accent-green/40 font-semibold text-xs transition-colors text-left flex items-center justify-between"
                >
                  <span>Pass Technical Probe</span>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onUpdateStatus(candidate.id, 'Needs Validation')}
                  className="w-full py-2 px-3 rounded-xl bg-accent-amber/20 hover:bg-accent-amber/30 text-accent-amber border border-accent-amber/40 font-semibold text-xs transition-colors text-left flex items-center justify-between"
                >
                  <span>Needs Follow-up Session</span>
                  <AlertTriangle className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onUpdateStatus(candidate.id, 'Decision Pending')}
                  className="w-full py-2 px-3 rounded-xl bg-case-surface hover:bg-case-surfaceLight text-slate-300 border border-case-border text-xs transition-colors text-left"
                >
                  Mark Decision Pending
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
