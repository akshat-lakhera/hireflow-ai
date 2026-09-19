import React, { useState, useEffect } from 'react';
import { DatabaseConfig, DatabaseSyncResult, CandidateCaseFile } from '../types';
import { DatabaseService } from '../services/databaseService';
import { 
  X, 
  Database, 
  Cloud, 
  HardDrive, 
  Check, 
  Copy, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  ExternalLink,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShieldCheck
} from 'lucide-react';

interface DatabaseSettingsModalProps {
  onClose: () => void;
  candidates: CandidateCaseFile[];
  onCandidatesUpdated: (updated: CandidateCaseFile[]) => void;
}

export const DatabaseSettingsModal: React.FC<DatabaseSettingsModalProps> = ({
  onClose,
  candidates,
  onCandidatesUpdated
}) => {
  const [config, setConfig] = useState<DatabaseConfig>({
    mode: 'indexeddb_vector',
    supabaseUrl: '',
    supabaseAnonKey: '',
    tableName: 'candidates',
    autoSync: false
  });

  const [activeTab, setActiveTab] = useState<'config' | 'schema'>('config');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<DatabaseSyncResult | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    DatabaseService.getConfig().then(cfg => setConfig(cfg));
  }, []);

  const handleSaveConfig = async () => {
    setValidationError(null);

    // If Supabase mode is chosen, Supabase URL and Anon Key are strictly mandatory
    if (config.mode === 'supabase_pgvector') {
      if (!config.supabaseUrl.trim() || !config.supabaseAnonKey.trim()) {
        setValidationError('Both Supabase Project URL and Anon Public API Key are mandatory when Cloud pgvector mode is enabled.');
        return;
      }
      if (!config.supabaseUrl.startsWith('http://') && !config.supabaseUrl.startsWith('https://')) {
        setValidationError('Please enter a valid Supabase Project URL starting with https://');
        return;
      }
    }

    await DatabaseService.saveConfig(config);
    setSavedSuccess(true);

    // Auto-close on successful submit (clean UX)
    setTimeout(() => {
      onClose();
    }, 450);
  };

  const handleTestConnection = async () => {
    if (!config.supabaseUrl.trim() || !config.supabaseAnonKey.trim()) {
      setValidationError('Please provide both URL and Anon Key to test connection.');
      return;
    }
    setValidationError(null);
    setIsTesting(true);
    setTestResult(null);
    const res = await DatabaseService.testSupabaseConnection(
      config.supabaseUrl, 
      config.supabaseAnonKey, 
      config.tableName
    );
    setTestResult(res);
    setIsTesting(false);
  };

  const handleSyncToSupabase = async () => {
    if (!config.supabaseUrl.trim() || !config.supabaseAnonKey.trim()) {
      setValidationError('Please configure and save Supabase credentials first.');
      return;
    }
    setValidationError(null);
    setIsSyncing(true);
    setSyncResult(null);
    // Actively deliver 384-dim vectors to Supabase
    const res = await DatabaseService.syncToSupabase(candidates);
    setSyncResult(res);
    setIsSyncing(false);
    if (res.success) {
      const updatedCfg = await DatabaseService.getConfig();
      setConfig(updatedCfg);
    }
  };

  const handlePullFromSupabase = async () => {
    if (!config.supabaseUrl.trim() || !config.supabaseAnonKey.trim()) {
      setValidationError('Please configure and save Supabase credentials first.');
      return;
    }
    setValidationError(null);
    setIsPulling(true);
    setSyncResult(null);
    const res = await DatabaseService.pullFromSupabase();
    setSyncResult(res);
    setIsPulling(false);
    if (res.success) {
      const loaded = await DatabaseService.getAllCandidates();
      onCandidatesUpdated(loaded);
      const updatedCfg = await DatabaseService.getConfig();
      setConfig(updatedCfg);
    }
  };

  const handleCopySql = () => {
    const sql = DatabaseService.getPostgresSchemaSQL();
    navigator.clipboard.writeText(sql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">Database & Vector Storage</h3>
              <p className="text-xs text-slate-500">
                Dual-tier persistence: Embedded Local Vector DB & Cloud PostgreSQL with pgvector
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('config')}
            className={`py-3 border-b-2 transition-colors mr-6 ${
              activeTab === 'config'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Connection & Engine
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schema')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'schema'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            PostgreSQL Schema (schema.sql)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'config' ? (
            <div className="space-y-5">
              
              {/* Storage Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                  Active Storage Engine
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  
                  {/* Option 1: IndexedDB */}
                  <div
                    onClick={() => {
                      setConfig({ ...config, mode: 'indexeddb_vector' });
                      setValidationError(null);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      config.mode === 'indexeddb_vector'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <HardDrive className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">Local Vector DB</span>
                      </div>
                      <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                        Zero Setup
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      Embedded browser IndexedDB with native 384-dimensional cosine similarity. 100% free and private.
                    </p>
                  </div>

                  {/* Option 2: Supabase */}
                  <div
                    onClick={() => {
                      setConfig({ ...config, mode: 'supabase_pgvector' });
                      setValidationError(null);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                      config.mode === 'supabase_pgvector'
                        ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <Cloud className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">Supabase pgvector</span>
                      </div>
                      <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200">
                        Cloud Sync
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed">
                      PostgreSQL 15+ database with pgvector extension. Team-wide candidate collaboration and cloud backup.
                    </p>
                  </div>
                </div>
              </div>

              {/* Status & Stats Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-semibold text-slate-800">
                    Local Records: <span className="font-bold text-indigo-600">{candidates.length} candidate{candidates.length === 1 ? '' : 's'}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Embedding Dimensions: 384 (all-MiniLM-L6-v2 format)
                  </div>
                </div>
                {config.lastSyncedAt && config.mode === 'supabase_pgvector' && (
                  <div className="text-[11px] text-slate-500 text-right">
                    <div>Last Synced</div>
                    <div className="font-mono text-slate-700">
                      {new Date(config.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                )}
              </div>

              {/* CONDITIONAL RENDERING: Local DB Active Message */}
              {config.mode === 'indexeddb_vector' && (
                <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center gap-2 text-emerald-800 font-semibold">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Embedded Local Vector DB is Active</span>
                  </div>
                  <p className="text-slate-600 text-[11px] leading-relaxed">
                    All candidate dossiers, match scores, and 384-dimensional vector embeddings are stored locally in your browser's IndexedDB. No external database credentials are required. Click <strong>"Save Configuration"</strong> to apply and close.
                  </p>
                </div>
              )}

              {/* CONDITIONAL RENDERING: Supabase Credentials (ONLY when Supabase mode is chosen) */}
              {config.mode === 'supabase_pgvector' && (
                <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-800">
                      Supabase Project Credentials <span className="text-rose-500">*</span>
                    </label>
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-indigo-600 hover:text-indigo-700 flex items-center gap-1 font-medium"
                    >
                      Open Supabase Dashboard <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {validationError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2 animate-in fade-in duration-150">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{validationError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Supabase Project URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="https://your-project.supabase.co"
                      value={config.supabaseUrl}
                      onChange={(e) => {
                        setConfig({ ...config, supabaseUrl: e.target.value.trim() });
                        setValidationError(null);
                      }}
                      className={`w-full text-xs bg-white border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono transition-colors ${
                        validationError && !config.supabaseUrl ? 'border-rose-300 ring-1 ring-rose-500' : 'border-slate-200'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">
                      Supabase Anon Public API Key <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                      value={config.supabaseAnonKey}
                      onChange={(e) => {
                        setConfig({ ...config, supabaseAnonKey: e.target.value.trim() });
                        setValidationError(null);
                      }}
                      className={`w-full text-xs bg-white border rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono transition-colors ${
                        validationError && !config.supabaseAnonKey ? 'border-rose-300 ring-1 ring-rose-500' : 'border-slate-200'
                      }`}
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="autoSyncToggle"
                        checked={config.autoSync}
                        onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <label htmlFor="autoSyncToggle" className="text-xs text-slate-700 font-medium cursor-pointer">
                        Auto-sync on save (actively streams 384-dim vectors)
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={handleTestConnection}
                      disabled={isTesting || !config.supabaseUrl || !config.supabaseAnonKey}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 disabled:opacity-40 flex items-center gap-1"
                    >
                      {isTesting ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" /> Testing...
                        </>
                      ) : (
                        'Test Connection'
                      )}
                    </button>
                  </div>

                  {testResult && (
                    <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                      testResult.ok 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {testResult.ok ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{testResult.message}</span>
                    </div>
                  )}

                  {/* Action Buttons: Sync & Pull */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={handleSyncToSupabase}
                      disabled={isSyncing || !config.supabaseUrl || !config.supabaseAnonKey}
                      className="flex-1 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <ArrowUpFromLine className="w-3.5 h-3.5" />
                      {isSyncing ? 'Syncing 384-Dim Vectors...' : 'Push Candidates to Supabase'}
                    </button>

                    <button
                      type="button"
                      onClick={handlePullFromSupabase}
                      disabled={isPulling || !config.supabaseUrl || !config.supabaseAnonKey}
                      className="px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-medium text-xs flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                    >
                      <ArrowDownToLine className="w-3.5 h-3.5" />
                      {isPulling ? 'Pulling...' : 'Pull Cloud Candidates'}
                    </button>
                  </div>

                  {syncResult && (
                    <div className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
                      syncResult.success 
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                        : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                      {syncResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                      <span>{syncResult.message || syncResult.error}</span>
                    </div>
                  )}

                </div>
              )}

            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-semibold text-slate-900">Supabase SQL Migration Script</h4>
                  <p className="text-[11px] text-slate-500">
                    Paste into your Supabase project's SQL Editor to create the <code className="font-mono text-indigo-600">candidates</code> table with <code className="font-mono text-indigo-600">vector(384)</code> and HNSW index.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy SQL
                    </>
                  )}
                </button>
              </div>

              <div className="relative rounded-lg bg-slate-900 p-4 font-mono text-[11px] text-slate-200 max-h-80 overflow-y-auto leading-relaxed border border-slate-800">
                <pre>{DatabaseService.getPostgresSchemaSQL()}</pre>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900">
                <span className="font-semibold">Note on Supabase pgvector:</span> Supabase does not automatically calculate vector embeddings upon INSERT. TalentDossier's client engine handles calculating the 384-dimensional normalized vector array and delivers it directly in the cloud sync payload.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {savedSuccess ? (
              <span className="text-emerald-600 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Configuration saved! Closing...
              </span>
            ) : (
              `Engine: ${config.mode === 'indexeddb_vector' ? 'Local IndexedDB' : 'Supabase pgvector'}`
            )}
          </div>

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
              onClick={handleSaveConfig}
              disabled={savedSuccess}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
            >
              {savedSuccess ? 'Saved!' : 'Save Configuration'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
