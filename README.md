# TalentDossier (TD)
> **Autonomous Recruiter Intelligence Workspace & Evidence-Grounded Screening System**

TalentDossier is an enterprise-grade recruiting intelligence platform that transforms raw resumes into structured, verifiable candidate dossiers. Designed for modern engineering hiring teams and recruiters, TalentDossier pairs local vector search with frontier LLM evaluation to eliminate recruitment bias and candidate hallucination.

---

## Key Features

### 1. Three-Column Human Recruiter Workspace
- **Resizable & Collapsible IDE Layout**: Tailored for high-velocity recruiting workflows with customizable panel widths and persistent layout state.
- **Candidate Pipeline Stream**: Fast candidate triage with instant search, fit badges (`Strong fit`, `Moderate fit`, `Potential gap`), and verified skill pills.
- **Executive Dossier Deep-Dive**: Full candidate profile with evidence grounding, career timeline highlights, verified project portfolios, and auditable score breakdowns.
- **Actions & Probes Rail**: Instant status transitions (`Under Review`, `Interview Ready`, `Passed Screen`, `Offer Extended`), reviewer notes with timestamps, and full audit trail logging.

### 2. Side-by-Side Candidate Comparison Matrix
- **Direct Candidate Benchmarking**: Select any 2 candidates directly from the pipeline with one click to launch a comparative head-to-head evaluation.
- **Comparative Telemetry**: Immediate side-by-side spec comparison of match score, years of experience, current role, location, and review status.
- **Differential Qualification Mapping**: Inspect overlapping strengths, unique competencies, and critical gaps between candidates.
- **Direct Dossier Inspection**: Switch directly into any candidate's full executive file with one click.

### 3. Recruiter Agent Copilot (Zero Dummy Answers)
- **Honest AI State Engine**: Clear distinction between live LLM analysis and offline mode. Never displays hardcoded or fabricated candidate assessments.
- **Rich Inline Markdown**: Styled bolding, monospace code blocks, structured lists, headers, and callouts.
- **Grounded Inline Citations**: Every claim made by the Copilot links directly to candidate evidence in the active dossier.
- **Multi-Provider Support**: Compatible with Groq (`llama-3.3-70b-versatile`), Google Gemini (`gemini-1.5-flash`), and OpenAI (`gpt-4o-mini`).
- **Encrypted Local Storage**: API keys are salted and obfuscated in browser memory with optional session-only storage.

### 4. Structured Interview Kit with TTS & Speech-to-Text
- **Confidential Rubric Protection**: Audio reading (TTS) speaks only the interview question, never leaking interviewer rubrics or internal scoring criteria.
- **Live Voice Dictation (STT)**: Web Speech API integration captures interviewer notes and candidate answers in real time.
- **Auto-Synced Answer Persistence**: Answers and interviewer evaluations persist directly to the database and survive page refreshes.

### 5. Dual-Layer Storage & Hybrid Vector Engine
- **Local IndexedDB Vector Store**: Zero setup required. Every candidate is automatically embedded into a 384-dimensional dense vector space for sub-millisecond semantic search.
- **Supabase Cloud Sync (pgvector)**: Full enterprise database support with automated background sync, vector similarity search (`match_candidates` RPC), and schema migration script (`public/schema.sql`).
- **Zero Data Loss Guarantee**: Automatic migration ensures candidate records and role configurations remain intact across updates.

### 6. Role Blueprint Studio
- **Role Parameterization**: Define required vs. preferred skills, minimum experience thresholds, location flexibility, and senior-level expectations.
- **Automated Resume Parsing**: Upload PDFs or paste resume text to extract skills, project history, and experience metrics automatically.
- **Persistent Role State**: Custom role blueprints persist across sessions.

---

## System Architecture

```
                               ┌─────────────────────────────────────────┐
                               │         TalentDossier Front-End         │
                               │   (React 19 + TypeScript + Vite + CSS)  │
                               └────────────────────┬────────────────────┘
                                                    │
                 ┌──────────────────────────────────┴──────────────────────────────────┐
                 ▼                                                                     ▼
   ┌───────────────────────────┐                                         ┌───────────────────────────┐
   │    Local Storage Layer    │                                         │    Frontier AI Engine     │
   ├───────────────────────────┤                                         ├───────────────────────────┤
   │ • IndexedDB Vector Store  │                                         │ • Groq LLaMA 3.3 70B      │
   │ • 384-dim Dense Vectors   │                                         │ • Google Gemini 1.5 Flash │
   │ • Cosine Similarity Engine│                                         │ • OpenAI GPT-4o-mini      │
   │ • Persistent Local Config │                                         │ • Zero-Dummy AI Copilot   │
   └─────────────┬─────────────┘                                         └─────────────┬─────────────┘
                 │                                                                     │
                 ▼                                                                     ▼
   ┌───────────────────────────┐                                         ┌───────────────────────────┐
   │    Cloud Database Sync    │                                         │   Interview Intelligence  │
   ├───────────────────────────┤                                         ├───────────────────────────┤
   │ • Supabase PostgreSQL     │                                         │ • Web Speech STT Audio    │
   │ • pgvector 384-dim Embed  │                                         │ • SpeechSynthesis TTS     │
   │ • Hybrid Search RPC       │                                         │ • Confidential Rubrics    │
   └───────────────────────────┘                                         └───────────────────────────┘
```

---

## Quick Start

### Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/akshat-lakhera/hireflow-ai.git
cd hireflow-ai

# Install dependencies
npm install

# Start local development server
npm run dev
```

The application will be running at `http://127.0.0.1:5173/`.

### Production Build

```bash
npm run build
npm run preview
```

---

## Database Configuration (Optional Cloud Sync)

TalentDossier works **100% offline out-of-the-box** using browser-native IndexedDB. 

To enable team collaboration with Supabase:
1. Create a Supabase project at [supabase.com](https://supabase.com).
2. Open the SQL Editor and run the migration script in `public/schema.sql`.
3. In TalentDossier, click the **Database Settings** (cylinder icon) in the top navigation.
4. Select **Supabase Cloud Database**, enter your `Project URL` and `Anon API Key`, then click **Test & Save Configuration**.

---

## License

MIT License. Designed and engineered for high-performance recruiting operations.
