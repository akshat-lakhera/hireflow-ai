import React, { useState, useEffect } from 'react';
import { CandidateCaseFile, RoleSetup } from '../types';
import { GmailSyncService, EmailDispatchLog } from '../services/gmailSyncService';
import { 
  Mail, 
  Send, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Settings, 
  AlertCircle,
  FileText,
  User,
  Clock
} from 'lucide-react';

interface EmailApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: CandidateCaseFile | null;
  role: RoleSetup;
  targetStatus: CandidateCaseFile['reviewStatus'];
  onEmailSent?: (log: EmailDispatchLog) => void;
  onOpenGmailSettings: () => void;
}

export const EmailApprovalModal: React.FC<EmailApprovalModalProps> = ({
  isOpen,
  onClose,
  candidate,
  role,
  targetStatus,
  onEmailSent,
  onOpenGmailSettings
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [recipient, setRecipient] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const isGmailConfigured = GmailSyncService.isConfigured();
  const gmailConfig = GmailSyncService.getConfig();

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

  const handleSend = async () => {
    if (!recipient.trim() || !subject.trim() || !body.trim()) return;
    setIsSending(true);
    try {
      const log = await GmailSyncService.dispatchEmail(candidate, subject, body);
      setSentSuccess(true);
      onEmailSent?.(log);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Email dispatch error:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
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
                Candidate synchronized to <span className="font-bold text-white">{targetStatus}</span>. Confirm or customize dispatch.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
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
                <div className="text-[11px] text-slate-500">{candidate.currentRole} • Match Score: <strong className="text-indigo-600">{candidate.matchScore}%</strong></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold text-slate-400">Trigger:</span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                targetStatus === 'Interview Ready'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  : targetStatus === 'Needs Review'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-rose-100 text-rose-800 border border-rose-200'
              }`}>
                {targetStatus}
              </span>
            </div>
          </div>

          {/* Gmail Connection Status Notice */}
          {!isGmailConfigured ? (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold text-amber-900">Gmail API Key / App Password Not Configured</div>
                <div className="text-amber-700 text-[11px] mt-0.5">
                  You can preview or copy the generated message now, or configure your Gmail API key to send directly via Google Workspace.
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenGmailSettings}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-medium rounded-lg text-[11px] flex items-center gap-1 shrink-0 shadow-xs"
              >
                <Settings className="w-3 h-3" />
                Configure Key
              </button>
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-xl flex items-center justify-between text-[11px] text-emerald-800">
              <span className="flex items-center gap-1.5 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Gmail Synced: <strong className="font-mono text-emerald-900">{gmailConfig.senderEmail}</strong>
              </span>
              <button
                onClick={onOpenGmailSettings}
                className="text-emerald-700 hover:text-emerald-900 underline font-medium"
              >
                Change settings
              </button>
            </div>
          )}

          {/* Form Fields */}
          <div className="space-y-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Recipient Email</label>
              <input
                type="email"
                value={recipient}
                onChange={e => setRecipient(e.target.value)}
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
                <label className="font-semibold text-slate-700">Personalized Email Body</label>
                <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  Auto-grounded in candidate's matched skills & interview questions
                </span>
              </div>
              <textarea
                rows={9}
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
            ) : (
              <span>HR Approval is required prior to email transmission.</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Skip / Do Not Send
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || sentSuccess}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isSending ? 'animate-bounce' : ''}`} />
              <span>{isSending ? 'Sending via Gmail...' : sentSuccess ? 'Dispatched!' : 'Approve & Send via Gmail'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
