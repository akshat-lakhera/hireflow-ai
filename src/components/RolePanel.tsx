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
  Star
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
      <div className="case-card rounded-xl p-4 border border-case-border space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400 font-mono text-[11px]">
            <Briefcase className="w-3.5 h-3.5 text-accent-blue" />
            <span>ACTIVE CASE ROLE</span>
          </div>
          <button
            onClick={onEditRole}
            className="text-[11px] text-accent-blue hover:underline font-mono flex items-center gap-1"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>Edit</span>
          </button>
        </div>

        <div>
          <h2 className="text-base font-bold text-white tracking-tight leading-snug">
            {role.title}
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-1.5 font-mono text-[11px]">
            <span className="px-2 py-0.5 rounded bg-case-surfaceElevated border border-case-border text-accent-blue font-medium">
              {role.seniority}
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{role.teamType}</span>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 leading-relaxed pt-1 border-t border-case-border">
          {role.summary || 'Compare proof against core requirements to generate evidence-backed hiring decisions.'}
        </p>
      </div>

      {/* Filter Chips for Requirements */}
      <div className="case-card rounded-xl p-4 border border-case-border space-y-3">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-accent-blue" />
            <span>REQUIREMENTS FILTER</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onFilterChange('all')}
            className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-left transition-all border ${
              activeFilter === 'all'
                ? 'bg-accent-blue/15 border-accent-blue text-accent-blue font-semibold'
                : 'bg-case-bg border-case-border text-slate-400 hover:text-slate-200'
            }`}
          >
            All Criteria
          </button>
          <button
            onClick={() => onFilterChange('must_have')}
            className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-left transition-all border ${
              activeFilter === 'must_have'
                ? 'bg-accent-blue/15 border-accent-blue text-accent-blue font-semibold'
                : 'bg-case-bg border-case-border text-slate-400 hover:text-slate-200'
            }`}
          >
            Must-Have ({role.mustHaveSkills.length})
          </button>
          <button
            onClick={() => onFilterChange('nice_to_have')}
            className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-left transition-all border ${
              activeFilter === 'nice_to_have'
                ? 'bg-accent-blue/15 border-accent-blue text-accent-blue font-semibold'
                : 'bg-case-bg border-case-border text-slate-400 hover:text-slate-200'
            }`}
          >
            Nice-to-Have ({role.niceToHaveSkills.length})
          </button>
          <button
            onClick={() => onFilterChange('missing')}
            className={`px-2.5 py-1.5 rounded-lg font-mono text-[11px] text-left transition-all border ${
              activeFilter === 'missing'
                ? 'bg-accent-red/15 border-accent-red text-accent-red font-semibold'
                : 'bg-case-bg border-case-border text-slate-400 hover:text-slate-200'
            }`}
          >
            Flagged Missing
          </button>
        </div>
      </div>

      {/* Requirement Checklist */}
      <div className="case-card rounded-xl p-4 border border-case-border space-y-3 flex-1">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-green" />
            <span>EVALUATION CHECKLIST</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono">Click to audit</span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
            Must-Have Requirements
          </div>
          {role.mustHaveSkills.map((req, idx) => {
            const isChecked = !!checkedRequirements[req];
            return (
              <div
                key={`must-${idx}`}
                onClick={() => toggleCheck(req)}
                className="flex items-start gap-2 p-2 rounded-lg bg-case-bg border border-case-border hover:border-slate-700 cursor-pointer transition-colors"
              >
                {isChecked ? (
                  <CheckSquare className="w-3.5 h-3.5 text-accent-green mt-0.5 flex-shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                )}
                <span className={`text-[11px] leading-tight ${isChecked ? 'text-slate-400 line-through' : 'text-slate-200'}`}>
                  {req}
                </span>
              </div>
            );
          })}

          {role.niceToHaveSkills.length > 0 && (
            <>
              <div className="text-[10px] font-mono uppercase text-slate-400 tracking-wider pt-2">
                Nice-to-Have Requirements
              </div>
              {role.niceToHaveSkills.map((req, idx) => {
                const isChecked = !!checkedRequirements[req];
                return (
                  <div
                    key={`nice-${idx}`}
                    onClick={() => toggleCheck(req)}
                    className="flex items-start gap-2 p-2 rounded-lg bg-case-bg border border-case-border hover:border-slate-700 cursor-pointer transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-accent-blue mt-0.5 flex-shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
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
      <div className="case-card rounded-xl p-4 border border-case-border space-y-3">
        <div className="flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-accent-blue" />
          <span>HIRING STAGE TIMELINE</span>
        </div>

        <div className="space-y-2.5">
          {stages.map((stage, idx) => {
            const isCompleted = stage.status === 'completed';
            const isActive = stage.status === 'active';

            return (
              <div key={idx} className="flex items-center gap-2.5">
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-2.5 h-2.5 rounded-full ${
                      isCompleted
                        ? 'bg-accent-green'
                        : isActive
                        ? 'bg-accent-blue ring-4 ring-accent-blue/20'
                        : 'bg-case-borderSubtle'
                    }`}
                  />
                </div>
                <div className="flex-1 flex items-center justify-between text-[11px]">
                  <span
                    className={
                      isActive
                        ? 'text-white font-semibold'
                        : isCompleted
                        ? 'text-slate-400'
                        : 'text-slate-500'
                    }
                  >
                    {stage.name}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-mono text-accent-blue bg-accent-blue/10 px-1.5 py-0.5 rounded">
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
