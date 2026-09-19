import React, { useState } from 'react';
import { RoleSetup, ReviewMode, CandidateCaseFile } from '../types';
import { extractTextFromPDF, StructuredResumeData } from '../services/pdfParser';
import { CaseEvaluator } from '../services/caseEvaluator';
import { 
  Briefcase, 
  UploadCloud, 
  Check, 
  ArrowRight, 
  X, 
  Plus, 
  Trash2, 
  Sparkles, 
  Layers, 
  SlidersHorizontal,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface OnboardingWizardProps {
  initialRole: RoleSetup;
  onComplete: (role: RoleSetup, uploadedCandidates: CandidateCaseFile[], reviewMode: ReviewMode) => void;
  onCancel: () => void;
}

const PRESET_ROLES: RoleSetup[] = [
  {
    title: 'Staff Distributed Systems Engineer',
    seniority: 'Staff/Principal',
    teamType: 'Core Infrastructure & Platform',
    mustHaveSkills: [
      'Go or Rust systems programming',
      'Raft or Paxos consensus internals',
      'Apache Kafka streaming (500k+ events/s)',
      'Kubernetes orchestration & service mesh'
    ],
    niceToHaveSkills: [
      'LSM-tree storage engine internals',
      'eBPF kernel telemetry & socket tracing',
      'Active-active disaster recovery topologies'
    ],
    summary: 'Architect and scale our real-time telemetry streaming backbone, optimizing low-latency state machines and consensus clusters across multi-region infrastructure.'
  },
  {
    title: 'Principal AI & LLM Systems Architect',
    seniority: 'Staff/Principal',
    teamType: 'AI & Data Platform',
    mustHaveSkills: [
      'vLLM / TensorRT-LLM inference serving',
      'Distributed training & checkpointing (Megatron/FSDP)',
      'High-throughput vector indexing (HNSW/IVF)',
      'CUDA kernel profiling & memory optimization'
    ],
    niceToHaveSkills: [
      'Agentic workflow tool orchestration',
      'Speculative decoding & KV-cache quantization',
      'Ray cluster autoscaling on Kubernetes'
    ],
    summary: 'Lead the architecture of our high-throughput AI agent inference runtime, driving sub-50ms token generation across multi-node GPU clusters.'
  },
  {
    title: 'Lead Product Security Engineer',
    seniority: 'Lead',
    teamType: 'Security & Trust',
    mustHaveSkills: [
      'Zero-Trust identity & mutual TLS architectures',
      'Application threat modeling & offensive red-teaming',
      'Automated SAST/DAST CI/CD gate design',
      'AWS / GCP cloud IAM privilege boundary isolation'
    ],
    niceToHaveSkills: [
      'Cryptographic hardware key attestation (HSM/TPM)',
      'SOC2 / ISO27001 regulatory compliance audits',
      'Rust systems memory-safety code reviews'
    ],
    summary: 'Direct defensive security architecture and automated threat boundary verification across customer-facing cloud products.'
  }
];

interface UploadItem {
  file: File;
  name: string;
  parsedData: StructuredResumeData;
}

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialRole,
  onComplete,
  onCancel
}) => {
  const [role, setRole] = useState<RoleSetup>(initialRole);
  const [newMustHave, setNewMustHave] = useState('');
  const [newNiceToHave, setNewNiceToHave] = useState('');
  const [rawJdText, setRawJdText] = useState('');
  const [isParsingJd, setIsParsingJd] = useState(false);

  // Uploaded files in wizard
  const [uploadedFiles, setUploadedFiles] = useState<UploadItem[]>([]);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Add must-have skill
  const handleAddMustHave = () => {
    if (newMustHave.trim()) {
      setRole(prev => ({ ...prev, mustHaveSkills: [...prev.mustHaveSkills, newMustHave.trim()] }));
      setNewMustHave('');
    }
  };

  const handleRemoveMustHave = (idx: number) => {
    setRole(prev => ({ ...prev, mustHaveSkills: prev.mustHaveSkills.filter((_, i) => i !== idx) }));
  };

  // Add nice-to-have skill
  const handleAddNiceToHave = () => {
    if (newNiceToHave.trim()) {
      setRole(prev => ({ ...prev, niceToHaveSkills: [...prev.niceToHaveSkills, newNiceToHave.trim()] }));
      setNewNiceToHave('');
    }
  };

  const handleRemoveNiceToHave = (idx: number) => {
    setRole(prev => ({ ...prev, niceToHaveSkills: prev.niceToHaveSkills.filter((_, i) => i !== idx) }));
  };

  // Parse raw JD text into skills
  const handleParseRawJd = () => {
    if (!rawJdText.trim()) return;
    setIsParsingJd(true);
    
    // Extract key lines or bullet points
    const lines = rawJdText.split('\n').map(l => l.trim()).filter(Boolean);
    const extractedSkills: string[] = [];
    
    for (const line of lines) {
      if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        const clean = line.replace(/^[•\-*]\s*/, '').trim();
        if (clean.length > 5 && clean.length < 90) {
          extractedSkills.push(clean);
        }
      }
    }

    if (extractedSkills.length > 0) {
      setRole(prev => ({
        ...prev,
        mustHaveSkills: [...new Set([...prev.mustHaveSkills, ...extractedSkills.slice(0, 4)])],
        niceToHaveSkills: [...new Set([...prev.niceToHaveSkills, ...extractedSkills.slice(4, 7)])]
      }));
    }
    setIsParsingJd(false);
  };

  // Handle PDF file drops
  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: File[] = [];
    if ('dataTransfer' in e) {
      e.preventDefault();
      droppedFilesHandler(Array.from(e.dataTransfer.files));
    } else if (e.target.files) {
      droppedFilesHandler(Array.from(e.target.files));
    }
  };

  const droppedFilesHandler = async (files: File[]) => {
    if (files.length === 0) return;
    setIsProcessingFiles(true);
    setErrorMsg(null);

    for (const file of files) {
      try {
        const parsed = await extractTextFromPDF(file);
        setUploadedFiles(prev => [...prev, { file, name: parsed.name, parsedData: parsed }]);
      } catch (err: any) {
        setErrorMsg(`Failed to parse ${file.name}: ${err.message || 'Unknown error'}`);
      }
    }
    setIsProcessingFiles(false);
  };

  const handleRemoveUploadedFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Finish wizard and launch board
  const handleFinish = () => {
    const generatedCandidates: CandidateCaseFile[] = uploadedFiles.map((uf) => {
      return CaseEvaluator.evaluate(
        uf.parsedData,
        role,
        uf.name,
        uf.parsedData.portfolioUrl || undefined,
        'Ingested via Full-Screen Role Studio'
      );
    });

    onComplete(role, generatedCandidates, 'recruiter');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 flex flex-col text-slate-900 font-sans overflow-hidden">
      
      {/* 1. Full-Screen Top Header Bar */}
      <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
            HF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900">Role Blueprint Studio</h2>
              <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 uppercase tracking-wider">
                Full-Screen Workspace
              </span>
            </div>
            <p className="text-xs text-slate-500">Configure role evaluation criteria and ingest candidate resumes</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Cancel & Exit
          </button>
          <button
            onClick={handleFinish}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <span>Launch Case Board ({uploadedFiles.length} Candidate{uploadedFiles.length === 1 ? '' : 's'})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Full-Screen 50/50 Split Body */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* LEFT 50% PANE: Role Specification & Criteria Builder */}
        <div className="w-1/2 border-r border-slate-200 bg-white p-8 overflow-y-auto space-y-6">
          
          {/* Quick Preset Selector */}
          <div>
            <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Fast Track: Select an Enterprise Role Preset
            </div>
            <div className="grid grid-cols-3 gap-2.5">
              {PRESET_ROLES.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setRole(preset)}
                  className={`p-3 rounded-xl border text-left transition-all text-xs ${
                    role.title === preset.title
                      ? 'border-indigo-600 bg-indigo-50/50 ring-1 ring-indigo-600 text-indigo-950 font-semibold'
                      : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="font-bold truncate">{preset.title.split(' ')[0]} {preset.title.split(' ')[1]}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{preset.seniority}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Role Details Form */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              1. Job Profile Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={role.title}
                  onChange={(e) => setRole(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Seniority Level
                </label>
                <select
                  value={role.seniority}
                  onChange={(e) => setRole(prev => ({ ...prev, seniority: e.target.value }))}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="Junior">Junior (0-2y)</option>
                  <option value="Mid-Level">Mid-Level (2-5y)</option>
                  <option value="Senior">Senior (5-8y)</option>
                  <option value="Staff/Principal">Staff / Principal (8+y)</option>
                  <option value="Lead">Team Lead</option>
                  <option value="Director/VP">Director / Executive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Target Team / Organization
              </label>
              <input
                type="text"
                value={role.teamType}
                onChange={(e) => setRole(prev => ({ ...prev, teamType: e.target.value }))}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Must-Have Requirements */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                2. Must-Have Evaluation Criteria ({role.mustHaveSkills.length})
              </h3>
              <span className="text-xs text-slate-500 font-mono">Hard gating requirements</span>
            </div>

            <div className="space-y-2">
              {role.mustHaveSkills.map((skill, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between text-xs text-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-medium">{skill}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveMustHave(idx)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new requirement */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add another requirement (e.g. Apache Kafka, Rust, Distributed consensus)..."
                value={newMustHave}
                onChange={(e) => setNewMustHave(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMustHave())}
                className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddMustHave}
                className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg"
              >
                Add
              </button>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Paste Raw JD section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              3. Quick-Import from Existing Job Description
            </h3>
            <textarea
              rows={3}
              placeholder="Paste raw JD text or requirements bullet points here to auto-populate criteria..."
              value={rawJdText}
              onChange={(e) => setRawJdText(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-900 focus:bg-white focus:ring-2 focus:ring-indigo-500 font-mono"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleParseRawJd}
                disabled={!rawJdText.trim()}
                className="px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors disabled:opacity-40"
              >
                Extract Criteria from Text
              </button>
            </div>
          </div>

        </div>

        {/* RIGHT 50% PANE: Ingest Candidate Resumes */}
        <div className="w-1/2 bg-slate-50/50 p-8 overflow-y-auto space-y-6">
          
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Ingest Candidate Resumes
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Upload candidate PDFs. Each resume is parsed client-side and mapped against the active role criteria.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Large Dropzone */}
          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-white hover:bg-indigo-50/20 rounded-xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all shadow-sm"
          >
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileDrop}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-3 shadow-sm">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-900">
              Drop candidate resume PDFs here, or click to browse
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Supports multi-file upload. Parses raw PDF text, detects projects, skills, education, and extracts exact evidence.
            </p>
          </label>

          {isProcessingFiles && (
            <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3 text-xs text-indigo-900">
              <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Extracting text and reconstructing coordinates...</span>
            </div>
          )}

          {/* Ingested Files Preview Roster */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                Uploaded Candidates ({uploadedFiles.length})
              </h4>
              {uploadedFiles.length > 0 && (
                <span className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Ready to evaluate
                </span>
              )}
            </div>

            {uploadedFiles.length === 0 ? (
              <div className="p-6 bg-white rounded-xl border border-slate-200 text-center text-xs text-slate-400">
                No candidates uploaded yet. Drop a resume PDF above or launch with a clean empty board.
              </div>
            ) : (
              <div className="space-y-2.5">
                {uploadedFiles.map((uf, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{uf.name}</span>
                        <span className="text-[10px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                          {uf.parsedData.headline || 'Parsed Candidate'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 pt-1">
                        <span>{uf.parsedData.skills.length} skills found</span>
                        <span>•</span>
                        <span>{uf.parsedData.projects.length} projects documented</span>
                        {uf.parsedData.email && (
                          <>
                            <span>•</span>
                            <span>{uf.parsedData.email}</span>
                          </>
                        )}
                      </div>

                      {/* Display project tags */}
                      {uf.parsedData.projects.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {uf.parsedData.projects.map((p, pIdx) => (
                            <span
                              key={pIdx}
                              className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100"
                            >
                              {p.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveUploadedFile(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-slate-100 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};
