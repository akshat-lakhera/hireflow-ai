import React from 'react';
import { RoleSetup, ReviewMode } from '../types';
import { 
  Briefcase, 
  Layers, 
  SlidersHorizontal, 
  Plus, 
  Sparkles,
  ChevronRight,
  Search,
  CheckCircle2
} from 'lucide-react';

interface RolePanelProps {
  role: RoleSetup;
  candidateCount: number;
  reviewMode: ReviewMode;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenRoleStudio: () => void;
  onOpenUpload: () => void;
}

export const RolePanel: React.FC<RolePanelProps> = ({
  role,
  candidateCount,
  searchQuery,
  onSearchChange,
  onOpenRoleStudio,
  onOpenUpload
}) => {
  return (
    <div className="space-y-4">
      
      {/* Active Role Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold text-indigo-600 uppercase tracking-wider">
              Active Job Profile
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
              {role.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {role.seniority} • {role.teamType}
            </p>
          </div>
          <button
            onClick={onOpenRoleStudio}
            className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Configure Role Blueprint"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </div>

        {/* Must-Have Criteria Tags */}
        <div className="mt-3 pt-3 border-t border-slate-100">
          <div className="text-[11px] font-medium text-slate-600 mb-1.5 flex items-center justify-between">
            <span>Evaluation Criteria</span>
            <span className="text-slate-400 font-mono text-[10px]">{role.mustHaveSkills.length} required</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {role.mustHaveSkills.map((skill, idx) => (
              <span
                key={idx}
                className="text-[10px] font-medium bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 truncate max-w-full"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Candidate Pipeline Control Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
            Candidate Pipeline ({candidateCount})
          </div>
          <button
            onClick={onOpenUpload}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Candidate</span>
          </button>
        </div>

        {/* Search Candidates Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search candidates, skills, projects..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-xs bg-white border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>
      </div>

    </div>
  );
};
