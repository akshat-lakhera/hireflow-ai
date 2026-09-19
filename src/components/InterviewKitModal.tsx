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
  CheckCircle2, 
  ChevronRight, 
  Save, 
  Check, 
  HelpCircle,
  Sparkles,
  Award
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
      AudioService.speak(`${activeQuestion.questionText}. What to look for: ${activeQuestion.followUpProbe}`, () => {
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

  const getSeverityBadge = (severity: QuestionSeverity) => {
    switch (severity) {
      case 'Deep dive':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Validate':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Clarify':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
              {candidate.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">{candidate.name}</h3>
                <span className="text-xs text-slate-500 font-medium">• Structured Interview Kit</span>
              </div>
              <p className="text-xs text-slate-500">{candidate.currentRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <select
              value={candidate.reviewStatus}
              onChange={(e) => onUpdateStatus(candidate.id, e.target.value as any)}
              className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-700 hover:border-slate-300 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Interview Ready">Status: Interview Ready</option>
              <option value="Needs Review">Status: Needs Review</option>
              <option value="Passed Screen">Status: Passed Screen</option>
              <option value="Offer Extended">Status: Offer Extended</option>
              <option value="Rejected">Status: Rejected</option>
            </select>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2-Column Kit Body */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Question List Sidebar (320px) */}
          <div className="w-80 border-r border-slate-200 bg-slate-50/50 p-4 overflow-y-auto space-y-2">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Interview Questions ({candidate.interviewQuestions.length})
            </div>

            {candidate.interviewQuestions.map((q, idx) => {
              const isSelected = q.id === activeQuestion?.id;
              const hasAnswer = Boolean(q.candidateAnswer);

              return (
                <div
                  key={q.id}
                  onClick={() => handleSelectQuestion(q)}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-indigo-500 ring-1 ring-indigo-500 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-semibold text-indigo-600 text-[10px] uppercase tracking-wider">
                      Probe #{idx + 1}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded border ${getSeverityBadge(q.severityTag)}`}>
                      {q.severityTag}
                    </span>
                  </div>

                  <div className="font-medium text-slate-900 leading-snug line-clamp-2">
                    {q.questionText}
                  </div>

                  {hasAnswer && (
                    <div className="mt-2 text-[10px] text-emerald-600 flex items-center gap-1 font-medium">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Notes recorded</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Question Workbench */}
          {activeQuestion ? (
            <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-white">
              
              {/* Question Banner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {activeQuestion.category}
                    </span>
                    <span className="text-xs text-slate-500">
                      Target: <span className="font-semibold text-slate-700">{activeQuestion.targetRequirement}</span>
                    </span>
                  </div>

                  {/* Audio Controls */}
                  <button
                    onClick={toggleTTS}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                      isPlayingTTS
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isPlayingTTS ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                    <span>{isPlayingTTS ? 'Stop Audio' : 'Read Aloud'}</span>
                  </button>
                </div>

                <h2 className="text-lg font-bold text-slate-900 leading-snug">
                  "{activeQuestion.questionText}"
                </h2>
              </div>

              {/* What to look for */}
              <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-1">
                <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-amber-700" />
                  <span>Evaluation Rubric & What to Look For:</span>
                </div>
                <p className="text-xs text-amber-950 leading-relaxed pl-5">
                  {activeQuestion.followUpProbe}
                </p>
                {activeQuestion.concernNote && (
                  <div className="pl-5 pt-1 text-[11px] text-amber-800 italic">
                    Note for interviewer: {activeQuestion.concernNote}
                  </div>
                )}
              </div>

              {/* Response Note Taking Area */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
                    <span>Candidate Answer & Interview Notes</span>
                  </label>

                  {/* Native Speech-to-Text Microphone Button */}
                  <button
                    onClick={toggleRecording}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                      isRecording
                        ? 'bg-rose-500 text-white border-rose-600 animate-pulse shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                    title="Live Speech-to-Text via Web Speech API"
                  >
                    {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-indigo-600" />}
                    <span>{isRecording ? 'Listening (Click to Stop)...' : 'Voice Dictate'}</span>
                  </button>
                </div>

                <textarea
                  rows={8}
                  placeholder="Record candidate's explanations, architectural tradeoffs, depth of hands-on knowledge, and scoring notes..."
                  value={candidateAnswer}
                  onChange={(e) => setCandidateAnswer(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed shadow-sm"
                />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Auto-attaches to candidate's evaluation record
                  </span>

                  <button
                    onClick={handleSaveAnswer}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
                  >
                    {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                    <span>{savedSuccess ? 'Notes Saved!' : 'Save Candidate Answer'}</span>
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-slate-400">
              Select a question on the left to start evaluating.
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
