import React, { useState } from 'react';
import { Search, Sparkles, X, Filter } from 'lucide-react';

interface NaturalLanguageSearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  resultExplanation?: string;
}

export const NaturalLanguageSearchBar: React.FC<NaturalLanguageSearchBarProps> = ({
  onSearch,
  onClear,
  resultExplanation
}) => {
  const [query, setQuery] = useState('');

  const quickFilters = [
    { label: '★ Top Contenders', query: 'Top Contenders' },
    { label: '⚡ Stream Ingestion / Kafka', query: 'Kafka and streaming' },
    { label: '⚠ Candidates with High Gaps', query: 'High risk gaps' },
    { label: '☁ Kubernetes Specialists', query: 'Kubernetes' },
  ];

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && query.trim()) {
      onSearch(query);
    }
  };

  const handleSelectFilter = (q: string) => {
    setQuery(q);
    onSearch(q);
  };

  const handleClear = () => {
    setQuery('');
    onClear();
  };

  return (
    <div className="w-full space-y-2.5">
      <div className="relative w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gold-400">
          <Sparkles className="h-4 w-4" />
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Natural Language Query: e.g. 'Show me candidates with Kafka streaming experience' or 'Who has critical gaps?'"
          className="w-full pl-10 pr-24 py-3 bg-obsidian-900/90 border border-obsidian-border rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-gold-500 focus:ring-1 focus:ring-gold-500 shadow-inner transition-all font-sans"
        />

        <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
          {query && (
            <button
              onClick={handleClear}
              className="p-1 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={() => query.trim() && onSearch(query)}
            className="px-3 py-1.5 rounded-lg bg-gold-500 hover:bg-gold-600 text-black text-xs font-bold shadow-sm transition-all flex items-center gap-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-mono text-slate-500 flex items-center gap-1 mr-1">
          <Filter className="w-3 h-3" />
          <span>Quick Probes:</span>
        </span>

        {quickFilters.map((f, idx) => (
          <button
            key={idx}
            onClick={() => handleSelectFilter(f.query)}
            className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-obsidian-850 hover:bg-obsidian-800 text-slate-300 hover:text-gold-300 border border-obsidian-border transition-colors"
          >
            {f.label}
          </button>
        ))}
      </div>

      {resultExplanation && (
        <div className="p-2.5 rounded-lg bg-gold-950/20 border border-gold-500/30 text-xs text-gold-300 flex items-center justify-between font-mono animate-in fade-in">
          <span>{resultExplanation}</span>
          <button
            onClick={handleClear}
            className="text-[10px] text-slate-400 hover:text-white underline ml-2"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
};
