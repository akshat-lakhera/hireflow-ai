import React, { useState, useEffect } from 'react';
import { CandidateCaseFile, RoleSetup } from '../types';
import { GmailSyncService, EmailDispatchLog, GmailConfig } from '../services/gmailSyncService';
import { 
  Mail, 
  Send, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Settings, 
  AlertCircle,
  Key,
  Lock,
  RefreshCw
} from 'lucide-react';

interface EmailApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateCaseFile | null;
  role: RoleSetup;
  targetStatus: CandidateCaseFile['reviewStatus'];
  onEmailSent?: (log: EmailDispatchLog) => void;
  onOpenGmailSettings?: () => void;
  onDismissWithoutSending?: (candidate: CandidateCaseFile, recipientEmail: string) => void;
}

export const EmailApprovalModal: React.FC<EmailApprovalModalProps> = ({
  isOpen,
  onClose,
  candidate,
  role,
  targetStatus,
  onEmailSent,
  onOpenGmailSettings,
  onDismissWithoutSending
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  // Missing credential inline capture & verification state
  const [inlineKey, setInlineKey] = useState('');
  const [inlineSender, setInlineSender] = useState('recruiting@talentdossier.ai');
  const [inlineProvider, setInlineProvider] = useState<'gmail' | 'sendgrid' | 'smtp' | 'emailjs'>('emailjs');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [isConfigured, setIsConfigured] = useState<boolean>(() => GmailSyncService.isConfigured());
  const [currentConfig, setCurrentConfig] = useState<GmailConfig>(() => GmailSyncService.getConfig());

  useEffect(() => {
    if (isOpen) {
      const cfg = GmailSyncService.getConfig();
      setCurrentConfig(cfg);
      setIsConfigured(GmailSyncService.isConfigured());
      setInlineKey(cfg.apiKey || '');
      setInlineSender(cfg.senderEmail || 'recruiting@talentdossier.ai');
      setInlineProvider(cfg.provider || 'gmail');
      setVerifyError(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (candidate && isOpen) {
      const generated = GmailSyncService.generateCandidateEmail(candidate, role, targetStatus);
      setSubject(generated.subject);
      setBody(generated.body);
      setRecipient(generated.to);
      setSentSuccess(false);
      setIsSending(false);
    }
  }, [candidate, role, targetStatus, isOpen]);

  if (!isOpen || !candidate) return null;

  const handleDismiss = () => {
    if (!sentSuccess && candidate) {
      onDismissWithoutSending?.(candidate, recipient);
    }
    onClose();
  };

  const handleVerifyAndSend = async () => {
    setVerifyError(null);

    // 1. If key is missing or short, block and explain
    if (!inlineKey.trim()) {
      setVerifyError('Email cannot be sent: SMTP / API Key is missing. Please enter your API key or App Password.');
      return;
    }

    setIsVerifying(true);
    try {
      const testConfig: GmailConfig = {
        ...currentConfig,
        provider: inlineProvider,
        apiKey: inlineKey.trim(),
        senderEmail: inlineSender.trim() || 'recruiting@talentdossier.ai',
        senderName: 'Talent Acquisition Team'
      };

      const result = await GmailSyncService.testConnection(testConfig);
      if (!result.success) {
        setVerifyError(`Connection failed: ${result.message} Please check your credentials and try again.`);
        setIsVerifying(false);
        return;
      }

      // 2. Connection verified! Save config
      GmailSyncService.saveConfig(testConfig);
      setIsConfigured(true);
      setCurrentConfig(testConfig);
      setIsVerifying(false);

      // 3. Now dispatch email
      await executeDispatch();
    } catch (err: any) {
      setVerifyError(`Connection error: ${err?.message || 'Host unreachable'}. Please verify key and try again.`);
      setIsVerifying(false);
    }
  };

  const executeDispatch = async () => {
    if (!recipient.trim() || !subject.trim() || !body.trim()) return;
    setIsSending(true);
    try {
      const log = await GmailSyncService.dispatchEmail(candidate, subject, body);
      setSentSuccess(true);
      onEmailSent?.(log);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err) {
      console.error('Email dispatch error:', err);
      setVerifyError('Failed to dispatch message via mail gateway.');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendStandard = async () => {
    if (!isConfigured) {
      handleVerifyAndSend();
      return;
    }
    await executeDispatch();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Automated Candidate Email Dispatch</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Human-in-the-Loop
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Candidate synchronized to <span className="font-bold text-white">{targetStatus}</span>. Confirm or customize automated dispatch.
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Cancel & Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          
          {/* Status sync callout */}
          <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                {candidate.initials}
              </div>
              <div>
                <div className="font-semibold text-slate-900 text-sm">{candidate.name}</div>
                <div className="text-[11px] text-slate-500">{candidate.currentRole} • Match: <strong className="text-indigo-600">{candidate.matchScore}%</strong></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Dispatch Trigger:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                targetStatus === 'Passed Screen' || targetStatus === 'Offer Extended'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : targetStatus === 'Interview Ready'
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                  : targetStatus === 'Needs Review'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {targetStatus === 'Passed Screen' || targetStatus === 'Offer Extended' ? 'Selected for Role' : targetStatus}
              </span>
            </div>
          </div>

          {/* MISSING CREDENTIALS / INLINE SETUP GATE */}
          {!isConfigured ? (
            <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-bold text-amber-900 text-xs">
                    SMTP / Email Service Key Missing
                  </h4>
                  <p className="text-amber-800 text-[11px] mt-0.5 leading-relaxed">
                    Automated email <strong>cannot be sent</strong> until an API key or SMTP password is provided. Please supply credentials below; we will verify the connection first before transmitting.
                  </p>
                </div>
              </div>

              {verifyError && (
                <div className="p-2.5 bg-rose-100 border border-rose-200 text-rose-800 rounded-lg text-[11px] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{verifyError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Provider</label>
                  <select
                    value={inlineProvider}
                    onChange={e => setInlineProvider(e.target.value as any)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="gmail">Google Gmail (App Password)</option>
                    <option value="sendgrid">SendGrid API</option>
                    <option value="smtp">Custom SMTP Server</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    API Key / SMTP App Password *
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={inlineKey}
                      onChange={e => { setInlineKey(e.target.value); setVerifyError(null); }}
                      placeholder="e.g. 16-character Gmail App Password or SG.xxx"
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <Key className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-[11px] text-emerald-800">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Email Synced: <strong className="font-mono text-emerald-900">{currentConfig.senderEmail}</strong> ({currentConfig.provider.toUpperCase()})
              </span>
              <button
                type="button"
                onClick={() => setIsConfigured(false)}
                className="text-emerald-700 hover:text-emerald-900 underline font-medium cursor-pointer"
              >
                Change credentials
              </button>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recipient Email (from resume)</label>
              <input
                type="email"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
                placeholder="candidate@example.com"
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Subject Line</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-700">Automated Notification Body</label>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Personalized to {candidate.name}
                </span>
              </div>
              <textarea
                rows={8}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg p-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-500">
            {sentSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Email successfully dispatched to {candidate.name}!
              </span>
            ) : !isConfigured ? (
              <span className="text-amber-700 font-medium flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Credentials required before transmission.
              </span>
            ) : (
              <span>HR Approval confirmed before automated dispatch.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDismiss}
              disabled={isSending || isVerifying}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              Cancel / Do Not Send
            </button>

            <button
              type="button"
              onClick={handleSendStandard}
              disabled={isSending || isVerifying || sentSuccess}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Connection...</span>
                </>
              ) : isSending ? (
                <>
                  <Send className="w-3.5 h-3.5 animate-bounce" />
                  <span>Dispatching Email...</span>
                </>
              ) : sentSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Dispatched!</span>
                </>
              ) : !isConfigured ? (
                <>
                  <Key className="w-3.5 h-3.5" />
                  <span>Verify Connection & Send</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Approve & Send Email</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
