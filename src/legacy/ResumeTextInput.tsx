import React, { useState } from 'react';
import { parseResumeText } from '../services/pdfParser';
import { FileText, Sparkles } from 'lucide-react';

interface ResumeTextInputProps {
  onParsed: (parsedData: ReturnType<typeof parseResumeText>) => void;
}

export const ResumeTextInput: React.FC<ResumeTextInputProps> = ({ onParsed }) => {
  const [candidateName, setCandidateName] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  const handleParse = () => {
    if (!resumeText.trim()) return;
    setIsParsing(true);

    setTimeout(() => {
      const lines = resumeText.split('\n').map(l => l.trim()).filter(Boolean);
      const parsed = parseResumeText(
        resumeText, 
        lines, 
        candidateName.trim() || 'Extracted Candidate'
      );
      if (candidateName.trim()) {
        parsed.name = candidateName.trim();
      }
      onParsed(parsed);
      setResumeText('');
      setCandidateName('');
      setIsParsing(false);
    }, 400);
  };

  return (
    <div className="space-y-3 font-sans text-xs">
      <div>
        <label className="block text-slate-400 font-medium mb-1">Candidate Name (Optional)</label>
        <input
          type="text"
          value={candidateName}
          onChange={e => setCandidateName(e.target.value)}
          placeholder="e.g. Sarah Connor"
          className="w-full bg-obsidian-950/80 border border-obsidian-border rounded-xl p-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold-500"
        />
      </div>

      <div>
        <label className="block text-slate-400 font-medium mb-1">Paste Resume, LinkedIn Summary or Bio</label>
        <textarea
          rows={5}
          value={resumeText}
          onChange={e => setResumeText(e.target.value)}
          placeholder="Paste experience, skills, projects, and work history here..."
          className="w-full bg-obsidian-950/80 border border-obsidian-border rounded-xl p-3 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-gold-500 resize-none leading-relaxed"
        />
      </div>

      <button
        type="button"
        onClick={handleParse}
        disabled={!resumeText.trim() || isParsing}
        className="w-full py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 disabled:opacity-40 text-black font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
      >
        {isParsing ? (
          <span>Analyzing Resume Vectors...</span>
        ) : (
          <>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Process & Screen Candidate</span>
          </>
        )}
      </button>
    </div>
  );
};
