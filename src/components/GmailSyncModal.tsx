import React, { useState, useEffect } from 'react';
import { GmailSyncService, GmailConfig, EmailDispatchLog } from '../services/gmailSyncService';
import { 
  Mail, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  X, 
  ExternalLink, 
  ShieldCheck, 
  Send,
  Eye,
  EyeOff,
  Inbox,
  Clock,
  Trash2
} from 'lucide-react';

interface GmailSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved?: () => void;
}

export const GmailSyncModal: React.FC<GmailSyncModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<GmailConfig>({
    provider: 'emailjs',
    apiKey: '',
    serviceId: '',
    templateId: '',
    senderEmail: 'recruiting@talentdossier.ai',
    senderName: 'Talent Acquisition Team',
    autoPromptOnSync: true
  });

  const [activeTab, setActiveTab] = useState<'settings' | 'outbox'>('settings');
  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [logs, setLogs] = useState<EmailDispatchLog[]>([]);

  useEffect(() => {
    if (isOpen) {
      setConfig(GmailSyncService.getConfig());
      setTestResult(null);
      setSavedSuccess(false);
      setShowApiKey(false);
      setLogs(GmailSyncService.getEmailLogs());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await GmailSyncService.testConnection(config);
    setTestResult(res);
    setTesting(false);
  };

  const handleSave = () => {
    GmailSyncService.saveConfig(config);
    setSavedSuccess(true);
    onConfigSaved?.();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClearKey = () => {
    const cleared: GmailConfig = { ...config, apiKey: '' };
    setConfig(cleared);
    GmailSyncService.saveConfig(cleared);
    setTestResult(null);
    onConfigSaved?.();
  };

  const handleClearLogs = () => {
    GmailSyncService.clearEmailLogs();
    setLogs([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-400 shadow-inner">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Gmail & Automated Candidate Sync</h3>
              <p className="text-xs text-slate-300">Configure email credentials for automated candidate outreach</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 border-b border-slate-100 flex items-center gap-4 bg-slate-50 text-xs">
          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Email Setup
          </button>
          <button
            onClick={() => setActiveTab('outbox')}
            className={`pb-2.5 font-semibold transition-colors border-b-2 flex items-center gap-1.5 ${
              activeTab === 'outbox'
                ? 'border-indigo-600 text-indigo-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Outbox / Dispatched</span>
            {logs.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                {logs.length}
              </span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
          {activeTab === 'settings' ? (
            <>
              {/* EmailJS Setup Guide Banner */}
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-600" />
                    EmailJS Setup (Free — 200 emails/month)
                  </div>
                  <a
                    href="https://www.emailjs.com/docs/introduction/how-does-emailjs-work/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 hover:underline flex items-center gap-1 font-medium"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Guide
                  </a>
                </div>
                <ol className="space-y-1 text-indigo-800 pl-3 leading-relaxed">
                  <li>1. Create free account at <a href="https://emailjs.com" target="_blank" rel="noreferrer" className="underline font-mono">emailjs.com</a></li>
                  <li>2. Add Email Service (Gmail) → copy <strong>Service ID</strong></li>
                  <li>3. Create Email Template with <code className="bg-indigo-100 px-1 rounded">{'{{to_email}}'}</code> <code className="bg-indigo-100 px-1 rounded">{'{{subject}}'}</code> <code className="bg-indigo-100 px-1 rounded">{'{{message}}'}</code> → copy <strong>Template ID</strong></li>
                  <li>4. Account → API Keys → copy <strong>Public Key</strong></li>
                </ol>
              </div>

              {/* Sender Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sender Name</label>
                  <input
                    type="text"
                    value={config.senderName}
                    onChange={e => setConfig(prev => ({ ...prev, senderName: e.target.value }))}
                    placeholder="Talent Acquisition Team"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reply-to Email</label>
                  <input
                    type="email"
                    value={config.senderEmail}
                    onChange={e => setConfig(prev => ({ ...prev, senderEmail: e.target.value }))}
                    placeholder="recruiting@yourcompany.com"
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>

              {/* EmailJS Service ID */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">EmailJS Service ID</label>
                <input
                  type="text"
                  value={config.serviceId || ''}
                  onChange={e => setConfig(prev => ({ ...prev, serviceId: e.target.value }))}
                  placeholder="service_xxxxxxx"
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* EmailJS Template ID */}
              <div>
                <label className="block font-semibold text-slate-700 mb-1">EmailJS Template ID</label>
                <input
                  type="text"
                  value={config.templateId || ''}
                  onChange={e => setConfig(prev => ({ ...prev, templateId: e.target.value }))}
                  placeholder="template_xxxxxxx"
                  className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* EmailJS Public Key */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">EmailJS Public Key</label>
                  {config.apiKey && (
                    <button
                      type="button"
                      onClick={handleClearKey}
                      className="text-rose-600 hover:text-rose-700 font-medium text-[11px]"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    placeholder="Your EmailJS Public Key (Account > API Keys)"
                    value={config.apiKey}
                    onChange={e => {
                      setConfig(prev => ({ ...prev, apiKey: e.target.value }));
                      setTestResult(null);
                    }}
                    className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Stored locally with obfuscation. Never sent to any server except EmailJS.
                </p>
              </div>

              {/* Test Status Banner */}
              {testResult && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="font-medium">{testResult.message}</div>
                </div>
              )}
            </>
          ) : (
            /* Outbox Log */
            <div className="space-y-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-slate-800 text-xs">Recent Automated Dispatches</div>
                {logs.length > 0 && (
                  <button
                    onClick={handleClearLogs}
                    className="text-rose-600 hover:text-rose-700 text-[11px] flex items-center gap-1 font-medium"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear History
                  </button>
                )}
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="font-medium">No emails dispatched yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Emails approved and sent via Gmail will be tracked here.</p>
                </div>
              ) : (
                logs.map(log => (
                  <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.candidateName}</span>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                        {log.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">To: {log.recipientEmail}</div>
                    <div className="text-xs text-slate-700 font-medium truncate">{log.subject}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-1 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.timestamp}
                      </span>
                      <span>Receipt: <strong className="font-mono text-slate-600">{log.deliveryReceiptId}</strong></span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !config.apiKey.trim()}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Verifying...' : 'Test Connection'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              {savedSuccess ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
