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
  Link as LinkIcon 
} from 'lucide-react';

interface OnboardingWizardProps {
  initialRole: RoleSetup;
  onComplete: (role: RoleSetup, uploadedCandidates: CandidateCaseFile[], reviewMode: ReviewMode) => void;
  onCancel: () => void;
}

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
        console.warn('PDF parse error:', err);
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
    // Generate candidate case files dynamically from uploaded files
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md overflow-y-auto">
      <div className="case-card rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-case-borderLight animate-in fade-in zoom-in-95 duration-200">
        
        {/* Progress Header */}
        <div className="p-5 bg-case-bgAlt border-b border-case-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-blue/15 border border-accent-blue/30 flex items-center justify-center text-accent-blue font-bold text-xs">
              {step}
            </div>
            <div>
              <div className="text-xs font-mono text-slate-400">Step {step} of 3</div>
              <h2 className="text-base font-bold text-white">
                {step === 1 && 'Role Setup'}
                {step === 2 && 'Candidate Upload'}
                {step === 3 && 'Review Mode'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Step indicators */}
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-xs">
              <span className={`px-2.5 py-1 rounded ${step === 1 ? 'bg-accent-blue text-black font-bold' : 'bg-case-surface text-slate-400'}`}>1. Role</span>
              <span className="text-slate-600">→</span>
              <span className={`px-2.5 py-1 rounded ${step === 2 ? 'bg-accent-blue text-black font-bold' : 'bg-case-surface text-slate-400'}`}>2. Upload</span>
              <span className="text-slate-600">→</span>
              <span className={`px-2.5 py-1 rounded ${step === 3 ? 'bg-accent-blue text-black font-bold' : 'bg-case-surface text-slate-400'}`}>3. Mode</span>
            </div>

            <button onClick={onCancel} className="text-xs text-slate-400 hover:text-white px-2 py-1">
              Cancel
            </button>
          </div>
        </div>

        {/* Wizard Step Content */}
        <div className="p-6 overflow-y-auto flex-1 font-sans text-xs">
          
          {/* STEP 1: Role Setup */}
          {step === 1 && (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              
              {/* Left Column: Form */}
              <div className="md:col-span-7 space-y-4">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Job Title</label>
                  <input
                    type="text"
                    value={role.title}
                    onChange={e => setRole({ ...role, title: e.target.value })}
                    placeholder="e.g. Senior Backend Engineer"
                    className="w-full bg-case-bg border border-case-border rounded-xl p-2.5 text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Seniority</label>
                    <select
                      value={role.seniority}
                      onChange={e => setRole({ ...role, seniority: e.target.value as any })}
                      className="w-full bg-case-bg border border-case-border rounded-xl p-2.5 text-white text-xs focus:outline-none"
                    >
                      <option value="Junior">Junior</option>
                      <option value="Mid">Mid-Level</option>
                      <option value="Senior">Senior</option>
                      <option value="Staff/Principal">Staff / Principal</option>
                      <option value="Lead">Lead / Architect</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Team Type</label>
                    <input
                      type="text"
                      value={role.teamType}
                      onChange={e => setRole({ ...role, teamType: e.target.value })}
                      placeholder="e.g. Platform Infrastructure"
                      className="w-full bg-case-bg border border-case-border rounded-xl p-2.5 text-white text-xs focus:outline-none"
                    />
                  </div>
                </div>

                {/* Must-Have Skills */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Must-Have Skills</label>
                  <div className="space-y-1.5 mb-2 max-h-32 overflow-y-auto">
                    {role.mustHaveSkills.map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-case-surface border border-case-border">
                        <span className="text-slate-200 font-mono text-[11px]">{skill}</span>
                        <button onClick={() => handleRemoveMustHave(idx)} className="text-slate-500 hover:text-accent-red">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMustHave}
                      onChange={e => setNewMustHave(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddMustHave()}
                      placeholder="Add must-have skill..."
                      className="flex-1 bg-case-bg border border-case-border rounded-lg p-2 text-white text-xs focus:outline-none"
                    />
                    <button onClick={handleAddMustHave} className="px-3 py-1.5 bg-case-surface hover:bg-case-surfaceLight border border-case-border rounded-lg text-slate-200 font-semibold">
                      Add
                    </button>
                  </div>
                </div>

                {/* Nice-To-Have Skills */}
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Nice-To-Have Skills</label>
                  <div className="space-y-1.5 mb-2 max-h-24 overflow-y-auto">
                    {role.niceToHaveSkills.map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-case-surface border border-case-border">
                        <span className="text-slate-200 font-mono text-[11px]">{skill}</span>
                        <button onClick={() => handleRemoveNiceToHave(idx)} className="text-slate-500 hover:text-accent-red">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newNiceToHave}
                      onChange={e => setNewNiceToHave(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddNiceToHave()}
                      placeholder="Add nice-to-have skill..."
                      className="flex-1 bg-case-bg border border-case-border rounded-lg p-2 text-white text-xs focus:outline-none"
                    />
                    <button onClick={handleAddNiceToHave} className="px-3 py-1.5 bg-case-surface hover:bg-case-surfaceLight border border-case-border rounded-lg text-slate-200 font-semibold">
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Column: Live Role Summary Card */}
              <div className="md:col-span-5">
                <div className="case-card rounded-xl p-5 border border-case-border space-y-3 sticky top-0">
                  <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Live Role Summary</div>
                  <h3 className="text-base font-bold text-white">{role.title || 'Untitled Role'}</h3>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-case-surfaceElevated border border-case-border text-slate-300 font-semibold">
                      {role.seniority}
                    </span>
                    <span>•</span>
                    <span>{role.teamType || 'Engineering'}</span>
                  </div>

                  <div className="pt-2 border-t border-case-border space-y-2">
                    <div className="text-[11px] font-mono text-slate-400">Must-Have ({role.mustHaveSkills.length}):</div>
                    <div className="flex flex-wrap gap-1">
                      {role.mustHaveSkills.map((s, i) => (
                        <span key={i} className="text-[10px] font-mono bg-case-bg border border-case-border px-2 py-0.5 rounded text-accent-blue">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-case-border space-y-2">
                    <div className="text-[11px] font-mono text-slate-400">Nice-to-Have ({role.niceToHaveSkills.length}):</div>
                    <div className="flex flex-wrap gap-1">
                      {role.niceToHaveSkills.map((s, i) => (
                        <span key={i} className="text-[10px] font-mono bg-case-bg border border-case-border px-2 py-0.5 rounded text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* STEP 2: Candidate Upload */}
          {step === 2 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              
              {/* Drag and Drop Zone */}
              <div className="case-card rounded-2xl p-6 border-2 border-dashed border-case-border hover:border-accent-blue/50 text-center transition-colors relative cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".pdf,.docx,application/pdf"
                  onChange={handleFileDrop}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <div className="w-12 h-12 rounded-xl bg-case-surfaceElevated border border-case-border flex items-center justify-center mx-auto mb-3 text-accent-blue">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-sm text-white">Drag and drop candidate files here, or browse</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Supports PDF and documents. Evaluated dynamically against your custom role.
                </p>
              </div>

              {/* Uploaded Files Chips */}
              {uploadedFiles.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-400">Uploaded Candidate Files ({uploadedFiles.length}):</div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {uploadedFiles.map((uf, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-case-surface border border-case-border">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-accent-blue" />
                          <span className="font-semibold text-slate-200">{uf.parsedName}</span>
                          <span className="text-[10px] font-mono text-slate-400">({uf.file.name})</span>
                        </div>
                        <button onClick={() => handleRemoveFile(idx)} className="text-slate-500 hover:text-accent-red">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio URL & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1 flex items-center gap-1.5">
                    <LinkIcon className="w-3 h-3 text-slate-400" />
                    <span>Portfolio or GitHub URL</span>
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={e => setPortfolioUrl(e.target.value)}
                    placeholder="https://github.com/candidate"
                    className="w-full bg-case-bg border border-case-border rounded-xl p-2.5 text-white text-xs focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Optional Notes</label>
                  <input
                    type="text"
                    value={optionalNotes}
                    onChange={e => setOptionalNotes(e.target.value)}
                    placeholder="e.g. Referred by Lead Architect"
                    className="w-full bg-case-bg border border-case-border rounded-xl p-2.5 text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

            </div>
          )}

          {/* STEP 3: Review Mode */}
          {step === 3 && (
            <div className="space-y-5 max-w-2xl mx-auto">
              <div className="text-center space-y-1">
                <h3 className="text-lg font-bold text-white">Choose Review Workspace Mode</h3>
                <p className="text-slate-400 text-xs">Configure how case files, evidence, and questioning tools are arranged</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3">
                
                <button
                  type="button"
                  onClick={() => setReviewMode('recruiter')}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    reviewMode === 'recruiter'
                      ? 'bg-case-surfaceElevated border-accent-blue ring-1 ring-accent-blue/50'
                      : 'bg-case-surface border-case-border hover:border-slate-600'
                  }`}
                >
                  <UserCheck className="w-6 h-6 text-accent-blue mb-2.5" />
                  <div className="font-bold text-sm text-white mb-1">Recruiter mode</div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Fast screening, verified evidence checks, and candidate grouping.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewMode('interviewer')}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    reviewMode === 'interviewer'
                      ? 'bg-case-surfaceElevated border-accent-blue ring-1 ring-accent-blue/50'
                      : 'bg-case-surface border-case-border hover:border-slate-600'
                  }`}
                >
                  <Mic className="w-6 h-6 text-accent-green mb-2.5" />
                  <div className="font-bold text-sm text-white mb-1">Interviewer mode</div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Interview prep, follow-up probe trees, and speech transcription.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setReviewMode('team_review')}
                  className={`p-4 rounded-xl text-left border transition-all ${
                    reviewMode === 'team_review'
                      ? 'bg-case-surfaceElevated border-accent-blue ring-1 ring-accent-blue/50'
                      : 'bg-case-surface border-case-border hover:border-slate-600'
                  }`}
                >
                  <Users className="w-6 h-6 text-accent-amber mb-2.5" />
                  <div className="font-bold text-sm text-white mb-1">Team review mode</div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Collaborative hiring debriefs, team observation notes, and offer consensus.
                  </p>
                </button>

              </div>
            </div>
          )}

        </div>

        {/* Wizard Navigation Footer */}
        <div className="p-4 bg-case-bgAlt border-t border-case-border flex items-center justify-between">
          <div>
            {step > 1 && (
              <button
                onClick={() => setStep((step - 1) as any)}
                className="px-4 py-2 rounded-xl bg-case-surface hover:bg-case-surfaceLight text-slate-300 font-medium text-xs border border-case-border transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div>
            {step < 3 ? (
              <button
                onClick={() => setStep((step + 1) as any)}
                className="px-5 py-2 rounded-xl bg-accent-blue hover:bg-accent-blueHover text-black font-semibold text-xs shadow transition-all flex items-center gap-1.5"
              >
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                className="px-6 py-2.5 rounded-xl bg-accent-green hover:bg-emerald-400 text-black font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Enter Case Board</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
