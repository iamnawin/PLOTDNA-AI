# PlotDNA — Project Memory
> This file is the single source of truth for all project context.
> Update this file at the end of every session with what changed.
> Any AI assistant or developer joining this project should read this first.

---

## What Is PlotDNA?
A real estate investment intelligence platform for India.
Users enter any location (plot/land/area) and get a **DNA Score (0–100)** showing
investment potential — based on satellite growth, infrastructure pipeline,
population trends, RERA activity, and AI analysis.

**Tagline:** *"Decode any plot before you buy."*

---

## Origin & Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| Separate app from Structra AI? | Yes — standalone | Different users, different use case |
| App name | **PlotDNA** | `plotdna.com` available ($11.25/yr), "DNA" = strong metaphor |
| First city | **Hyderabad** | Best RERA data (TSRERA), fastest growing market, ORR boom |
| Expansion plan | Hyderabad → pan-India | Validate concept first, then scale |
| Map library | Leaflet.js + OpenStreetMap | 100% free forever, no API key needed |
| AI model | Gemini 2.0 Flash | 1500 req/day free tier |
| Satellite data | Google Earth Engine | Free non-commercial account |
| Database | Supabase | Free 500MB + PostGIS spatial queries |
| Backend | FastAPI (Python) | GEE SDK is Python-native |
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 | Same stack as Structra AI, familiar |

---

## Current Status
**Phase:** 0 — Scaffold complete, no features built yet
**Last session:** Project initialized, repo created, all dependencies installed

### What's Been Built
- [x] Git repo initialized at `Desktop/PlotDNA/`
- [x] Frontend scaffolded: React 19 + TS + Vite + Tailwind v4 + Leaflet + Recharts + Framer Motion
- [x] Backend scaffolded: FastAPI with 4 route stubs (areas / score / satellite / ai)
- [x] All frontend deps installed (`node_modules/` ready)
- [x] `CLAUDE.md` — AI coding instructions
- [x] `README.md` — project overview
- [x] `docs/ROADMAP.md` — 20-week phase plan
- [x] `docs/DATA_SOURCES.md` — all free APIs + upgrade triggers
- [x] `docs/DNA_SCORE.md` — full scoring methodology
- [x] `.gitignore` + `.env.example`
- [x] `.claude/launch.json` — preview server config (port 5173)
- [x] Initial git commit `bfb276f`

### What's NOT Built Yet
- [ ] Any actual UI (map, score cards, pages)
- [ ] Hyderabad micro-market data (JSON)
- [ ] Leaflet map component
- [ ] DNA score card component
- [ ] Backend logic (all routes are stubs returning empty data)
- [ ] Supabase connection
- [ ] GEE integration
- [ ] Gemini AI chat

---

## Tech Stack (Full)

### Frontend (`/frontend`)
| Package | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7 | Build tool (port 5173) |
| Tailwind CSS | v4 (via @tailwindcss/vite) | Styling — NO tailwind.config.js needed |
| Leaflet.js | 1.9 | Maps (free, OSM tiles) |
| react-leaflet | 5.0 | React wrapper for Leaflet |
| Recharts | 3.7 | Charts for growth trends |
| Framer Motion | 12 | Animations |
| Lucide React | 0.575 | Icons |
| React Router | v7 | Routing |
| TanStack Query | v5 | Data fetching + caching |
| Axios | 1.13 | HTTP client |
| Zustand | 5 | Lightweight state management |

### Backend (`/backend`)
| Package | Purpose |
|---|---|
| FastAPI | Web framework |
| uvicorn | ASGI server |
| earthengine-api | Google Earth Engine |
| geopandas + shapely | Spatial data processing |
| supabase | Database client |
| sqlalchemy + psycopg2 | ORM + PostgreSQL |
| google-generativeai | Gemini AI |
| pydantic-settings | Config from .env |

---

## Directory Structure
```
PlotDNA/
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── map/        Leaflet map components
│       │   ├── score/      DNA score cards + badges
│       │   └── ui/         Shared UI (Button, Badge, Card...)
│       ├── pages/          Home, AreaDetail, Compare
│       ├── data/           Static JSON (Hyderabad micro-markets)
│       ├── hooks/          Custom React hooks
│       ├── lib/            API client (axios), utils
│       ├── types/          TypeScript interfaces
│       └── store/          Zustand global state
├── backend/
│   └── app/
│       ├── api/routes/     areas.py | score.py | satellite.py | ai.py
│       ├── models/         Pydantic + SQLAlchemy models
│       ├── services/       GEE service, Gemini service, scoring logic
│       └── core/           config.py (settings from .env)
├── data/
│   ├── hyderabad/          GeoJSON + score data for 20 micro-markets
│   └── india/              Pan-India city boundaries
├── docs/
│   ├── ROADMAP.md
│   ├── DATA_SOURCES.md
│   └── DNA_SCORE.md
├── scripts/                Data scraping + import scripts
├── .claude/launch.json     Preview server: "PlotDNA Frontend" on port 5173
├── CLAUDE.md               AI assistant instructions
├── MEMORY.md               ← YOU ARE HERE
├── README.md
├── .gitignore
└── .env.example
```

---

## DNA Score — How It Works
Single number 0–100 built from 7 weighted signals:

| Signal | Weight | Source |
|---|---|---|
| Infrastructure Pipeline | 25% | NHAI, Metro, Airport data |
| Population Growth | 20% | WorldPop + Census India |
| Satellite Built-up Growth | 20% | GEE Landsat/Sentinel-2 |
| RERA New Projects | 15% | TSRERA / State RERA portals |
| Employment Hub Proximity | 10% | OSM + IT park data |
| Property Price Velocity | 5% | 99acres/MagicBricks |
| Smart City / Govt Scheme | 5% | smartcities.gov.in |

**Score ranges:**
- 0–40: 🔴 High Risk
- 41–65: 🟡 Moderate
- 66–80: 🟢 Good Growth
- 81–100: 💎 Emerging Goldzone

---

## Hyderabad Micro-markets (Phase 1 — 20 zones)

| Area | Category | DNA Score |
|---|---|---|
| Financial District | Established | 62 |
| Kokapet | High Growth | 81 |
| Narsingi | High Growth | 76 |
| Adibatla | Emerging | 88 |
| Tukkuguda | Emerging | 84 |
| Shadnagar | Emerging | 79 |
| Mokila | High Growth | 74 |
| Tellapur | High Growth | 72 |
| Shankarpally | Emerging | 78 |
| Ghatkesar | Emerging | 71 |
| Yacharam | Emerging | 69 |
| Bibinagar | Emerging | 73 |
| Rajendra Nagar | Established | 58 |
| Kompally | Established | 55 |
| Medchal | High Growth | 68 |
| Shamshabad | High Growth | 66 |
| Patancheru | Industrial | 61 |
| Peerzadiguda | Emerging | 70 |
| Ameenpur | Emerging | 75 |
| LB Nagar | Established | 54 |

---

## Phase Roadmap Summary

| Phase | Goal | Status |
|---|---|---|
| 0 | Scaffold + repo setup | ✅ Done |
| 1 (Weeks 1–4) | Hyderabad map + static DNA scores | 🔲 Next |
| 2 (Weeks 5–8) | RERA scraper + dynamic scores + Gemini AI chat | 🔲 Pending |
| 3 (Weeks 9–12) | GEE satellite timelapse | 🔲 Pending |
| 4 (Weeks 13–16) | Pan-India expansion (Bangalore, Mumbai, Chennai, Pune) | 🔲 Pending |
| 5 (Weeks 17–20) | Monetization (free/pro tiers) | 🔲 Pending |

---

## Free API Limits — Do Not Exceed
| API | Limit | Action if hit |
|---|---|---|
| Gemini Flash | 1500 req/day, 15 req/min | Queue requests, show loading |
| Nominatim geocoding | 1 req/sec | Debounce search input |
| GEE (free) | Non-commercial only | Cache ALL results, never recompute |
| OpenStreetMap tiles | Soft limit | Use tile caching |
| Supabase free | 500MB storage | Archive old data before expanding |

---

## Design System
- **Background:** `#0a0a0a` (near black)
- **Surface:** `#111111`, `#1a1a1a`, `#262626`
- **Accent:** Green (`#22c55e`) for good scores, Red (`#ef4444`) for bad
- **Score colors:** Red → Yellow → Green → Emerald
- **Font:** Inter (system fallback)
- **Map style:** Dark tiles (CSS filter: invert + hue-rotate)
- **Popups:** Dark background `#1a1a1a`, white text, green border

---

## How to Run Locally
```bash
# Frontend (open in new terminal)
cd frontend
npm run dev
# → http://localhost:5173

# Backend (open in separate terminal)
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
cp ../.env.example ../.env     # fill in keys
uvicorn app.main:app --reload
# → http://localhost:8000
# → Docs at http://localhost:8000/docs
```

---

## Important Notes for Next Session
1. **Open Claude Code from `Desktop/PlotDNA/`** — not from Structra AI
2. First task: build `src/data/hyderabad.ts` (micro-market data file)
3. Then build: `MapView` component with Leaflet + zone polygons
4. Then build: `ScoreCard` component + `AreaDetail` page
5. Tailwind v4 uses `@import "tailwindcss"` in CSS — no config file needed
6. Path alias `@/` maps to `src/` (configured in vite.config.ts)

---

## Session Log
| Date | What Was Done |
|---|---|
| 2026-03-01 | Project conceived, tech stack decided, Hyderabad chosen as first city |
| 2026-03-01 | Full scaffold created: repo, frontend, backend, docs, CLAUDE.md, initial commit |
