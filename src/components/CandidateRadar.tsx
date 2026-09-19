import React from 'react';
import { Candidate } from '../types';

interface CandidateRadarProps {
  candidates: Candidate[];
  selectedCandidateId?: string;
  onSelectCandidate?: (id: string) => void;
}

export const CandidateRadar: React.FC<CandidateRadarProps> = ({
  candidates,
  selectedCandidateId,
  onSelectCandidate
}) => {
  const axes = [
    { label: 'Technical Depth', key: 'technicalSkills' as const },
    { label: 'Architecture Fit', key: 'architectureDepth' as const },
    { label: 'Experience Rel.', key: 'experienceRelevance' as const },
    { label: 'Comm. Quality', key: 'communicationPotential' as const },
    { label: 'Low Risk', key: 'riskPenalty' as const },
  ];

  const size = 300;
  const center = size / 2;
  const radius = center - 45;
  const totalAxes = axes.length;

  const getCoordinates = (index: number, value: number) => {
    const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
    const r = (value / 100) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle)
    };
  };

  const levels = [25, 50, 75, 100];

  // Anti-slop Warm Champagne, Cyan & Emerald Palette
  const candidateColors = [
    { stroke: '#e5a93c', fill: 'rgba(229, 169, 60, 0.18)', dot: '#f3c46b' },
    { stroke: '#38bdf8', fill: 'rgba(56, 189, 248, 0.16)', dot: '#7dd3fc' },
    { stroke: '#10b981', fill: 'rgba(16, 185, 129, 0.16)', dot: '#34d399' },
  ];

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-slate-500 font-mono text-xs text-center">
        No candidate vectors available. Ingest resumes to generate comparative radar.
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} className="overflow-visible select-none">
          {levels.map((lvl) => {
            const points = axes.map((_, i) => {
              const { x, y } = getCoordinates(i, lvl);
              return `${x},${y}`;
            }).join(' ');

            return (
              <polygon
                key={`lvl-${lvl}`}
                points={points}
                fill="none"
                stroke="rgba(255, 255, 255, 0.07)"
                strokeWidth="1"
                strokeDasharray={lvl === 100 ? 'none' : '3 3'}
              />
            );
          })}

          {axes.map((_, i) => {
            const { x, y } = getCoordinates(i, 100);
            return (
              <line
                key={`axis-line-${i}`}
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth="1"
              />
            );
          })}

          {axes.map((axis, i) => {
            const { x, y } = getCoordinates(i, 118);
            return (
              <text
                key={`axis-label-${i}`}
                x={x}
                y={y}
                textAnchor="middle"
                dominantBaseline="central"
                className="text-[10px] font-mono tracking-wider fill-slate-400 select-none uppercase font-medium"
              >
                {axis.label}
              </text>
            );
          })}

          {candidates.slice(0, 3).map((candidate, candIdx) => {
            const isSelected = !selectedCandidateId || selectedCandidateId === candidate.id;
            const color = candidateColors[candIdx % candidateColors.length];

            const points = axes.map((axis, i) => {
              let val = candidate.matchBreakdown[axis.key];
              if (axis.key === 'riskPenalty') {
                val = 100 - val;
              }
              const { x, y } = getCoordinates(i, val);
              return `${x},${y}`;
            }).join(' ');

            return (
              <g key={`cand-poly-${candidate.id}`} opacity={isSelected ? 1 : 0.25} className="transition-opacity duration-300">
                <polygon
                  points={points}
                  fill={color.fill}
                  stroke={color.stroke}
                  strokeWidth={selectedCandidateId === candidate.id ? 2.5 : 1.75}
                  className="transition-all duration-300"
                />
                {axes.map((axis, i) => {
                  let val = candidate.matchBreakdown[axis.key];
                  if (axis.key === 'riskPenalty') val = 100 - val;
                  const { x, y } = getCoordinates(i, val);
                  return (
                    <circle
                      key={`dot-${candidate.id}-${i}`}
                      cx={x}
                      cy={y}
                      r={selectedCandidateId === candidate.id ? 4 : 3}
                      fill={color.dot}
                      stroke="#080a0f"
                      strokeWidth="1.5"
                    />
                  );
                })}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
        {candidates.slice(0, 3).map((candidate, idx) => {
          const color = candidateColors[idx % candidateColors.length];
          const isSelected = selectedCandidateId === candidate.id;
          return (
            <button
              key={candidate.id}
              onClick={() => onSelectCandidate && onSelectCandidate(candidate.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isSelected 
                  ? 'bg-obsidian-700 border border-gold-500/50 text-white shadow-sm' 
                  : 'bg-obsidian-850 border border-obsidian-border text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color.stroke }} />
              <span>{candidate.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({candidate.matchScore}%)</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
