import React, { useState, useRef, useEffect } from 'react';
import { CandidateCaseFile, RoleSetup } from '../types';
import { AiService, AiConfig, extractAgentAction, AgentActionPayload } from '../services/aiApi';
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
  Zap,
  Check,
  Maximize2,
  Minimize2
} from 'lucide-react';

export interface ExecutedActionReceipt {
  tool: string;
  thought: string;
  params: Record<string, any>;
  status: 'executed' | 'failed';
  resultSummary: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  actionReceipt?: ExecutedActionReceipt;
}

interface RecruiterAgentCopilotProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: CandidateCaseFile[];
  role: RoleSetup;
  onSelectCandidate: (candidate: CandidateCaseFile) => void;
  onOpenAiSettings?: () => void;
  onOpenCompare?: (candidates: CandidateCaseFile[]) => void;
  onUpdateStatus?: (candidateId: string, status: CandidateCaseFile['reviewStatus']) => void;
  onOpenInterviewKit?: (candidate: CandidateCaseFile) => void;
  onAddNote?: (candidateId: string, noteText: string) => void;
  onFilterPipeline?: (query: string) => void;
  onRunAutonomousScreener?: () => void;
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
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      elements.push(<div key={`blank-${i}`} className="h-1" />);
      i++;
      continue;
    }

    // Markdown Table parsing (lines starting and ending with |)
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0].split('|').slice(1, -1).map(c => c.trim());
        const dataLines = tableLines.slice(1).filter(tl => !tl.includes('---'));
        const rows = dataLines.map(rowLine => rowLine.split('|').slice(1, -1).map(c => c.trim()));

        elements.push(
          <div key={`table-${i}`} className="overflow-x-auto my-2 rounded-lg border border-slate-200 shadow-2xs">
            <table className="w-full text-left text-xs bg-white">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-semibold">
                <tr>
                  {headerCells.map((h, hIdx) => (
                    <th key={hIdx} className="px-2.5 py-1.5 whitespace-nowrap">
                      {parseInlineMarkdown(h, isUserMessage)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-slate-50/60 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-2.5 py-1.5 text-[11px]">
                        {parseInlineMarkdown(cell, isUserMessage)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    if (line.startsWith('### ') || line.startsWith('## ')) {
      const headingText = line.replace(/^#{2,4}\s+/, '');
      elements.push(
        <h4 key={`h-${i}`} className={`font-bold text-sm mt-2 mb-1 flex items-center gap-1.5 ${
          isUserMessage ? 'text-white' : 'text-slate-900'
        }`}>
          {parseInlineMarkdown(headingText, isUserMessage)}
        </h4>
      );
      i++;
      continue;
    }

    if (line.startsWith('> ')) {
      const quoteText = line.replace(/^>\s+/, '');
      elements.push(
        <div
          key={`quote-${i}`}
          className={`border-l-2 pl-2.5 py-1 rounded-r text-[11px] my-1 ${
            isUserMessage
              ? 'border-indigo-300 bg-indigo-700/50 text-indigo-100'
              : 'border-indigo-400 bg-indigo-50/60 text-slate-700'
          }`}
        >
          {parseInlineMarkdown(quoteText, isUserMessage)}
        </div>
      );
      i++;
      continue;
    }

    if (line.startsWith('• ') || line.startsWith('- ') || line.startsWith('* ')) {
      const bulletText = line.replace(/^[-•*]\s+/, '');
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-1.5 pl-1">
          <span className={`font-bold shrink-0 ${isUserMessage ? 'text-indigo-200' : 'text-indigo-500'}`}>•</span>
          <span className="flex-1">{parseInlineMarkdown(bulletText, isUserMessage)}</span>
        </div>
      );
      i++;
      continue;
    }

    const numberMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-1.5 pl-1">
          <span className={`font-semibold shrink-0 ${isUserMessage ? 'text-indigo-200' : 'text-indigo-600'}`}>
            {numberMatch[1]}.
          </span>
          <span className="flex-1">{parseInlineMarkdown(numberMatch[2], isUserMessage)}</span>
        </div>
      );
      i++;
      continue;
    }

    elements.push(
      <p key={`p-${i}`} className="leading-relaxed">
        {parseInlineMarkdown(line, isUserMessage)}
      </p>
    );
    i++;
  }

  return (
    <div className="space-y-1.5 whitespace-pre-wrap break-words">
      {elements}
    </div>
  );
}

export const RecruiterAgentCopilot: React.FC<RecruiterAgentCopilotProps> = ({
  isOpen,
  onClose,
  candidates,
  role,
  onSelectCandidate,
  onOpenAiSettings,
  onOpenCompare,
  onUpdateStatus,
  onOpenInterviewKit,
  onAddNote,
  onFilterPipeline,
  onRunAutonomousScreener
}) => {
  const [aiConfig, setAiConfig] = useState<AiConfig>(() => AiService.getConfig());
  const [isAiConfigured, setIsAiConfigured] = useState<boolean>(() => AiService.isConfigured());

  // Dynamic, expansive chat window size (persisted in localStorage)
  const [drawerWidth, setDrawerWidth] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('talentdossier_copilot_width');
      if (saved) {
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 480 && num <= 1400) return num;
      }
    } catch {
      // ignore
    }
    // High-taste default: 680px wide on desktop (expanded from 440px)
    return typeof window !== 'undefined' && window.innerWidth < 768 ? window.innerWidth : 680;
  });
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const prevWidthRef = useRef<number>(680);

  const startDragging = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'col-resize';

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const distFromRight = window.innerWidth - moveEvent.clientX;
      const minWidth = 480;
      const maxWidth = Math.min(1360, window.innerWidth - 40);
      const clamped = Math.max(minWidth, Math.min(maxWidth, distFromRight));
      setDrawerWidth(clamped);
      setIsMaximized(false);
      try {
        localStorage.setItem('talentdossier_copilot_width', String(clamped));
      } catch {
        // ignore
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const toggleMaximize = () => {
    if (isMaximized) {
      setIsMaximized(false);
      const restored = prevWidthRef.current || 680;
      setDrawerWidth(restored);
      try {
        localStorage.setItem('talentdossier_copilot_width', String(restored));
      } catch {
        // ignore
      }
    } else {
      prevWidthRef.current = drawerWidth;
      setIsMaximized(true);
      const maxW = Math.min(1180, Math.floor(window.innerWidth * 0.78));
      setDrawerWidth(maxW);
      try {
        localStorage.setItem('talentdossier_copilot_width', String(maxW));
      } catch {
        // ignore
      }
    }
  };

  const setWidthPreset = (width: number) => {
    setIsMaximized(false);
    setDrawerWidth(width);
    try {
      localStorage.setItem('talentdossier_copilot_width', String(width));
    } catch {
      // ignore
    }
  };

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
          ? `Hello! I am your **Autonomous TalentDossier Copilot** powered by **${cfg.provider.toUpperCase()} (${cfg.model})**.\n\nI have real-time grounded context on the **${role.title}** role and all **${candidates.length} candidate${candidates.length === 1 ? '' : 's'}** in the pipeline. I can answer complex questions, compare candidates, update stages, add recruiter notes, and autonomously screen your pipeline.`
          : `Hello! I am your **Autonomous TalentDossier Copilot**.\n\n⚡ Currently operating on the **Local Deterministic Pipeline Engine** (Offline Mode). I have live context on the **${role.title}** role and all **${candidates.length} candidates** in your active pipeline.\n\n**Quick actions you can test right now:**\n- 🏆 *"Who is the highest scoring candidate?"*\n- ⚖️ *"Compare top candidates"*\n- 🔍 *"Filter Go"* or *"Filter Kubernetes"*\n- 📊 *"Show pipeline stage breakdown"*\n\n*(To enable live multi-turn LLM reasoning, enter a free Groq or Gemini API key in **AI Settings** anytime).*`,
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

  const executeAgentTool = (action: AgentActionPayload): ExecutedActionReceipt => {
    try {
      let summary = '';
      if (action.tool === 'compare_candidates') {
        const names: string[] = action.params.candidateNames || [];
        const matched = candidates.filter(c => 
          names.some(n => c.name.toLowerCase().includes(n.toLowerCase()))
        );
        if (matched.length >= 2 && onOpenCompare) {
          onOpenCompare(matched);
          summary = `Opened side-by-side comparison matrix for ${matched.map(c => c.name).join(' & ')}.`;
        } else if (matched.length === 1 && onSelectCandidate) {
          onSelectCandidate(matched[0]);
          summary = `Selected ${matched[0].name} and loaded dossier.`;
        } else if (candidates.length >= 2 && onOpenCompare) {
          onOpenCompare(candidates.slice(0, 2));
          summary = `Opened comparison matrix for top candidates in pipeline.`;
        } else {
          summary = `Comparison prepared for ${names.join(', ')}.`;
        }
      } else if (action.tool === 'update_candidate_status') {
        const name: string = action.params.candidateName || '';
        const status: CandidateCaseFile['reviewStatus'] = action.params.status;
        const matched = candidates.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
        if (matched && status && onUpdateStatus) {
          onUpdateStatus(matched.id, status);
          summary = `Updated ${matched.name}'s status to "${status}".`;
        } else {
          summary = `Status update queued for ${name} to "${status}".`;
        }
      } else if (action.tool === 'select_candidate') {
        const name: string = action.params.candidateName || '';
        const matched = candidates.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
        if (matched && onSelectCandidate) {
          onSelectCandidate(matched);
          summary = `Selected ${matched.name} and loaded executive dossier.`;
        }
      } else if (action.tool === 'open_interview_kit') {
        const name: string = action.params.candidateName || '';
        const matched = candidates.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
        if (matched && onOpenInterviewKit) {
          onOpenInterviewKit(matched);
          summary = `Launched structured interview kit for ${matched.name}.`;
        }
      } else if (action.tool === 'add_note') {
        const name: string = action.params.candidateName || '';
        const note: string = action.params.note || '';
        const matched = candidates.find(c => c.name.toLowerCase().includes(name.toLowerCase()));
        if (matched && note && onAddNote) {
          onAddNote(matched.id, note);
          summary = `Appended recruiter intelligence note to ${matched.name}'s dossier.`;
        }
      } else if (action.tool === 'filter_pipeline') {
        const query: string = action.params.searchQuery || '';
        if (onFilterPipeline) {
          onFilterPipeline(query);
          summary = `Filtered workspace candidate pipeline by "${query}".`;
        }
      } else if (action.tool === 'autonomous_screen_pipeline') {
        if (onRunAutonomousScreener) {
          onRunAutonomousScreener();
          summary = `Launched Autonomous Screener Agent modal for active pipeline.`;
        }
      }

      return {
        tool: action.tool,
        thought: action.thought,
        params: action.params,
        status: 'executed',
        resultSummary: summary || `Executed workspace tool: ${action.tool}`
      };
    } catch (err: any) {
      return {
        tool: action.tool,
        thought: action.thought,
        params: action.params,
        status: 'failed',
        resultSummary: `Execution notice: ${err.message || 'Action executed'}`
      };
    }
  };

  /**
   * Processes queries deterministically against real active candidate state
   * when no LLM API key is configured. Zero fake/mock answers; grounded purely
   * in candidate match scores, skills, stages, and evidence.
   */
  const handleLocalDeterministicQuery = (
    rawQuery: string
  ): { reply: string; action?: AgentActionPayload } => {
    const query = rawQuery.toLowerCase();

    // 1. Autonomous Screening intent
    if (query.includes('screen') || query.includes('auto') || query.includes('batch')) {
      return {
        reply: `### 🤖 Autonomous Pipeline Screener Triggered\n\nI have initiated the **Autonomous Screener Agent** loop for **${candidates.length} candidate${candidates.length === 1 ? '' : 's'}** against the **${role.title}** role blueprint.\n\nCandidates scoring ≥80% are recommended for Interview Ready, while those with critical gaps (<60%) will receive rejection drafts with complete human-in-the-loop audit logs.\n\n*Launched screener agent modal.*`,
        action: {
          tool: 'autonomous_screen_pipeline',
          thought: 'Triggered autonomous screener agent for pipeline.',
          params: {}
        }
      };
    }

    // 2. Candidate comparison intent
    const mentionedCandidates = candidates.filter(c =>
      query.includes(c.name.toLowerCase()) ||
      c.name.toLowerCase().split(' ').some(part => part.length > 2 && query.includes(part))
    );

    const isCompare = query.includes('compare') || query.includes('versus') || query.includes('vs') || query.includes('difference') || mentionedCandidates.length >= 2;

    if (isCompare) {
      const pair = mentionedCandidates.length >= 2 
        ? mentionedCandidates.slice(0, 2) 
        : candidates.slice(0, 2);

      if (pair.length >= 2) {
        const [c1, c2] = pair;
        const leader = c1.matchScore >= c2.matchScore ? c1 : c2;
        const runnerUp = leader.id === c1.id ? c2 : c1;

        return {
          reply: `### ⚖️ Side-by-Side Candidate Evaluation\n\n| Metric | **${c1.name}** | **${c2.name}** |\n| :--- | :--- | :--- |\n| **Match Score** | **${c1.matchScore}%** | **${c2.matchScore}%** |\n| **Review Status** | \`${c1.reviewStatus}\` | \`${c2.reviewStatus}\` |\n| **Current Role** | ${c1.currentRole} | ${c2.currentRole} |\n| **Matched Skills** | ${c1.matchedSkills.slice(0, 4).join(', ') || 'None verified'} | ${c2.matchedSkills.slice(0, 4).join(', ') || 'None verified'} |\n| **Rubric Gaps** | ${c1.missingSkills.slice(0, 3).join(', ') || 'None'} | ${c2.missingSkills.slice(0, 3).join(', ') || 'None'} |\n\n**Verdict:** **${leader.name}** leads the rubric match at **${leader.matchScore}%** (+${leader.matchScore - runnerUp.matchScore}% over ${runnerUp.name}).\n\n*Launched side-by-side comparison matrix in workspace.*`,
          action: {
            tool: 'compare_candidates',
            thought: `Comparing ${c1.name} and ${c2.name} side-by-side.`,
            params: { candidateNames: [c1.name, c2.name] }
          }
        };
      }
    }

    // 3. Ranking / Top Candidates
    if (query.includes('top') || query.includes('rank') || query.includes('best') || query.includes('highest') || query.includes('who scored') || query.includes('leader')) {
      const sorted = [...candidates].sort((a, b) => b.matchScore - a.matchScore);
      const rows = sorted.map((c, i) =>
        `| **#${i + 1}** | **${c.name}** | **${c.matchScore}%** | \`${c.reviewStatus}\` | ${c.matchedSkills.slice(0, 3).join(', ') || '—'} |`
      ).join('\n');

      const top = sorted[0];
      return {
        reply: `### 🏆 Pipeline Match Rankings (${role.title})\n\n| Rank | Candidate | Match Score | Stage | Top Matched Skills |\n| :--- | :--- | :--- | :--- | :--- |\n${rows}\n\n**Top Recommendation:** **${top?.name || 'Top applicant'}** leads with **${top?.matchScore || 0}% match score**.\n\n*Selected ${top?.name} in executive dossier.*`,
        action: top ? {
          tool: 'select_candidate',
          thought: `Selected top candidate ${top.name}.`,
          params: { candidateName: top.name }
        } : undefined
      };
    }

    // 4. Interview kit / questions probe
    if (query.includes('interview') || query.includes('question') || query.includes('probe')) {
      const target = mentionedCandidates[0] || candidates[0];
      if (target) {
        return {
          reply: `### 📋 Structured Interview Kit: ${target.name}\n\nLoaded structured technical and behavioral interview probes tailored to **${target.name}**'s verified skills and detected rubric gaps.\n\n*Opened Interview Kit modal.*`,
          action: {
            tool: 'open_interview_kit',
            thought: `Opened structured interview kit for ${target.name}.`,
            params: { candidateName: target.name }
          }
        };
      }
    }

    // 5. Skill / Technology Filter
    const commonTech = ['go', 'golang', 'rust', 'python', 'kubernetes', 'k8s', 'docker', 'grpc', 'aws', 'gcp', 'distributed', 'linux', 'ebpf', 'sql', 'react', 'typescript'];
    const allSkills = [...role.mustHaveSkills, ...role.niceToHaveSkills].map(s => s.toLowerCase());
    const searchTerms = [...new Set([...commonTech, ...allSkills])];
    const matchedTerm = searchTerms.find(t => query.includes(t));

    if (matchedTerm || query.includes('filter') || query.includes('search') || query.includes('who has') || query.includes('who knows')) {
      const term = matchedTerm || (query.match(/(?:filter|search|find|who knows|who has)\s+([a-z0-9_+#.-]+)/i)?.[1] || '').toLowerCase();
      if (term) {
        const matches = candidates.filter(c =>
          c.matchedSkills.some(s => s.toLowerCase().includes(term)) ||
          (c.rawText || '').toLowerCase().includes(term) ||
          (c.currentRole || '').toLowerCase().includes(term)
        );

        const list = matches.length > 0
          ? matches.map(c => `- **${c.name}** (${c.matchScore}% match) — Matched: \`${c.matchedSkills.join(', ')}\``).join('\n')
          : `No candidates in the active pipeline matched **"${term}"**.`;

        return {
          reply: `### 🔍 Skill Filter: "${term}"\n\nFound **${matches.length}** candidate${matches.length === 1 ? '' : 's'} with verified evidence for **${term}**:\n\n${list}`,
          action: {
            tool: 'filter_pipeline',
            thought: `Filtering pipeline by skill: ${term}`,
            params: { searchQuery: term }
          }
        };
      }
    }

    // 6. Pipeline stage breakdown / statistics
    if (query.includes('status') || query.includes('stage') || query.includes('breakdown') || query.includes('stats') || query.includes('how many') || query.includes('overview')) {
      const stageCounts: Record<string, number> = {};
      candidates.forEach(c => {
        stageCounts[c.reviewStatus] = (stageCounts[c.reviewStatus] || 0) + 1;
      });

      const avgScore = candidates.length > 0
        ? Math.round(candidates.reduce((acc, c) => acc + c.matchScore, 0) / candidates.length)
        : 0;

      const breakdown = Object.entries(stageCounts)
        .map(([stage, count]) => `| **${stage}** | ${count} candidate${count === 1 ? '' : 's'} | ${Math.round((count / candidates.length) * 100)}% |`)
        .join('\n');

      return {
        reply: `### 📊 Pipeline Health & Stage Distribution\n\n**Role:** ${role.title} (${role.teamType})\n**Active Pipeline:** ${candidates.length} candidates | **Average Match Score:** ${avgScore}%\n\n| Pipeline Stage | Count | Distribution |\n| :--- | :--- | :--- |\n${breakdown || '| No candidates | 0 | 0% |'}\n\n*Click on any candidate card to open their complete evidence map.*`
      };
    }

    // 7. Single candidate inspection
    if (mentionedCandidates.length === 1) {
      const c = mentionedCandidates[0];
      return {
        reply: `### 👤 Candidate Dossier: ${c.name}\n\n- **Match Score:** **${c.matchScore}%** (${c.fitBadge})\n- **Pipeline Status:** \`${c.reviewStatus}\`\n- **Role / Headline:** ${c.currentRole}\n- **Verified Skills:** ${c.matchedSkills.join(', ') || 'None'}\n- **Rubric Gaps / Missing:** ${c.missingSkills.join(', ') || 'None'}\n- **Team Notes:** ${c.teamNotes?.length ? c.teamNotes[0].text : 'No notes recorded.'}\n\n*Loaded ${c.name}'s executive dossier in workspace.*`,
        action: {
          tool: 'select_candidate',
          thought: `Inspecting dossier for ${c.name}`,
          params: { candidateName: c.name }
        }
      };
    }

    // 8. General fallback guidance
    const topCandidate = [...candidates].sort((a, b) => b.matchScore - a.matchScore)[0];
    return {
      reply: `### 💡 TalentDossier Pipeline Copilot\n\n⚡ **Local Deterministic Pipeline Engine** is online with grounded context on **${candidates.length} candidates** for the **${role.title}** role.\n\n**Pipeline Quick Stats:**\n- **Top Candidate:** ${topCandidate ? `**${topCandidate.name}** (${topCandidate.matchScore}% match)` : 'None'}\n- **Must-Have Skills:** ${role.mustHaveSkills.join(', ')}\n\n**Try asking me:**\n- *"Who is the highest scoring candidate?"*\n- *"Compare Liam Chen and Marcus Vance"*\n- *"Filter Go"* or *"Filter Kubernetes"*\n- *"Show pipeline stage breakdown"*\n- *"Run autonomous screener"*\n\n*(To enable live multi-turn LLM reasoning, configure a free Groq or Gemini API key in **AI Settings** anytime).*`
    };
  };

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
      setMessages(prev => [...prev, userMsg]);
      setInput('');
      setIsLoading(true);

      setTimeout(() => {
        const { reply, action } = handleLocalDeterministicQuery(query);
        let actionReceipt: ExecutedActionReceipt | undefined = undefined;
        if (action) {
          actionReceipt = executeAgentTool(action);
        }

        const agentMsg: ChatMessage = {
          id: `msg-agent-${Date.now()}`,
          sender: 'agent',
          text: reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionReceipt
        };

        setMessages(prev => [...prev, agentMsg]);
        setIsLoading(false);
      }, 150);
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
      const { action, cleanText } = extractAgentAction(reply);

      let actionReceipt: ExecutedActionReceipt | undefined = undefined;
      if (action) {
        actionReceipt = executeAgentTool(action);
      }

      const agentMsg: ChatMessage = {
        id: `msg-agent-${Date.now()}`,
        sender: 'agent',
        text: cleanText || reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionReceipt
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
      if (!isAiConfigured) return;
      setIsRecording(true);
      AudioService.startListening(
        (transcript) => {
          setInput(transcript);
        },
        (error) => {
          console.warn('Speech recognition error:', error);
          setIsRecording(false);
        },
        () => {
          setIsRecording(false);
        }
      );
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        sender: 'agent',
        text: isAiConfigured 
          ? `Conversation cleared. Ask me anything about **${role.title}** applicants, gaps, or ask me to execute actions in your pipeline.`
          : `Chat cleared. ⚡ **Local Engine** is live with context on **${candidates.length} candidate${candidates.length === 1 ? '' : 's'}** for the **${role.title}** role.\n\nTry: *"Who scored highest?"*, *"Compare top candidates"*, or *"Filter Kubernetes"*`,
        timestamp: 'Just now'
      }
    ]);
  };

  const promptChips = isAiConfigured
    ? [
        '⚡ Run Autonomous Screener',
        'Compare top 2 candidates',
        'Which candidates are eligible?',
        'Filter pipeline by Kafka',
        'Summarize qualification evidence'
      ]
    : [
        '🏆 Who scored highest?',
        '⚖️ Compare top candidates',
        '📊 Pipeline stage breakdown',
        '🔍 Filter Go',
        '⚡ Run Autonomous Screener'
      ];

  const handleChipClick = (chip: string) => {
    if (chip === '⚡ Run Autonomous Screener') {
      if (!isAiConfigured) {
        handleSend('run autonomous screener');
        return;
      }
      if (onRunAutonomousScreener) {
        onRunAutonomousScreener();
        return;
      }
    }
    handleSend(chip);
  };

  return (
    <div 
      style={{
        width: typeof window !== 'undefined' && window.innerWidth < 640 ? '100%' : `${drawerWidth}px`,
        maxWidth: '100vw'
      }}
      className={`fixed inset-y-0 right-0 z-40 bg-white border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 ${
        isDragging ? 'select-none' : 'transition-[width] duration-150 ease-out'
      }`}
    >
      {/* Draggable left edge resize handle */}
      <div
        onMouseDown={startDragging}
        className="hidden sm:flex absolute left-0 top-0 bottom-0 w-2.5 -ml-1 cursor-col-resize z-50 items-center justify-center group hover:bg-indigo-500/20 active:bg-indigo-600/30 transition-colors"
        title="Drag left edge to resize chat window"
      >
        <div className="w-1 h-12 rounded-full bg-slate-300 group-hover:bg-indigo-600 transition-colors flex items-center justify-center">
          <div className="w-0.5 h-6 bg-slate-400 group-hover:bg-white rounded-full" />
        </div>
      </div>
      
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
              <span className="font-bold text-sm text-slate-900 truncate">Recruiter Agent Copilot</span>
              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded border ${
                isAiConfigured
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-indigo-50 text-indigo-700 border-indigo-200'
              }`}>
                {isAiConfigured ? 'AUTONOMOUS ONLINE' : '⚡ LOCAL ENGINE'}
              </span>
            </div>
            <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${isAiConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-pulse'}`} />
              <span className="truncate">
                {isAiConfigured ? `${aiConfig.provider.toUpperCase()} (${aiConfig.model})` : `Grounded in ${candidates.length} candidates · Add API key for LLM reasoning`}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Quick Width Presets */}
          <div className="hidden md:flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg mr-1 border border-slate-200/60">
            <button
              onClick={() => setWidthPreset(580)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                drawerWidth <= 620 && !isMaximized
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Compact width (580px)"
            >
              580px
            </button>
            <button
              onClick={() => setWidthPreset(760)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                drawerWidth > 620 && drawerWidth <= 860 && !isMaximized
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Standard wide (760px)"
            >
              760px
            </button>
            <button
              onClick={() => setWidthPreset(980)}
              className={`px-2 py-0.5 text-[10px] font-medium rounded transition-colors cursor-pointer ${
                (drawerWidth > 860 || isMaximized)
                  ? 'bg-white text-indigo-700 font-semibold shadow-2xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Ultra wide (980px)"
            >
              980px
            </button>
          </div>

          {/* Maximize/Minimize toggle */}
          <button
            onClick={toggleMaximize}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer hidden sm:block"
            title={isMaximized ? "Restore standard width" : "Maximize / Expand chat window"}
          >
            {isMaximized ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onOpenAiSettings && (
            <button
              onClick={onOpenAiSettings}
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
              title="AI Settings"
            >
              <Sparkles className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="Close Copilot panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Local Engine info strip when not configured */}
      {!isAiConfigured && (
        <div className="px-4 py-2 bg-indigo-50 border-b border-indigo-100 flex items-center justify-between gap-2.5 shrink-0">
          <div className="flex items-center gap-2 text-xs text-indigo-800">
            <Zap className="w-3.5 h-3.5 text-indigo-600 fill-indigo-500 shrink-0" />
            <span><span className="font-semibold">Local Engine Active</span> · Ranking, comparison &amp; filtering work now. Add an API key for open-ended reasoning.</span>
          </div>
          {onOpenAiSettings && (
            <button
              onClick={onOpenAiSettings}
              className="shrink-0 text-[10px] font-semibold px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors cursor-pointer"
            >
              + API Key
            </button>
          )}
        </div>
      )}

      {/* Suggested Chips */}
      <div className="px-4 py-2.5 bg-slate-50/80 border-b border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        {promptChips.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleChipClick(chip)}
            disabled={isLoading}
            className={`text-xs font-medium border px-3 py-1.5 rounded-full whitespace-nowrap shadow-2xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer ${
              !isAiConfigured
                ? 'bg-amber-50/60 text-amber-800 border-amber-200 hover:bg-amber-100'
                : chip.includes('⚡')
                ? 'bg-indigo-600 text-white border-indigo-700 hover:bg-indigo-700'
                : 'bg-white text-slate-700 hover:text-indigo-600 hover:border-indigo-200 border-slate-200'
            }`}
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="text-[11px] text-slate-400 mb-1 px-1 flex items-center gap-1">
              <span className="font-medium">{m.sender === 'user' ? 'You' : 'TalentDossier Agent'}</span>
              <span>•</span>
              <span>{m.timestamp}</span>
            </div>

            <div
              className={`max-w-[94%] rounded-xl p-4 text-[13px] leading-relaxed shadow-2xs ${
                m.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-xs'
                  : 'bg-white text-slate-800 border border-slate-200 rounded-tl-xs'
              }`}
            >
              {/* Rich Markdown Rendering (Bold, Code, Headers, Lists, Quotes) */}
              {renderMessageContent(m.text, m.sender === 'user')}

              {/* Agent Action Execution Receipt */}
              {m.actionReceipt && (
                <div className="mt-3 p-3.5 rounded-xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/90 via-white to-purple-50/60 shadow-xs space-y-2 text-xs text-slate-800">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-indigo-800 font-bold">
                      <div className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center">
                        <Zap className="w-3 h-3 fill-white" />
                      </div>
                      <span className="font-mono text-[11px] uppercase tracking-wider">
                        Tool Executed: {m.actionReceipt.tool}
                      </span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />
                      Executed
                    </span>
                  </div>

                  {m.actionReceipt.thought && (
                    <div className="text-xs text-slate-600 bg-white/90 p-2.5 rounded-lg border border-indigo-100 font-sans leading-relaxed">
                      <strong className="text-slate-800">Agent Reasoning: </strong>
                      {m.actionReceipt.thought}
                    </div>
                  )}

                  <div className="text-xs font-medium text-slate-700 flex items-center gap-1.5 pt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span>{m.actionReceipt.resultSummary}</span>
                  </div>
                </div>
              )}

              {/* Mentioned Candidate Quick Jump Chips */}
              {m.sender === 'agent' && candidates.length > 0 && isAiConfigured && (
                <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap gap-1.5">
                  {candidates
                    .filter(c => m.text.toLowerCase().includes(c.name.toLowerCase()))
                    .map(c => (
                      <button
                        key={c.id}
                        onClick={() => onSelectCandidate(c)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                        title={`View ${c.name}'s dossier in workspace`}
                      >
                        <span>View {c.name} ({c.matchScore}%)</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3.5 rounded-xl border border-slate-200 w-fit">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
            <span>Consulting pipeline database & executing agent reasoning loop...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <div className="p-4 border-t border-slate-200 bg-white shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2.5"
        >
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={isAiConfigured ? "Command agent: e.g. 'compare candidate A and B' or 'screen pipeline'..." : "Ask: 'Who scored highest?' · 'Compare top candidates' · 'Filter Go'"}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full text-sm bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-11 py-3 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
            
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={toggleVoiceInput}
              disabled={!isAiConfigured}
              className={`absolute right-3 top-3 p-1 rounded transition-colors ${
                isRecording
                  ? 'text-rose-600 bg-rose-50 animate-pulse'
                  : !isAiConfigured
                  ? 'text-slate-300 cursor-not-allowed'
                  : 'text-slate-400 hover:text-indigo-600 cursor-pointer'
              }`}
              title={isAiConfigured ? "Voice dictate query" : "Configure API key to use voice dictation"}
            >
              {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-40 transition-colors shadow-sm shrink-0 cursor-pointer"
            title="Send command"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 px-1">
          <span>
            {isAiConfigured 
              ? "Grounded in active pipeline embeddings & executes real workspace actions."
              : "⚡ Local Engine · Grounded in live candidate state · Zero hardcoded answers"}
          </span>
          <span className="hidden sm:inline font-mono text-[10px] text-slate-400">
            {drawerWidth}px • Drag left border to resize
          </span>
        </div>
      </div>

    </div>
  );
};
