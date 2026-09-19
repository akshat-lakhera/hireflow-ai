import { RoleSetup, CandidateCaseFile } from '../types';

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

// Single reference sample case for recruiter demonstration
export const SINGLE_SAMPLE_CASE: CandidateCaseFile = {
  id: 'case-alex-rivera',
  initials: 'AR',
  name: 'Alex Rivera',
  currentRole: 'Principal Systems Architect @ Apex Cloud',
  experienceYears: 6,
  location: 'Seattle, WA',
  email: 'alex.rivera@apexcloud.io',
  phone: '+1 (206) 555-0194',
  matchScore: 94,
  fitBadge: 'Strong fit',
  matchedSkills: ['Go / Rust', 'Raft Consensus', 'Kafka Streaming'],
  missingSkills: ['Active-Active Disaster Recovery', 'Production eBPF'],
  proofLine: '2 production systems, 1 open-source GitHub repo, 1 conference paper',
  reviewStatus: 'Interview Ready',
  resumeSummary: 'Systems architect specializing in consensus engines and low-latency distributed storage. Engineered custom Raft coordinator in Go processing 1.4M events/s with 240ms failover.',
  education: [
    { degree: 'B.S. Computer Science (Summa Cum Laude)', school: 'University of Washington', year: '2018' }
  ],
  experiences: [
    {
      company: 'Apex Cloud Systems',
      role: 'Principal Systems Architect',
      duration: '2022 - Present',
      highlights: [
        'Architected a distributed metadata coordinator using custom Raft consensus in Go, decreasing failover latency from 4.2s to 240ms.',
        'Scaled Apache Kafka cluster across 3 AWS regions handling 1.4 million transactions per second with zero data loss under simulated partitions.',
        'Authored eBPF probes for TCP socket tracing, reducing P99 latency jitter across 800 microservices by 34%.'
      ]
    },
    {
      company: 'Vanguard Networks',
      role: 'Senior Infrastructure Engineer',
      duration: '2019 - 2022',
      highlights: [
        'Engineered a persistent LSM-tree storage engine in Rust with custom WAL (write-ahead log) compaction.',
        'Configured multi-cluster Kubernetes topologies and automated canary deployments using Istio service mesh.'
      ]
    }
  ],
  projects: [
    {
      name: 'raft-kv-engine',
      description: 'Fault-tolerant distributed key-value store with leader election, log replication, and Jepsen partition tests.',
      link: 'github.com/alexrivera/raft-kv-engine'
    }
  ],
  evidenceMap: [
    {
      id: 'ev-1',
      requirement: 'Go or Rust systems programming',
      evidenceSource: 'Apex Cloud & Vanguard codebases',
      snippet: 'Authored core coordinator in Go and persistent LSM engine in Rust; 8+ years combined production commit history.',
      confidence: 'High',
      status: 'Verified'
    },
    {
      id: 'ev-2',
      requirement: 'Raft or Paxos consensus internals',
      evidenceSource: 'GitHub repo "raft-kv-engine" + Jepsen suite',
      snippet: 'Implemented Raft linearizable ReadIndex and log compaction; verified partition tolerance with 100% data consistency.',
      confidence: 'High',
      status: 'Verified'
    },
    {
      id: 'ev-3',
      requirement: 'Apache Kafka streaming (500k+ events/s)',
      evidenceSource: 'Apex Cloud multi-region deployment telemetry',
      snippet: 'Scaled 3-region Kafka cluster processing 1.4M transactions/sec with zero loss during simulated partition chaos.',
      confidence: 'High',
      status: 'Verified'
    },
    {
      id: 'ev-4',
      requirement: 'Kubernetes orchestration & service mesh',
      evidenceSource: 'Vanguard Networks Istio rollout',
      snippet: 'Automated canary deployments and multi-cluster pod autoscaling across 40+ production nodes.',
      confidence: 'High',
      status: 'Verified'
    },
    {
      id: 'ev-5',
      requirement: 'Active-active disaster recovery topologies',
      evidenceSource: 'Resume work experience section',
      snippet: 'Candidate details AWS multi-region setups, but hybrid on-prem to cloud active-active failover is not explicitly documented.',
      confidence: 'Medium',
      status: 'Needs validation'
    }
  ],
  interviewQuestions: [
    {
      id: 'q-ar-1',
      category: 'Consensus & Latency',
      questionText: 'Walk me through how you tuned Raft election timeouts to achieve 240ms failover without inducing split-vote storms.',
      targetRequirement: 'Raft or Paxos consensus internals',
      severityTag: 'Deep dive',
      followUpProbe: 'What exact quorum heartbeat intervals did you benchmark, and how did you guarantee linearizability under leader partition?',
      concernNote: 'Verify candidate did the low-level tuning rather than relying on standard framework defaults.'
    },
    {
      id: 'q-ar-2',
      category: 'Disaster Recovery',
      questionText: 'How would you architect cross-region stream replication when network partitions occur between hybrid on-prem datacenters and AWS?',
      targetRequirement: 'Active-active disaster recovery topologies',
      severityTag: 'Validate',
      followUpProbe: 'How would you handle producer idempotency keys when the secondary datacenter assumes primary leadership?',
      concernNote: 'Primary qualification gap on file; test edge case handling.'
    }
  ],
  riskFlags: [
    {
      id: 'rf-1',
      label: 'Hybrid Cloud Disaster Recovery',
      severity: 'low',
      details: 'Candidate is heavily specialized in AWS; needs brief validation on bare-metal / hybrid datacenter network quirks.'
    }
  ],
  teamNotes: [
    {
      id: 'tn-1',
      author: 'Lead Recruiter',
      text: 'Strongest technical candidate on paper. GitHub project shows genuine distributed systems craftsmanship.',
      timestamp: 'Today at 10:14 AM'
    }
  ],
  auditTrail: [
    {
      id: 'at-1',
      action: 'Case File Generated',
      timestamp: 'Today at 09:30 AM',
      note: 'Extracted 5 core requirements from Staff Distributed Systems JD and cross-referenced 4 sources.'
    },
    {
      id: 'at-2',
      action: 'Evidence Verified',
      timestamp: 'Today at 09:31 AM',
      note: 'Matched 4/5 requirements with High confidence against public GitHub repository and production telemetry.'
    }
  ]
};

// Export as array of 1 item only (Alex Rivera)
export const SAMPLE_CASE_FILES: CandidateCaseFile[] = [SINGLE_SAMPLE_CASE];
