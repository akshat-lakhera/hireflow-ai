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
  Check,
  Sparkles
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

  const handleSelectQuestion = (q: InterviewKitQuestion) => {
    setActiveQuestionId(q.id);
    setCandidateAnswer(q.candidateAnswer || '');
    setSavedSuccess(false);
    AudioService.cancelSpeech();
    setIsPlayingTTS(false);
  };

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
        return 'bg-gold-subtle text-gold-400 border-gold-border';
      case 'Validate':
        return 'bg-caution-subtle text-caution-500 border-caution-border';
      case 'Clarify':
        return 'bg-verified-subtle text-verified-400 border-verified-border';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-8 bg-black/90 backdrop-blur-md overflow-y-auto font-sans">
      <div className="dossier-card rounded-3xl w-full max-w-[1500px] h-[92vh] flex flex-col shadow-2xl border-2 border-gold-border/60 bg-ink-950 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Top Strip */}
        <div className="p-5 bg-ink-900 border-b border-ink-border flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-ink-850 border border-ink-border flex items-center justify-center text-gold-400 font-mono font-bold text-sm shadow">
              {candidate.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-gold-400 font-bold uppercase tracking-wider">
                  TECHNICAL INTERVIEW THEATER
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[11px] font-mono px-2.5 py-0.5 rounded bg-ink-850 border border-ink-border text-slate-300">
                  {candidate.fitBadge}
                </span>
              </div>
              <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 mt-0.5">
                {candidate.name}
                <span className="text-xs font-normal text-slate-400 font-mono">
                  ({candidate.currentRole})
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="bg-ink-850 px-3.5 py-2 rounded-xl border border-ink-border flex items-center gap-2">
              <span className="text-slate-400">Match Score:</span>
              <span className="text-base font-extrabold text-verified-400">{candidate.matchScore}%</span>
            </div>
            <div className="bg-ink-850 px-3.5 py-2 rounded-xl border border-ink-border flex items-center gap-2">
              <span className="text-slate-400">Review Status:</span>
              <span className="text-gold-400 font-bold">{candidate.reviewStatus}</span>
            </div>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-ink-850 hover:bg-ink-800 border border-ink-border flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body: 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 flex-1 overflow-y-auto divide-y lg:divide-y-0 lg:divide-x divide-ink-border bg-ink-950 text-xs">
          
          {/* LEFT (4 cols): Questions List */}
          <div className="lg:col-span-4 p-6 overflow-y-auto space-y-3.5 bg-ink-900/40">
            <div className="flex items-center justify-between font-mono text-xs text-slate-300 uppercase tracking-wider font-bold pb-1">
              <div className="flex items-center gap-2 text-gold-400">
                <MessageSquare className="w-4 h-4 text-gold-500" />
                <span>Probe List ({candidate.interviewQuestions.length})</span>
              </div>
            </div>

            <div className="space-y-3">
              {candidate.interviewQuestions.map((q, idx) => {
                const isSelected = q.id === activeQuestion?.id;
                return (
                  <div
                    key={q.id}
                    onClick={() => handleSelectQuestion(q)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2.5 ${
                      isSelected
                        ? 'bg-ink-850 border-gold-500 ring-2 ring-gold-500/40 shadow-xl'
                        : 'bg-ink-900 border-ink-border hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] text-slate-400 uppercase font-bold">
                        Probe #{idx + 1}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-lg font-mono text-[10px] font-bold border ${getSeverityStyle(q.severityTag)}`}>
                        {q.severityTag}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-gold-400 font-semibold truncate">
                      {q.targetRequirement}
                    </div>

                    <p className={`text-xs leading-relaxed line-clamp-2 ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                      "{q.questionText}"
                    </p>

                    {q.candidateAnswer && (
                      <div className="text-[11px] font-mono text-verified-400 flex items-center gap-1.5 pt-1 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Response Transcribed</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* MIDDLE (5 cols): Follow-Up Tree & Interactive Workspace */}
          <div className="lg:col-span-5 p-6 overflow-y-auto space-y-6">
            {activeQuestion ? (
              <>
                {/* Active Question Focus Header */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-400 uppercase tracking-wider">
                      Targeted Requirement: <strong className="text-white">{activeQuestion.targetRequirement}</strong>
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg font-mono text-xs font-bold border ${getSeverityStyle(activeQuestion.severityTag)}`}>
                      {activeQuestion.severityTag}
                    </span>
                  </div>

                  {/* Primary Question Box */}
                  <div className="p-5 rounded-2xl bg-ink-850 border border-ink-border space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-base font-bold text-white leading-relaxed">
                        "{activeQuestion.questionText}"
                      </p>
                      <button
                        onClick={toggleTTS}
                        className={`p-2.5 rounded-xl border transition-colors flex-shrink-0 ${
                          isPlayingTTS 
                            ? 'bg-gold-500 text-ink-950 border-gold-400 font-bold' 
                            : 'bg-ink-900 border-ink-border text-slate-300 hover:text-white'
                        }`}
                        title="Voice Readout"
                      >
                        {isPlayingTTS ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Follow-up Tree Branch */}
                <div className="p-5 rounded-2xl bg-gradient-to-r from-ink-850 to-ink-900 border border-ink-border space-y-2.5 relative pl-7">
                  <div className="absolute left-3 top-6 bottom-6 w-0.5 bg-gold-500/60" />
                  <div className="flex items-center gap-2 font-mono text-xs text-gold-400 font-bold">
                    <GitFork className="w-4 h-4 rotate-180" />
                    <span>DEEP DIVE PROBE TREE</span>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono">
                    {activeQuestion.followUpProbe}
                  </p>
                </div>

                {/* Candidate Answer Recording Area */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-slate-400 uppercase tracking-wider font-bold">
                      Live Candidate Transcript & Evaluator Notes
                    </span>

                    <button
                      onClick={toggleRecording}
                      className={`px-3 py-1.5 rounded-xl border font-mono text-xs font-bold flex items-center gap-2 transition-colors ${
                        isRecording 
                          ? 'bg-flag-subtle text-flag-500 border-flag-border animate-pulse' 
                          : 'bg-ink-850 hover:bg-ink-800 border-ink-border text-gold-400'
                      }`}
                    >
                      {isRecording ? (
                        <>
                          <MicOff className="w-4 h-4" />
                          <span>Stop Recording</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-4 h-4 text-gold-500" />
                          <span>Record via Mic</span>
                        </>
                      )}
                    </button>
                  </div>

                  <textarea
                    rows={4}
                    value={candidateAnswer}
                    onChange={e => setCandidateAnswer(e.target.value)}
                    placeholder="Speak into microphone or transcribe candidate's explanation, architectural tradeoffs, and performance benchmarks..."
                    className="w-full bg-ink-900 border border-ink-border rounded-2xl p-4 text-white text-xs leading-relaxed focus:outline-none focus:border-gold-500 resize-none font-mono"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-slate-500 font-mono">
                      {candidateAnswer ? `${candidateAnswer.length} chars transcribed` : 'No response transcribed yet'}
                    </span>
                    <button
                      onClick={handleSaveAnswer}
                      className="px-5 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs flex items-center gap-2 transition-colors shadow-lg"
                    >
                      {savedSuccess ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Saved to Dossier</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>Save Evaluation</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Select a probe on the left to begin technical evaluation.
              </div>
            )}
          </div>

          {/* RIGHT (3 cols): Concern Focus & Outcome */}
          <div className="lg:col-span-3 p-6 overflow-y-auto space-y-6 bg-ink-900/30">
            
            {/* Concern List */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs text-caution-500 uppercase tracking-wider font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Evaluator Warning Flag</span>
              </div>
              <div className="p-4 rounded-2xl bg-ink-850 border border-ink-border space-y-1.5">
                <div className="font-bold text-white text-xs">Probe Target</div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeQuestion?.concernNote || 'Verify candidate demonstrates hands-on implementation depth rather than framework abstraction.'}
                </p>
              </div>
            </div>

            {/* Unverified Gaps */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 font-mono text-xs text-slate-400 uppercase tracking-wider font-bold">
                <ShieldAlert className="w-4 h-4 text-flag-500" />
                <span>Unverified Gaps on File</span>
              </div>
              <div className="space-y-2">
                {candidate.evidenceMap
                  .filter(ev => ev.status !== 'Verified')
                  .map((ev, i) => (
                    <div key={i} className="p-3 rounded-xl bg-ink-850 border border-ink-border space-y-1 text-xs">
                      <div className="font-bold text-white">{ev.requirement}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{ev.snippet}</div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Next Action Outcome */}
            <div className="space-y-3 pt-3 border-t border-ink-border">
              <div className="font-mono text-xs text-slate-400 uppercase tracking-wider font-bold">
                Interview Verdict
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => onUpdateStatus(candidate.id, 'Interview Ready')}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-verified-subtle hover:bg-verified-subtle/80 text-verified-400 border border-verified-border font-bold text-xs transition-colors text-left flex items-center justify-between"
                >
                  <span>Pass Technical Probe</span>
                  <CheckCircle2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onUpdateStatus(candidate.id, 'Needs Validation')}
                  className="w-full py-2.5 px-3.5 rounded-xl bg-caution-subtle hover:bg-caution-subtle/80 text-caution-500 border border-caution-border font-bold text-xs transition-colors text-left flex items-center justify-between"
                >
                  <span>Needs Follow-up Session</span>
                  <AlertTriangle className="w-4 h-4" />
                </button>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
