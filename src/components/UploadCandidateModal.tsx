import React, { useState } from 'react';
import { CandidateCaseFile, RoleSetup } from '../types';
import { extractTextFromPDF, StructuredResumeData } from '../services/pdfParser';
import { CaseEvaluator } from '../services/caseEvaluator';
import { 
  X, 
  UploadCloud, 
  FileText, 
  Link as LinkIcon, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  Sparkles,
  User,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react';

interface UploadCandidateModalProps {
  role: RoleSetup;
  onClose: () => void;
  onCandidatesUploaded: (newCandidates: CandidateCaseFile[]) => void;
}

interface UploadedFileItem {
  file: File;
  name: string;
  parsedData: StructuredResumeData;
}

export const UploadCandidateModal: React.FC<UploadCandidateModalProps> = ({
  role,
  onClose,
  onCandidatesUploaded
}) => {
  const [activeTab, setActiveTab] = useState<'pdf' | 'text'>('pdf');
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [resumeText, setResumeText] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [candidateRole, setCandidateRole] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    setErrorMsg(null);

    for (const file of droppedFiles) {
      try {
        const parsed = await extractTextFromPDF(file);
        setFiles(prev => [...prev, { file, name: parsed.name, parsedData: parsed }]);
      } catch (err: any) {
        console.error('Extraction error:', err);
        setErrorMsg(`Failed to parse ${file.name}: ${err.message || 'Unknown error'}`);
      }
    }
    setIsProcessing(false);
  };

  const handleRemoveFile = (idx: number) => {
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = () => {
    const generated: CandidateCaseFile[] = [];

    // 1. Process uploaded PDF files using their parsed StructuredResumeData
    if (activeTab === 'pdf' && files.length > 0) {
      files.forEach((f) => {
        const evaluated = CaseEvaluator.evaluate(
          f.parsedData,
          role,
          f.name,
          portfolioUrl || f.parsedData.portfolioUrl || undefined,
          'Ingested via PDF Document Upload'
        );
        generated.push(evaluated);
      });
    }

    // 2. Process pasted raw text dynamically
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Add Candidate to Pipeline</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating against active role: <span className="font-semibold text-slate-700">{role.title}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('pdf')}
            className={`py-3 border-b-2 transition-colors mr-6 ${
              activeTab === 'pdf'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Upload Resume PDF
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`py-3 border-b-2 transition-colors ${
              activeTab === 'text'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Paste Resume Text
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'pdf' ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <label 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileUpload}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50/60 hover:bg-indigo-50/30 rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              >
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-indigo-600 shadow-sm mb-3">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-900">
                  Click to select or drag and drop candidate resumes (.PDF)
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Extracts text, skills, and projects client-side with zero external data sharing
                </p>
              </label>

              {isProcessing && (
                <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 text-xs text-indigo-900">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
                  <span>Parsing and reconstructing resume coordinates...</span>
                </div>
              )}

              {/* Uploaded Files Live Preview */}
              {files.length > 0 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                    Ready to Ingest ({files.length})
                  </div>
                  {files.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{item.name}</span>
                          <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                            Parsed Successfully
                          </span>
                        </div>
                        <div className="text-slate-600 truncate">
                          {item.parsedData.headline || item.file.name}
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                          <span>{item.parsedData.skills.length} Skills detected</span>
                          <span>•</span>
                          <span>{item.parsedData.projects.length} Projects</span>
                          {item.parsedData.email && (
                            <>
                              <span>•</span>
                              <span className="truncate">{item.parsedData.email}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded hover:bg-slate-100 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Candidate Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Alex Rivera"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Current Title (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Senior Software Engineer"
                    value={candidateRole}
                    onChange={(e) => setCandidateRole(e.target.value)}
                    className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Resume Content / Plain Text
                </label>
                <textarea
                  rows={8}
                  placeholder="Paste plain text resume, work history, projects, or credentials..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  className="w-full text-xs bg-white border border-slate-200 rounded-lg p-3 text-slate-900 focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>
          )}

          {/* Optional Portfolio or GitHub URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              External Portfolio / GitHub Repo (Optional)
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="https://github.com/... or https://portfolio.dev"
                value={portfolioUrl}
                onChange={(e) => setPortfolioUrl(e.target.value)}
                className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 focus:ring-2 focus:ring-indigo-500"
              />
              <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {activeTab === 'pdf' ? `${files.length} candidate(s) ready` : 'Ready to evaluate'}
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
              onClick={handleSubmit}
              disabled={activeTab === 'pdf' ? files.length === 0 : !resumeText.trim()}
              className="px-4 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:pointer-events-none rounded-lg shadow-sm transition-colors"
            >
              Ingest & Evaluate Candidate
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
