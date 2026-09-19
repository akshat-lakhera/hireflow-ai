import React, { useState, useEffect } from 'react';
import { AiService, AiConfig } from '../services/aiApi';
import { 
  X, 
  Sparkles, 
  Key, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ExternalLink,
  Eye,
  EyeOff,
  Zap
} from 'lucide-react';

interface AiSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigSaved: () => void;
}

export const AiSettingsModal: React.FC<AiSettingsModalProps> = ({
  isOpen,
  onClose,
  onConfigSaved
}) => {
  const [config, setConfig] = useState<AiConfig>({
    provider: 'groq',
    apiKey: '',
    model: 'llama-3.3-70b-versatile'
  });

  const [showApiKey, setShowApiKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setConfig(AiService.getConfig());
      setTestResult(null);
      setSavedSuccess(false);
      setShowApiKey(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleProviderChange = (provider: 'groq' | 'gemini' | 'openai') => {
    let defaultModel = 'llama-3.3-70b-versatile';
    if (provider === 'gemini') defaultModel = 'gemini-1.5-flash';
    if (provider === 'openai') defaultModel = 'gpt-4o-mini';

    setConfig(prev => ({
      ...prev,
      provider,
      model: defaultModel
    }));
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const result = await AiService.testConnection(config);
    setTestResult(result);
    setTesting(false);
  };

  const handleSave = () => {
    AiService.saveConfig(config);
    setSavedSuccess(true);
    onConfigSaved();
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  const handleClearKey = () => {
    const cleared: AiConfig = { ...config, apiKey: '' };
    setConfig(cleared);
    AiService.saveConfig(cleared);
    setTestResult(null);
    onConfigSaved();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden">
        
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900">AI Intelligence Engine</h3>
              <p className="text-xs text-slate-500">Configure Groq, Gemini, or OpenAI API key for live evaluation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          
          {/* Provider Selection (Groq, Gemini, OpenAI) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2 uppercase tracking-wide">
              Select AI Provider
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              
              {/* Groq Card */}
              <button
                type="button"
                onClick={() => handleProviderChange('groq')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.provider === 'groq'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 text-indigo-950'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1 font-bold text-xs">
                  <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span>Groq</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Ultra-fast Llama 3.3</div>
              </button>

              {/* Gemini Card */}
              <button
                type="button"
                onClick={() => handleProviderChange('gemini')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.provider === 'gemini'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 text-indigo-950'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">Gemini</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Google AI Studio</div>
              </button>

              {/* OpenAI Card */}
              <button
                type="button"
                onClick={() => handleProviderChange('openai')}
                className={`p-3 rounded-xl border text-left transition-all ${
                  config.provider === 'openai'
                    ? 'border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600 text-indigo-950'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                }`}
              >
                <div className="font-bold text-xs">OpenAI</div>
                <div className="text-[10px] text-slate-500 mt-0.5">GPT-4o Mini</div>
              </button>

            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Model
            </label>
            <select
              value={config.model}
              onChange={(e) => setConfig(prev => ({ ...prev, model: e.target.value }))}
              className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {config.provider === 'groq' && (
                <>
                  <option value="llama-3.3-70b-versatile">Llama 3.3 70B Versatile (Recommended — Fastest & Best Reasoning)</option>
                  <option value="llama-3.1-8b-instant">Llama 3.1 8B Instant (Sub-second response)</option>
                  <option value="mixtral-8x7b-32768">Mixtral 8x7B (32k Context Window)</option>
                </>
              )}

              {config.provider === 'gemini' && (
                <>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Ultra-fast)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Architectural Reasoning)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen)</option>
                </>
              )}

              {config.provider === 'openai' && (
                <>
                  <option value="gpt-4o-mini">GPT-4o Mini (Fast & Cost-Effective)</option>
                  <option value="gpt-4o">GPT-4o (High-Precision Reasoning)</option>
                </>
              )}
            </select>
          </div>

          {/* API Key Input with Show/Hide Eye Toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700">
                {config.provider === 'groq' 
                  ? 'Groq Cloud API Key' 
                  : config.provider === 'gemini' 
                  ? 'Google AI Studio API Key' 
                  : 'OpenAI API Key'}
              </label>
              {config.apiKey && (
                <button
                  type="button"
                  onClick={handleClearKey}
                  className="text-xs text-rose-600 hover:text-rose-700 font-medium"
                >
                  Remove Key
                </button>
              )}
            </div>
            
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder={
                  config.provider === 'groq'
                    ? 'gsk_...'
                    : config.provider === 'gemini'
                    ? 'AIzaSy...'
                    : 'sk-...'
                }
                value={config.apiKey}
                onChange={(e) => {
                  setConfig(prev => ({ ...prev, apiKey: e.target.value }));
                  setTestResult(null);
                }}
                className="w-full text-xs font-mono bg-white border border-slate-200 rounded-lg pl-9 pr-10 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              
              {/* Show / Hide Toggle Button */}
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors"
                title={showApiKey ? 'Hide API Key' : 'Show API Key'}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
              <span>Keys are stored safely in local browser storage.</span>
              {config.provider === 'groq' ? (
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Get free Groq API key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : config.provider === 'gemini' ? (
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Get free Gemini API key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              ) : (
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-600 hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  Get OpenAI API key <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}
            </p>
          </div>

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-lg text-xs flex items-start gap-2.5 ${
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

          {/* Fallback info */}
          {!config.apiKey && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
              <span className="font-semibold text-slate-900">⚡ Local Deterministic Engine Active:</span> Even without an API key, HireFlow parses real PDFs with coordinate-sorted line reconstruction and runs full criteria mapping locally.
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing || !config.apiKey.trim()}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:pointer-events-none flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing...' : 'Test Connection'}</span>
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
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              {savedSuccess ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
