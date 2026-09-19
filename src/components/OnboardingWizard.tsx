import React, { useState } from 'react';
import { RoleSetup, ReviewMode, CandidateCaseFile } from '../types';
import { extractTextFromPDF } from '../services/pdfParser';
import { CaseEvaluator } from '../services/caseEvaluator';
import { 
  Briefcase, 
  UploadCloud, 
  FileText, 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  UserCheck, 
  Mic, 
  Users, 
  Trash2, 
  Plus, 
  Link as LinkIcon,
  Sparkles,
  ShieldCheck,
  Layers,
  Cpu,
  Terminal,
  X,
  Target
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

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  initialRole,
  onComplete,
  onCancel
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1: Role setup
  const [role, setRole] = useState<RoleSetup>(initialRole);
  const [newMustHave, setNewMustHave] = useState('');
  const [newNiceToHave, setNewNiceToHave] = useState('');

  // Step 2: Candidate upload
  const [uploadedFiles, setUploadedFiles] = useState<{ file: File; parsedName: string; parsedText: string }[]>([]);
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [optionalNotes, setOptionalNotes] = useState('');
  const [isParsing, setIsParsing] = useState(false);

  // Step 3: Review mode
  const [reviewMode, setReviewMode] = useState<ReviewMode>('recruiter');

  // Load preset
  const handleApplyPreset = (preset: RoleSetup) => {
    setRole(preset);
  };

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

  // Handle PDF file upload in Step 2
  const handleFileDrop = async (e: React.ChangeEvent<HTMLInputElement> | React.DragEvent) => {
    let files: File[] = [];
    if ('dataTransfer' in e) {
      e.preventDefault();
      files = Array.from(e.dataTransfer.files);
    } else if (e.target.files) {
      files = Array.from(e.target.files);
    }

    if (files.length === 0) return;

    setIsParsing(true);
    for (const file of files) {
      try {
        const parsed = await extractTextFromPDF(file);
        setUploadedFiles(prev => [...prev, { file, parsedName: parsed.name, parsedText: parsed.rawText }]);
      } catch (err) {
        setUploadedFiles(prev => [...prev, { 
          file, 
          parsedName: file.name.replace(/\.[^/.]+$/, ''), 
          parsedText: `Candidate dossier for ${file.name}` 
        }]);
      }
    }
    setIsParsing(false);
  };

  const handleRemoveFile = (idx: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // Finish wizard
  const handleFinish = () => {
    const generatedCandidates: CandidateCaseFile[] = uploadedFiles.map((uf) => {
      return CaseEvaluator.evaluate(
        uf.parsedText,
        role,
        uf.parsedName,
        portfolioUrl || undefined,
        optionalNotes || undefined
      );
    });

    onComplete(role, generatedCandidates, reviewMode);
  };

  return (
    <div className="fixed inset-0 z-50 bg-ink-950 flex flex-col text-slate-200 overflow-y-auto font-sans">
      
      {/* Full-Screen Top Control Bar */}
      <header className="w-full border-b border-ink-border bg-ink-900/90 backdrop-blur-md sticky top-0 z-30 px-6 sm:px-10 h-18 flex items-center justify-between">
        
        {/* Left Identity */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gold-glow border border-gold-border flex items-center justify-center text-gold-500 font-bold text-sm">
            HF
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold text-base tracking-tight">HireFlow Studio</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-ink-800 border border-ink-border text-gold-400">
                FULL-SCREEN ARCHITECT
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              Investigation Room Setup • Step {step} of 3
            </div>
          </div>
        </div>

        {/* Center Progress Stepper */}
        <div className="hidden md:flex items-center gap-2 font-mono text-xs">
          <button 
            onClick={() => setStep(1)}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${
              step === 1 
                ? 'bg-gold-500 text-ink-950 font-bold border-gold-400 shadow-md' 
                : 'bg-ink-850 text-slate-400 border-ink-border hover:text-white'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px]">1</span>
            <span>Role Blueprint</span>
          </button>

          <span className="text-slate-600">→</span>

          <button 
            onClick={() => setStep(2)}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${
              step === 2 
                ? 'bg-gold-500 text-ink-950 font-bold border-gold-400 shadow-md' 
                : 'bg-ink-850 text-slate-400 border-ink-border hover:text-white'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px]">2</span>
            <span>Dossier Intake</span>
          </button>

          <span className="text-slate-600">→</span>

          <button 
            onClick={() => setStep(3)}
            className={`px-4 py-2 rounded-xl border flex items-center gap-2 transition-all ${
              step === 3 
                ? 'bg-gold-500 text-ink-950 font-bold border-gold-400 shadow-md' 
                : 'bg-ink-850 text-slate-400 border-ink-border hover:text-white'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-black/20 flex items-center justify-center text-[10px]">3</span>
            <span>Review Mode</span>
          </button>
        </div>

        {/* Right Cancel / Exit */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-ink-850 hover:bg-ink-800 border border-ink-border text-slate-300 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Exit to Board</span>
          </button>
        </div>

      </header>

      {/* Main Full-Screen Body */}
      <main className="flex-1 w-full max-w-[1720px] mx-auto p-6 sm:p-10 flex flex-col justify-between">
        
        {/* STEP 1: ROLE BLUEPRINT STUDIO */}
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in duration-200">
            
            {/* 1-Click Role Presets Strip */}
            <div className="dossier-card rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-ink-border">
              <div className="flex items-center gap-2.5 text-xs font-mono text-slate-300">
                <Sparkles className="w-4 h-4 text-gold-500" />
                <span className="font-bold text-white uppercase tracking-wider">Quick Presets:</span>
                <span className="text-slate-400 hidden lg:inline">Load calibrated enterprise architecture profiles</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {PRESET_ROLES.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleApplyPreset(preset)}
                    className="px-3 py-1.5 rounded-lg bg-ink-850 hover:bg-ink-800 border border-ink-border hover:border-gold-border text-[11px] font-mono text-slate-200 hover:text-gold-400 transition-colors"
                  >
                    {preset.title.split(' ')[0]} {preset.title.split(' ')[1]}
                  </button>
                ))}
              </div>
            </div>

            {/* Two Full-Height Master Wings */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left Wing (7 cols): Configuration Console */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Role Title */}
                <div className="dossier-card rounded-2xl p-6 border border-ink-border space-y-3">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                    Target Role Title
                  </label>
                  <input
                    type="text"
                    value={role.title}
                    onChange={e => setRole({ ...role, title: e.target.value })}
                    placeholder="e.g. Staff Distributed Systems Engineer"
                    className="w-full bg-ink-900 border border-ink-border rounded-xl p-3.5 text-white font-semibold text-base focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>

                {/* Seniority Segments */}
                <div className="dossier-card rounded-2xl p-6 border border-ink-border space-y-3">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                    Seniority Level
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                    {(['Junior', 'Mid', 'Senior', 'Staff/Principal', 'Lead'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setRole({ ...role, seniority: lvl })}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          role.seniority === lvl
                            ? 'bg-gold-500 text-ink-950 font-bold border-gold-400 shadow-md'
                            : 'bg-ink-900 border-ink-border text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        <div className="text-xs">{lvl}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Team Type Cards */}
                <div className="dossier-card rounded-2xl p-6 border border-ink-border space-y-3">
                  <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                    Engineering Domain / Team
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { name: 'Core Infrastructure & Platform', desc: 'Consensus, streaming, low-latency backbones' },
                      { name: 'AI & Data Platform', desc: 'Inference runtime, GPU clusters, vector search' },
                      { name: 'Product Engineering', desc: 'High-availability user APIs, real-time web engines' },
                      { name: 'Security & Trust', desc: 'Zero-trust identity, cryptography, boundary isolation' }
                    ].map(t => (
                      <button
                        key={t.name}
                        type="button"
                        onClick={() => setRole({ ...role, teamType: t.name })}
                        className={`p-3.5 rounded-xl border text-left transition-all ${
                          role.teamType === t.name
                            ? 'bg-ink-800 border-gold-500 ring-1 ring-gold-500/40 text-white'
                            : 'bg-ink-900 border-ink-border text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        <div className="font-bold text-xs text-white mb-0.5">{t.name}</div>
                        <div className="text-[11px] text-slate-400 leading-snug">{t.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Must-Have Skills Studio */}
                <div className="dossier-card rounded-2xl p-6 border border-ink-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-gold-400 font-bold">
                        Must-Have Core Requirements ({role.mustHaveSkills.length})
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Candidates will be audited line-by-line against these criteria
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {role.mustHaveSkills.map((skill, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-xl bg-ink-900 border border-ink-border hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Target className="w-3.5 h-3.5 text-gold-500" />
                          <span className="font-mono text-xs text-slate-200">{skill}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveMustHave(idx)}
                          className="text-slate-500 hover:text-flag-500 transition-colors p-1"
                          title="Remove requirement"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Input */}
                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newMustHave}
                      onChange={e => setNewMustHave(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddMustHave()}
                      placeholder="Add mandatory requirement (e.g. Apache Kafka streaming, Raft consensus)..."
                      className="flex-1 bg-ink-900 border border-ink-border rounded-xl p-3 text-white text-xs focus:outline-none focus:border-gold-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddMustHave}
                      className="px-5 py-3 bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>

                {/* Nice-To-Have Skills */}
                <div className="dossier-card rounded-2xl p-6 border border-ink-border space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                        Nice-to-Have Bonus Criteria ({role.niceToHaveSkills.length})
                      </label>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Secondary differentiators for top-percentile candidates
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {role.niceToHaveSkills.map((skill, idx) => (
                      <div 
                        key={idx} 
                        className="flex items-center justify-between p-3 rounded-xl bg-ink-900 border border-ink-border hover:border-slate-700 transition-colors"
                      >
                        <span className="font-mono text-xs text-slate-300">{skill}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveNiceToHave(idx)}
                          className="text-slate-500 hover:text-flag-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      value={newNiceToHave}
                      onChange={e => setNewNiceToHave(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNiceToHave()}
                      placeholder="Add nice-to-have qualification..."
                      className="flex-1 bg-ink-900 border border-ink-border rounded-xl p-3 text-white text-xs focus:outline-none focus:border-gold-500 font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddNiceToHave}
                      className="px-5 py-3 bg-ink-850 hover:bg-ink-800 border border-ink-border text-slate-200 font-semibold rounded-xl text-xs transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

              </div>

              {/* Right Wing (5 cols): Real-Time Role Dossier Blueprint */}
              <div className="lg:col-span-5 space-y-6 sticky top-24">
                
                <div className="dossier-card rounded-2xl p-7 border-2 border-gold-border/60 bg-gradient-to-b from-ink-850 to-ink-900 space-y-5 shadow-2xl relative overflow-hidden">
                  
                  <div className="flex items-center justify-between border-b border-ink-border pb-4">
                    <div className="flex items-center gap-2 font-mono text-xs text-gold-400">
                      <ShieldCheck className="w-4 h-4 text-gold-500" />
                      <span>LIVE DOSSIER BLUEPRINT</span>
                    </div>
                    <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-gold-glow border border-gold-border text-gold-400 font-bold">
                      ACTIVE SPEC
                    </span>
                  </div>

                  <div>
                    <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                      Position Architecture
                    </span>
                    <h3 className="text-xl font-extrabold text-white mt-1 tracking-tight leading-snug">
                      {role.title || 'Untitled Role Specification'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-xs">
                      <span className="px-2.5 py-1 rounded bg-ink-800 border border-ink-border text-gold-400 font-bold">
                        {role.seniority}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-slate-300">{role.teamType}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed p-4 rounded-xl bg-ink-950 border border-ink-border">
                    {role.summary}
                  </p>

                  {/* Criteria Checklist Preview */}
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                      <span>Must-Have Criteria</span>
                      <span className="text-gold-400 font-bold">{role.mustHaveSkills.length} Required</span>
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {role.mustHaveSkills.map((s, i) => (
                        <div key={i} className="p-2.5 rounded-lg bg-ink-950 border border-ink-border flex items-center gap-2 text-xs font-mono text-slate-300">
                          <Check className="w-3.5 h-3.5 text-verified-400 flex-shrink-0" />
                          <span className="truncate">{s}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {role.niceToHaveSkills.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-ink-border">
                      <div className="text-xs font-mono text-slate-400">
                        Nice-to-Have Differentiators ({role.niceToHaveSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {role.niceToHaveSkills.map((s, i) => (
                          <span key={i} className="text-[11px] font-mono bg-ink-950 border border-ink-border px-2.5 py-1 rounded text-slate-300">
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-ink-border flex items-center justify-between text-xs text-slate-400 font-mono">
                    <span>Evidence Grounding: Strict</span>
                    <span className="text-verified-400">Source Verification Enabled</span>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

        {/* STEP 2: DOSSIER INTAKE STUDIO (CANDIDATE UPLOAD) */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto w-full space-y-8 py-8 animate-in fade-in duration-200">
            
            <div className="text-center space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-gold-400">
                Step 2: Candidate Intake
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Ingest Resumes & Portfolios for {role.title}
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Upload real candidate PDF resumes or provide portfolio repositories. Each will be parsed dynamically and mapped against your custom criteria.
              </p>
            </div>

            {/* Massive Full Screen Drag & Drop Zone */}
            <div className="dossier-card rounded-3xl p-12 border-2 border-dashed border-ink-border hover:border-gold-500/60 text-center transition-all relative cursor-pointer group bg-ink-900/50">
              <input
                type="file"
                multiple
                accept=".pdf,.docx,application/pdf"
                onChange={handleFileDrop}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
              <div className="w-16 h-16 rounded-2xl bg-gold-glow border border-gold-border flex items-center justify-center mx-auto mb-4 text-gold-500 group-hover:scale-105 transition-transform shadow-lg">
                <UploadCloud className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Drag and drop candidate files here, or browse
              </h3>
              <p className="text-slate-400 text-xs mt-1.5">
                Supports standard PDF and text documents. Automatic evidence cross-referencing.
              </p>
            </div>

            {/* Uploaded Files Chips */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-3">
                <div className="text-xs font-mono text-slate-400">
                  Ready to Evaluate ({uploadedFiles.length} Dossiers):
                </div>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {uploadedFiles.map((uf, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between p-3.5 rounded-xl bg-ink-850 border border-ink-border hover:border-slate-700"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-gold-500" />
                        <div>
                          <div className="font-bold text-white text-xs">{uf.parsedName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{uf.file.name}</div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleRemoveFile(idx)} 
                        className="text-slate-500 hover:text-flag-500 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Portfolio Link & Optional Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <LinkIcon className="w-3.5 h-3.5 text-gold-500" />
                  <span>GitHub or Portfolio Repository (Optional)</span>
                </label>
                <input
                  type="url"
                  value={portfolioUrl}
                  onChange={e => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/candidate-repo"
                  className="w-full bg-ink-900 border border-ink-border rounded-xl p-3 text-white text-xs focus:outline-none focus:border-gold-500 font-mono"
                />
              </div>

              <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                  Hiring Intake Notes (Optional)
                </label>
                <input
                  type="text"
                  value={optionalNotes}
                  onChange={e => setOptionalNotes(e.target.value)}
                  placeholder="e.g. Inbound referral from Systems Architect"
                  className="w-full bg-ink-900 border border-ink-border rounded-xl p-3 text-white text-xs focus:outline-none focus:border-gold-500"
                />
              </div>
            </div>

          </div>
        )}

        {/* STEP 3: REVIEW MODE WORKSPACE SELECTOR */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto w-full space-y-8 py-8 animate-in fade-in duration-200">
            
            <div className="text-center space-y-2">
              <span className="text-xs font-mono uppercase tracking-wider text-gold-400">
                Step 3: Workspace Persona
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight">
                Select Your Investigation Workspace
              </h2>
              <p className="text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
                Tailor how candidate evidence cards, technical probes, and scoring rails are laid out.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
              
              <button
                type="button"
                onClick={() => setReviewMode('recruiter')}
                className={`p-6 rounded-2xl text-left border transition-all ${
                  reviewMode === 'recruiter'
                    ? 'bg-ink-800 border-gold-500 ring-2 ring-gold-500/40 shadow-xl'
                    : 'bg-ink-900 border-ink-border hover:border-slate-600'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-gold-glow border border-gold-border flex items-center justify-center text-gold-500 mb-4">
                  <UserCheck className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-white mb-2">Recruiter Mode</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Optimized for fast candidate triage, automated proof verification, and match score distribution.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReviewMode('interviewer')}
                className={`p-6 rounded-2xl text-left border transition-all ${
                  reviewMode === 'interviewer'
                    ? 'bg-ink-800 border-gold-500 ring-2 ring-gold-500/40 shadow-xl'
                    : 'bg-ink-900 border-ink-border hover:border-slate-600'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-verified-subtle border border-verified-border flex items-center justify-center text-verified-400 mb-4">
                  <Mic className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-white mb-2">Interviewer Mode</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Focuses on deep-dive question trees, live speech-to-text transcriptions, and follow-up probes.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setReviewMode('team_review')}
                className={`p-6 rounded-2xl text-left border transition-all ${
                  reviewMode === 'team_review'
                    ? 'bg-ink-800 border-gold-500 ring-2 ring-gold-500/40 shadow-xl'
                    : 'bg-ink-900 border-ink-border hover:border-slate-600'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-caution-subtle border border-caution-border flex items-center justify-center text-caution-500 mb-4">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base text-white mb-2">Team Review Mode</h3>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Designed for consensus hiring committee debriefs, team observation notes, and offer sign-offs.
                </p>
              </button>

            </div>

          </div>
        )}

        {/* Full-Screen Footer Bar */}
        <div className="border-t border-ink-border pt-6 mt-8 flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as any)}
                className="px-6 py-3 rounded-xl bg-ink-850 hover:bg-ink-800 text-slate-300 font-medium text-xs border border-ink-border transition-colors flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous Step</span>
              </button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                onClick={() => setStep((step + 1) as any)}
                className="px-8 py-3.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs shadow-lg transition-all flex items-center gap-2"
              >
                <span>Continue to Step {step + 1}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-8 py-3.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-ink-950 font-bold text-xs shadow-xl transition-all flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Launch Case Board</span>
              </button>
            )}
          </div>
        </div>

      </main>

    </div>
  );
};
