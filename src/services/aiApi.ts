import { RoleSetup, EvidenceItem, InterviewKitQuestion, RiskFlag } from '../types';

export interface AiConfig {
  provider: 'groq' | 'gemini' | 'openai';
  apiKey: string;
  model: string;
  sessionOnly?: boolean;
}

const STORAGE_KEY = 'hireflow_ai_config_secure';
const LEGACY_STORAGE_KEY = 'hireflow_ai_config';
const SESSION_STORAGE_KEY = 'hireflow_ai_config_session';
const SALT_STRING = 'hf_sec_salt_v2$9x!@';

/**
 * Base64 + Salt Obfuscation so API keys are never stored as plain text in browser storage
 */
function obfuscateApiKey(key: string): string {
  if (!key || !key.trim()) return '';
  try {
    const salted = key
      .split('')
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ SALT_STRING.charCodeAt(i % SALT_STRING.length)))
      .join('');
    return btoa(encodeURIComponent(salted));
  } catch {
    return btoa(key);
  }
}

function deobfuscateApiKey(cipher: string): string {
  if (!cipher || !cipher.trim()) return '';
  try {
    const decoded = decodeURIComponent(atob(cipher));
    return decoded
      .split('')
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ SALT_STRING.charCodeAt(i % SALT_STRING.length)))
      .join('');
  } catch {
    try {
      return atob(cipher);
    } catch {
      return cipher;
    }
  }
}

export class AiService {
  public static getConfig(): AiConfig {
    let rawConfig: any = null;
    let isSession = false;

    try {
      // 1. Check session storage first
      const sessionSaved = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (sessionSaved) {
        rawConfig = JSON.parse(sessionSaved);
        isSession = true;
      } else {
        // 2. Check secure localStorage
        const localSaved = localStorage.getItem(STORAGE_KEY);
        if (localSaved) {
          rawConfig = JSON.parse(localSaved);
        } else {
          // 3. Fallback to legacy unencrypted storage for seamless migration
          const legacySaved = localStorage.getItem(LEGACY_STORAGE_KEY);
          if (legacySaved) {
            rawConfig = JSON.parse(legacySaved);
          }
        }
      }
    } catch {
      // ignore
    }

    if (rawConfig) {
      let key = rawConfig.apiKey || '';
      if (rawConfig.isObfuscated && key) {
        key = deobfuscateApiKey(key);
      }
      return {
        provider: rawConfig.provider || 'groq',
        apiKey: key,
        model: rawConfig.model || 'llama-3.3-70b-versatile',
        sessionOnly: isSession || Boolean(rawConfig.sessionOnly)
      };
    }

    // Default configuration with optional env fallback
    const envGroqKey = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
    const envGeminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    const envOpenAiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';

    if (envGroqKey) {
      return { provider: 'groq', apiKey: envGroqKey, model: 'llama-3.3-70b-versatile', sessionOnly: false };
    }
    if (envGeminiKey) {
      return { provider: 'gemini', apiKey: envGeminiKey, model: 'gemini-1.5-flash', sessionOnly: false };
    }
    if (envOpenAiKey) {
      return { provider: 'openai', apiKey: envOpenAiKey, model: 'gpt-4o-mini', sessionOnly: false };
    }

    return {
      provider: 'groq',
      apiKey: '',
      model: 'llama-3.3-70b-versatile',
      sessionOnly: false
    };
  }

  public static saveConfig(config: AiConfig): void {
    const payload = {
      provider: config.provider,
      apiKey: obfuscateApiKey(config.apiKey),
      model: config.model,
      sessionOnly: Boolean(config.sessionOnly),
      isObfuscated: true,
      updatedAt: Date.now()
    };

    if (config.sessionOnly) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    }
  }

  public static clearConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
  }

  public static isConfigured(): boolean {
    const cfg = this.getConfig();
    return Boolean(cfg.apiKey && cfg.apiKey.trim().length > 5);
  }

  /**
   * Test the provided API key with a live ping call
   */
  public static async testConnection(config: AiConfig): Promise<{ success: boolean; message: string }> {
    if (!config.apiKey.trim()) {
      return { success: false, message: 'Please enter a valid API key.' };
    }


    try {
      if (config.provider === 'groq') {
        const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: config.model || 'llama-3.3-70b-versatile',
            messages: [{ role: 'user', content: 'Respond with the exact word: OK' }],
            max_tokens: 5
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: errData.error?.message || `HTTP ${res.status}: Failed to connect to Groq API.` };
        }
        return { success: true, message: `Successfully connected to Groq (${config.model || 'llama-3.3-70b-versatile'}).` };
      } else if (config.provider === 'gemini') {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey.trim()}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: 'Respond with the exact word: OK' }] }]
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: errData.error?.message || `HTTP ${res.status}: Failed to connect to Gemini API.` };
        }
        return { success: true, message: `Successfully connected to Google Gemini (${config.model || 'gemini-1.5-flash'}).` };
      } else {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: config.model || 'gpt-4o-mini',
            messages: [{ role: 'user', content: 'Respond with the exact word: OK' }],
            max_tokens: 5
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: errData.error?.message || `HTTP ${res.status}: Failed to connect to OpenAI API.` };
        }
        return { success: true, message: `Successfully connected to OpenAI (${config.model || 'gpt-4o-mini'}).` };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Network error connecting to AI provider.' };
    }
  }

  /**
   * Deep LLM evaluation of resume text against role requirements
   */
  public static async evaluateWithLLM(
    resumeText: string,
    role: RoleSetup
  ): Promise<{
    evidenceMap: EvidenceItem[];
    interviewQuestions: InterviewKitQuestion[];
    riskFlags: RiskFlag[];
    matchScore: number;
    fitBadge: 'Strong fit' | 'Moderate fit' | 'Potential gap';
  }> {
    const config = this.getConfig();
    if (!this.isConfigured()) {
      throw new Error('AI API Key is not configured. Please open AI Settings.');
    }

    const prompt = `You are a Principal Technical Recruiter and Engineering Hiring Manager evaluating a candidate's resume against a role specification.
Strict instructions:
- Output ONLY valid JSON, with no markdown code blocks or wrapping text.
- Ground all findings in the candidate's actual text. Do not invent facts or mock strings.

Role Specification:
Title: ${role.title} (${role.seniority})
Team: ${role.teamType}
Must-Have Requirements: ${JSON.stringify(role.mustHaveSkills)}
Nice-To-Have Skills: ${JSON.stringify(role.niceToHaveSkills)}

Candidate Resume Text:
"""
${resumeText.slice(0, 10000)}
"""

JSON Structure required:
{
  "matchScore": number (0-100),
  "fitBadge": "Strong fit" | "Moderate fit" | "Potential gap",
  "evidenceMap": [
    {
      "requirement": string,
      "evidenceSource": string (e.g. "Project: DevDash" or "Work History: Company X"),
      "snippet": string (direct quote or factual summary),
      "confidence": "High" | "Medium" | "Low",
      "status": "Verified" | "Needs validation" | "Missing"
    }
  ],
  "interviewQuestions": [
    {
      "category": string,
      "questionText": string (exact technical question to ask),
      "targetRequirement": string,
      "severityTag": "Deep dive" | "Validate" | "Clarify",
      "followUpProbe": string (What to look for in their response),
      "concernNote": string (Why this probe matters)
    }
  ],
  "riskFlags": [
    {
      "label": string,
      "severity": "low" | "medium" | "high",
      "details": string
    }
  ]
}`;

    let jsonStr = '';

    if (config.provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: config.model || 'llama-3.3-70b-versatile',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(`Groq evaluation failed: ${err.error?.message || `HTTP ${res.status}`}`);
      }
      const data = await res.json();
      jsonStr = data.choices?.[0]?.message?.content || '{}';
    } else if (config.provider === 'gemini') {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey.trim()}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' }
        })
      });

      if (!res.ok) {
        throw new Error(`Gemini evaluation failed: HTTP ${res.status}`);
      }
      const data = await res.json();
      jsonStr = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    } else {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey.trim()}`
        },
        body: JSON.stringify({
          model: config.model || 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' }
        })
      });

      if (!res.ok) {
        throw new Error(`OpenAI evaluation failed: HTTP ${res.status}`);
      }
      const data = await res.json();
      jsonStr = data.choices?.[0]?.message?.content || '{}';
    }

    const parsed = JSON.parse(jsonStr);

    return {
      matchScore: Math.min(100, Math.max(20, parsed.matchScore || 75)),
      fitBadge: parsed.fitBadge || 'Moderate fit',
      evidenceMap: (parsed.evidenceMap || []).map((ev: any, idx: number) => ({
        id: `ev-ai-${Date.now()}-${idx}`,
        requirement: ev.requirement || 'Core Requirement',
        evidenceSource: ev.evidenceSource || 'Candidate Resume',
        snippet: ev.snippet || 'Referenced in candidate history',
        confidence: ev.confidence || 'Medium',
        status: ev.status || 'Verified'
      })),
      interviewQuestions: (parsed.interviewQuestions || []).map((q: any, idx: number) => ({
        id: `q-ai-${Date.now()}-${idx}`,
        category: q.category || 'Technical Competency',
        questionText: q.questionText,
        targetRequirement: q.targetRequirement || 'Role Fit',
        severityTag: q.severityTag || 'Deep dive',
        followUpProbe: q.followUpProbe || 'Evaluate depth of architectural ownership',
        concernNote: q.concernNote || 'Verify hands-on technical contribution'
      })),
      riskFlags: (parsed.riskFlags || []).map((r: any, idx: number) => ({
        id: `rf-ai-${Date.now()}-${idx}`,
        label: r.label || 'Technical Verification Gap',
        severity: r.severity || 'medium',
        details: r.details || 'Validation recommended during technical screen'
      }))
    };
  }

  /**
   * RAG Recruiter Agent: Conversational queries over all candidates, resumes, and scores
   */
  public static async chatWithRecruiterAgent(
    query: string,
    candidates: any[],
    role: RoleSetup,
    history: Array<{ role: 'user' | 'assistant'; content: string }> = []
  ): Promise<string> {
    const config = this.getConfig();

    // 1. If configured with live LLM (Groq, Gemini, OpenAI), run true RAG
    if (this.isConfigured()) {
      try {
        const candidateSummaries = candidates.map((c, i) => {
          const projs = (c.projects || []).map((p: any) => `${p.name}: ${p.description}`).join('; ');
          const exps = (c.experiences || []).map((e: any) => `${e.role} at ${e.company} (${e.duration})`).join('; ');
          const evidence = (c.evidenceMap || []).map((ev: any) => `${ev.requirement} [${ev.status}, ${ev.confidence}]: "${ev.snippet}"`).join('; ');
          const risks = (c.riskFlags || []).map((r: any) => `${r.label} (${r.details})`).join('; ');
          return `[Candidate ${i + 1}]
Name: ${c.name}
Role: ${c.currentRole}
Score: ${c.matchScore}% (${c.fitBadge})
Status: ${c.reviewStatus}
Location: ${c.location || 'N/A'} | Email: ${c.email || 'N/A'} | Phone: ${c.phone || 'N/A'}
Skills: ${c.matchedSkills.join(', ')} (Missing: ${c.missingSkills.join(', ')})
Projects: ${projs || 'None documented'}
Work History: ${exps || 'None documented'}
Verified Evidence: ${evidence || 'None'}
Risk Flags: ${risks || 'None'}`;
        }).join('\n\n');

        const systemPrompt = `You are HireFlow Copilot — an expert AI Recruiting Intelligence Agent embedded inside the recruiter's workspace.
You have real-time grounded access to the candidate pipeline database and the active role requirements.

Current Role Blueprint:
- Title: ${role.title} (${role.seniority})
- Team: ${role.teamType}
- Must-Have Skills: ${role.mustHaveSkills.join(', ')}
- Nice-to-Have Skills: ${role.niceToHaveSkills.join(', ')}

Candidate Pipeline Database (${candidates.length} candidate${candidates.length === 1 ? '' : 's'} on record):
${candidateSummaries || 'No candidates currently in the pipeline.'}

Instructions:
1. Answer the user's query directly and authoritatively using only the grounded facts above.
2. When asked to "list candidates", provide candidate names with their match score %, current status, and key verified strengths.
3. When asked "who is eligible", identify candidates with Strong/Moderate fit or match scores >= 75%, and explain the specific evidence supporting eligibility.
4. When asked about skills, projects, or gaps, cite the specific candidate and concrete evidence.
5. If the user asks about an unknown candidate or skill not on record, state so factually.
6. Format responses with clean markdown (bullet points, bold text). Keep responses concise, scannable, and professional.`;

        if (config.provider === 'groq') {
          const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey.trim()}`
            },
            body: JSON.stringify({
              model: config.model || 'llama-3.3-70b-versatile',
              messages: [
                { role: 'system', content: systemPrompt },
                ...history.slice(-4),
                { role: 'user', content: query }
              ],
              temperature: 0.2,
              max_tokens: 800
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) return text;
          }
        } else if (config.provider === 'gemini') {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.model || 'gemini-1.5-flash'}:generateContent?key=${config.apiKey.trim()}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    { text: `${systemPrompt}\n\nUser Query: ${query}` }
                  ]
                }
              ]
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) return text;
          }
        } else {
          // OpenAI
          const res = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey.trim()}`
            },
            body: JSON.stringify({
              model: config.model || 'gpt-4o-mini',
              messages: [
                { role: 'system', content: systemPrompt },
                ...history.slice(-4),
                { role: 'user', content: query }
              ],
              temperature: 0.2,
              max_tokens: 800
            })
          });

          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) return text;
          }
        }
      } catch (err: any) {
        console.warn('Live LLM agent error, falling back to local deterministic RAG engine:', err);
      }
    }

    // 2. Intelligent Local Deterministic Fallback RAG Engine
    return this.localRagFallback(query, candidates, role);
  }

  private static localRagFallback(query: string, candidates: any[], role: RoleSetup): string {
    const q = query.toLowerCase();

    if (candidates.length === 0) {
      return `There are currently no candidates in the pipeline for **${role.title}**. Please upload a resume PDF or load a demo case to begin querying candidate data.`;
    }

    // Intent 1: List candidates
    if (q.includes('list') || q.includes('who applied') || q.includes('all candidate') || q.includes('name of candidate')) {
      const list = candidates.map(c => 
        `• **${c.name}** — ${c.currentRole} | Match Score: **${c.matchScore}%** (${c.fitBadge}) | Status: *${c.reviewStatus}*`
      ).join('\n');
      return `### Candidates in Active Pipeline (${candidates.length})\n\n${list}\n\n*Click on any candidate card on the left to inspect their full executive dossier.*`;
    }

    // Intent 2: Eligibility
    if (q.includes('eligible') || q.includes('qualified') || q.includes('pass') || q.includes('interview ready')) {
      const eligible = candidates.filter(c => c.matchScore >= 75 || c.reviewStatus === 'Interview Ready');
      if (eligible.length === 0) {
        return `No candidates currently meet the high-match eligibility threshold (≥75%) for **${role.title}**. Top candidate is **${candidates[0].name}** at ${candidates[0].matchScore}%.`;
      }
      const breakdown = eligible.map(c => 
        `• **${c.name}** (**${c.matchScore}%** - ${c.fitBadge}): Verified evidence in ${c.matchedSkills.join(', ')}. Status: *${c.reviewStatus}*.`
      ).join('\n');
      return `### Eligible Candidates for ${role.title}\n\n${breakdown}\n\nThese candidates have confirmed evidence matching the core criteria.`;
    }

    // Intent 3: Risk Flags & Gaps
    if (q.includes('risk') || q.includes('gap') || q.includes('concern') || q.includes('missing')) {
      const withRisks = candidates.filter(c => c.riskFlags && c.riskFlags.length > 0);
      if (withRisks.length === 0) {
        return `No major risk flags have been detected across the active pipeline.`;
      }
      const riskSummary = withRisks.map(c => 
        `• **${c.name}**: ${c.riskFlags.map((r: any) => `${r.label} — ${r.details}`).join('; ')}`
      ).join('\n');
      return `### Identified Qualification Gaps & Risk Flags\n\n${riskSummary}`;
    }

    // Intent 4: Specific candidate lookup
    const mentioned = candidates.find(c => q.includes(c.name.toLowerCase()) || q.includes(c.name.split(' ')[0].toLowerCase()));
    if (mentioned) {
      const projs = (mentioned.projects || []).map((p: any) => `**${p.name}** (${p.technologies || 'N/A'}): ${p.description}`).join('\n  - ');
      return `### Dossier Summary: ${mentioned.name}\n\n` +
        `• **Role**: ${mentioned.currentRole}\n` +
        `• **Match Score**: **${mentioned.matchScore}%** (${mentioned.fitBadge})\n` +
        `• **Status**: ${mentioned.reviewStatus}\n` +
        `• **Contact**: ${mentioned.email || 'N/A'} | ${mentioned.phone || 'N/A'} | ${mentioned.location}\n` +
        `• **Key Skills**: ${mentioned.matchedSkills.join(', ')}\n` +
        `• **Missing Criteria**: ${mentioned.missingSkills.join(', ') || 'None'}\n` +
        `• **Documented Projects**:\n  - ${projs || 'No projects extracted.'}`;
    }

    // Intent 5: Generic query summary
    return `### Pipeline Intelligence for ${role.title}\n\n` +
      `We have **${candidates.length} candidate${candidates.length === 1 ? '' : 's'}** evaluated against your role blueprint.\n\n` +
      `• **Top Fit**: ${candidates[0].name} (${candidates[0].matchScore}% - ${candidates[0].fitBadge})\n` +
      `• **Must-Have Requirements**: ${role.mustHaveSkills.join(', ')}\n\n` +
      `You can ask me questions like:\n` +
      `- *"List all candidates who applied"*\n` +
      `- *"Which candidates are eligible for an interview?"*\n` +
      `- *"Who has project experience in consensus or Kafka?"*\n` +
      `- *"What are the risks with ${candidates[0].name}?"*`;
  }
}

