import React, { useState } from 'react';
import { RoleSetup } from '../types';
import { 
  Briefcase, 
  CheckSquare, 
  Square, 
  Filter, 
  Clock, 
  SlidersHorizontal,
  ChevronRight,
  ShieldCheck,
  Target
} from 'lucide-react';

interface RolePanelProps {
  role: RoleSetup;
  activeFilter: 'all' | 'must_have' | 'nice_to_have' | 'missing';
  onFilterChange: (filter: 'all' | 'must_have' | 'nice_to_have' | 'missing') => void;
  onEditRole: () => void;
}

export const RolePanel: React.FC<RolePanelProps> = ({
  role,
  activeFilter,
  onFilterChange,
  onEditRole
}) => {
  const [checkedRequirements, setCheckedRequirements] = useState<Record<string, boolean>>({});

  const toggleCheck = (req: string) => {
    setCheckedRequirements(prev => ({
      ...prev,
      [req]: !prev[req]
    }));
  };

  const stages = [
    { name: 'Sourced', status: 'completed' },
    { name: 'Case Files Ingested', status: 'completed' },
    { name: 'Evidence Screened', status: 'active' },
    { name: 'Technical Probe', status: 'upcoming' },
    { name: 'Hiring Decision', status: 'upcoming' },
  ];

  return (
    <div className="flex flex-col gap-4 font-sans text-xs">
      
      {/* Job Title Card */}
      <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Briefcase className="w-3.5 h-3.5 text-gold-500" />
            <span>ACTIVE ROLE ARCHITECTURE</span>
          </div>
          <button
            onClick={onEditRole}
            className="text-[11px] text-gold-400 hover:text-gold-300 font-mono flex items-center gap-1 font-semibold"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Edit Spec</span>
          </button>
        </div>

        <div>
          <h2 className="text-base font-extrabold text-white tracking-tight leading-snug">
            {role.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-2 font-mono text-[11px]">
            <span className="px-2.5 py-0.5 rounded bg-ink-850 border border-ink-border text-gold-400 font-bold">
              {role.seniority}
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300">{role.teamType}</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed pt-2 border-t border-ink-border">
          {role.summary || 'Compare proof against core requirements to generate evidence-backed hiring decisions.'}
        </p>
      </div>

      {/* Filter Chips for Requirements */}
      <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-3">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-gold-500" />
            <span>CRITERIA FILTER</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-3 py-2 rounded-xl font-mono text-[11px] text-left transition-all border ${
              activeFilter === 'all'
                ? 'bg-gold-500 text-ink-950 font-bold border-gold-400 shadow'
                : 'bg-ink-900 border-ink-border text-slate-400 hover:text-slate-200'
            }`}
          >
            All Criteria
          </button>
          <button
            onClick={() => onFilterChange('must_have')}
            className={`px-3 py-2 rounded-xl font-mono text-[11px] text-left transition-all border ${
              activeFilter === 'must_have'
                ? 'bg-gold-500 text-ink-950 font-bold border-gold-400 shadow'
                : 'bg-ink-900 border-ink-border text-slate-400 hover:text-slate-200'
            }`}
          >
            Must-Have ({role.mustHaveSkills.length})
          </button>
          <button
            onClick={() => onFilterChange('nice_to_have')}
            className={`px-3 py-2 rounded-xl font-mono text-[11px] text-left transition-all border ${
              activeFilter === 'nice_to_have'
                ? 'bg-gold-500 text-ink-950 font-bold border-gold-400 shadow'
                : 'bg-ink-900 border-ink-border text-slate-400 hover:text-slate-200'
            }`}
          >
            Nice-to-Have ({role.niceToHaveSkills.length})
          </button>
          <button
            onClick={() => onFilterChange('missing')}
            className={`px-3 py-2 rounded-xl font-mono text-[11px] text-left transition-all border ${
              activeFilter === 'missing'
                ? 'bg-flag-subtle border-flag-border text-flag-500 font-bold'
                : 'bg-ink-900 border-ink-border text-slate-400 hover:text-slate-200'
            }`}
          >
            Flagged Missing
          </button>
        </div>
      </div>

      {/* Requirement Checklist */}
      <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-3 flex-1">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-verified-400" />
            <span>EVALUATION AUDIT LIST</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Interactive</span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <div className="text-[10px] font-mono uppercase text-gold-400 tracking-wider font-bold">
            Must-Have Criteria
          </div>
          {role.mustHaveSkills.map((req, idx) => {
            const isChecked = !!checkedRequirements[req];
            return (
              <div
                key={`must-${idx}`}
                onClick={() => toggleCheck(req)}
                className="flex items-start gap-2.5 p-2.5 rounded-xl bg-ink-900 border border-ink-border hover:border-slate-700 cursor-pointer transition-colors"
              >
                {isChecked ? (
                  <CheckSquare className="w-4 h-4 text-verified-400 mt-0.5 flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                )}
                <span className={`text-[11px] leading-tight ${isChecked ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {req}
                </span>
              </div>
            );
          })}

          {role.niceToHaveSkills.length > 0 && (
            <>
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider pt-3">
                Nice-to-Have Criteria
              </div>
              {role.niceToHaveSkills.map((req, idx) => {
                const isChecked = !!checkedRequirements[req];
                return (
                  <div
                    key={`nice-${idx}`}
                    onClick={() => toggleCheck(req)}
                    className="flex items-start gap-2.5 p-2.5 rounded-xl bg-ink-900 border border-ink-border hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-gold-500 mt-0.5 flex-shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
                    )}
                    <span className={`text-[11px] leading-tight ${isChecked ? 'text-slate-400 line-through' : 'text-slate-300'}`}>
                      {req}
                    </span>
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>

      {/* Tiny Timeline for Hiring Stages */}
      <div className="dossier-card rounded-2xl p-5 border border-ink-border space-y-3">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-gold-500" />
          <span>HIRING STAGE TIMELINE</span>
        </div>

        <div className="space-y-3 pt-1">
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isActive = stage.status === 'active';

            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isCompleted
                        ? 'bg-verified-400'
                        : isActive
                        ? 'bg-gold-500 ring-4 ring-gold-glow'
                        : 'bg-ink-border'
                    }`}
                  />
                </div>
                <div className="flex-1 flex items-center justify-between text-[11px]">
                  <span
                    className={
                      isActive
                        ? 'text-white font-bold'
                        : isCompleted
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }
                  >
                    {stage.name}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-mono text-gold-400 bg-gold-subtle border border-gold-border px-2 py-0.5 rounded font-bold">
                      Current
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
