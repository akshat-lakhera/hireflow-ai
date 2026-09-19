import React, { useState, useRef, useEffect } from 'react';
import { CandidateCaseFile, RoleSetup } from '../types';
import { AiService, AiConfig } from '../services/aiApi';
import { AudioService } from '../services/audioService';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Mic, 
  MicOff, 
  X, 
  Trash2, 
  ArrowUpRight,
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
  onOpenAiSettings?: () => void;
}

/**
 * Parses inline markdown: **bold**, `code`, and *italic*
 */
function parseInlineMarkdown(text: string, isUserMessage = false): React.ReactNode {
  if (!text) return null;
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((token, idx) => {
    if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
      return (
        <strong key={idx} className={`font-semibold ${isUserMessage ? 'text-white font-bold' : 'text-slate-900 font-bold'}`}>
          {token.slice(2, -2)}
        </strong>
      );
    }
    if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
      return (
        <code
          key={idx}
          className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${
            isUserMessage
              ? 'bg-indigo-700 text-indigo-100'
              : 'bg-slate-100 text-indigo-700 border border-slate-200/80 font-medium'
          }`}
        >
          {token.slice(1, -1)}
        </code>
      );
    }
    if (token.startsWith('*') && token.endsWith('*') && token.length >= 2 && !token.startsWith('**')) {
      return (
        <em key={idx} className="italic">
          {token.slice(1, -1)}
        </em>
      );
    }
    return token;
  });
}

/**
 * Renders full message content with block and inline markdown formatting
 */
function renderMessageContent(content: string, isUserMessage = false): React.ReactNode {
  const lines = content.split('\n');

  return (
    <div className="space-y-1.5 whitespace-pre-wrap break-words">
      {lines.map((line, lIdx) => {
        const trimmed = line.trim();
        if (!trimmed) {
          return <div key={lIdx} className="h-1" />;
        }
        if (line.startsWith('### ') || line.startsWith('## ')) {
          const headingText = line.replace(/^#{2,4}\s+/, '');
          return (
            <h4 key={lIdx} className={`font-bold text-sm mt-2 mb-1 flex items-center gap-1.5 ${
              isUserMessage ? 'text-white' : 'text-slate-900'
            }`}>
              {parseInlineMarkdown(headingText, isUserMessage)}
            </h4>
          );
        }
        if (line.startsWith('> ')) {
          const quoteText = line.replace(/^>\s+/, '');
          return (
            <div
              key={lIdx}
              className={`border-l-2 pl-2.5 py-1 rounded-r text-[11px] my-1 ${
                isUserMessage
                  ? 'border-indigo-300 bg-indigo-700/50 text-indigo-100'
                  : 'border-indigo-400 bg-indigo-50/60 text-slate-700'
              }`}
            >
              {parseInlineMarkdown(quoteText, isUserMessage)}
            </div>
          );
        }
        if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
          const bulletText = line.replace(/^[-•*]\s+/, '');
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-1">
              <span className={`font-bold shrink-0 ${isUserMessage ? 'text-indigo-200' : 'text-indigo-500'}`}>•</span>
              <span className="flex-1">{parseInlineMarkdown(bulletText, isUserMessage)}</span>
            </div>
          );
        }
        const numberMatch = line.match(/^(\d+)\.\s+(.*)/);
        if (numberMatch) {
          return (
            <div key={lIdx} className="flex items-start gap-1.5 pl-1">
              <span className={`font-semibold shrink-0 ${isUserMessage ? 'text-indigo-200' : 'text-indigo-600'}`}>
                {numberMatch[1]}.
              </span>
              <span className="flex-1">{parseInlineMarkdown(numberMatch[2], isUserMessage)}</span>
            </div>
          );
        }
        return (
          <p key={lIdx} className="leading-relaxed">
            {parseInlineMarkdown(line, isUserMessage)}
          </p>
        );
      })}
    </div>
  );
}

export const RecruiterAgentCopilot: React.FC<RecruiterAgentCopilotProps> = ({
  isOpen,
  onClose,
  candidates,
  role,
  onSelectCandidate,
  onOpenAiSettings
}) => {
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => AiService.getConfig());
  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(() => AiService.isConfigured());

  useEffect(() => {
    const syncConfig = () => {
      setAiConfig(AiService.getConfig());
      setIsAiConfigured(AiService.isConfigured());
    };

    window.addEventListener('talentdossier-ai-config-updated', syncConfig);
    window.addEventListener('hireflow-ai-config-updated', syncConfig);
    window.addEventListener('storage', syncConfig);
    return () => {
      window.removeEventListener('talentdossier-ai-config-updated', syncConfig);
      window.removeEventListener('hireflow-ai-config-updated', syncConfig);
      window.removeEventListener('storage', syncConfig);
    };
  }, []);

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const configured = AiService.isConfigured();
    const cfg = AiService.getConfig();
    return [
      {
        id: 'init-1',
        sender: 'agent',
        text: configured
          ? `Hello! I am your **TalentDossier Copilot** powered by **${cfg.provider.toUpperCase()} (${cfg.model})**. I have real-time grounded context on the **${role.title}** role and all **${candidates.length} candidate${candidates.length === 1 ? '' : 's'}** in the pipeline. Ask me anything about candidate qualifications, verification gaps, or eligibility.`
          : `### ⚠️ AI API Key Required\n\nWelcome to **TalentDossier Copilot**.\n\nCurrently, **no AI API key is configured**. TalentDossier operates with authentic LLM evaluation and does **not** provide fake, mock, or hardcoded dummy answers.\n\nTo ask questions, evaluate qualifications, compare applicants, or generate interview questions, please add your free **Groq** (\`llama-3.3-70b\`) or **Google Gemini** API key in **AI Settings**.`,
        timestamp: 'Just now'
      }
    ];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setAiConfig(AiService.getConfig());
      setIsAiConfigured(AiService.isConfigured());
      scrollToBottom();
    }
  }, [isOpen]);

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

    if (!isAiConfigured) {
      const warnMsg: ChatMessage = {
        id: `msg-agent-${Date.now()}`,
        sender: 'agent',
        text: `### ⚠️ AI API Key Required\n\nNo AI API key is configured. TalentDossier operates with authentic LLM intelligence and does **not** provide dummy or hardcoded answers.\n\nPlease open **AI Settings** (top header) and enter a free **Groq** (\`llama-3.3-70b\`) or **Google Gemini** API key to chat with the copilot.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, userMsg, warnMsg]);
      setInput('');
      return;
    }

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
        text: `### ⚠️ AI Service Error\n\n${err.message || 'Failed to reach AI service'}.\n\nPlease check your API key in **AI Settings**.`,
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
        text: isAiConfigured 
          ? `Conversation cleared. Ask me anything about **${role.title}** applicants, gaps, or qualifications.`
          : `### ⚠️ AI API Key Required\n\nNo AI API key is configured. Please configure your free **Groq** (\`llama-3.3-70b\`) or **Google Gemini** API key in **AI Settings** to begin.`,
        timestamp: 'Just now'
      }
    ]);
  };

  const promptChips = isAiConfigured
    ? [
        'Which candidates are eligible?',
        'Compare candidate skills and projects',
        'What are the main risk flags in this pipeline?',
        'Summarize top qualification evidence'
      ]
    : [
        '🔑 Connect Free Groq Key',
        '🔑 Connect Gemini Key',
        '⚙️ Open AI Settings'
      ];

  const handleChipClick = (chip: string) => {
    if (!isAiConfigured) {
      if (onOpenAiSettings) {
        onOpenAiSettings();
      }
      return;
    }
    handleSend(chip);
  };

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
      
      {/* Header */}
      <div className="h-14 px-4 border-b border-slate-200 flex items-center justify-between bg-white shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0 ${
            isAiConfigured ? 'bg-indigo-600' : 'bg-slate-700'
          }`}>
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-slate-900 truncate">Recruiter Copilot</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                isAiConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isAiConfigured ? 'RAG AGENT ONLINE' : 'AI OFFLINE'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isAiConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span>
                {isAiConfigured 
                  ? `${aiConfig.provider === 'groq' ? '⚡ Groq Llama 3.3' : aiConfig.provider === 'gemini' ? 'Gemini 1.5' : 'OpenAI'} Active`
                  : 'API Key Required'}
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

      {/* API Key Required Alert Banner when offline */}
      {!isAiConfigured && (
        <div className="mx-3 mt-3 p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900 shrink-0 shadow-2xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-semibold text-amber-950 flex items-center justify-between">
              <span>No AI Key Configured</span>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/80 px-1.5 py-0.5 rounded border border-amber-200/50">Dummy Answers Removed</span>
            </div>
            <p className="text-amber-800 text-[11px] mt-1 leading-relaxed">
              TalentDossier does not use canned or dummy answers. Connect a free Groq or Google Gemini API key to activate conversational AI intelligence.
            </p>
            {onOpenAiSettings && (
              <button
                onClick={onOpenAiSettings}
                className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Configure Free API Key</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Suggested Chips */}
      <div className="px-3 py-2 bg-slate-50/80 border-b border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleChipClick(chip)}
            disabled={isLoading}
            className={`text-[11px] font-medium border px-2.5 py-1 rounded-full whitespace-nowrap shadow-2xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer ${
              !isAiConfigured
                ? 'bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100'
                : 'bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-200 border-slate-200'
            }`}
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
              <span>{m.sender === 'user' ? 'You' : 'TalentDossier Copilot'}</span>
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
              {/* Rich Markdown Rendering (Bold, Code, Headers, Lists, Quotes) */}
              {renderMessageContent(m.text, m.sender === 'user')}

              {/* Mentioned Candidate Quick Jump Chips */}
              {m.sender === 'agent' && candidates.length > 0 && isAiConfigured && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {candidates
                    .filter(c => m.text.toLowerCase().includes(c.name.toLowerCase()))
                    .map(c => (
                      <button
                        key={c.id}
                        onClick={() => onSelectCandidate(c)}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded transition-colors cursor-pointer"
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
              placeholder={isAiConfigured ? "Ask anything about candidates, skills, or comparisons..." : "Configure API key in AI Settings to chat..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-9 py-2.5 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={!isAiConfigured}
              className={`absolute right-2 top-2 p-1 rounded transition-colors ${
                isRecording
                  ? 'text-rose-600 bg-rose-50 animate-pulse'
                  : !isAiConfigured
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-400 hover:text-indigo-600 cursor-pointer'
              }`}
              title={isAiConfigured ? "Voice dictate query" : "Configure API key to use voice dictation"}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-sm shrink-0 cursor-pointer"
            title="Send query"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          {isAiConfigured 
            ? "Grounded directly in active candidate resumes, projects, and evidence maps."
            : "Zero fake or hardcoded answers. Configure an API key to enable Copilot."}
        </p>
      </div>

    </div>
  );
};
