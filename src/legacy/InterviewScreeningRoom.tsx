import React, { useState, useEffect } from 'react';
import { Candidate, InterviewQuestion } from '../types';
import { AgentEngine } from '../services/agentEngine';
import { AudioService } from '../services/audioService';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, ArrowRight, CheckCircle2, ShieldAlert, CornerDownRight } from 'lucide-react';
import confetti from 'canvas-confetti';

interface InterviewScreeningRoomProps {
  candidate: Candidate;
  onFinishInterview: (updatedCandidate: Candidate) => void;
  onClose: () => void;
}

export const InterviewScreeningRoom: React.FC<InterviewScreeningRoomProps> = ({
  candidate,
  onFinishInterview,
  onClose
}) => {
  const [questions, setQuestions] = useState<InterviewQuestion[]>(candidate.questions);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [candidateAnswer, setCandidateAnswer] = useState<string>('');
  const [probeAnswer, setProbeAnswer] = useState<string>('');
  
  // Audio state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [voiceEnabled, setVoiceEnabled] = useState<boolean>(true);

  // Probing state
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeProbe, setActiveProbe] = useState<{
    depth: 'shallow' | 'moderate' | 'deep';
    feedback: string;
    probeQuestion?: string;
  } | null>(null);

  const currentQ = questions[currentIdx] || questions[0];

  useEffect(() => {
    if (voiceEnabled && currentQ) {
      AudioService.speak(currentQ.questionText);
    }
    setCandidateAnswer(currentQ?.candidateAnswer || '');
    setActiveProbe(null);
    setProbeAnswer('');
    return () => {
      AudioService.cancelSpeech();
      AudioService.stopListening();
    };
  }, [currentIdx]);

  const toggleRecording = () => {
    if (isRecording) {
      AudioService.stopListening();
      setIsRecording(false);
    } else {
      const started = AudioService.startListening(
        (transcript) => {
          if (activeProbe?.probeQuestion) {
            setProbeAnswer(transcript);
          } else {
            setCandidateAnswer(transcript);
          }
        },
        () => {
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

  const handleEvaluateAnswer = () => {
    if (!candidateAnswer.trim()) return;

    setIsAnalyzing(true);
    AudioService.stopListening();
    setIsRecording(false);

    setTimeout(() => {
      const evaluation = AgentEngine.evaluateAnswerAndProbe(currentQ, candidateAnswer);
      setIsAnalyzing(false);
      setActiveProbe(evaluation);

      if (evaluation.probeQuestion && voiceEnabled) {
        AudioService.speak(`Follow-up inquiry: ${evaluation.probeQuestion}`);
      }

      const updated = [...questions];
      updated[currentIdx] = {
        ...updated[currentIdx],
        candidateAnswer,
        answerDepthRating: evaluation.depth,
        criticFeedback: evaluation.feedback,
        wasProbed: Boolean(evaluation.probeQuestion),
        probeQuestion: evaluation.probeQuestion,
        finalScore: evaluation.score
      };
      setQuestions(updated);
    }, 500);
  };

  const handleCompleteQuestion = () => {
    const updated = [...questions];
    if (activeProbe?.probeQuestion) {
      updated[currentIdx] = {
        ...updated[currentIdx],
        probeAnswer: probeAnswer || 'Candidate addressed follow-up probe.',
        finalScore: Math.min(10, (updated[currentIdx].finalScore || 6) + 2)
      };
    }
    setQuestions(updated);

    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      confetti({
        particleCount: 75,
        spread: 70,
        origin: { y: 0.6 }
      });

      const scorecard = AgentEngine.generateScorecard(candidate, updated);
      const updatedCandidate: Candidate = {
        ...candidate,
        interviewStatus: 'completed',
        questions: updated,
        scorecard,
        matchScore: scorecard.overallScore
      };

      onFinishInterview(updatedCandidate);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-obsidian-900 border border-obsidian-border rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-obsidian-850 border-b border-obsidian-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
              AI
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-100">Live AI Screening Session</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold animate-pulse">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Candidate: <span className="text-slate-200 font-semibold">{candidate.name}</span> • Question {currentIdx + 1} of {questions.length}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setVoiceEnabled(!voiceEnabled);
                if (voiceEnabled) AudioService.cancelSpeech();
              }}
              className={`p-2 rounded-lg border transition-colors ${
                voiceEnabled 
                  ? 'bg-gold-500/15 border-gold-500/40 text-gold-400' 
                  : 'bg-obsidian-800 border-obsidian-border text-slate-400 hover:text-slate-200'
              }`}
              title={voiceEnabled ? 'Voice output active' : 'Voice muted'}
            >
              {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-xs text-slate-400 hover:text-white border border-obsidian-border transition-colors"
            >
              Exit
            </button>
          </div>
        </div>

        {/* Question & Workspace */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          
          <div className="p-5 rounded-2xl bg-gradient-to-b from-obsidian-800 to-obsidian-850 border border-gold-500/30 shadow-lg relative overflow-hidden">
            <div className="flex items-center justify-between text-xs text-gold-400 font-mono mb-2 uppercase tracking-wider font-semibold">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Interviewer Prompt • {currentQ.category.replace('_', ' ')}</span>
              </span>
              <span className="text-slate-400">Target Criteria: {currentQ.mappedJDRequirement}</span>
            </div>

            <h3 className="text-base font-semibold text-slate-100 leading-relaxed">
              {currentQ.questionText}
            </h3>

            <div className="mt-3 pt-3 border-t border-obsidian-border/80 flex items-center gap-2 text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Targeting Resume Claim:</span>
              <span className="bg-obsidian-950/80 px-2.5 py-1 rounded-md text-gold-300 font-mono text-[11px] border border-obsidian-border">
                "{currentQ.targetResumeClaim}"
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <span>Candidate Response:</span>
                {isRecording && (
                  <span className="text-rose-400 text-[11px] font-mono flex items-center gap-1 animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                    Recording Microphone...
                  </span>
                )}
              </label>

              {/* Sample Quick Fill to make live testing effortless */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500">Quick Test:</span>
                <button
                  type="button"
                  onClick={() => setCandidateAnswer("We used our tech stack and scaled it up so latency was low, and we had good monitoring in place.")}
                  className="px-2 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[11px] border border-amber-500/30 transition-colors"
                >
                  Vague Answer (Trigger Probe)
                </button>
                <button
                  type="button"
                  onClick={() => setCandidateAnswer("We tuned Raft election timeouts to 150-300ms, avoided split votes, and implemented linearizable read indices over quorum heartbeats to prevent leader write bottlenecks under high throughput.")}
                  className="px-2 py-0.5 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[11px] border border-emerald-500/30 transition-colors"
                >
                  Deep Technical Answer
                </button>
              </div>
            </div>

            <div className="relative">
              <textarea
                value={candidateAnswer}
                onChange={(e) => setCandidateAnswer(e.target.value)}
                placeholder="Type your response or click the microphone to speak naturally..."
                rows={4}
                className="w-full bg-obsidian-950/80 border border-obsidian-border rounded-xl p-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold-500 transition-colors resize-none leading-relaxed font-sans"
              />

              <button
                type="button"
                onClick={toggleRecording}
                className={`absolute bottom-3 right-3 p-2.5 rounded-full shadow-lg transition-all ${
                  isRecording 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-obsidian-800 hover:bg-obsidian-700 text-gold-400 border border-obsidian-border'
                }`}
                title={isRecording ? 'Stop Recording' : 'Start Microphone'}
              >
                {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            </div>

            {!activeProbe && (
              <button
                type="button"
                onClick={handleEvaluateAnswer}
                disabled={!candidateAnswer.trim() || isAnalyzing}
                className="w-full py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-black text-xs font-bold shadow-md disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    <span>Agent Critic Evaluating Technical Depth...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Submit Response & Run Adversarial Critic</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Adversarial Probe Display */}
          {activeProbe && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-3 duration-200">
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                activeProbe.depth === 'deep' 
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-300'
              }`}>
                {activeProbe.depth === 'deep' ? (
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                )}
                <div>
                  <div className="font-bold text-xs uppercase tracking-wider font-mono">
                    {activeProbe.depth === 'deep' 
                      ? '✓ Depth Validated by Critic Agent' 
                      : '⚠ Critic Agent Detected Shallow Response'}
                  </div>
                  <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                    {activeProbe.feedback}
                  </p>
                </div>
              </div>

              {activeProbe.probeQuestion && (
                <div className="p-4 rounded-xl bg-obsidian-950 border border-amber-500/50 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 font-mono uppercase tracking-wider">
                    <CornerDownRight className="w-4 h-4 text-amber-400" />
                    <span>Adversarial Drill-Down Probe</span>
                  </div>

                  <p className="text-sm font-semibold text-slate-100 pl-6 leading-relaxed">
                    "{activeProbe.probeQuestion}"
                  </p>

                  <div className="pl-6 pt-2">
                    <label className="text-xs text-slate-400 block mb-1 font-medium">Candidate Probe Response:</label>
                    <textarea
                      value={probeAnswer}
                      onChange={(e) => setProbeAnswer(e.target.value)}
                      placeholder="Explain low-level trade-offs, network recovery, or failure mode handling..."
                      rows={3}
                      className="w-full bg-obsidian-900 border border-obsidian-border rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-gold-500 resize-none font-sans"
                    />
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleCompleteQuestion}
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {currentIdx < questions.length - 1 ? 'Save & Proceed to Next Question' : 'Complete Screening & View Scorecard'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-obsidian-850 border-t border-obsidian-border flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>Autonomous Agent Loop: <span className="text-gold-400 font-bold">Interviewer-Critic State Machine</span></div>
          <div className="flex items-center gap-2">
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span>•</span>
            <span className="text-emerald-400 font-bold">{candidate.name}</span>
          </div>
        </div>

      </div>
    </div>
  );
};
