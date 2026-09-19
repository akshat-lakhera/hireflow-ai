import { JobDescription, Candidate } from '../types';

export const SAMPLE_JOB_DESCRIPTION: JobDescription = {
  id: 'jd-staff-distributed-sys-01',
  title: 'Staff Distributed Systems Engineer',
  department: 'Core Infrastructure & Platform Architecture',
  level: 'Staff / L6',
  location: 'San Francisco, CA (Hybrid / Remote)',
  minimumYearsExperience: 6,
  summary: 'We are seeking a Staff Distributed Systems Engineer to lead the architectural evolution of our global telemetry and high-throughput real-time stream ingestion backbone. You will design fault-tolerant consensus systems, optimize low-latency storage engines, and drive high-availability guarantees across multi-region cloud clusters.',
  coreRequirements: [
    '6+ years of production experience in high-throughput distributed systems using Go, Rust, or modern C++',
    'Deep expertise in consensus algorithms (Raft, Paxos), distributed state machines, and replication models',
    'Proven track record scaling Apache Kafka, Pulsar, or event stream architectures processing 500k+ events/sec',
    'Production experience with Kubernetes orchestration, service mesh (Istio/Linkerd), and Linux kernel tuning',
    'Demonstrated mastery of distributed database primitives, LSM-trees, and concurrency control (MVCC, 2PC)',
  ],
  preferredQualifications: [
    'Contributions to open-source infrastructure projects (e.g. etcd, TiKV, Kafka, Envoy)',
    'Experience designing zero-downtime multi-region active-active disaster recovery topologies',
    'Familiarity with eBPF, network telemetry, and high-performance RPC protocols (gRPC, Cap\'n Proto)',
  ],
  keyResponsibilities: [
    'Architect and implement mission-critical consensus and stream processing pipelines with 99.999% SLA',
    'Lead architectural reviews, root-cause investigations, and mentor senior engineering peers',
    'Profile latency regressions, memory allocations, and network bottleneck optimizations in production',
  ]
};

export const SAMPLE_CANDIDATES: Candidate[] = [
  {
    id: 'cand-alex-rivera',
    name: 'Alex Rivera',
    email: 'alex.rivera@cloudinfra.dev',
    roleApplied: 'Staff Distributed Systems Engineer',
    experienceYears: 8,
    location: 'Seattle, WA',
    summary: 'Distributed systems architect with 8 years specializing in high-throughput storage engines, consensus protocols, and low-latency stream processing. Lead engineer on a 1.2M events/sec Raft-backed time-series engine.',
    skills: ['Go', 'Rust', 'Raft Consensus', 'Apache Kafka', 'Distributed Storage', 'Kubernetes', 'gRPC', 'eBPF', 'Linux Kernel', 'PostgreSQL'],
    experiences: [
      {
        company: 'Apex Cloud Systems',
        role: 'Principal Systems Architect',
        duration: '2022 - Present',
        highlights: [
          'Architected a distributed metadata coordinator using custom Raft consensus in Go, decreasing failover latency from 4.2s to 240ms.',
          'Scaled Apache Kafka cluster across 3 AWS regions handling 1.4 million transactions per second with zero data loss under simulated partitions.',
          'Authored eBPF probes for TCP socket tracing, reducing P99 latency jitter across 800 microservices by 34%.'
        ],
        citations: [
          'Resume: Page 1, Section "Work Experience - Apex Cloud Systems", Lines 12-18',
          'Github: github.com/alexrivera/raft-kv-engine (850 stars, personal open-source Raft implementation)'
        ]
      },
      {
        company: 'Vanguard Networks',
        role: 'Senior Infrastructure Engineer',
        duration: '2019 - 2022',
        highlights: [
          'Engineered a persistent LSM-tree storage engine in Rust with custom WAL (write-ahead log) compaction.',
          'Configured multi-cluster Kubernetes topologies and automated canary deployments using Istio service mesh.'
        ],
        citations: [
          'Resume: Page 1, Section "Work Experience - Vanguard Networks", Lines 22-26'
        ]
      }
    ],
    education: [
      {
        degree: 'B.S. in Computer Science (Summa Cum Laude)',
        institution: 'University of Washington',
        year: '2018'
      }
    ],
    projects: [
      {
        name: 'raft-kv-engine',
        description: 'Fault-tolerant distributed key-value store with leader election, log replication, and snapshotting in Go.',
        techStack: ['Go', 'gRPC', 'Protobuf', 'Raft'],
        claims: [
          'Implemented log compaction and linearizable read index algorithm',
          'Validated partition tolerance using Jepsen tests with 100% data consistency'
        ]
      }
    ],
    matchScore: 94,
    matchBreakdown: {
      technicalSkills: 96,
      architectureDepth: 98,
      experienceRelevance: 95,
      communicationPotential: 90,
      riskPenalty: 4
    },
    matchedRequirements: [
      {
        requirement: '6+ years in high-throughput distributed systems using Go, Rust',
        status: 'fulfilled',
        evidenceSnippet: '8 years experience at Apex Cloud & Vanguard building high-throughput systems in Go and Rust.',
        resumeLineRef: 'Page 1, Summary & Experience block',
        relevanceWeight: 5
      },
      {
        requirement: 'Deep expertise in consensus algorithms (Raft, Paxos)',
        status: 'fulfilled',
        evidenceSnippet: 'Architected distributed metadata coordinator with custom Raft consensus; published raft-kv-engine with Jepsen verification.',
        resumeLineRef: 'Page 1, Apex Cloud bullet 1',
        relevanceWeight: 5
      },
      {
        requirement: 'Proven track record scaling Apache Kafka (500k+ events/sec)',
        status: 'fulfilled',
        evidenceSnippet: 'Scaled Apache Kafka cluster handling 1.4 million transactions per second across 3 AWS regions.',
        resumeLineRef: 'Page 1, Apex Cloud bullet 2',
        relevanceWeight: 5
      },
      {
        requirement: 'Production experience with Kubernetes orchestration and service mesh',
        status: 'fulfilled',
        evidenceSnippet: 'Configured multi-cluster Kubernetes and automated canary deployments using Istio.',
        resumeLineRef: 'Page 1, Vanguard Networks bullet 2',
        relevanceWeight: 4
      },
      {
        requirement: 'Mastery of distributed database primitives, LSM-trees, and concurrency control',
        status: 'fulfilled',
        evidenceSnippet: 'Engineered persistent LSM-tree storage engine in Rust with custom WAL compaction.',
        resumeLineRef: 'Page 1, Vanguard Networks bullet 1',
        relevanceWeight: 5
      }
    ],
    missingGaps: [
      {
        skillOrArea: 'Active-Active Disaster Recovery across On-Prem & Cloud',
        severity: 'minor',
        rationale: 'Candidate has strong AWS multi-region experience, but hybrid on-prem disaster recovery is not explicitly detailed.',
        suggestedValidation: 'Probe candidate on edge cases when syncing data between private datacenter and cloud availability zones.'
      }
    ],
    grouping: 'Top Contender',
    interviewStatus: 'pending',
    questions: [
      {
        id: 'q-alex-1',
        category: 'distributed_systems',
        questionText: 'In your Apex Cloud metadata coordinator, you reduced Raft failover latency to 240ms. How did you tune election timeouts, avoid split-vote storms, and guarantee linearizable reads without overloading the leader?',
        targetResumeClaim: 'Architected distributed metadata coordinator using custom Raft consensus in Go, decreasing failover latency from 4.2s to 240ms',
        rationale: 'Directly validates deep systems knowledge and verifies they did the low-level tuning rather than using off-the-shelf defaults.',
        mappedJDRequirement: 'Deep expertise in consensus algorithms (Raft, Paxos)',
        wasProbed: false
      },
      {
        id: 'q-alex-2',
        category: 'concurrency',
        questionText: 'When scaling Kafka to 1.4 million TPS across three AWS regions, how did you handle cross-region replication lag, producer acks (acks=all vs acks=1), and consumer rebalances during partition re-assignments?',
        targetResumeClaim: 'Scaled Apache Kafka cluster across 3 AWS regions handling 1.4 million transactions per second',
        rationale: 'Tests candidate on real operational failure modes under extreme throughput.',
        mappedJDRequirement: 'Scaling Apache Kafka or event stream architectures processing 500k+ events/sec',
        wasProbed: false
      }
    ]
  },
  {
    id: 'cand-elena-chen',
    name: 'Elena Chen',
    email: 'elena.chen@devops-lead.io',
    roleApplied: 'Staff Distributed Systems Engineer',
    experienceYears: 7,
    location: 'San Francisco, CA',
    summary: 'Cloud infrastructure lead with 7 years orchestrating Kubernetes microservices, cloud telemetry backends, and gRPC service meshes. Extensive experience with Go, Docker, Helm, and AWS infrastructure.',
    skills: ['Go', 'Kubernetes', 'Docker', 'AWS', 'Terraform', 'gRPC', 'Prometheus', 'PostgreSQL', 'Redis', 'Python'],
    experiences: [
      {
        company: 'HyperScale Data',
        role: 'Staff Infrastructure Engineer',
        duration: '2021 - Present',
        highlights: [
          'Managed 45+ production Kubernetes clusters running 2,500+ microservices on AWS EKS.',
          'Built internal distributed caching layer using Redis Cluster and Go proxies, improving API response times by 45%.',
          'Established automated GitOps delivery pipelines using ArgoCD, reducing release cycle time by 70%.'
        ],
        citations: [
          'Resume: Page 1, HyperScale Data Experience block, Lines 10-15'
        ]
      },
      {
        company: 'SaaS Platform Inc',
        role: 'Senior Backend Engineer',
        duration: '2019 - 2021',
        highlights: [
          'Developed high-performance gRPC microservices in Go for billing and subscription management.',
          'Optimized PostgreSQL queries and implemented connection pooling with PgBouncer.'
        ],
        citations: [
          'Resume: Page 2, SaaS Platform Inc Experience block, Lines 3-8'
        ]
      }
    ],
    education: [
      {
        degree: 'M.S. in Software Engineering',
        institution: 'UC Berkeley',
        year: '2019'
      }
    ],
    projects: [
      {
        name: 'k8s-autoscale-operator',
        description: 'Custom Kubernetes controller in Go that autoscales pods based on queue depth metrics from Redis.',
        techStack: ['Go', 'Kubernetes Client-go', 'CRD', 'Prometheus'],
        claims: ['Zero-lag autoscaling for asynchronous background worker queues']
      }
    ],
    matchScore: 81,
    matchBreakdown: {
      technicalSkills: 85,
      architectureDepth: 76,
      experienceRelevance: 84,
      communicationPotential: 88,
      riskPenalty: 12
    },
    matchedRequirements: [
      {
        requirement: '6+ years in high-throughput distributed systems using Go',
        status: 'fulfilled',
        evidenceSnippet: '7 years engineering infrastructure and backend services in Go across HyperScale Data and SaaS Platform.',
        resumeLineRef: 'Page 1, Work History',
        relevanceWeight: 5
      },
      {
        requirement: 'Production experience with Kubernetes orchestration',
        status: 'fulfilled',
        evidenceSnippet: 'Managed 45+ production Kubernetes clusters running 2,500+ microservices on AWS EKS with ArgoCD GitOps.',
        resumeLineRef: 'Page 1, HyperScale Data bullet 1',
        relevanceWeight: 5
      },
      {
        requirement: 'Deep expertise in consensus algorithms (Raft, Paxos)',
        status: 'partial',
        evidenceSnippet: 'Familiar with etcd backing Kubernetes, but has not implemented or customized core consensus state machines directly.',
        resumeLineRef: 'Implicit in K8s operator experience, no explicit consensus protocol design cited',
        relevanceWeight: 5
      },
      {
        requirement: 'Proven track record scaling Apache Kafka (500k+ events/sec)',
        status: 'missing',
        evidenceSnippet: 'Resume details Redis Cluster and PostgreSQL, but lacks production Apache Kafka streaming experience at scale.',
        resumeLineRef: 'No mentions of Kafka or Pulsar in tech stack or project bullets',
        relevanceWeight: 5
      }
    ],
    missingGaps: [
      {
        skillOrArea: 'High-Throughput Stream Ingestion (Apache Kafka / Pulsar)',
        severity: 'critical',
        rationale: 'Role requires leading telemetry streaming ingestion at 500k+ events/sec. Candidate primarily worked with Redis caching and REST/gRPC.',
        suggestedValidation: 'Probe candidate on how they would transition from in-memory Redis queues to distributed partitioned event logs like Kafka.'
      },
      {
        skillOrArea: 'Consensus State Machine Internals',
        severity: 'moderate',
        rationale: 'Understands Kubernetes control loops, but lacks hands-on consensus protocol tuning (e.g. Raft heartbeats, log pruning).',
        suggestedValidation: 'Ask how etcd consensus behaves during network partitions in split-brain clusters.'
      }
    ],
    grouping: 'Strong Technical Fit',
    interviewStatus: 'pending',
    questions: [
      {
        id: 'q-elena-1',
        category: 'architecture',
        questionText: 'You have deep experience with Redis Cluster and Kubernetes operators, but our core infrastructure streams 500k+ telemetry events/sec through Kafka. How would you design a stream processing architecture that guarantees at-least-once delivery without creating consumer bottlenecking?',
        targetResumeClaim: 'Built internal distributed caching layer using Redis Cluster and Go proxies',
        rationale: 'Directly bridges the candidate’s primary skill gap against the core JD requirement.',
        mappedJDRequirement: 'Proven track record scaling Apache Kafka or event stream architectures',
        wasProbed: false
      },
      {
        id: 'q-elena-2',
        category: 'distributed_systems',
        questionText: 'When your Kubernetes clusters scale pods based on queue depth, how do you prevent thundering herd problems, cascade failures, and graceful teardown of stateful connections during sudden traffic spikes?',
        targetResumeClaim: 'Custom Kubernetes controller in Go that autoscales pods based on queue depth',
        rationale: 'Tests resilience engineering and deep systems operational maturity.',
        mappedJDRequirement: 'Production experience with Kubernetes orchestration and high availability',
        wasProbed: false
      }
    ]
  },
  {
    id: 'cand-marcus-vance',
    name: 'Marcus Vance',
    email: 'marcus.vance@techconsult.net',
    roleApplied: 'Staff Distributed Systems Engineer',
    experienceYears: 6,
    location: 'Austin, TX',
    summary: 'Full-stack cloud consultant and systems enthusiast. Experienced in Python, Node.js, AWS serverless architectures, and building scalable SaaS APIs with Docker and CI/CD.',
    skills: ['Python', 'JavaScript', 'Node.js', 'AWS Lambda', 'DynamoDB', 'Docker', 'REST APIs', 'FastAPI', 'Git', 'CI/CD'],
    experiences: [
      {
        company: 'CloudBridge Consulting',
        role: 'Senior Cloud Consultant',
        duration: '2022 - Present',
        highlights: [
          'Delivered cloud modernization consulting for enterprise clients migrating from on-prem to AWS.',
          'Built serverless microservices using AWS Lambda, API Gateway, and DynamoDB.',
          'Implemented automated CI/CD pipelines with GitHub Actions for 12 client repositories.'
        ],
        citations: [
          'Resume: Page 1, CloudBridge Consulting, Lines 8-14'
        ]
      },
      {
        company: 'NextGen Digital',
        role: 'Full Stack Engineer',
        duration: '2020 - 2022',
        highlights: [
          'Developed web dashboards using React and Express.js.',
          'Created database migrations and REST endpoints for customer onboarding.'
        ],
        citations: [
          'Resume: Page 2, NextGen Digital, Lines 4-9'
        ]
      }
    ],
    education: [
      {
        degree: 'B.S. in Information Systems',
        institution: 'Texas A&M University',
        year: '2020'
      }
    ],
    projects: [
      {
        name: 'serverless-order-pipeline',
        description: 'E-commerce checkout prototype with AWS SQS and Lambda functions.',
        techStack: ['Python', 'AWS Lambda', 'SQS', 'DynamoDB'],
        claims: ['Serverless microservices with automated scaling']
      }
    ],
    matchScore: 58,
    matchBreakdown: {
      technicalSkills: 52,
      architectureDepth: 48,
      experienceRelevance: 55,
      communicationPotential: 82,
      riskPenalty: 28
    },
    matchedRequirements: [
      {
        requirement: '6+ years in high-throughput distributed systems using Go, Rust',
        status: 'missing',
        evidenceSnippet: 'Experience is centered on Python, Node.js, and AWS serverless. Zero production Go or Rust codebase experience.',
        resumeLineRef: 'Page 1, Skills & Tech History',
        relevanceWeight: 5
      },
      {
        requirement: 'Deep expertise in consensus algorithms (Raft, Paxos)',
        status: 'missing',
        evidenceSnippet: 'No consensus algorithm or state machine replication experience listed.',
        resumeLineRef: 'Completely unmentioned in resume',
        relevanceWeight: 5
      },
      {
        requirement: 'Proven track record scaling Apache Kafka (500k+ events/sec)',
        status: 'missing',
        evidenceSnippet: 'Candidate used AWS SQS and DynamoDB for low-volume e-commerce orders, not high-volume streaming.',
        resumeLineRef: 'Page 1, Project section',
        relevanceWeight: 5
      },
      {
        requirement: 'Production experience with Kubernetes orchestration',
        status: 'partial',
        evidenceSnippet: 'Lists Docker containerization, but lacks hands-on multi-cluster Kubernetes or service mesh operations.',
        resumeLineRef: 'Page 1, Skills section only mentions Docker',
        relevanceWeight: 4
      }
    ],
    missingGaps: [
      {
        skillOrArea: 'Core Systems Programming (Go / Rust)',
        severity: 'critical',
        rationale: 'Candidate has exclusively worked in Python and Node.js. Staff level requires writing and debugging low-level memory, threads, and network buffers.',
        suggestedValidation: 'Ask candidate to explain how Go runtime scheduler (GMP) handles goroutines or how Rust prevents data races without GC.'
      },
      {
        skillOrArea: 'Low-Latency High-Throughput Stream Ingestion',
        severity: 'critical',
        rationale: 'Consulting experience is focused on standard serverless web APIs with low RPS rather than million-event infrastructure.',
        suggestedValidation: 'Probe how they would debug a queue backpressure issue when downstream writes freeze.'
      }
    ],
    grouping: 'High Gap Risk',
    interviewStatus: 'pending',
    questions: [
      {
        id: 'q-marcus-1',
        category: 'resume_probe',
        questionText: 'Your experience is predominantly in Python serverless architectures (AWS Lambda + DynamoDB), whereas this Staff role requires engineering low-latency systems in Go/Rust with custom consensus. Have you worked with compiled systems languages or raw TCP sockets in high-concurrency environments?',
        targetResumeClaim: 'Built serverless microservices using AWS Lambda, API Gateway, and DynamoDB',
        rationale: 'Validates whether candidate has any undisclosed systems programming experience or is misaligned with role requirements.',
        mappedJDRequirement: 'Production experience in high-throughput distributed systems using Go or Rust',
        wasProbed: false
      },
      {
        id: 'q-marcus-2',
        category: 'architecture',
        questionText: 'When an AWS SQS queue experiences sudden message duplication or consumer processing timeouts, how do you ensure idempotent processing and prevent duplicate side-effects in downstream databases?',
        targetResumeClaim: 'E-commerce checkout prototype with AWS SQS and Lambda',
        rationale: 'Tests whether candidate understands at-least-once message delivery and idempotency keys.',
        mappedJDRequirement: 'Distributed database primitives and concurrency control',
        wasProbed: false
      }
    ]
  }
];
