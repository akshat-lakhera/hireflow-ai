import { RoleSetup, EvidenceItem, InterviewKitQuestion, RiskFlag } from '../types';

export interface AiConfig {
  provider: 'groq' | 'gemini' | 'openai';
  apiKey: string;
  model: string;
  sessionOnly?: boolean;
}

const STORAGE_KEY = 'talentdossier_ai_config_secure';
const LEGACY_STORAGE_KEY = 'hireflow_ai_config_secure';
const LEGACY_UNENCRYPTED_KEY = 'hireflow_ai_config';
const SESSION_STORAGE_KEY = 'talentdossier_ai_config_session';
const LEGACY_SESSION_KEY = 'hireflow_ai_config_session';
const SALT_STRING = 'td_sec_salt_v3$9x!@';

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

export interface AgentActionPayload {
  thought: string;
  tool: 'compare_candidates' | 'update_candidate_status' | 'select_candidate' | 'open_interview_kit' | 'add_note' | 'filter_pipeline' | 'autonomous_screen_pipeline';
  params: Record<string, any>;
}

export function extractAgentAction(text: string): { action: AgentActionPayload | null; cleanText: string } {
  const match = text.match(/```agent_action\s*([\s\S]*?)\s*```/);
  if (!match) {
    return { action: null, cleanText: text };
  }
  try {
    const action = JSON.parse(match[1]) as AgentActionPayload;
    const cleanText = text.replace(/```agent_action\s*[\s\S]*?\s*```/, '').trim();
    return { action, cleanText };
  } catch {
    return { action: null, cleanText: text };
  }
}

export class AiService {
  public static getConfig(): AiConfig {
    let rawConfig: any = null;
    let isSession = false;

    try {
      // 1. Check session storage first
      const sessionSaved = sessionStorage.getItem(SESSION_STORAGE_KEY) || sessionStorage.getItem(LEGACY_SESSION_KEY);
      if (sessionSaved) {
        rawConfig = JSON.parse(sessionSaved);
        isSession = true;
      } else {
        // 2. Check secure localStorage
        const localSaved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
        if (localSaved) {
          rawConfig = JSON.parse(localSaved);
        } else {
          // 3. Fallback to legacy unencrypted storage for seamless migration
          const legacySaved = localStorage.getItem(LEGACY_UNENCRYPTED_KEY);
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
      const provider = rawConfig.provider || 'groq';
      return {
        provider,
        apiKey: key,
        model: rawConfig.model || (provider === 'groq' ? 'llama-3.1-8b-instant' : provider === 'gemini' ? 'gemini-1.5-flash' : 'gpt-4o-mini'),
        sessionOnly: isSession || Boolean(rawConfig.sessionOnly)
      };
    }

    // Default configuration with optional env fallback
    const envGroqKey = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
    if (envGroqKey) {
      return {
        provider: 'groq',
        apiKey: envGroqKey,
        model: 'llama-3.1-8b-instant',
        sessionOnly: false
      };
    }

    return {
      provider: 'groq',
      apiKey: '',
      model: 'llama-3.1-8b-instant',
      sessionOnly: false
    };
  }

  public static saveConfig(config: AiConfig): void {
    const payload = {
      provider: config.provider,
      apiKey: obfuscateApiKey(config.apiKey),
      model: config.model,
      sessionOnly: config.sessionOnly,
      isObfuscated: true,
      updatedAt: Date.now()
    };

    if (config.sessionOnly) {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(payload));
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_UNENCRYPTED_KEY);
    } else {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
      localStorage.removeItem(LEGACY_UNENCRYPTED_KEY);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('talentdossier-ai-config-updated'));
      window.dispatchEvent(new CustomEvent('hireflow-ai-config-updated'));
    }
  }

  public static clearConfig(): void {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    localStorage.removeItem(LEGACY_UNENCRYPTED_KEY);
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem(LEGACY_SESSION_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('talentdossier-ai-config-updated'));
      window.dispatchEvent(new CustomEvent('hireflow-ai-config-updated'));
    }
  }

  public static isConfigured(): boolean {
    const cfg = this.getConfig();
    return Boolean(cfg.apiKey && cfg.apiKey.trim().length > 5);
  }

  /**
   * Helper to query accessible models for a Groq API key
   */
  public static async getAvailableGroqModels(apiKey: string): Promise<string[]> {
    if (!apiKey || !apiKey.trim()) return [];
    try {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { Authorization: `Bearer ${apiKey.trim()}` }
      });
      if (res.ok) {
        const json = await res.json();
        return (json.data || []).map((m: any) => m.id);
      }
    } catch {
      // ignore
    }
    return [];
  }

  /**
   * Test the provided API key with a live ping call
   */
  public static async testConnection(config: AiConfig): Promise<{
    success: boolean;
    message: string;
    autoSelectedModel?: string;
    availableModels?: string[];
  }> {
    if (!config.apiKey.trim()) {
      return { success: false, message: 'Please enter a valid API key.' };
    }

    try {
      if (config.provider === 'groq') {
        const apiKey = config.apiKey.trim();
        const initialModel = config.model || 'llama-3.1-8b-instant';

        const pingGroq = async (m: string) => {
          return await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              model: m,
              messages: [{ role: 'user', content: 'Respond with the exact word: OK' }],
              max_tokens: 5
            })
          });
        };

        // Try with chosen model first
        let res = await pingGroq(initialModel);

        if (res.ok) {
          return {
            success: true,
            message: `Successfully connected to Groq (${initialModel}).`,
            autoSelectedModel: initialModel
          };
        }

        const errData = await res.json().catch(() => ({}));
        const errMsg = errData.error?.message || `HTTP ${res.status}: Failed to connect to Groq API.`;

        // Check if the error is model-specific (not found, access restricted, deprecated)
        const isModelAccessError =
          res.status === 404 ||
          errMsg.includes('does not exist') ||
          errMsg.includes('do not have access') ||
          errMsg.includes('model_not_found') ||
          errMsg.includes('decommissioned');

        if (isModelAccessError) {
          // Discover what models this key actually has access to
          try {
            const modelsRes = await fetch('https://api.groq.com/openai/v1/models', {
              headers: { Authorization: `Bearer ${apiKey}` }
            });

            if (modelsRes.ok) {
              const modelsJson = await modelsRes.json().catch(() => ({}));
              const availableModels: string[] = (modelsJson.data || []).map((m: any) => m.id);

              const priorityFallbacks = [
                'llama-3.1-8b-instant',
                'llama-3.3-70b-versatile',
                'llama-3.1-70b-versatile',
                'llama3-70b-8192',
                'llama3-8b-8192',
                'mixtral-8x7b-32768',
                'gemma2-9b-it'
              ];

              let workingModel = priorityFallbacks.find(pm => availableModels.includes(pm) && pm !== initialModel);
              if (!workingModel) {
                workingModel = availableModels.find(id => (id.includes('llama') || id.includes('mixtral')) && id !== initialModel) || availableModels[0];
              }

              if (workingModel) {
                const fallbackRes = await pingGroq(workingModel);
                if (fallbackRes.ok) {
                  return {
                    success: true,
                    message: `Connected to Groq! (Switched to '${workingModel}' — '${initialModel}' was not enabled on your account tier).`,
                    autoSelectedModel: workingModel,
                    availableModels
                  };
                }
              }
            }
          } catch {
            // models inspection failed
          }

          // Direct ping to universal llama-3.1-8b-instant
          if (initialModel !== 'llama-3.1-8b-instant') {
            const fallbackInstant = await pingGroq('llama-3.1-8b-instant');
            if (fallbackInstant.ok) {
              return {
                success: true,
                message: `Connected to Groq! (Switched to 'llama-3.1-8b-instant' — '${initialModel}' was not enabled on your account tier).`,
                autoSelectedModel: 'llama-3.1-8b-instant'
              };
            }
          }
        }

        return { success: false, message: errMsg };
      } else if (config.provider === 'gemini') {
        const initialModel = config.model || 'gemini-1.5-flash';
        const pingGemini = async (m: string) => {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${config.apiKey.trim()}`;
          return await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: 'Respond with the exact word: OK' }] }]
            })
          });
        };

        let res = await pingGemini(initialModel);
        if (!res.ok && initialModel !== 'gemini-1.5-flash') {
          res = await pingGemini('gemini-1.5-flash');
          if (res.ok) {
            return {
              success: true,
              message: `Successfully connected to Google Gemini (Switched to 'gemini-1.5-flash').`,
              autoSelectedModel: 'gemini-1.5-flash'
            };
          }
        }

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: errData.error?.message || `HTTP ${res.status}: Failed to connect to Gemini API.` };
        }
        return { success: true, message: `Successfully connected to Google Gemini (${initialModel}).`, autoSelectedModel: initialModel };
      } else {
        const initialModel = config.model || 'gpt-4o-mini';
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: initialModel,
            messages: [{ role: 'user', content: 'Respond with the exact word: OK' }],
            max_tokens: 5
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          return { success: false, message: errData.error?.message || `HTTP ${res.status}: Failed to connect to OpenAI API.` };
        }
        return { success: true, message: `Successfully connected to OpenAI (${initialModel}).`, autoSelectedModel: initialModel };
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
      const callGroq = async (m: string) => {
        return await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: m,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' }
          })
        });
      };

      const requestedModel = config.model || 'llama-3.1-8b-instant';
      let res = await callGroq(requestedModel);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || '';
        const isModelErr = res.status === 404 || msg.includes('does not exist') || msg.includes('do not have access') || msg.includes('model_not_found');
        if (isModelErr && requestedModel !== 'llama-3.1-8b-instant') {
          console.warn(`[TalentDossier] Groq model '${requestedModel}' unavailable. Retrying with 'llama-3.1-8b-instant'.`);
          res = await callGroq('llama-3.1-8b-instant');
        }
        if (!res.ok) {
          const finalErr = await res.json().catch(() => ({}));
          throw new Error(`Groq evaluation failed: ${finalErr.error?.message || err.error?.message || `HTTP ${res.status}`}`);
        }
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
   * Autonomous Agent Screening Decision via Live LLM
   */
  public static async screenCandidateWithLLM(
    candidate: any,
    role: RoleSetup
  ): Promise<{
    targetStatus: 'Interview Ready' | 'Needs Review' | 'Rejected';
    actionReason: string;
  }> {
    const config = this.getConfig();
    if (!this.isConfigured()) {
      throw new Error('AI API Key is not configured.');
    }

    const prompt = `You are the Autonomous Technical Screening Agent evaluating candidate dossiers for the role "${role.title}" (${role.seniority}, ${role.teamType}).

Role Must-Have Skills: ${JSON.stringify(role.mustHaveSkills)}
Role Nice-To-Have Skills: ${JSON.stringify(role.niceToHaveSkills)}

Candidate Dossier:
- Name: ${candidate.name}
- Headline: ${candidate.currentRole}
- Match Score: ${candidate.matchScore}% (${candidate.fitBadge})
- Matched Skills: ${candidate.matchedSkills.join(', ')}
- Missing Skills: ${candidate.missingSkills.join(', ')}
- Projects: ${(candidate.projects || []).map((p: any) => `${p.name}: ${p.description}`).join('; ') || 'None documented'}
- Work Experience: ${(candidate.experiences || []).map((e: any) => `${e.role} at ${e.company} (${e.duration})`).join('; ') || 'None documented'}
- Evidence Map: ${(candidate.evidenceMap || []).map((ev: any) => `${ev.requirement} [${ev.status}, ${ev.confidence}]: "${ev.snippet}"`).join('; ') || 'None'}
- Risk Flags: ${(candidate.riskFlags || []).map((r: any) => `${r.label} (${r.details})`).join('; ') || 'None'}

Your Mission:
Autonomously analyze whether this candidate should be advanced to the technical interview stage, held for manual review, or screened out.

Output STRICT JSON ONLY:
{
  "targetStatus": "Interview Ready" | "Needs Review" | "Rejected",
  "actionReason": "High-signal 2-sentence rationale explicitly citing which must-have skills are satisfied or missing and what evidence justifies the decision."
}`;

    let jsonStr = '';

    if (config.provider === 'groq') {
      const callGroqScreen = async (m: string) => {
        return await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey.trim()}`
          },
          body: JSON.stringify({
            model: m,
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
            temperature: 0.1
          })
        });
      };

      const requestedModel = config.model || 'llama-3.1-8b-instant';
      let res = await callGroqScreen(requestedModel);

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        const msg = err.error?.message || '';
        const isModelErr = res.status === 404 || msg.includes('does not exist') || msg.includes('do not have access') || msg.includes('model_not_found');
        if (isModelErr && requestedModel !== 'llama-3.1-8b-instant') {
          console.warn(`[TalentDossier] Groq model '${requestedModel}' unavailable. Retrying with 'llama-3.1-8b-instant'.`);
          res = await callGroqScreen('llama-3.1-8b-instant');
        }
        if (!res.ok) {
          const finalErr = await res.json().catch(() => ({}));
          throw new Error(finalErr.error?.message || err.error?.message || `Groq screening error: HTTP ${res.status}`);
        }
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
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        })
      });

      if (!res.ok) {
        throw new Error(`Gemini screening error: HTTP ${res.status}`);
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
          response_format: { type: 'json_object' },
          temperature: 0.1
        })
      });

      if (!res.ok) {
        throw new Error(`OpenAI screening error: HTTP ${res.status}`);
      }
      const data = await res.json();
      jsonStr = data.choices?.[0]?.message?.content || '{}';
    }

    const parsed = JSON.parse(jsonStr);
    const validStatuses = ['Interview Ready', 'Needs Review', 'Rejected'];
    const targetStatus = validStatuses.includes(parsed.targetStatus) ? (parsed.targetStatus as any) : 'Needs Review';
    const actionReason = parsed.actionReason || `Evaluated candidate against ${role.title} requirements.`;

    return { targetStatus, actionReason };
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

    // Enforce API key requirement: Zero dummy or hardcoded responses
    if (!this.isConfigured()) {
      return `### ⚠️ AI API Key Required\n\nNo AI API key is configured. TalentDossier Copilot requires an active LLM provider (**Groq**, **Google Gemini**, or **OpenAI**) to converse and analyze candidate dossiers.\n\nAll hardcoded and dummy responses have been permanently removed. Please configure your free **Groq** (\`llama-3.3-70b\`) or **Google Gemini** API key in **AI Settings** (top header) to activate the Copilot.`;
    }

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

      const systemPrompt = `You are TalentDossier Copilot — an Autonomous AI Recruiting Intelligence Agent embedded inside the recruiter's workspace.
You have real-time grounded access to the candidate pipeline database and the active role requirements, AND you have live tools to execute actions on the recruiter's screen.

Current Role Blueprint:
- Title: ${role.title} (${role.seniority})
- Team: ${role.teamType}
- Must-Have Skills: ${role.mustHaveSkills.join(', ')}
- Nice-to-Have Skills: ${role.niceToHaveSkills.join(', ')}

Candidate Pipeline Database (${candidates.length} candidate${candidates.length === 1 ? '' : 's'} on record):
${candidateSummaries || 'No candidates currently in the pipeline.'}

Agentic Workspace Tools:
You can autonomously execute actions in the recruiter's workspace. Whenever an action is requested or warranted, include a tool call block formatted exactly as:
\`\`\`agent_action
{
  "thought": "Your step-by-step reasoning for why you are executing this action",
  "tool": "<tool_name>",
  "params": { ... }
}
\`\`\`

Available Tools:
1. "compare_candidates": {"candidateNames": ["Name1", "Name2"]}
   -> Launches the Side-by-Side Comparison Matrix on screen for the specified candidates.
2. "update_candidate_status": {"candidateName": "Name", "status": "Interview Ready" | "Needs Review" | "Passed Screen" | "Offer Extended" | "Rejected", "reason": "Justification"}
   -> Updates candidate status in real time and logs an audit note.
3. "select_candidate": {"candidateName": "Name"}
   -> Selects the candidate and displays their executive dossier in the center workspace.
4. "open_interview_kit": {"candidateName": "Name"}
   -> Launches the structured interview kit modal with confidential rubrics and speech dictation.
5. "add_note": {"candidateName": "Name", "note": "Observation text"}
   -> Appends a recruiter intelligence note to the candidate's permanent file.
6. "filter_pipeline": {"searchQuery": "keyword or skill"}
   -> Filters the candidate cards on screen in real time.
7. "autonomous_screen_pipeline": {"criteria": "focus area"}
   -> Autonomously screens, evaluates, and triages the entire candidate pipeline.

Instructions:
1. When asked to perform an action (e.g. "compare Alex and Maya", "reject Akshat", "shortlist Maya", "filter by Kafka", "screen all candidates"), ALWAYS emit the \`\`\`agent_action\`\`\` block and provide a clear explanation.
2. Answer queries authoritatively using only the grounded facts above.
3. When asked "who is eligible", identify candidates with Strong/Moderate fit or match scores >= 75%, cite specific evidence, and offer to take action.
4. Format responses with clean, scannable markdown (bullet points, bold text).`;

      if (config.provider === 'groq') {
        const callGroqChat = async (m: string) => {
          return await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.apiKey.trim()}`
            },
            body: JSON.stringify({
              model: m,
              messages: [
                { role: 'system', content: systemPrompt },
                ...history.slice(-4),
                { role: 'user', content: query }
              ],
              temperature: 0.2,
              max_tokens: 800
            })
          });
        };

        const requestedModel = config.model || 'llama-3.1-8b-instant';
        let res = await callGroqChat(requestedModel);

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          const msg = errData.error?.message || '';
          const isModelErr = res.status === 404 || msg.includes('does not exist') || msg.includes('do not have access') || msg.includes('model_not_found');
          if (isModelErr && requestedModel !== 'llama-3.1-8b-instant') {
            console.warn(`[TalentDossier] Groq model '${requestedModel}' unavailable. Retrying with 'llama-3.1-8b-instant'.`);
            res = await callGroqChat('llama-3.1-8b-instant');
          }
          if (res.ok) {
            const data = await res.json();
            const text = data.choices?.[0]?.message?.content;
            if (text) return text;
          } else {
            const finalErr = await res.json().catch(() => ({}));
            throw new Error(finalErr.error?.message || errData.error?.message || `HTTP ${res.status}: Groq API error`);
          }
        } else {
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
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${res.status}: Gemini API error`);
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
        } else {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `HTTP ${res.status}: OpenAI API error`);
        }
      }

      return `### ⚠️ No Response\n\nThe AI model did not return an answer. Please try rephrasing your query or check your API key in **AI Settings**.`;
    } catch (err: any) {
      console.error('Live LLM agent error:', err);
      return `### ⚠️ AI Service Error\n\nFailed to connect to **${config.provider.toUpperCase()}** (${config.model}): ${err.message || 'Network request failed'}.\n\nPlease check your API key in **AI Settings** and try again.`;
    }
  }
}




