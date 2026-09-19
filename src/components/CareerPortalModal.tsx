import React, { useState } from 'react';
import { RoleSetup } from '../types';
import { PortalIngestionService } from '../services/portalIngestionService';
import { 
  Briefcase, 
  UploadCloud, 
  FileText, 
  X, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Link2, 
  Code, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';

interface CareerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  role: RoleSetup;
  onApplicationSubmitted?: (candidateName: string) => void;
}

export const CareerPortalModal: React.FC<CareerPortalModalProps> = ({
  isOpen,
  onClose,
  role,
  onApplicationSubmitted
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [linkedin, setLinkedin] = useState('');
  const [github, setGithub] = useState('');
  const [portfolio, setPortfolio] = useState('');
  
  const [resumeText, setResumeText] = useState('');
  const [fileName, setFileName] = useState('');
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsReadingFile(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setResumeText(text);
      setIsReadingFile(false);
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read file contents. Please paste text directly.');
      setIsReadingFile(false);
    };

    reader.readAsText(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }
    if (!resumeText.trim()) {
      setErrorMsg('Please upload a resume file or paste your technical background.');
      return;
    }

    try {
      PortalIngestionService.submitApplication({
        source: 'career_portal',
        candidateName: name.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        location: location.trim() || undefined,
        linkedinUrl: linkedin.trim() || undefined,
        githubUrl: github.trim() || undefined,
        portfolioUrl: portfolio.trim() || undefined,
        rawResumeText: resumeText.trim(),
        fileName: fileName || `${name.replace(/\s+/g, '_')}_Resume.txt`
      });

      setSubmittedSuccess(true);
      onApplicationSubmitted?.(name.trim());

      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
        // Reset form
        setName('');
        setEmail('');
        setPhone('');
        setLocation('');
        setLinkedin('');
        setGithub('');
        setPortfolio('');
        setResumeText('');
        setFileName('');
      }, 1800);
    } catch (err: any) {
      setErrorMsg(`Submission error: ${err?.message || 'Could not queue application'}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header: Branded Career Page Style */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between border-b border-slate-800">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Public Career Portal
              </span>
              <span className="text-slate-400 text-xs">• TalentDossier Platform</span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Apply for {role.title}
            </h2>
            <p className="text-xs text-slate-300">
              {role.seniority} • {role.teamType}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-5">
          
          {/* Role Snapshot Callout */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-slate-700 font-semibold">
              <span>Required Core Competencies:</span>
              <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Autonomous AI Cross-Referencing
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {role.mustHaveSkills.map((s, idx) => (
                <span key={idx} className="bg-white border border-slate-200 text-slate-700 px-2 py-0.5 rounded text-[11px]">
                  {s}
                </span>
              ))}
            </div>
          </div>

          {submittedSuccess ? (
            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col items-center justify-center text-center space-y-3 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-emerald-950">Application Received!</h3>
              <p className="text-xs text-emerald-800 max-w-md leading-relaxed">
                Thank you, <strong>{name}</strong>. Your portfolio has been placed in our inbound portal queue. Our Autonomous Recruiter Agent will analyze your evidence and update you shortly at <strong>{email}</strong>.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Primary Contact Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Rivera"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      placeholder="e.g. alex.rivera@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      placeholder="+1 (555) 019-2834"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Current Location
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="e.g. San Francisco, CA (or Remote)"
                      value={location}
                      onChange={e => setLocation(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <MapPin className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  </div>
                </div>
              </div>

              {/* Profiles & Portfolio Links */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">LinkedIn Profile</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="linkedin.com/in/username"
                      value={linkedin}
                      onChange={e => setLinkedin(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <Link2 className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">GitHub / Code</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="github.com/username"
                      value={github}
                      onChange={e => setGithub(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <Code className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">Portfolio / Website</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="https://mywork.dev"
                      value={portfolio}
                      onChange={e => setPortfolio(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                    <Globe className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  </div>
                </div>
              </div>

              {/* Resume Ingestion Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    Resume Document or Raw Text *
                  </label>
                  {fileName && (
                    <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      File: {fileName}
                    </span>
                  )}
                </div>

                <div className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-4 text-center bg-slate-50 transition-colors">
                  <input
                    type="file"
                    id="portal-file-upload"
                    accept=".txt,.pdf,.md,.doc,.docx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="portal-file-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
                    <UploadCloud className="w-7 h-7 text-indigo-600" />
                    <span className="font-semibold text-slate-800 text-xs">
                      {isReadingFile ? 'Reading file...' : 'Upload Resume File (PDF, TXT, DOCX)'}
                    </span>
                    <span className="text-[11px] text-slate-400">Click to browse or drop file here</span>
                  </label>
                </div>

                <div>
                  <textarea
                    rows={5}
                    value={resumeText}
                    onChange={e => setResumeText(e.target.value)}
                    placeholder="Or paste your resume text directly: work history, projects, systems architecture, skills, education..."
                    className="w-full bg-white border border-slate-300 rounded-lg p-3 text-xs font-mono text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Submissions are triaged autonomously by TalentDossier AI</span>
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3.5 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span>Submit Application</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

      </div>
    </div>
  );
};
