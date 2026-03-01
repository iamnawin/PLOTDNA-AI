# PlotDNA — AI Instructions

## What This App Does
PlotDNA is a real estate investment intelligence platform for India.
It decodes the "DNA" of any land/plot — showing growth score, satellite changes,
infrastructure pipeline, population trends — so buyers can invest smarter.

## Current Focus
**Phase 1: Hyderabad MVP** — 20 micro-markets, static data, working map + score UI

## Tech Stack
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4 + Leaflet.js
- **Backend**: FastAPI (Python 3.11+)
- **Database**: Supabase (PostgreSQL + PostGIS)
- **Maps**: Leaflet.js + OpenStreetMap (free tier)
- **Satellite**: Google Earth Engine Python SDK (free non-commercial account)
- **AI**: Gemini 2.0 Flash API (free tier: 1500 req/day)
- **Hosting**: Vercel (frontend) + Render.com (backend)

## Directory Structure
```
PlotDNA/
├── frontend/          React app (port 5173)
│   └── src/
│       ├── components/map/      Leaflet map components
│       ├── components/score/    DNA score cards + badges
│       ├── components/ui/       Shared UI components
│       ├── pages/               Home, AreaDetail, Compare
│       ├── data/                Static JSON (Hyderabad micro-markets)
│       ├── hooks/               Custom React hooks
│       ├── lib/                 API client, utilities
│       ├── types/               TypeScript interfaces
│       └── store/               Zustand state management
├── backend/           FastAPI app (port 8000)
│   └── app/
│       ├── api/routes/          REST endpoints
│       ├── models/              Pydantic + SQLAlchemy models
│       ├── services/            GEE, Gemini, scoring logic
│       └── core/                Config, DB connection
├── data/              Static datasets
│   ├── hyderabad/     Hyderabad micro-market GeoJSON + scores
│   └── india/         Pan-India city boundaries
├── docs/              Planning docs
└── scripts/           Data scraping + import scripts
```

## Key Conventions
- All colors: dark theme (#0a0a0a background, green accents for "good" scores)
- Score color coding: 0-40 = red, 41-65 = yellow, 66-85 = green, 86-100 = emerald
- DNA Score is always 0-100 integer
- All coordinates: WGS84 (EPSG:4326)
- City slugs: lowercase, no spaces (e.g., "hyderabad", "bangalore")
- Area slugs: lowercase-hyphenated (e.g., "financial-district", "kokapet")

## Running Locally
```bash
# Frontend
cd frontend && npm run dev       # http://localhost:5173

# Backend
cd backend
python -m venv venv
source venv/bin/activate         # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload    # http://localhost:8000
```

## Phase Roadmap
- **Phase 1 (Now)**: Hyderabad map + static DNA scores for 20 micro-markets
- **Phase 2**: RERA scraper + dynamic scoring + Gemini AI chat
- **Phase 3**: GEE satellite timelapse integration
- **Phase 4**: Pan-India expansion (Bangalore, Mumbai, Chennai, Pune)
- **Phase 5**: Monetization (free/pro tiers)

## Free API Limits (respect these)
- Gemini Flash: 15 req/min, 1500 req/day
- Nominatim geocoding: 1 req/sec max
- GEE: free for non-commercial use, cache all results
- OpenStreetMap tiles: no hard limit but cache aggressively

## DO NOT
- Store user PII without consent
- Cache stale satellite data >30 days without refresh flag
- Make synchronous GEE calls in API routes (always async/background)
- Hardcode API keys anywhere — always use .env
