import React, { useState } from 'react';
import { Candidate } from '../types';
import { X, BookOpen, CheckCircle, Target, ArrowRight, RefreshCw } from 'lucide-react';

interface EduPathRoadmapModalProps {
  candidate: Candidate;
  onClose: () => void;
}

export const EduPathRoadmapModal: React.FC<EduPathRoadmapModalProps> = ({
  candidate,
  onClose
}) => {
  const [activeWeek, setActiveWeek] = useState<number>(1);
  const [completedTasks, setCompletedTasks] = useState<Record<string, boolean>>({
    'task-w1-1': true,
    'task-w1-2': false
  });
  const [strugglingTopic, setStrugglingTopic] = useState<string | null>(null);
  const [hasAdapted, setHasAdapted] = useState<boolean>(false);

  const weeks = [
    {
      week: 1,
      title: 'Consensus Internals & Low-Level State Machines',
      focusGap: candidate.missingGaps[0]?.skillOrArea || 'Distributed Consensus & Replication',
      estimatedHours: 12,
      learningObjectives: [
        'Master Raft leader election, heartbeats, and randomized timer mechanics',
        'Implement log compaction and linearizable read index algorithm in Go/Rust',
        'Simulate split-brain network partition recovery using Jepsen tests'
      ],
      recommendedResources: [
        { title: 'The Raft Consensus Algorithm Paper (Ongaro & Ousterhout)', type: 'Paper', duration: '3 hours' },
        { title: 'Building a Raft-Backed Distributed KV Store from Scratch', type: 'Hands-on Lab', duration: '6 hours' },
        { title: 'Designing Data-Intensive Applications (Chapter 9: Consistency & Consensus)', type: 'Book', duration: '3 hours' }
      ],
      practiceProject: {
        title: 'Build a Mini-Raft Consensus Node with Memory Snapshotting',
        description: 'Construct a 3-node cluster handling crash recovery without losing uncommitted log entries.',
        deliverables: ['Go or Rust implementation with unit test coverage > 85%']
      }
    },
    {
      week: 2,
      title: 'High-Throughput Stream Ingestion & Backpressure Control',
      focusGap: 'Apache Kafka Partitioning & LSM Storage',
      estimatedHours: 14,
      learningObjectives: [
        'Tune Kafka producer batching (linger.ms, batch.size) for 500k events/sec',
        'Implement custom consumer rebalance listeners with offset commits',
        'Prevent cascading consumer failures under heavy consumer lag'
      ],
      recommendedResources: [
        { title: 'Kafka: The Definitive Guide (Ch 4: Kafka Consumers)', type: 'Book', duration: '4 hours' },
        { title: 'Zero-Copy Network Buffers & Linux epoll Architecture', type: 'Deep Dive', duration: '4 hours' },
        { title: 'Real-Time Stream Processing at Scale with Flink/Kafka', type: 'Video Course', duration: '6 hours' }
      ],
      practiceProject: {
        title: 'Million-Event Partitioned Ingestion Pipeline',
        description: 'Simulate high-throughput ingestion with custom backpressure shedder and Prometheus metrics.',
        deliverables: ['Docker Compose setup benchmarking P99 latency under 20ms']
      }
    },
    {
      week: 3,
      title: 'Multi-Region Fault Tolerance & Active-Active Disaster Recovery',
      focusGap: 'Active-Active Disaster Recovery Topologies',
      estimatedHours: 10,
      learningObjectives: [
        'Design cross-region replication topologies with conflict resolution',
        'Configure multi-cluster Kubernetes with Istio service mesh failover',
        'Implement automated canary rollout with automated rollback triggers'
      ],
      recommendedResources: [
        { title: 'Google SRE Book: Distributed Multi-Region Consistency', type: 'Case Study', duration: '3 hours' },
        { title: 'Istio Multi-Cluster Mesh Architecture Guide', type: 'Documentation', duration: '4 hours' }
      ],
      practiceProject: {
        title: 'Active-Active Failover Simulator',
        description: 'Simulate region loss and measure failover latency under synthetic traffic.',
        deliverables: ['Architecture blueprint & chaos engineering test suite']
      }
    }
  ];

  const toggleTask = (taskId: string) => {
    setCompletedTasks(prev => ({ ...prev, [taskId]: !prev[taskId] }));
  };

  const triggerStruggleAdaptation = (topic: string) => {
    setStrugglingTopic(topic);
    setHasAdapted(true);
  };

  const currentWeekData = weeks[activeWeek - 1] || weeks[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-obsidian-900 border border-obsidian-border rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 bg-obsidian-850 border-b border-obsidian-border flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-gold-500 to-amber-300 flex items-center justify-center text-black font-bold shadow-lg shadow-gold-500/20">
              <BookOpen className="w-6 h-6 text-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-100">EduPath • Adaptive Skill Gap Roadmap</h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-400 font-semibold">
                  Personalized to Candidate Deficiencies
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Learner: <span className="text-slate-200 font-semibold">{candidate.name}</span> • Target: <span className="text-gold-300 font-medium">{candidate.roleApplied}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-obsidian-800 hover:bg-obsidian-700 text-slate-400 hover:text-white border border-obsidian-border transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Struggle Alert Banner */}
        {hasAdapted && (
          <div className="bg-gold-950/40 border-b border-gold-500/30 p-4 px-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-3">
              <RefreshCw className="w-5 h-5 text-gold-400 animate-spin flex-shrink-0" />
              <div>
                <div className="text-xs font-bold text-gold-400 uppercase tracking-wider font-mono">
                  Autonomous Re-Routing Triggered
                </div>
                <p className="text-xs text-slate-300">
                  Agent detected persistent struggle on <span className="font-semibold text-white">"{strugglingTopic}"</span>. Inserted prerequisite micro-diagnostic module and adjusted project scope dynamically.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-gold-500/20 text-gold-300 px-2.5 py-1 rounded-full border border-gold-500/40">
              Graph Recalculated
            </span>
          </div>
        )}

        {/* Week Selector Bar */}
        <div className="grid grid-cols-3 border-b border-obsidian-border bg-obsidian-950/60 divide-x divide-obsidian-border font-mono text-xs">
          {weeks.map((w) => (
            <button
              key={w.week}
              onClick={() => setActiveWeek(w.week)}
              className={`p-4 text-left transition-all ${
                activeWeek === w.week 
                  ? 'bg-obsidian-800/80 border-b-2 border-gold-500 text-slate-100 shadow-sm' 
                  : 'text-slate-400 hover:bg-obsidian-900/50 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-gold-400 font-bold mb-1">
                <span>WEEK {w.week}</span>
                <span className="text-slate-500">{w.estimatedHours}h Estimated</span>
              </div>
              <div className="font-sans font-semibold text-sm truncate text-slate-200">{w.title}</div>
              <div className="text-[11px] text-slate-400 truncate mt-1">Focus: {w.focusGap}</div>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold flex items-center gap-1.5">
                <Target className="w-4 h-4 text-gold-400" />
                <span>Structured Learning Objectives</span>
              </h3>
              <div className="space-y-2">
                {currentWeekData.learningObjectives.map((obj, i) => (
                  <div key={i} className="p-3 rounded-xl bg-obsidian-850 border border-obsidian-border flex items-start gap-3 text-xs text-slate-200 leading-relaxed">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-gold-400" />
                <span>Curated Industry Resources</span>
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {currentWeekData.recommendedResources.map((res, i) => (
                  <div key={i} className="p-3 rounded-xl bg-obsidian-850 border border-obsidian-border flex flex-col justify-between hover:border-slate-700 transition-colors">
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-obsidian-950 text-gold-300 border border-obsidian-border">
                        {res.type}
                      </span>
                      <h4 className="text-xs font-semibold text-slate-200 mt-2 line-clamp-2">{res.title}</h4>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono mt-3 pt-2 border-t border-obsidian-border/60">
                      <span>{res.duration}</span>
                      <span className="text-gold-400 hover:underline flex items-center gap-0.5 cursor-pointer">
                        Access <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-gradient-to-br from-obsidian-800 to-obsidian-850 border border-gold-500/30 space-y-2 shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-gold-400 uppercase font-bold flex items-center gap-1.5">
                  <span>Capstone Practice Project</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                  Portfolio Grade
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-100">{currentWeekData.practiceProject.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed">{currentWeekData.practiceProject.description}</p>
              <div className="mt-2 text-[11px] font-mono text-slate-400 pt-2 border-t border-obsidian-border">
                <span className="text-slate-300 font-bold">Deliverables:</span> {currentWeekData.practiceProject.deliverables.join(', ')}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-obsidian-850 border border-obsidian-border space-y-3">
              <h3 className="text-xs font-mono uppercase text-slate-400 tracking-wider font-semibold">
                Milestone Activity Tasks
              </h3>
              <div className="space-y-2">
                {[
                  { id: `task-w${activeWeek}-1`, label: 'Complete core consensus readings' },
                  { id: `task-w${activeWeek}-2`, label: 'Pass diagnostic quiz on log compaction' },
                  { id: `task-w${activeWeek}-3`, label: 'Submit mini-project GitHub repository' },
                ].map((task) => (
                  <label 
                    key={task.id}
                    className="flex items-center gap-2.5 p-2 rounded-lg bg-obsidian-950/60 hover:bg-obsidian-950 border border-obsidian-border cursor-pointer transition-colors text-xs text-slate-300"
                  >
                    <input
                      type="checkbox"
                      checked={Boolean(completedTasks[task.id])}
                      onChange={() => toggleTask(task.id)}
                      className="rounded border-slate-700 text-gold-500 focus:ring-0 bg-obsidian-900"
                    />
                    <span className={completedTasks[task.id] ? 'line-through text-slate-500' : ''}>
                      {task.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gradient-to-b from-obsidian-850 to-obsidian-900 border border-amber-500/40 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-300 font-mono uppercase">
                <RefreshCw className="w-4 h-4 text-amber-400" />
                <span>Simulate Struggle Detection</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Demonstrates the autonomous agent detecting when a learner struggles on a concept, dynamically inserting remediation modules into the graph.
              </p>
              <button
                type="button"
                onClick={() => triggerStruggleAdaptation('Raft Split-Brain Quorum')}
                className="w-full py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs font-semibold border border-amber-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Simulate Struggle & Re-Route</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-obsidian-850 border-t border-obsidian-border flex items-center justify-between text-xs text-slate-400 font-mono">
          <div>Powered by EduPath Adaptive Agent Core • 100% Dynamic DAG Architecture</div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-gold-500 hover:bg-gold-600 text-black font-bold transition-colors"
          >
            Close Roadmap
          </button>
        </div>

      </div>
    </div>
  );
};
