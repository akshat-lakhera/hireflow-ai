import React, { useState } from 'react';
import { JobDescription } from '../types';
import { X, Briefcase, Plus, Trash2, Check } from 'lucide-react';

interface JDEditorModalProps {
  jobDescription: JobDescription;
  onSave: (updatedJD: JobDescription) => void;
  onClose: () => void;
}

export const JDEditorModal: React.FC<JDEditorModalProps> = ({
  jobDescription,
  onSave,
  onClose
}) => {
  const [title, setTitle] = useState(jobDescription.title);
  const [department, setDepartment] = useState(jobDescription.department);
  const [level, setLevel] = useState(jobDescription.level);
  const [summary, setSummary] = useState(jobDescription.summary);
  const [coreReqs, setCoreReqs] = useState<string[]>(jobDescription.coreRequirements);
  const [newReq, setNewReq] = useState('');

  const handleAddRequirement = () => {
    if (newReq.trim()) {
      setCoreReqs(prev => [...prev, newReq.trim()]);
      setNewReq('');
    }
  };

  const handleRemoveRequirement = (idx: number) => {
    setCoreReqs(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    onSave({
      ...jobDescription,
      title: title.trim() || 'Software Engineer',
      department: department.trim() || 'Engineering',
      level: level.trim() || 'Senior',
      summary: summary.trim() || 'Role overview',
      coreRequirements: coreReqs.length > 0 ? coreReqs : ['3+ years software engineering experience']
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-obsidian-900 border border-obsidian-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 bg-obsidian-850 border-b border-obsidian-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gold-500/15 border border-gold-500/30 flex items-center justify-center text-gold-400 font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">Job Description Configuration</h2>
              <p className="text-xs text-slate-400">All uploaded resumes will be dynamically mapped against these criteria</p>
            </div>
          </div>

          <button onClick={onClose} className="p-2 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs font-sans">
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Target Role Title</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-obsidian-950 border border-obsidian-border rounded-xl p-2.5 text-slate-100 focus:border-gold-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Department / Team</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full bg-obsidian-950 border border-obsidian-border rounded-xl p-2.5 text-slate-100 focus:border-gold-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Role Summary & Focus</label>
            <textarea
              rows={3}
              value={summary}
              onChange={e => setSummary(e.target.value)}
              className="w-full bg-obsidian-950 border border-obsidian-border rounded-xl p-3 text-slate-100 focus:border-gold-500 focus:outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Core Requirements List */}
          <div>
            <label className="block text-slate-300 font-semibold mb-1.5">
              Core Evaluation Requirements ({coreReqs.length})
            </label>
            <div className="space-y-2 mb-3 max-h-56 overflow-y-auto">
              {coreReqs.map((req, i) => (
                <div key={i} className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-obsidian-850 border border-obsidian-border">
                  <span className="text-slate-200 text-xs font-mono">{req}</span>
                  <button
                    onClick={() => handleRemoveRequirement(i)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    title="Remove requirement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add requirement input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add another requirement (e.g. 'Production experience with Kafka and Go')..."
                value={newReq}
                onChange={e => setNewReq(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAddRequirement()}
                className="flex-1 bg-obsidian-950 border border-obsidian-border rounded-xl p-2.5 text-slate-100 text-xs focus:border-gold-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddRequirement}
                className="px-3 py-2 bg-obsidian-800 hover:bg-obsidian-700 text-gold-400 border border-obsidian-border rounded-xl font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-obsidian-850 border-t border-obsidian-border flex items-center justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-obsidian-800 hover:bg-obsidian-700 text-slate-400 hover:text-white font-medium text-xs">
            Cancel
          </button>
          <button onClick={handleSave} className="px-4 py-2 rounded-xl bg-gold-500 hover:bg-gold-600 text-black font-bold text-xs flex items-center gap-1.5 shadow-md">
            <Check className="w-3.5 h-3.5" />
            <span>Apply Active Criteria</span>
          </button>
        </div>

      </div>
    </div>
  );
};
