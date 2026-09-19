import React, { useState, useRef, useEffect } from 'react';
import { CandidateCaseFile, RoleSetup } from '../types';
import { AiService } from '../services/aiApi';
import { AudioService } from '../services/audioService';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  X, 
  Trash2, 
  User, 
  ChevronRight,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
}

interface RecruiterAgentCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateCaseFile[];
  role: RoleSetup;
  onSelectCandidate: (candidate: CandidateCaseFile) => void;
}

export const RecruiterAgentCopilot: React.FC<RecruiterAgentCopilotProps> = ({
  isOpen,
  onClose,
  candidates,
  role,
  onSelectCandidate
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init-1',
      sender: 'agent',
      text: `Hello! I am your **HireFlow Copilot**. I have full context on the **${role.title}** role and all **${candidates.length} candidate${candidates.length === 1 ? '' : 's'}** on record.\n\nYou can ask me questions like:\n• *"List all candidates who applied"*\n• *"Which candidates are eligible for an interview?"*\n• *"Compare candidate skills and projects"*\n• *"What are the biggest risk flags?"*`,
      timestamp: 'Just now'
    }
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const aiConfig = AiService.getConfig();
  const isAiConfigured = AiService.isConfigured();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (userText?: string) => {
    const query = (userText || input).trim();
    if (!query || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(m => ({
        role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
        content: m.text
      }));

      const reply = await AiService.chatWithRecruiterAgent(query, candidates, role, history);

      const agentMsg: ChatMessage = {
        id: `msg-agent-${Date.now()}`,
        sender: 'agent',
        text: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, agentMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'agent',
        text: `Error contacting AI engine: ${err.message}. Showing local candidate pipeline summary instead.`,
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    if (isRecording) {
      AudioService.stopListening();
      setIsRecording(false);
    } else {
      const started = AudioService.startListening(
        (transcript) => {
          setInput(prev => (prev ? `${prev} ${transcript}` : transcript));
        },
        (error) => {
          console.warn('Speech recognition error:', error);
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

  const handleClearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'agent',
        text: `Chat cleared. Ask anything about **${role.title}** applicants or eligibility.`,
        timestamp: 'Just now'
      }
    ]);
  };

  const promptChips = [
    'List all candidates who applied',
    'Which candidates are eligible?',
    'What are the main risk flags?',
    'Who has distributed systems experience?'
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 truncate">Recruiter Copilot</span>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded border border-indigo-100">
                RAG AGENT
              </span>
            </div>
            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                {isAiConfigured 
                  ? `${aiConfig.provider === 'groq' ? '⚡ Groq Llama 3.3' : aiConfig.provider === 'gemini' ? 'Gemini 1.5' : 'OpenAI'} Active`
                  : 'Smart Local Pipeline Engine'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Close Copilot panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Chips */}
      <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            disabled={isLoading}
            className="text-[11px] font-medium bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-200 border border-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs transition-colors shrink-0 disabled:opacity-50"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[10px] text-slate-400 mb-1 px-1 flex items-center gap-1">
              <span>{m.sender === 'user' ? 'You' : 'HireFlow Copilot'}</span>
              <span>•</span>
              <span>{m.timestamp}</span>
            </div>

            <div
              className={`max-w-[90%] rounded-xl p-3.5 text-xs leading-relaxed shadow-2xs ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
              }`}
            >
              {/* Message text with basic markdown formatting */}
              <div className="space-y-1.5 whitespace-pre-wrap break-words">
                {m.text.split('\n').map((line, lIdx) => {
                  if (line.startsWith('### ')) {
                    return <h4 key={lIdx} className="font-bold text-sm text-slate-900 mt-2 mb-1">{line.replace('### ', '')}</h4>;
                  }
                  if (line.startsWith('• ') || line.startsWith('- ')) {
                    return (
                      <div key={lIdx} className="flex items-start gap-1.5 pl-1">
                        <span className="text-indigo-500 font-bold shrink-0">•</span>
                        <span>{line.slice(2)}</span>
                      </div>
                    );
                  }
                  return <p key={lIdx}>{line}</p>;
                })}
              </div>

              {/* Mentioned Candidate Quick Jump Chips */}
              {m.sender === 'agent' && candidates.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {candidates
                    .filter(c => m.text.toLowerCase().includes(c.name.toLowerCase()))
                    .map(c => (
                      <button
                        key={c.id}
                        onClick={() => onSelectCandidate(c)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded transition-colors"
                        title={`View ${c.name}'s dossier in workspace`}
                      >
                        <span>View {c.name} ({c.matchScore}%)</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-xl border border-slate-200 w-fit">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
            <span>Consulting pipeline database & generating grounded response...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-3 border-t border-slate-200 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Ask anything about candidates, skills, or comparisons..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-9 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`absolute right-2 top-2 p-1 rounded transition-colors ${
                isRecording
                  ? 'text-rose-600 bg-rose-50 animate-pulse'
                  : 'text-slate-400 hover:text-indigo-600'
              }`}
              title="Voice dictate query"
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-sm shrink-0"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          Grounded directly in active candidate resumes, projects, and evidence maps.
        </p>
      </div>

    </div>
  );
};
