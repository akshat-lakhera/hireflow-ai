import { RoleSetup } from '../types';

export const DEFAULT_ROLE: RoleSetup = {
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
};
