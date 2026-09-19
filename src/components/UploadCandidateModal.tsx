import React, { useState } from 'react';
import { CandidateCaseFile, RoleSetup } from '../types';
import { extractTextFromPDF } from '../services/pdfParser';
import { CaseEvaluator } from '../services/caseEvaluator';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface UploadCandidateModalProps {
  role: RoleSetup;
  onClose: () => void;
  onCandidatesUploaded: (newCandidates: CandidateCaseFile[]) => void;
}

export const UploadCandidateModal: React.FC<UploadCandidateModalProps> = ({
  role,
  onClose,
  onCandidatesUploaded
}) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('pdf');
  const [files, setFiles] = useState<{ file: File; name: string; text: string }[]>([]);
  const [resumeText, setResumeText] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateRole, setCandidateRole] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let droppedFiles: File[] = [];
    if ('dataTransfer' in e) {
      e.preventDefault();
      droppedFiles = Array.from(e.dataTransfer.files);
    } else if (e.target.files) {
      droppedFiles = Array.from(e.target.files);
    }

    if (droppedFiles.length === 0) return;

    setIsProcessing(true);
    for (const file of droppedFiles) {
      try {
        const parsed = await extractTextFromPDF(file);
        setFiles(prev => [...prev, { file, name: parsed.name, text: parsed.rawText }]);
      } catch (err) {
        setFiles(prev => [...prev, { 
          file, 
          name: file.name.replace(/\.[^/.]+$/, ''), 
          text: `Candidate resume document ${file.name}` 
        }]);
      }
    }
    setIsProcessing(false);
  };

  const handleRemoveFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    const generated: CandidateCaseFile[] = [];

    // Process uploaded PDF files dynamically
    if (activeTab === 'pdf' && files.length > 0) {
      files.forEach((f) => {
        const evaluated = CaseEvaluator.evaluate(
          f.text,
          role,
          f.name,
          portfolioUrl || undefined,
          'Ingested via PDF Document Upload'
        );
        generated.push(evaluated);
      });
    }

    // Process pasted text dynamically
    if (activeTab === 'text' && resumeText.trim()) {
      const evaluated = CaseEvaluator.evaluate(
        resumeText,
        role,
        candidateName.trim() || undefined,
        portfolioUrl || undefined,
        'Ingested via Direct Text Input'
      );
      if (candidateRole.trim()) {
        evaluated.currentRole = candidateRole.trim();
      }
      generated.push(evaluated);
    }

    if (generated.length > 0) {
      onCandidatesUploaded(generated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-black/90 backdrop-blur-md overflow-y-auto font-sans text-xs">
      <div className="dossier-card rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl border-2 border-gold-border/60 bg-ink-950 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-5 bg-ink-900 border-b border-ink-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gold-glow border border-gold-border flex items-center justify-center text-gold-500">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Ingest Candidate Resumes</h3>
              <p className="text-[11px] text-slate-400 font-mono">Evaluating against: {role.title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-ink-850 hover:bg-ink-800 border border-ink-border flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-ink-border bg-ink-900">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 py-3 text-center font-mono text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'pdf'
                ? 'border-gold-500 text-gold-400 bg-ink-850'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            PDF / Document Upload
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-3 text-center font-mono text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-gold-500 text-gold-400 bg-ink-850'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Paste Resume Text
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1 bg-ink-950">
          {activeTab === 'pdf' ? (
            <div className="space-y-4">
              <div className="dossier-card rounded-2xl p-8 border-2 border-dashed border-ink-border hover:border-gold-500/60 text-center transition-colors relative cursor-pointer group bg-ink-900/40">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-10 h-10 text-gold-500 mx-auto mb-2.5 group-hover:scale-105 transition-transform" />
                <div className="text-white font-bold text-sm">Drop candidate PDF dossiers here or browse</div>
                <p className="text-slate-400 text-xs mt-1">
                  Supports PDF and documents. Automatic dynamic extraction against active role.
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="font-mono text-xs text-slate-400">Ready to Ingest ({files.length}):</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-ink-850 border border-ink-border">
                        <div className="flex items-center gap-2.5">
                          <FileText className="w-4 h-4 text-gold-500" />
                          <span className="font-bold text-white text-xs">{f.name}</span>
                        </div>
                        <button onClick={() => handleRemoveFile(i)} className="text-slate-500 hover:text-flag-500 p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">Candidate Name</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full bg-ink-900 border border-ink-border rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-gold-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 text-xs">Current Role (Optional)</label>
                  <input
                    type="text"
                    value={candidateRole}
                    onChange={e => setCandidateRole(e.target.value)}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full bg-ink-900 border border-ink-border rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-gold-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1 text-xs">Resume Content</label>
                <textarea
                  rows={6}
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste candidate work experience, achievements, and technical stack..."
                  className="w-full bg-ink-900 border border-ink-border rounded-xl p-3 text-white text-xs leading-relaxed focus:outline-none focus:border-gold-500 resize-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Portfolio link */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 text-xs flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-gold-500" />
              <span>Portfolio or GitHub Link (Optional)</span>
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/candidate-repo"
              className="w-full bg-ink-900 border border-ink-border rounded-xl p-2.5 text-white text-xs focus:outline-none focus:border-gold-500 font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-ink-900 border-t border-ink-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-ink-850 hover:bg-ink-800 text-slate-300 border border-ink-border text-xs"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={activeTab === 'pdf' ? files.length === 0 : !resumeText.trim()}
            className="px-6 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-400 disabled:opacity-40 text-ink-950 font-bold text-xs shadow-lg transition-colors flex items-center gap-1.5"
          >
            <span>Evaluate & Ingest</span>
          </button>
        </div>

      </div>
    </div>
  );
};
