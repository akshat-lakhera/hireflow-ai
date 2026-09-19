import React, { useState } from 'react';
import { JobDescription, Candidate } from './types';
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_CANDIDATES } from './data/sampleData';
import { extractTextFromPDF } from './services/pdfParser';
import { AgentEngine } from './services/agentEngine';

// Components
import { Navbar } from './components/Navbar';
import { CandidateRadar } from './components/CandidateRadar';
import { CandidateCard } from './components/CandidateCard';
import { CandidateDetailModal } from './components/CandidateDetailModal';
import { InterviewScreeningRoom } from './components/InterviewScreeningRoom';
import { ScorecardModal } from './components/ScorecardModal';
import { EduPathRoadmapModal } from './components/EduPathRoadmapModal';
import { NaturalLanguageSearchBar } from './components/NaturalLanguageSearchBar';
import { JDEditorModal } from './components/JDEditorModal';
import { ResumeTextInput } from './components/ResumeTextInput';
import FileUpload from './components/ui/FileUpload';

// Icons
import { 
  Briefcase, 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Users, 
  Cpu, 
  ArrowUpRight,
  GraduationCap,
  Edit3,
  FileText,
  Upload,
  PlusCircle,
  Inbox
} from 'lucide-react';

export function App() {
  const [jobDescription, setJobDescription] = useState<JobDescription>(SAMPLE_JOB_DESCRIPTION);
  // Default start with sample candidates so the user can test immediately, but give an instant "Clear All" or "Add Candidate" option
  const [candidates, setCandidates] = useState<Candidate[]>(SAMPLE_CANDIDATES);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>(SAMPLE_CANDIDATES);
  
  // Ingestion tab: PDF upload vs Direct Text Paste
  const [ingestionMode, setIngestionMode] = useState<'pdf' | 'text'>('pdf');
  
  // Navigation & Modals
  const [activePersona, setActivePersona] = useState<'recruiter' | 'candidate'>('recruiter');
  const [isEditingJD, setIsEditingJD] = useState<boolean>(false);
  const [selectedAuditCandidate, setSelectedAuditCandidate] = useState<Candidate | null>(null);
  const [selectedInterviewCandidate, setSelectedInterviewCandidate] = useState<Candidate | null>(null);
  const [selectedScorecardCandidate, setSelectedScorecardCandidate] = useState<Candidate | null>(null);
  const [selectedEduPathCandidate, setSelectedEduPathCandidate] = useState<Candidate | null>(null);
  
  // Radar selection
  const [radarSelectedId, setRadarSelectedId] = useState<string | undefined>(candidates[0]?.id);
  const [searchExplanation, setSearchExplanation] = useState<string>('');
  const [activeFilterGroup, setActiveFilterGroup] = useState<string>('ALL');

  // Handle PDF Resume Upload
  const handleResumeUpload = async (file: File) => {
    try {
      const parsedRaw = await extractTextFromPDF(file);
      const evaluatedCandidate = AgentEngine.evaluateCandidateAgainstJD(parsedRaw, jobDescription);
      
      setCandidates(prev => [evaluatedCandidate, ...prev]);
      setFilteredCandidates(prev => [evaluatedCandidate, ...prev]);
      setRadarSelectedId(evaluatedCandidate.id);
    } catch (err) {
      console.error('Error during resume processing:', err);
    }
  };

  // Handle Raw Text Resume Ingestion
  const handleParsedTextResume = (parsedRaw: any) => {
    const evaluatedCandidate = AgentEngine.evaluateCandidateAgainstJD(parsedRaw, jobDescription);
    setCandidates(prev => [evaluatedCandidate, ...prev]);
    setFilteredCandidates(prev => [evaluatedCandidate, ...prev]);
    setRadarSelectedId(evaluatedCandidate.id);
  };

  // Handle Natural Language Search
  const handleSearch = (query: string) => {
    const result = AgentEngine.queryCandidatePool(query, candidates);
    setFilteredCandidates(result.matchedCandidates);
    setSearchExplanation(result.explanation);
    setActiveFilterGroup('ALL');
  };

  const handleClearSearch = () => {
    setFilteredCandidates(candidates);
    setSearchExplanation('');
  };

  // Filter candidates by grouping
  const displayedCandidates = filteredCandidates.filter(cand => {
    if (activeFilterGroup === 'ALL') return true;
    return cand.grouping === activeFilterGroup;
  });

  // Finish Interview Callback
  const handleFinishInterview = (updatedCandidate: Candidate) => {
    setCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
    setFilteredCandidates(prev => prev.map(c => c.id === updatedCandidate.id ? updatedCandidate : c));
    setSelectedInterviewCandidate(null);
    setSelectedScorecardCandidate(updatedCandidate);
  };

  // Reset to initial clean benchmark data
  const handleResetData = () => {
    setCandidates(SAMPLE_CANDIDATES);
    setFilteredCandidates(SAMPLE_CANDIDATES);
    setRadarSelectedId(SAMPLE_CANDIDATES[0].id);
    setSearchExplanation('');
    setActiveFilterGroup('ALL');
  };

  // Clear pool to start 100% fresh from scratch
  const handleClearPool = () => {
    setCandidates([]);
    setFilteredCandidates([]);
    setRadarSelectedId(undefined);
    setSearchExplanation('');
  };

  const topMatch = candidates.length > 0 ? Math.max(...candidates.map(c => c.matchScore), 0) : 0;
  const totalGaps = candidates.reduce((acc, c) => acc + c.missingGaps.length, 0);

  return (
    <div className="min-h-screen bg-obsidian-950 text-slate-100 flex flex-col font-sans selection:bg-gold-500 selection:text-black">
      
      {/* Top Navigation */}
      <Navbar
        activePersona={activePersona}
        onSelectPersona={setActivePersona}
        onResetData={handleResetData}
        candidateCount={candidates.length}
        topMatchScore={topMatch}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Active Job Description Configuration Card */}
        <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-obsidian-border relative overflow-hidden">
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            
            <div className="max-w-2xl space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 font-mono text-xs text-gold-400 uppercase tracking-wider font-semibold">
                  <Briefcase className="w-3.5 h-3.5 text-gold-400" />
                  <span>Active Role Context • {jobDescription.department}</span>
                </span>
                <button
                  onClick={() => setIsEditingJD(true)}
                  className="flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-gold-300 transition-colors bg-obsidian-900 border border-obsidian-border px-2 py-0.5 rounded-md"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>Configure Criteria</span>
                </button>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
                {jobDescription.title}
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {jobDescription.summary}
              </p>
            </div>

            {/* Live Metrics */}
            <div className="grid grid-cols-3 gap-3 font-mono">
              <div className="p-3.5 rounded-2xl bg-obsidian-900 border border-obsidian-border text-center shadow-inner">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Candidate Pool</div>
                <div className="text-2xl font-bold text-slate-100 mt-0.5">{candidates.length}</div>
                <div className="text-[10px] text-gold-400 mt-1 flex items-center justify-center gap-1">
                  <Users className="w-3 h-3" />
                  <span>In Pipeline</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-obsidian-900 border border-obsidian-border text-center shadow-inner">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Top Match</div>
                <div className="text-2xl font-bold text-emerald-400 mt-0.5">{topMatch}%</div>
                <div className="text-[10px] text-emerald-400 mt-1 flex items-center justify-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Verified Fit</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-obsidian-900 border border-obsidian-border text-center shadow-inner">
                <div className="text-[11px] text-slate-400 uppercase tracking-wider">Flagged Gaps</div>
                <div className="text-2xl font-bold text-amber-400 mt-0.5">{totalGaps}</div>
                <div className="text-[10px] text-amber-400 mt-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  <span>To Probe</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Requirements Badges */}
          <div className="mt-6 pt-4 border-t border-obsidian-border/80 flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono text-slate-400 mr-1 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-gold-400" />
                <span>Criteria ({jobDescription.coreRequirements.length}):</span>
              </span>
              {jobDescription.coreRequirements.slice(0, 3).map((req, i) => (
                <span key={i} className="text-[11px] font-mono bg-obsidian-850 border border-obsidian-border/80 text-slate-300 px-2.5 py-1 rounded-lg">
                  {req.slice(0, 65)}...
                </span>
              ))}
            </div>

            {candidates.length > 0 && (
              <button
                onClick={handleClearPool}
                className="text-[11px] font-mono text-slate-500 hover:text-rose-400 transition-colors"
                title="Clear all candidates to screen custom files"
              >
                Clear Current Pool
              </button>
            )}
          </div>
        </div>

        {/* CANDIDATE / EDUPATH ROADMAP VIEW (PS1) */}
        {activePersona === 'candidate' && (
          <div className="p-8 rounded-3xl bg-gradient-to-b from-obsidian-900 to-obsidian-950 border border-gold-500/30 space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-gold-400 text-xs font-mono uppercase font-bold">
                  <GraduationCap className="w-4 h-4" />
                  <span>EduPath • Learner Career Advancement Engine</span>
                </div>
                <h2 className="text-xl font-bold text-slate-100">Adaptive Skill Gap Roadmaps for Candidates</h2>
                <p className="text-xs text-slate-300 max-w-2xl">
                  Select a candidate from the pool to view their personalized weekly learning path, project assignments, and simulated struggle adaptation.
                </p>
              </div>

              {candidates.length > 0 && (
                <button
                  onClick={() => setSelectedEduPathCandidate(candidates[0])}
                  className="px-4 py-2.5 rounded-xl bg-gold-500 hover:bg-gold-600 text-black text-xs font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <span>Launch {candidates[0]?.name}'s Roadmap</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              )}
            </div>

            {candidates.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-mono text-sm glass-panel rounded-2xl">
                No candidates in the pool yet. Upload a resume in the Recruiter Console to generate an adaptive roadmap.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                {candidates.map(candidate => (
                  <div key={candidate.id} className="p-5 rounded-2xl bg-obsidian-850 border border-obsidian-border space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-slate-100 text-sm">{candidate.name}</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gold-500/15 text-gold-400 font-bold border border-gold-500/30">
                        {candidate.matchScore}% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{candidate.summary}</p>
                    <div className="text-[11px] font-mono text-amber-400">
                      {candidate.missingGaps.length} Key Gaps Requiring Remediation
                    </div>
                    <button
                      onClick={() => setSelectedEduPathCandidate(candidate)}
                      className="w-full py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-200 text-xs font-semibold border border-obsidian-border transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Inspect Adaptive Roadmap</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RECRUITER WORKSPACE (PS3) */}
        {activePersona === 'recruiter' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* LEFT COLUMN: Ingestion & Radar Benchmark (col-span-5) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Dynamic Ingestion Card (PDF or Direct Text) */}
              <div className="glass-panel rounded-2xl p-5 border border-obsidian-border space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold-400" />
                    <span>Screen Candidate</span>
                  </h3>

                  {/* Toggle Mode */}
                  <div className="flex items-center p-0.5 rounded-lg bg-obsidian-950 border border-obsidian-border text-[11px] font-mono">
                    <button
                      onClick={() => setIngestionMode('pdf')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        ingestionMode === 'pdf' ? 'bg-obsidian-800 text-gold-400 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      PDF Upload
                    </button>
                    <button
                      onClick={() => setIngestionMode('text')}
                      className={`px-2.5 py-1 rounded-md transition-colors ${
                        ingestionMode === 'text' ? 'bg-obsidian-800 text-gold-400 font-semibold' : 'text-slate-400'
                      }`}
                    >
                      Paste Text
                    </button>
                  </div>
                </div>

                {ingestionMode === 'pdf' ? (
                  <FileUpload
                    onUploadSuccess={handleResumeUpload}
                    acceptedFileTypes={['.pdf', 'application/pdf']}
                  />
                ) : (
                  <ResumeTextInput onParsed={handleParsedTextResume} />
                )}
              </div>

              {/* Multi-Candidate Comparative Benchmark Radar */}
              <div className="glass-panel rounded-2xl p-5 border border-obsidian-border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    <span>Capability Comparison Radar</span>
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    5-Axis Evaluation
                  </span>
                </div>

                <CandidateRadar
                  candidates={candidates}
                  selectedCandidateId={radarSelectedId}
                  onSelectCandidate={setRadarSelectedId}
                />
              </div>

            </div>

            {/* RIGHT COLUMN: Natural Language Filter & Candidate Pool (col-span-7) */}
            <div className="lg:col-span-7 space-y-6">
              
              {/* Natural Language Query Bar */}
              <div className="glass-panel rounded-2xl p-5 border border-obsidian-border">
                <NaturalLanguageSearchBar
                  onSearch={handleSearch}
                  onClear={handleClearSearch}
                  resultExplanation={searchExplanation}
                />
              </div>

              {/* Grouping Filter Tabs */}
              <div className="flex items-center justify-between overflow-x-auto pb-1 text-xs font-mono">
                <div className="flex items-center gap-2">
                  {['ALL', 'Top Contender', 'Strong Technical Fit', 'Needs Technical Validation', 'High Gap Risk'].map((group) => (
                    <button
                      key={group}
                      onClick={() => setActiveFilterGroup(group)}
                      className={`px-3 py-1.5 rounded-lg transition-all flex-shrink-0 font-medium ${
                        activeFilterGroup === group
                          ? 'bg-gold-500 text-black shadow-sm font-bold'
                          : 'bg-obsidian-850 hover:bg-obsidian-800 text-slate-400 hover:text-slate-200 border border-obsidian-border'
                      }`}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>

              {/* Candidate Cards Grid */}
              <div className="space-y-4">
                {displayedCandidates.length === 0 ? (
                  <div className="p-12 text-center text-slate-500 font-mono text-sm glass-panel rounded-2xl space-y-3">
                    <Inbox className="w-8 h-8 mx-auto text-slate-600" />
                    <div>No candidates in active view.</div>
                    <div className="text-xs text-slate-400">
                      Drop a PDF resume above, paste candidate text, or click below to load reference profiles.
                    </div>
                    <button
                      onClick={handleResetData}
                      className="px-3.5 py-1.5 bg-obsidian-800 hover:bg-obsidian-700 text-gold-400 border border-obsidian-border rounded-lg text-xs font-semibold"
                    >
                      Load Reference Benchmarks
                    </button>
                  </div>
                ) : (
                  displayedCandidates.map((cand) => (
                    <CandidateCard
                      key={cand.id}
                      candidate={cand}
                      onOpenAudit={setSelectedAuditCandidate}
                      onStartInterview={setSelectedInterviewCandidate}
                      onOpenScorecard={setSelectedScorecardCandidate}
                    />
                  ))
                )}
              </div>

            </div>

          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="w-full border-t border-obsidian-border bg-obsidian-950 py-6 text-center text-xs font-mono text-slate-500">
        HireFlow & EduPath Agentic Recruitment Suite • Deterministic Evidence Grounding • Hackathon 2026
      </footer>

      {/* MODALS */}
      {isEditingJD && (
        <JDEditorModal
          jobDescription={jobDescription}
          onSave={setJobDescription}
          onClose={() => setIsEditingJD(false)}
        />
      )}

      {selectedAuditCandidate && (
        <CandidateDetailModal
          candidate={selectedAuditCandidate}
          jobDescription={jobDescription}
          onClose={() => setSelectedAuditCandidate(null)}
          onStartInterview={(c) => {
            setSelectedAuditCandidate(null);
            setSelectedInterviewCandidate(c);
          }}
        />
      )}

      {selectedInterviewCandidate && (
        <InterviewScreeningRoom
          candidate={selectedInterviewCandidate}
          onClose={() => setSelectedInterviewCandidate(null)}
          onFinishInterview={handleFinishInterview}
        />
      )}

      {selectedScorecardCandidate && (
        <ScorecardModal
          candidate={selectedScorecardCandidate}
          onClose={() => setSelectedScorecardCandidate(null)}
          onTriggerEduPathRoadmap={(c) => {
            setSelectedScorecardCandidate(null);
            setSelectedEduPathCandidate(c);
          }}
        />
      )}

      {selectedEduPathCandidate && (
        <EduPathRoadmapModal
          candidate={selectedEduPathCandidate}
          onClose={() => setSelectedEduPathCandidate(null)}
        />
      )}

    </div>
  );
}

export default App;
