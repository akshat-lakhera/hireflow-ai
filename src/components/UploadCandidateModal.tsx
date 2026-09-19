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
  AlertTriangle 
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-sm overflow-y-auto font-sans text-xs">
      <div className="case-card rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl border border-case-borderLight animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        
        {/* Header */}
        <div className="p-4 bg-case-bgAlt border-b border-case-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-4 h-4 text-accent-blue" />
            <h3 className="font-bold text-sm text-white">Upload Candidate Resumes</h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-case-surface hover:bg-case-surfaceLight border border-case-border flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab selector */}
        <div className="flex border-b border-case-border bg-case-surface">
          <button
            onClick={() => setActiveTab('pdf')}
            className={`flex-1 py-2.5 text-center font-mono text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'pdf'
                ? 'border-accent-blue text-accent-blue bg-case-surfaceElevated'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            PDF / Document Upload
          </button>
          <button
            onClick={() => setActiveTab('text')}
            className={`flex-1 py-2.5 text-center font-mono text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-accent-blue text-accent-blue bg-case-surfaceElevated'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            Paste Resume Text
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 bg-case-bg">
          {activeTab === 'pdf' ? (
            <div className="space-y-4">
              <div className="case-card rounded-xl p-6 border-2 border-dashed border-case-border hover:border-accent-blue/50 text-center transition-colors relative cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,application/pdf"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-accent-blue mx-auto mb-2" />
                <div className="text-white font-semibold">Drop PDF resumes here or browse</div>
                <p className="text-slate-400 text-[11px] mt-1">
                  Supports PDF and text documents. Automatically evaluated against active JD.
                </p>
              </div>

              {files.length > 0 && (
                <div className="space-y-2">
                  <div className="font-mono text-[11px] text-slate-400">Ready to Ingest & Evaluate ({files.length}):</div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-case-surface border border-case-border">
                        <div className="flex items-center gap-2">
                          <FileText className="w-3.5 h-3.5 text-accent-blue" />
                          <span className="font-semibold text-white">{f.name}</span>
                        </div>
                        <button onClick={() => handleRemoveFile(i)} className="text-slate-500 hover:text-accent-red">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Candidate Name</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={e => setCandidateName(e.target.value)}
                    placeholder="e.g. Jordan Miller"
                    className="w-full bg-case-surface border border-case-border rounded-lg p-2 text-white text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Current Role (Optional)</label>
                  <input
                    type="text"
                    value={candidateRole}
                    onChange={e => setCandidateRole(e.target.value)}
                    placeholder="e.g. Staff Backend Engineer"
                    className="w-full bg-case-surface border border-case-border rounded-lg p-2 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Resume Content</label>
                <textarea
                  rows={6}
                  value={resumeText}
                  onChange={e => setResumeText(e.target.value)}
                  placeholder="Paste candidate work experience, achievements, and technical stack..."
                  className="w-full bg-case-surface border border-case-border rounded-lg p-2.5 text-white text-xs leading-relaxed focus:outline-none resize-none font-mono"
                />
              </div>
            </div>
          )}

          {/* Portfolio link */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
              <LinkIcon className="w-3.5 h-3.5 text-slate-400" />
              <span>Portfolio or GitHub Link (Optional)</span>
            </label>
            <input
              type="url"
              value={portfolioUrl}
              onChange={e => setPortfolioUrl(e.target.value)}
              placeholder="https://github.com/candidate-repo"
              className="w-full bg-case-surface border border-case-border rounded-lg p-2 text-white text-xs focus:outline-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-case-bgAlt border-t border-case-border flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-case-surface hover:bg-case-surfaceLight text-slate-300 border border-case-border"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={activeTab === 'pdf' ? files.length === 0 : !resumeText.trim()}
            className="px-5 py-2 rounded-xl bg-accent-blue hover:bg-accent-blueHover disabled:opacity-40 text-black font-semibold text-xs shadow transition-colors flex items-center gap-1.5"
          >
            <span>Evaluate & Ingest</span>
          </button>
        </div>

      </div>
    </div>
  );
};
