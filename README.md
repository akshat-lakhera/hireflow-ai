# TalentDossier (TD) — Autonomous AI Recruiter Intelligence System
> **Built for the Agentic AI Hackathon 2026**  
> *Autonomous Candidate Screening, Evidence Verification & Workspace Tool Execution*

[![CI Quality Gate](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/ci.yml)
[![Deploy to GitHub Pages](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/deploy.yml/badge.svg)](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/deploy.yml)
[![GitHub Release](https://img.shields.io/github/v/release/akshat-lakhera/hireflow-ai?color=6366f1&label=Release&logo=github)](https://github.com/akshat-lakhera/hireflow-ai/releases/latest)
[![Direct Download](https://img.shields.io/badge/Download-Standalone%20Release%20ZIP-emerald?logo=github)](https://github.com/akshat-lakhera/hireflow-ai/releases/latest/download/talentdossier-v1.0.0-standalone.zip)

TalentDossier is an **Autonomous Agentic Recruiting Platform** engineered to transform raw applicant resumes into verifiable, evidence-grounded hiring decisions. Operating on a **ReAct (Reasoning + Acting) Agentic Framework**, TalentDossier gives AI real agency over the recruiter's workspace: autonomously evaluating applicant portfolios against custom role blueprints, executing UI tools (comparison matrix, stage updates, interview kits), and committing auditable decisions directly into an IndexedDB / Supabase pgvector store.

---

## 📦 Instant Standalone Download (No Setup Required)

Want to run or inspect TalentDossier immediately without installing developer tools or configuring node builds?

- 📥 **Direct Download (.zip)**: [**talentdossier-v1.0.0-standalone.zip**](https://github.com/akshat-lakhera/hireflow-ai/releases/latest/download/talentdossier-v1.0.0-standalone.zip)
- 🏷️ **GitHub Releases Hub**: [**https://github.com/akshat-lakhera/hireflow-ai/releases**](https://github.com/akshat-lakhera/hireflow-ai/releases)

### 30-Second Launch:
1. **Download & unzip** `talentdossier-v1.0.0-standalone.zip`.
2. **Serve locally** via any static web server:
   ```bash
   # Option A: With npx (Node.js)
   npx serve .
   
   # Option B: With Python
   python -m http.server 8080
   ```
3. Open `http://localhost:3000` or `http://localhost:8080` in your browser. All vector embeddings, resume parsing, and local agent reasoning run 100% in-browser with zero telemetry leakage!

---

## Workspace Showcase

### 1. Three-Column Recruiter Workspace
A responsive, resizable IDE-style workspace with pipeline cards, deep-dive executive dossier, verified citations, and recruiter action rail.

![TalentDossier Recruiter Workspace](docs/screenshots/dashboard-workspace.png)

---

### 2. Autonomous Screener Agent (Multi-Step ReAct Pipeline)
Autonomously ingests the role requirements, performs evidence triage, makes decisive stage classifications (`Interview Ready`, `Needs Review`, `Rejected`), and logs immutable audit trails.

![Autonomous Screener Agent](docs/screenshots/autonomous-screener-agent.png)

---

### 3. Recruiter Agent Copilot (Workspace Tool Execution)
Natural language RAG recruiter agent that reasons over applicant data and directly executes workspace actions with visual execution receipts.

![Recruiter Agent Copilot](docs/screenshots/recruiter-copilot.png)

---

### 4. Head-to-Head Candidate Compare Matrix
Benchmarking matrix evaluating two candidates side-by-side across match scores, experience, and differential technical requirements.

![Candidate Comparison Matrix](docs/screenshots/candidate-compare-matrix.png)

---

## Agentic Core Features

### 1. Autonomous Screener Agent
- **4-Step Execution Pipeline**:
  1. `Ingest Blueprint`: Loads role criteria, must-have skills, and dense 384-dimensional candidate embeddings.
  2. `Evidence Triage`: Verifies qualification coverage across projects, work history, and verified proof points.
  3. `Decisive Classification`: Autonomously advances candidates to **Interview Ready**, holds for **Needs Review**, or screens out to **Rejected**.
  4. `Audit Commit`: Writes timestamped justification notes and immutable audit trail records directly to candidate files.
- **Dual-Engine Transparent Attribution**:
  - *Frontier LLM Mode*: Uses Groq (`llama-3.3-70b-versatile`), Google Gemini (`gemini-1.5-flash`), or OpenAI (`gpt-4o-mini`) to generate authentic, non-templated reasoning.
  - *Local Deterministic Rule Engine*: Client-side verification fallback with 100% honest attribution (zero fabricated claims).

### 2. Recruiter Agent Copilot (7 Workspace Tools)
The Copilot is equipped with active agency through executable workspace tools:
1. `compare_candidates`: Opens side-by-side comparison matrix for designated applicants.
2. `update_candidate_status`: Promotes or rejects candidates in real time.
3. `select_candidate`: Loads the candidate's executive dossier into the workspace.
4. `open_interview_kit`: Launches the technical interview kit with confidential rubrics.
5. `add_note`: Appends recruiter intelligence notes to the candidate's permanent file.
6. `filter_pipeline`: Filters candidates by keyword or skill in real time.
7. `autonomous_screen_pipeline`: Dispatches the multi-step screener agent.
- **Visual ReAct Receipts**: Each tool call renders an interactive receipt badge in the chat stream displaying the agent's thought process, tool name, parameters, and live UI status.

### 3. Structured Interview Kit with TTS & Speech-to-Text
- **Confidential Rubric Protection**: Text-to-Speech (TTS) speaks only the interview question aloud, never leaking interviewer rubrics or internal scoring criteria.
- **Live Voice Dictation (STT)**: Web Speech API integration captures interviewer notes and candidate answers in real time.
- **Auto-Synced Answer Persistence**: Answers and interviewer evaluations persist directly to the database.

### 4. Dual-Layer Storage & Hybrid Vector Engine
- **Local IndexedDB Vector Store**: Zero setup required. Every candidate is automatically embedded into a 384-dimensional dense vector space for sub-millisecond semantic search.
- **Supabase Cloud Sync (pgvector)**: Enterprise database support with automated background sync, vector similarity search (`match_candidates` RPC), and schema migration script (`public/schema.sql`).
- **Zero Data Loss Guarantee**: Automatic migration ensures candidate records and role configurations remain intact across updates.

### 5. Verbatim Resume Inspection & PDF Preview
- **Full Original Text Stream**: Line-numbered text viewer with real-time keyword highlighting, word count, and one-click copy to clipboard.
- **Embedded PDF Rendering**: Dedicated `<iframe />` preview for uploaded PDF resumes alongside parsed qualifications.
- **Quick-Access Inspection Points**: Direct access via candidate pipeline cards, executive dossier action bar, and the dedicated `📄 Original Resume` dossier tab.

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
   │ • Persistent Local Config │                                         │ • ReAct Workspace Tools   │
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

### Linting & Type Checking

```bash
npm run lint
npx tsc -b
```

---

## Submission Details
- **Project Name**: TalentDossier (TD)
- **Repository**: [https://github.com/akshat-lakhera/hireflow-ai](https://github.com/akshat-lakhera/hireflow-ai)
- **Hackathon Track**: Agentic AI Hackathon 2026
- **Architecture**: Autonomous Multi-Agent Recruiter System with ReAct Tool Execution & Vector Search
