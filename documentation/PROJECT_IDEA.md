# ⚽🏀 TacticoAI — AI Tactical Analyst for Sports Teams
> *Post-Game Tactical Insights for Soccer & Basketball Coaches*

---

## 🎯 Overview
**TacticoAI** is an AI-powered SaaS platform that helps **college, semi-pro, and high school** soccer and basketball coaches analyze their games automatically.

Coaches upload full match recordings, and TacticoAI:
- Extracts player/ball tracking data with Computer Vision.
- Analyzes tactical patterns and player performance metrics.
- Summarizes findings into human-readable insights using LLM reasoning.
- Provides an interactive, voice-enabled “AI Coach” for follow-up tactical Q&A.

Our MVP is built for **post-game analysis**, focusing on fast, clear, and coach-friendly feedback.
Long-term, TacticoAI scales toward **real-time in-match tactical coaching**.

---

## 🚀 MVP Goal (Hackathon Version)
Deliver a **demo-ready web app** where users can:
1. Log in as a team (college & sport themed).
2. Upload a full match video (or short demo clip).
3. See an automatically generated **match summary card**:
   - Tactical analysis (AI-generated text).
   - Basic stats & metrics.
   - Formation visualization (simple SVG pitch/court).
   - Embedded match video.
4. View team and player stats in the “My Team” section.
5. Ask questions via **Voice Coach (Vapi)** — powered by the LLM (Letta).

The MVP focuses on *frontend completion first*, with backend and AI features integrated progressively.

---

## 🧩 Core Features
| Feature | Description | Status |
|----------|--------------|--------|
| **Landing Page** | Intro with product summary and “Get Started” CTA | ✅ Planned |
| **Dynamic Theming** | Colors and logo update per college & sport | ✅ Planned |
| **Login (Mock)** | Temporary client-only login for demo | ✅ Planned |
| **Video Upload (Mock)** | Upload match clip → simulate analysis job | ✅ Planned |
| **Past Matches List** | Cards with status badges (New / Processing / Analyzed) | ✅ Planned |
| **Past Match Card** | Video, AI summary, metrics, formation SVG | ✅ Planned |
| **My Team Page** | Player roster grid with editable mock stats | ✅ Planned |
| **Voice Coach Modal** | Conversational Q&A (frontend + Vapi placeholder) | ✅ Planned |
| **AI Integration (Backend)** | Letta for tactical summaries, RAG memory | ⏳ Integration Phase |
| **Computer Vision Worker** | YOLO + ByteTrack pipeline for player/ball tracking | ⏳ Integration Phase |

---

## 🧠 Data Flow (Simplified)
```

Upload Video  →  Job Created  →  CV Worker (YOLO+OpenCV)
↓
Events & Metrics JSON
↓
Letta (LLM RAG)
↓
AI Summary + Tactical Insights
↓
Frontend Visualization

````

---

## 🧰 Tech Stack (Hackathon MVP)

| Layer | Technology | Purpose |
|-------|-------------|----------|
| **Frontend** | React (Vite + Tailwind + shadcn/ui + Zustand) | Web UI |
| **Routing** | React Router | Multi-page navigation |
| **Voice Interface** | Vapi | Voice-based tactical Q&A |
| **LLM / RAG Engine** | Letta (Sonnet 4.5) | AI summaries + memory |
| **Backend API** | FastAPI (Python) | Video job orchestration & API endpoints |
| **Database / Auth / Storage** | Supabase | Auth, metadata, and file storage |
| **CV / ML Pipeline** | OpenCV + YOLOv8 + ByteTrack | Player/ball detection & tracking |
| **Deployment** | Vercel (web), Railway/Render (API/worker) | Hosting |
| **Dev Tools** | GitHub, Postman, Notion, Figma | Collaboration & design |

---

## 📦 Data Model (Simplified)

| Table | Purpose |
|--------|----------|
| **teams** | Stores team name, sport, theme colors, and logo |
| **players** | Player roster with basic metadata |
| **matches** | Uploaded matches linked to team and opponent |
| **jobs** | Processing status (queued, running, completed) |
| **analyses** | Stores AI summaries, metrics, and events |
| **team_form** | Aggregated rolling stats for last matches |

Each match generates lightweight JSON files:
- `/events.json` → detected passes, shots, turnovers
- `/metrics.json` → possession %, compactness, press index
- `/analysis.json` → LLM tactical summary

---

## 🧮 Example Metrics for MVP
- **Possession %**
- **Press Intensity Index**
- **Width / Compactness**
- **Pass Completion %**
- **Shot Count**
- **Formation Confidence**

Example (per match JSON):
```json
{
  "summary": "Team lost compactness in midfield after 60th minute...",
  "metrics": { "possession": 0.57, "press_index": 0.65 },
  "formation": { "team": "4-3-3", "opponent": "4-4-2" },
  "events": [
    {"minute": 12, "type": "press_trigger", "player": 8},
    {"minute": 23, "type": "goal", "player": 9, "assist": 10}
  ]
}
````

---

## 🧭 Development Roadmap

### Phase 1 — Frontend Prototype (React only)

* [ ] Create all pages & components (no backend)
* [ ] Add mock data & local state
* [ ] Integrate theming and navigation
* [ ] Implement upload simulation and analysis cards
* [ ] Include clear backend hook comments in code

### Phase 2 — Backend & AI Integration

* [ ] Set up Supabase (auth + storage + tables)
* [ ] Connect upload & analysis status to API
* [ ] Add FastAPI endpoints
* [ ] Integrate Letta for tactical summaries
* [ ] Connect Vapi voice assistant

### Phase 3 — ML Pipeline (Proof of Concept)

* [ ] Run YOLOv8 + ByteTrack on sample clips
* [ ] Generate mock positional data + metrics
* [ ] Store results to Supabase + feed into Letta

### Phase 4 — Demo & Submission

* [ ] Prepare seeded demo teams (2 colleges × 2 sports)
* [ ] Pre-upload 2–3 analyzed matches
* [ ] Record full demo flow (upload → summary → voice Q&A)
* [ ] Finalize Devpost & slides for Cal Hacks 12

---

## 🎥 Hackathon Demo Flow

1. **Login** → select college & sport (dynamic theme).
2. **Upload** short match clip (preloaded for speed).
3. **See “Analysis Completed”** → open Match Card.
4. **Review AI Summary & Formation visualization.**
5. **Ask the Voice Coach:**
   “How did our press look in the second half?”
6. **Show JSON data → emphasize full-match scalability.**

---

## 🧠 Why It’s Winnable

* **Real-world problem** (manual tactical analysis = 10+ hrs/week).
* **Agentic AI focus** (Letta + Vapi integration).
* **Visible impact** (AI video analysis + voice explanation).
* **Strong vertical niche** (sports coaching SaaS).
* **Scalable roadmap** post-hackathon (multi-sport, B2B SaaS).

---

## 🏁 Success Criteria

* [ ] Fully functional React UI with mock data.
* [ ] End-to-end upload → summary → voice interaction flow.
* [ ] LLM-generated tactical insights visible in demo.
* [ ] Clean, theme-based UX for two colleges per sport.
* [ ] Runs locally and on Vercel with no errors.
* [ ] Demonstrates clear potential for real-world deployment.

---

## 👥 Team Roles (suggested)

| Role                | Responsibilities                                           |
| ------------------- | ---------------------------------------------------------- |
| **Frontend Devs**   | Build React app per Figma design; handle UI & state        |
| **Backend Devs**    | Create FastAPI endpoints, integrate Supabase, Letta        |
| **ML/AI Devs**      | Implement CV pipeline (YOLO, tracking, metrics extraction) |
| **Integrations**    | Connect Vapi ↔ Letta; ensure structured JSON flow          |
| **PM / Pitch Lead** | Manage tasks, prepare demo, business story & deck          |

---

## 📚 References

* Cal Hacks 12.0 Guide (Application, Creativity, Functionality, Complexity)
* YC RFS 2025: *AI-Native Vertical SaaS + Agent Workflows*
* YOLOv8, ByteTrack, OpenCV documentation
* Letta AI (Sonnet 4.5) and Vapi integration docs
* Supabase docs (auth, storage, database)

---

### 🧩 TL;DR

TacticoAI = *AI Tactical Analyst for Sports Teams.*

Upload a match → AI analyzes tactics → Coach gets visual insights + voice feedback.
Our MVP will demonstrate this full loop — clean UI, working AI logic, and a scalable product vision.