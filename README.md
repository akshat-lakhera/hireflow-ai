# TalentDossier - Autonomous AI Recruiter Agent
> **Agentic AI Hackathon 2026 Submission**
> *From raw resume to hiring decision, autonomously - with humans in the loop at exactly the right moment.*

[![Build](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/ci.yml)
[![Deploy](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/deploy.yml/badge.svg)](https://github.com/akshat-lakhera/hireflow-ai/actions/workflows/deploy.yml)
[![Release](https://img.shields.io/github/v/release/akshat-lakhera/hireflow-ai?color=6366f1&label=Release)](https://github.com/akshat-lakhera/hireflow-ai/releases/latest)
[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://agentic-ai-hackathon-seven.vercel.app)

> **Live Demo**: https://agentic-ai-hackathon-seven.vercel.app

---

## What Is This?

**TalentDossier** is a fully autonomous AI recruiting agent that runs end-to-end - from the moment a candidate submits their resume to the moment an acceptance or rejection email lands in their inbox - with one human checkpoint in between.

It is **not a chatbot**. It does not wait for prompts. It runs a continuous **Perceive -> Plan -> Act** loop:
- **Perceive**: Monitors an application portal queue for new submissions (LinkedIn, Greenhouse, Indeed, or a built-in career page)
- **Plan**: Generates a dynamic DAG (Directed Acyclic Graph) execution plan for each batch of candidates
- **Act**: Executes each plan step - embedding extraction, evidence triage, qualification scoring, status classification, and email drafting
- **Gate**: Stages all decisions in a Human Review Action Deck before any email fires

This is the architecture described by the hackathon brief: *"An AI agent works independently in a continuous loop. It breaks down a big goal into smaller steps, checks its environment, and takes real-world actions."*

---

## See It in 60 Seconds

**Option A - Live Demo (no setup):**
> Open https://agentic-ai-hackathon-seven.vercel.app
> - 2 demo candidates are pre-loaded (Liam Zhang + Priya Sharma)
> - Go to **Autonomous Agent** -> **Activate Loop** -> **Simulate Portal Inflow**
> - Watch the agent auto-process 3 candidates in real time

**Option B - Run locally:**
```bash
git clone https://github.com/akshat-lakhera/hireflow-ai.git
cd hireflow-ai
npm install
npm run dev
# Open http://localhost:5173
```

---

## Setup Instructions

### 1. Basic Setup (Zero Config - works immediately)

```bash
npm install
npm run dev
```

The app runs fully offline with a built-in deterministic scoring engine. No API keys needed to see the full pipeline.

---

### 2. Enable Live AI Reasoning (Optional - Groq is free)

1. Get a free API key from https://console.groq.com
2. In the app: click the **AI model badge** in the top nav bar -> **AI Settings**
3. Paste your Groq API key -> **Save**
4. The agent now uses LLaMA-3.3-70B for real reasoning instead of the rule engine

Alternatively: paste an **OpenAI** or **Google Gemini** key in the same settings panel.

---

### 3. Enable Real Email Dispatch (Optional - EmailJS is free)

TalentDossier uses **EmailJS** to send real candidate emails directly from the browser - no backend server needed. Free tier: 200 emails/month.

**Step-by-step:**

1. **Create a free account** at https://emailjs.com

2. **Add an Email Service:**
   - Dashboard -> Email Services -> Add New Service -> Gmail
   - Authorize with your Gmail account
   - Copy the **Service ID** (looks like `service_xxxxxxx`)

3. **Create an Email Template:**
   - Dashboard -> Email Templates -> Create New Template
   - Use these variable names in your template body:
     ```
     To: {{to_email}}
     Subject: {{subject}}
     Message: {{message}}
     From name: {{from_name}}
     ```
   - Copy the **Template ID** (looks like `template_xxxxxxx`)

4. **Get your Public Key:**
   - Top-right menu -> Account -> API Keys
   - Copy the **Public Key** (looks like `AbCdEfGhIjKlMnOpQr`)

5. **Paste into TalentDossier:**
   - In the app: top nav -> **Gmail Sync** icon (envelope)
   - Fill in: Service ID, Template ID, Public Key
   - Click **Test Connection** -> should show green checkmark
   - Click **Save Changes**

6. **That's it.** Next time you approve a candidate in the Human Review deck, the email fires in real time and appears in the Outbox log.

---

### 4. Enable Cloud Vector Storage (Optional - Supabase free tier)

By default, candidates are stored in IndexedDB (browser local storage). To enable Supabase pgvector for cross-device sync:

1. Create a project at https://supabase.com (free)
2. Run the schema from `public/schema.sql` in the Supabase SQL editor
3. In the app: **Database** panel -> paste your Supabase URL + Anon Key -> **Connect**

---

## The Agentic Architecture

```
PERCEPTION LAYER            PLANNING LAYER             ACTION LAYER
------------------------    --------------------------  --------------------------
PortalIngestionService  ->  AgentLoopRuntime (DAG)  ->  Tool Execution
  - Career portal queue       - Dynamic plan per batch    - Candidate embedding
  - Greenhouse webhook          STEP 1: ingest_portal     - Evidence triage
  - Lever webhook               STEP 2: extract_embed     - Score & classify
  - LinkedIn Apply              STEP 3: triage_evidence   - Status update
  - Indeed webhook              STEP 4: score_rank        - Email draft
  - Event-driven (instant)      STEP 5: update_status
                                STEP 6: draft_email
                                STEP 7: human_gate  -->   HUMAN CHECKPOINT
                                                          (approve / reject / edit)
                                                                 |
                                                        Email dispatched to candidate
                                                        (via EmailJS, real send)
```

### ReAct Protocol (Reasoning + Acting)

Every agent cycle logs its **Thought -> Action -> Observation** loop in real time:

```
[THOUGHT]   3 new applications detected from portal queue (LinkedIn x2, Greenhouse x1)
[ACTION]    run_plan_step: extract_embedding for "Liam Zhang"
[OBSERVE]   384-dim vector. Cosine similarity to role blueprint: 0.87
[THOUGHT]   Similarity exceeds threshold (0.75). Proceeding to evidence triage.
[ACTION]    run_plan_step: triage_evidence for "Liam Zhang"
[OBSERVE]   4/5 must-have skills verified. 2 proof points. Gap: Paxos variants.
[ACTION]    run_plan_step: score_rank -> 89% (Strong fit) -> Interview Ready
[ACTION]    run_plan_step: draft_email -> Subject + body generated
[ACTION]    human_gate -> staged for recruiter 1-click approval
```

---

## Features

### Autonomous Loop
- Continuous daemon polls queue every 10 seconds; event-driven trigger fires instantly on new submissions
- Persistent state: staged decisions, audit logs, and ReAct traces survive page refresh
- Pause/resume: recruiter can pause the loop and manually step-cycle for debugging

### Multi-Source Application Ingestion
- Built-in career portal (`/apply` page) - candidates fill a form, agent detects in <10s
- Webhook format support: Greenhouse, Lever, LinkedIn Apply, Indeed
- Simulated batch inflow: 3-candidate demo batch from all four sources for instant demo

### AI Engine (Dual-Mode)
- Frontier LLM: Groq LLaMA-3.3 70B, Google Gemini 1.5 Flash, or OpenAI GPT-4o-mini - switchable at runtime
- Local deterministic fallback: rule-based scoring with zero API keys, zero hallucination
- Active engine shown on every evaluation result

### Human-in-the-Loop Gate
- Every agent decision staged in the Human Review Action Deck before any action fires
- 1-click Approve or Dismiss per candidate; batch approve all
- Full email preview (subject + body) before sending
- If no EmailJS key: inline credential capture modal with connection test

### Recruiter Workspace
- 3-column IDE-style layout with resizable, collapsible panels
- Candidate Executive Dossier: evidence map, interview probes, notes, audit trail, PDF resume viewer
- Compare Matrix: side-by-side scoring for any 2 candidates
- Recruiter AI Copilot: natural language -> 7 executable workspace tools
- Structured Interview Kit: TTS reads questions, STT captures answers live

### Storage
- **IndexedDB** - in-browser vector store, zero config, works offline
- **Supabase pgvector** - optional cloud sync with 384-dim semantic similarity search

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Agent Runtime | Custom ReAct loop + DAG planner - pure TypeScript, no framework |
| AI APIs | Groq, Google Gemini, OpenAI (all optional, switchable) |
| Vector Store | IndexedDB (local) + Supabase pgvector (cloud) |
| PDF Parsing | pdfjs-dist (client-side, no server) |
| Speech | Web Speech API (browser-native TTS + STT) |
| Email | EmailJS (real browser-to-email, no backend needed) |

---

## Submission Details

| Field | Value |
|---|---|
| **Project Name** | TalentDossier |
| **Hackathon** | Agentic AI Hackathon 2026 |
| **Live Demo** | https://agentic-ai-hackathon-seven.vercel.app |
| **Repository** | https://github.com/akshat-lakhera/hireflow-ai |
| **Architecture** | ReAct Loop + Dynamic DAG Planner + Human Gate + Multi-Source Portal Ingestion |
| **AI Models** | Groq LLaMA-3.3-70B, Google Gemini 1.5 Flash, OpenAI GPT-4o-mini |
| **Built During** | 24-hour hackathon window |
