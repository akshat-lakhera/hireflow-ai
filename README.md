# TalentDossier â€” Autonomous AI Recruiter Agent
> **Agentic AI Hackathon 2026 Submission**  
> *From raw resume to hiring decision, autonomously â€” with humans in the loop at exactly the right moment.*

[![Build](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/ci.yml)
[![Deploy](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/deploy.yml/badge.svg)](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/deploy.yml)
[![Release](https://img.shields.io/github/v/release/akshat-lakhera/hireflow-ai?color=6366f1&label=Release)](https://github.com/akshat-lakhera/hireflow-ai/releases/latest)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://agentic-ai-hackathon-seven.vercel.app)

> 🌐 **Live Demo**: [https://agentic-ai-hackathon-seven.vercel.app](https://agentic-ai-hackathon-seven.vercel.app)

---

## What Is This?

**TalentDossier** is a fully autonomous AI recruiting agent that runs end-to-end â€” from the moment a candidate submits their resume to the moment an acceptance or rejection email lands in their inbox â€” with one human checkpoint in between.

It is **not a chatbot**. It does not wait for prompts. It runs a continuous **Perceive â†’ Plan â†’ Act** loop:
- **Perceive**: Monitors an application portal queue for new submissions (LinkedIn, Greenhouse, Indeed, or a built-in career page)
- **Plan**: Generates a dynamic DAG (Directed Acyclic Graph) execution plan for each batch of candidates
- **Act**: Executes each plan step â€” embedding extraction, evidence triage, qualification scoring, status classification, and email drafting
- **Gate**: Stages all decisions in a Human Review Action Deck before any email fires

This is the architecture described by the hackathon brief: *"An AI agent works independently in a continuous loop. It breaks down a big goal into smaller steps, checks its environment, and takes real-world actions."*

---

## See It in 60 Seconds

**Step 1 â€” Clone and run:**
```bash
git clone https://github.com/akshat-lakhera/hireflow-ai.git
cd hireflow-ai
npm install
npm run dev
```
Open `http://localhost:5173`

**Step 2 â€” Define a role** (takes 30 seconds in the onboarding wizard â€” or skip, a default role is pre-loaded)

**Step 3 â€” Trigger the agent loop:**  
Click **"Autonomous Agent"** in the top nav â†’ **"Activate Loop"** â†’ **"Simulate Portal Inflow"**

Watch the agent perceive 3 candidates from LinkedIn/Greenhouse/Indeed, build a DAG plan, score each against your role blueprint, classify each one, draft emails, and stage them for your 1-click approval â€” all without you touching anything.

**Step 4 â€” Review and approve** in the Human Review Action Deck. If SMTP credentials are configured, emails dispatch automatically. If not, the system surfaces an inline key capture modal â€” enter it, verify, send.

---

## The Agentic Architecture

```
PERCEPTION LAYER              PLANNING LAYER              ACTION LAYER
â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€     â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
PortalIngestionService    â†’   AgentLoopRuntime (DAG)   â†’  Tool Execution
  â€¢ Career portal queue         â€¢ Dynamic plan per batch    â€¢ Candidate embedding
  â€¢ Greenhouse webhook            STEP 1: ingest_portal     â€¢ Evidence triage
  â€¢ Lever webhook                 STEP 2: extract_embed     â€¢ Score & classify
  â€¢ LinkedIn Apply                STEP 3: triage_evidence   â€¢ Status update
  â€¢ Indeed webhook                STEP 4: score_rank        â€¢ Email draft
  â€¢ Event-driven (instant)        STEP 5: update_status   
                                  STEP 6: draft_email     
                                  STEP 7: human_gate  â”€â”€â†’  HUMAN CHECKPOINT
                                                            (approve / reject / edit)
                                                                   â”‚
                                                          Email dispatch to candidate
                                                          (SMTP-gated, real credentials)
```

### ReAct Protocol (Reasoning + Acting)
Every agent cycle logs its **Thought â†’ Action â†’ Observation** loop in real time to the Operations Center terminal:
```
[THOUGHT]   3 new applications detected from portal queue (LinkedIn x2, Greenhouse x1)
[ACTION]    run_plan_step: extract_embedding for "Liam Zhang"
[OBSERVE]   384-dim vector. Cosine similarity to role blueprint: 0.87
[THOUGHT]   Similarity exceeds threshold (0.75). Proceeding to evidence triage.
[ACTION]    run_plan_step: triage_evidence for "Liam Zhang"
[OBSERVE]   4/5 must-have skills verified. 2 proof points. Gap: Paxos variants.
[ACTION]    run_plan_step: score_rank â†’ 89% (Strong fit) â†’ Interview Ready
[ACTION]    run_plan_step: draft_email â†’ Subject + body generated
[ACTION]    human_gate â†’ staged for recruiter 1-click approval
```

---

## Features

### Autonomous Loop (Core Innovation)
- **Continuous daemon**: Polls application queue every 10 seconds (configurable interval)
- **Event-driven trigger**: Activates instantly on `portal_inflow` events â€” no polling lag when someone actually applies
- **Persistent state**: Staged decisions, audit logs, and ReAct traces survive page refresh via localStorage
- **Pause/resume**: Recruiter can pause the loop and manually step-cycle for debugging

### Multi-Source Application Ingestion
- **Built-in career portal** (`/apply` page inside the app) â€” candidates fill a form, agent detects and processes in <10s
- **Webhook format support**: Greenhouse, Lever, LinkedIn Apply, Indeed structured payloads
- **Simulated batch inflow**: Realistic 3-candidate demo batch from all four sources for instant demonstration

### AI Engine (Dual-Mode, No Vendor Lock-in)
- **Frontier LLM**: Groq LLaMA-3.3 70B, Google Gemini 1.5 Flash, or OpenAI GPT-4o-mini â€” switchable at runtime
- **Local deterministic fallback**: Rule-based scoring engine works with zero API keys â€” honest attribution, zero hallucination
- Transparent in UI â€” the active engine name is shown on every evaluation result

### Human-in-the-Loop Gate
- Every agent decision stages in the **Human Review Action Deck** before any action fires
- 1-click Approve or Dismiss per candidate
- Batch approve all with a single button
- Full email preview (subject + body) expandable inline before sending
- **SMTP gate**: If no key, surfaces an inline credential capture modal with connection test. If recruiter still doesn't provide â€” "Email Not Sent" alert records the skipped communication with name + email

### Recruiter Workspace
- **3-column IDE-style layout** with resizable, collapsible panels (drag handles, persisted widths)
- **Candidate Executive Dossier**: Evidence map, interview probes, notes, full audit trail, original resume (PDF embed + text viewer with keyword highlight)
- **Compare Matrix**: Side-by-side scoring for any 2 candidates; auto-closes if a candidate is rejected mid-session
- **Recruiter AI Copilot**: Natural language with 7 executable workspace tools (compare, update status, open interview kit, add note, filter pipeline, re-evaluate with AI, etc.)
- **Structured Interview Kit**: TTS reads questions aloud (without leaking rubrics), STT captures interviewer notes live

### Storage
- **IndexedDB** â€” in-browser vector store, zero config, works offline
- **Supabase pgvector** â€” optional cloud sync with 384-dim semantic similarity search
- Schema SQL in `public/schema.sql`

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Agent Runtime | Custom ReAct loop + DAG planner â€” pure TypeScript, no framework |
| AI APIs | Groq, Google Gemini, OpenAI (all optional, switchable) |
| Vector Store | IndexedDB (local) + Supabase pgvector (cloud) |
| PDF Parsing | pdfjs-dist (client-side, no server) |
| Speech | Web Speech API (browser-native TTS + STT) |
| Email | GmailSyncService (SMTP App Password or SendGrid) |

---

## Quick Start

```bash
git clone https://github.com/akshat-lakhera/hireflow-ai.git
cd hireflow-ai
npm install
npm run dev
# â†’ http://localhost:5173
```

**To enable live LLM reasoning (optional):**
1. Click the status badge in the top nav â†’ AI Settings
2. Paste a free [Groq API key](https://console.groq.com) â†’ Save

**To enable real email dispatch (optional):**
1. Settings â†’ Gmail Candidate Sync
2. Enter Gmail App Password (16-char) â†’ Test Connection â†’ Save

The app is fully functional with zero API keys using the built-in deterministic engine.

---

## Submission Details

| Field | Value |
|---|---|
| **Project Name** | TalentDossier |
| **Hackathon** | Agentic AI Hackathon 2026 |
| **Repository** | [github.com/akshat-lakhera/hireflow-ai](https://github.com/akshat-lakhera/hireflow-ai) |
| **Architecture** | ReAct Loop + Dynamic DAG Planner + Human Gate + Multi-Source Portal Ingestion |
| **AI Models** | Groq LLaMA-3.3-70B Â· Google Gemini 1.5 Flash Â· OpenAI GPT-4o-mini |
| **Built During** | 24-hour hackathon window |

