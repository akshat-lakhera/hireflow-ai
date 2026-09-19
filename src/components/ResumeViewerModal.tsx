import React, { useState, useMemo, useEffect } from 'react';
import { CandidateCaseFile } from '../types';
import { 
  X, 
  FileText, 
  Copy, 
  Check, 
  Search, 
  Download, 
  ExternalLink, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Mail, 
  Phone,
  Code,
  Layers
} from 'lucide-react';

interface ResumeViewerModalProps {
  candidate: CandidateCaseFile | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ResumeViewerModal: React.FC<ResumeViewerModalProps> = ({
  candidate,
  isOpen,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'text' | 'pdf'>('text');
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (candidate?.pdfDataUrl) {
      setViewMode('pdf');
    } else {
      setViewMode('text');
    }
  }, [candidate]);

  // Compute text statistics
  const rawText = candidate?.rawText || candidate?.resumeSummary || '';
  const lines = useMemo(() => {
    return rawText.split('\n').filter(l => l.trim().length > 0);
  }, [rawText]);

  const wordCount = useMemo(() => {
    return rawText.trim().split(/\s+/).filter(Boolean).length;
  }, [rawText]);

  if (!isOpen || !candidate) return null;

  const handleCopyText = () => {
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    if (!candidate.pdfDataUrl) return;
    const a = document.createElement('a');
    a.href = candidate.pdfDataUrl;
    a.download = `${candidate.name.replace(/\s+/g, '_')}_Resume.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleOpenPdfNewTab = () => {
    if (!candidate.pdfDataUrl) return;
    const win = window.open();
    if (win) {
      win.document.write(
        `<iframe src="${candidate.pdfDataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
      );
      win.document.title = `${candidate.name} — Original Resume PDF`;
    }
  };

  // Highlight search matches
  const renderHighlightedLine = (line: string, idx: number) => {
    if (!searchQuery.trim()) {
      return (
        <div key={idx} className="flex items-start gap-3 py-0.5 hover:bg-slate-50 px-2 rounded font-mono text-xs">
          <span className="select-none text-slate-300 w-8 text-right shrink-0">{idx + 1}</span>
          <span className="text-slate-800 leading-relaxed whitespace-pre-wrap">{line}</span>
        </div>
      );
    }

    const regex = new RegExp(`(${searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = line.split(regex);
    const hasMatch = regex.test(line);

    return (
      <div 
        key={idx} 
        className={`flex items-start gap-3 py-0.5 px-2 rounded font-mono text-xs transition-colors ${
          hasMatch ? 'bg-amber-50/90 text-amber-950 font-medium' : 'hover:bg-slate-50 text-slate-800'
        }`}
      >
        <span className="select-none text-slate-300 w-8 text-right shrink-0">{idx + 1}</span>
        <span className="leading-relaxed whitespace-pre-wrap">
          {parts.map((part, pIdx) => 
            part.toLowerCase() === searchQuery.toLowerCase() ? (
              <mark key={pIdx} className="bg-amber-300 text-slate-900 px-0.5 rounded font-bold">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200/80 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 tracking-tight">
                  {candidate.name} — Original Resume Document
                </h3>
                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                  VERIFIED INTAKE
                </span>
              </div>
              <p className="text-xs text-slate-500">
                {candidate.currentRole} • {wordCount} words extracted
              </p>
            </div>
          </div>

          {/* Center: View Switcher (if PDF available) */}
          <div className="flex items-center gap-2">
            {candidate.pdfDataUrl && (
              <div className="bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 flex items-center gap-1 text-xs">
                <button
                  onClick={() => setViewMode('pdf')}
                  className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                    viewMode === 'pdf'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Original PDF
                </button>
                <button
                  onClick={() => setViewMode('text')}
                  className={`px-3 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                    viewMode === 'text'
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Extracted Text
                </button>
              </div>
            )}

            {/* Copy Text */}
            <button
              onClick={handleCopyText}
              className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Copy entire raw resume text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Text'}</span>
            </button>

            {/* Download PDF if present */}
            {candidate.pdfDataUrl && (
              <>
                <button
                  onClick={handleDownloadPdf}
                  className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                  title="Download original PDF"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Download</span>
                </button>
                <button
                  onClick={handleOpenPdfNewTab}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Open PDF in new tab"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </>
            )}

            {/* Close Modal */}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Close Resume Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden flex flex-col bg-slate-50/50">
          
          {/* PDF View */}
          {viewMode === 'pdf' && candidate.pdfDataUrl && (
            <div className="w-full h-full flex flex-col bg-slate-800">
              <iframe
                src={candidate.pdfDataUrl}
                title={`${candidate.name} Resume PDF`}
                className="w-full h-full border-0"
              />
            </div>
          )}

          {/* Formatted Text View */}
          {(viewMode === 'text' || !candidate.pdfDataUrl) && (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Quick Text Filter Toolbar */}
              <div className="p-3 bg-white border-b border-slate-200 flex items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1 max-w-md">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search keywords in resume text (e.g. Kafka, Rust, Lead, Kubernetes)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span>{lines.length} lines parsed</span>
                  <span>•</span>
                  <span>{candidate.matchedSkills.length} skills matched</span>
                </div>
              </div>

              {/* Text Paper Viewer */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
                
                {/* Structured Metadata Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-indigo-600" />
                      <span>Documented Projects</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {candidate.projects.length} System Architectures
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {candidate.projects.map(p => p.name).join(', ') || 'No projects listed'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                      <Code className="w-3 h-3 text-indigo-600" />
                      <span>Extracted Skills</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {candidate.matchedSkills.length} Role-Aligned Skills
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {candidate.matchedSkills.join(', ') || 'General engineering'}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 text-indigo-600" />
                      <span>Work History & Education</span>
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {candidate.experiences.length} Documented Roles
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">
                      {candidate.education[0]?.degree || 'Technical Degree'}
                    </div>
                  </div>
                </div>

                {/* Verbatim Document Paper Card */}
                <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Verbatim Resume Text Stream</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      UTF-8 Decoded
                    </span>
                  </div>

                  {lines.length > 0 ? (
                    <div className="space-y-0.5">
                      {lines.map((line, idx) => renderHighlightedLine(line, idx))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-400 py-8 text-center">
                      No raw text available for this case.
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
