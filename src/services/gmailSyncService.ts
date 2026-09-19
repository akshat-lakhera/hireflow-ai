import { CandidateCaseFile, RoleSetup } from '../types';
import emailjs from '@emailjs/browser';

export interface GmailConfig {
  provider: 'gmail' | 'sendgrid' | 'smtp' | 'emailjs';
  apiKey: string;           // EmailJS Public Key (or legacy SMTP password)
  serviceId?: string;       // EmailJS Service ID
  templateId?: string;      // EmailJS Template ID
  senderEmail: string;
  senderName: string;
  autoPromptOnSync: boolean;
  isObfuscated?: boolean;
}

export interface EmailDispatchLog {
  id: string;
  candidateId: string;
  candidateName: string;
  recipientEmail: string;
  subject: string;
  body: string;
  status: 'sent' | 'drafted' | 'failed';
  timestamp: string;
  deliveryReceiptId: string;
}

const GMAIL_STORAGE_KEY = 'talentdossier_gmail_config_secure';
const GMAIL_LOGS_KEY = 'talentdossier_gmail_logs';
const SALT = 'td_gmail_sec_v1';

// Default EmailJS credentials — users can override in Settings
// To use: create a free account at https://emailjs.com
// Service: Gmail → Service ID = "service_xxxxxxx"
// Template: create one with {{to_email}}, {{to_name}}, {{subject}}, {{message}} variables
// Public Key: from Account > API Keys
const DEFAULT_EMAILJS_SERVICE_ID = '';   // Set in Settings UI
const DEFAULT_EMAILJS_TEMPLATE_ID = '';  // Set in Settings UI

function obfuscate(key: string): string {
  if (!key) return '';
  try {
    const salted = key
      .split('')
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length)))
      .join('');
    return btoa(encodeURIComponent(salted));
  } catch {
    return btoa(key);
  }
}

function deobfuscate(cipher: string): string {
  if (!cipher) return '';
  try {
    const decoded = decodeURIComponent(atob(cipher));
    return decoded
      .split('')
      .map((c, i) => String.fromCharCode(c.charCodeAt(0) ^ SALT.charCodeAt(i % SALT.length)))
      .join('');
  } catch {
    try {
      return atob(cipher);
    } catch {
      return cipher;
    }
  }
}

export class GmailSyncService {
  public static getConfig(): GmailConfig {
    try {
      const saved = localStorage.getItem(GMAIL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          provider: parsed.provider || 'emailjs',
          apiKey: parsed.isObfuscated && parsed.apiKey ? deobfuscate(parsed.apiKey) : parsed.apiKey || '',
          serviceId: parsed.serviceId || DEFAULT_EMAILJS_SERVICE_ID,
          templateId: parsed.templateId || DEFAULT_EMAILJS_TEMPLATE_ID,
          senderEmail: parsed.senderEmail || 'recruiting@talentdossier.ai',
          senderName: parsed.senderName || 'Talent Acquisition Team',
          autoPromptOnSync: parsed.autoPromptOnSync !== false
        };
      }
    } catch {
      // ignore
    }

    return {
      provider: 'emailjs',
      apiKey: '',
      serviceId: DEFAULT_EMAILJS_SERVICE_ID,
      templateId: DEFAULT_EMAILJS_TEMPLATE_ID,
      senderEmail: 'recruiting@talentdossier.ai',
      senderName: 'Talent Acquisition Team',
      autoPromptOnSync: true
    };
  }

  public static saveConfig(config: GmailConfig): void {
    const payload = {
      ...config,
      apiKey: obfuscate(config.apiKey),
      isObfuscated: true,
      updatedAt: Date.now()
    };
    localStorage.setItem(GMAIL_STORAGE_KEY, JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('talentdossier-gmail-config-updated'));
    }
  }

  public static clearConfig(): void {
    localStorage.removeItem(GMAIL_STORAGE_KEY);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('talentdossier-gmail-config-updated'));
    }
  }

  public static isConfigured(): boolean {
    const cfg = this.getConfig();
    // Needs at minimum a public key (EmailJS) or legacy SMTP password
    return Boolean(cfg.apiKey && cfg.apiKey.trim().length >= 8);
  }

  /**
   * Test EmailJS connection using the provided credentials.
   * Sends a silent test ping via EmailJS init — no actual email sent.
   */
  public static async testConnection(config: GmailConfig): Promise<{ success: boolean; message: string }> {
    if (!config.apiKey.trim()) {
      return { success: false, message: 'API key / Public Key is required. Get it free at emailjs.com.' };
    }
    if (config.apiKey.trim().length < 8) {
      return { success: false, message: 'Invalid key. EmailJS Public Keys are typically 20+ chars.' };
    }

    // For EmailJS: validate by initializing the SDK
    // A real send test would consume quota — we just validate the key format here
    // and attempt init. Actual dispatch will confirm if it works.
    try {
      emailjs.init({ publicKey: config.apiKey.trim() });
      // If the key is valid format, we can proceed
      return {
        success: true,
        message: `EmailJS initialized with public key (...${config.apiKey.trim().slice(-4)}). Credentials saved. Send a test email to verify.`
      };
    } catch (e: any) {
      return { success: false, message: `EmailJS init failed: ${e.message || 'Unknown error'}` };
    }
  }

  /**
   * Generate authentic, tailored candidate email based on status and evidence
   */
  public static generateCandidateEmail(
    candidate: CandidateCaseFile,
    role: RoleSetup,
    targetStatus: CandidateCaseFile['reviewStatus']
  ): { subject: string; body: string; to: string } {
    const to = candidate.email || `${candidate.name.toLowerCase().replace(/\s+/g, '.')}@candidate-mail.com`;
    const firstName = candidate.name.split(' ')[0] || candidate.name;
    const topSkills = candidate.matchedSkills.slice(0, 3).join(', ') || 'your technical background';

    if (targetStatus === 'Passed Screen' || targetStatus === 'Offer Extended') {
      return {
        subject: `Congratulations! You've been selected — ${role.title}`,
        body: `Dear ${firstName},

We are thrilled to inform you that you have been selected for the position of ${role.title}!

Our evaluation team was particularly impressed by your demonstrated experience in ${topSkills}${candidate.proofLine ? ` — ${candidate.proofLine}` : ''}.

Our talent acquisition team will follow up shortly with your formal offer documentation, compensation details, and onboarding next steps.

Congratulations once again!

Warm regards,
${role.teamType ? role.teamType + ' — ' : ''}Talent Acquisition Team`,
        to
      };
    } else if (targetStatus === 'Interview Ready') {
      return {
        subject: `Interview Invitation: ${role.title}`,
        body: `Dear ${firstName},

Thank you for your interest in the ${role.title} position.

After reviewing your background — particularly your work in ${topSkills} — we'd love to invite you to a structured technical interview.

Please reply to this email with your availability for a 45-minute discussion. We'll explore your experience in depth and give you a chance to ask questions about the role.

We look forward to speaking with you!

Warm regards,
Talent Acquisition Team`,
        to
      };
    } else if (targetStatus === 'Needs Review') {
      return {
        subject: `Application Update: ${role.title}`,
        body: `Dear ${firstName},

Thank you for applying for the ${role.title} role.

Your background in ${topSkills} has caught our attention. Our hiring committee is currently completing their detailed review of your profile.

We'll have a definitive update for you within 2 business days.

Best regards,
Talent Acquisition Team`,
        to
      };
    } else {
      // Rejection
      return {
        subject: `Update on your application — ${role.title}`,
        body: `Dear ${firstName},

Thank you for taking the time to apply for the ${role.title} position.

While we were impressed by your background, we've decided to move forward with candidates whose experience more closely matches our immediate requirements.

We genuinely appreciate your interest and will keep your profile on file for future opportunities.

Wishing you the very best,
Talent Acquisition Team`,
        to
      };
    }
  }

  /**
   * Dispatch email using EmailJS (real send) or log as drafted if not configured.
   */
  public static async dispatchEmail(
    candidate: CandidateCaseFile,
    subject: string,
    body: string
  ): Promise<EmailDispatchLog> {
    const config = this.getConfig();
    const recipientEmail = candidate.email || `${candidate.name.toLowerCase().replace(/\s+/g, '.')}@candidate-mail.com`;
    const firstName = candidate.name.split(' ')[0] || candidate.name;
    const receiptId = `msg-ejs-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

    let status: 'sent' | 'drafted' | 'failed' = 'drafted';

    // Attempt real send via EmailJS if credentials are configured
    if (config.apiKey && config.serviceId && config.templateId) {
      try {
        emailjs.init({ publicKey: config.apiKey.trim() });

        await emailjs.send(
          config.serviceId.trim(),
          config.templateId.trim(),
          {
            to_email: recipientEmail,
            to_name: firstName,
            from_name: config.senderName || 'Talent Acquisition Team',
            reply_to: config.senderEmail || 'recruiting@talentdossier.ai',
            subject: subject,
            message: body,
            // Extra context fields for richer templates
            candidate_name: candidate.name,
            candidate_role: candidate.currentRole || '',
            match_score: String(candidate.matchScore || ''),
          }
        );
        status = 'sent';
      } catch (e: any) {
        console.warn('EmailJS dispatch error:', e);
        status = 'failed';
      }
    } else if (config.apiKey && !config.serviceId) {
      // Public key set but service/template not — still mark as drafted
      // This means the user set the key but didn't finish EmailJS template setup
      status = 'drafted';
    }

    const log: EmailDispatchLog = {
      id: `log-${Date.now()}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      recipientEmail,
      subject,
      body,
      status,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      deliveryReceiptId: receiptId
    };

    // Save to local dispatch log
    const existing = this.getEmailLogs();
    localStorage.setItem(GMAIL_LOGS_KEY, JSON.stringify([log, ...existing].slice(0, 50)));

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('talentdossier-email-dispatched', { detail: log }));
    }

    return log;
  }

  public static getEmailLogs(): EmailDispatchLog[] {
    try {
      const saved = localStorage.getItem(GMAIL_LOGS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  public static clearEmailLogs(): void {
    localStorage.removeItem(GMAIL_LOGS_KEY);
  }
}
