import { RoleSetup, EvidenceItem, InterviewKitQuestion, RiskFlag } from '../types';

export interface AiConfig {
  provider: 'groq' | 'gemini' | 'openai';
  apiKey: string;
  model: string;
}

const STORAGE_KEY = 'hireflow_ai_config';

export class AiService {
  public static getConfig(): AiConfig {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // ignore
    }

    // Default configuration with optional env fallback
    const envGroqKey = (import.meta as any).env?.VITE_GROQ_API_KEY || '';
    const envGeminiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
    const envOpenAiKey = (import.meta as any).env?.VITE_OPENAI_API_KEY || '';

    if (envGroqKey) {
      return { provider: 'groq', apiKey: envGroqKey, model: 'llama-3.3-70b-versatile' };
    }
    if (envGeminiKey) {
      return { provider: 'gemini', apiKey: envGeminiKey, model: 'gemini-1.5-flash' };
    }
    if (envOpenAiKey) {
      return { provider: 'openai', apiKey: envOpenAiKey, model: 'gpt-4o-mini' };
    }

    return {
      provider: 'groq',
      apiKey: '',
      model: 'llama-3.3-70b-versatile'
    };
  }

  public static saveConfig(config: AiConfig): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
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
}
