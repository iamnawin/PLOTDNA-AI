<div align="center">

<h1>
  <img src="https://img.shields.io/badge/Plot-DNA-00e676?style=for-the-badge&labelColor=050508&color=00e676" alt="PlotDNA" height="36" />
</h1>

**Decode any plot before you buy.**

AI-powered real estate investment intelligence for India — DNA scores, satellite growth, infrastructure pipeline, and live construction activity for 120+ micro-markets across 6 cities.

<br/>

[![Live Demo](https://img.shields.io/badge/Live%20Demo-plotdna.vercel.app-00e676?style=flat-square&logo=vercel&logoColor=white&labelColor=050508)](https://plotdna.vercel.app)
[![React](https://img.shields.io/badge/React%2019-TypeScript-61dafb?style=flat-square&logo=react&logoColor=61dafb&labelColor=050508)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-7.x-646cff?style=flat-square&logo=vite&logoColor=646cff&labelColor=050508)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8?style=flat-square&logo=tailwindcss&logoColor=38bdf8&labelColor=050508)](https://tailwindcss.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-Python%203.11-009688?style=flat-square&logo=fastapi&logoColor=009688&labelColor=050508)](https://fastapi.tiangolo.com)

</div>

---
## What is PlotDNA?

<img width="1055" height="1544" alt="image" src="https://github.com/user-attachments/assets/5c5b04b9-a1e5-4b65-b97d-ef7bf915e1be" />




Most Indians make their biggest financial decision — buying land — based on gut feel, a broker's pitch, or a WhatsApp forward. PlotDNA fixes that.

Enter any location in India. Get a **DNA Score (0–100)** backed by 7 real signals: infrastructure pipeline, satellite growth, RERA activity, employment hubs, population trends, price velocity, and government schemes. Every micro-market, decoded.

---

## Features

### 🗺️ Interactive Intelligence Map
- Polygon overlays for 120+ micro-markets across 6 cities
- Color-coded DNA tiers: **Goldzone** · **Good Growth** · **Moderate** · **High Risk**
- Hover tooltip with 7-signal fingerprint, YoY growth, and price range
- 4 basemap styles — Standard · Satellite · Terrain · Light (no API key needed)
- 3D tilt view for depth and spatial context
- City switcher with smooth fly-to animation

### 🧬 DNA Score System
A single 0–100 integer that captures investment potential across 7 weighted signals:

| Signal | Weight | What it measures |
|--------|--------|-----------------|
| Infrastructure | 25% | Roads, metro, ORR nodes, connectivity |
| Population Growth | 20% | Migration trends, settlement density |
| Satellite Growth | 20% | 10-year built-up expansion via GEE |
| RERA Activity | 15% | Project filings, builder reputation |
| Employment Hub | 10% | IT parks, SEZs, industrial zones nearby |
| Price Velocity | 5% | YoY appreciation rate |
| Govt Schemes | 5% | HMDA layouts, smart city, infrastructure spend |

**Score tiers:**
- `86–100` → 🟢 **Goldzone** — exceptional growth potential
- `66–85` → 🟩 **Good Growth** — strong fundamentals
- `41–65` → 🟡 **Moderate** — balanced risk/reward
- `0–40`  → 🔴 **High Risk** — caution advised

### 🏗️ Active Construction Layer *(new)*
Toggle live construction markers on the map to see:
- Active projects (pulsing) vs approved vs planning
- Type-coded colors: Metro · IT Park · Highway · Residential · Commercial · Airport
- Hover tooltip: investment ₹Cr, ETA, developer, impact level

Currently live for **Hyderabad** (50 tracked projects across core and growth corridors):

| Area | Key Projects |
|------|-------------|
| Adibatla | Fab City Phase 2 (₹3,500 Cr), Aerospace SEZ (₹1,200 Cr) |
| Kokapet | Metro Phase IV (₹4,200 Cr), Radiance 15M Township |
| Shamshabad | RGIA Terminal 2 (₹5,500 Cr), Aerotropolis (₹12,000 Cr) |
| Tukkuguda | NIMZ Phase 1 (₹2,800 Cr), Hyperscale Data Centre |
| Narsingi | Prestige Somerville, Lodha Belmondo |
| Financial District | Metro Phase IV Station, Prestige South City |

### 📍 Plot Coordinate Analysis
Drop any lat/lng — get the nearest micro-market's DNA score, growth story, 5-year outlook, and confidence level. Works for any plot in India.

### 📄 Area Deep Dive
Every micro-market gets a full analysis page:
- Animated DNA score ring with weighted signal breakdown
- Livability Index (connectivity, amenities, green spaces, entertainment)
- Satellite growth before/after comparison
- Active development pipeline with investment totals
- Growth timeline (2009 → present) and 5-year outlook
- Source links (RERA, HMDA, news, research reports)
- One-click **PDF report** download

### 📱 PWA — Install as App
PlotDNA is a Progressive Web App. On mobile, tap **"Add to Home Screen"** to install it as a native-feeling app — no App Store needed.

---

## Cities & Coverage

| City | Micro-markets | Status |
|------|:---:|--------|
| 🟢 Hyderabad | 32 | Live — expanding construction data |
| 🟢 Bangalore | 20 | Live |
| 🟢 Mumbai | 20 | Live |
| 🟢 Chennai | 20 | Live |
| 🟢 Pune | 20 | Live |
| 🟢 Delhi NCR | 20 | Live |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite 7 + Tailwind CSS v4 |
| **Maps** | MapLibre GL via `react-map-gl` (free, no API key) |
| **Basemaps** | CartoCDN · ArcGIS Satellite · OpenTopoMap |
| **Animations** | Framer Motion |
| **State** | Zustand |
| **Icons** | Lucide React |
| **PDF Export** | jsPDF |
| **Backend** | FastAPI (Python 3.11+) |
| **Database** | Supabase (PostgreSQL + PostGIS) |
| **Satellite** | Google Earth Engine Python SDK |
| **AI** | Gemini 2.0 Flash API |
| **Hosting** | Vercel (frontend) + Render (backend) |

---

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+

### Frontend (all you need for local dev)

```bash
git clone https://github.com/iamnawin/PLOTDNA-AI.git
cd PLOTDNA-AI/frontend

npm install
npm run dev
# → http://localhost:5173
```

No API keys needed. All data is static TypeScript files — the map works fully offline.

### Backend (optional — stubs only in Phase 1)

```bash
cd backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill in your keys
cp ../.env.example ../.env

uvicorn app.main:app --reload
# → http://localhost:8000
```

### Environment Variables (backend)

```env
DATABASE_URL=
SUPABASE_URL=
SUPABASE_KEY=
GEE_SERVICE_ACCOUNT=
GEE_KEY_FILE=
GEMINI_API_KEY=
REDIS_URL=redis://localhost:6379
```

Place `.env` at the project root (`PlotDNA/.env`).

---

## Project Structure

```
PlotDNA/
├── frontend/                   React app (Vite + TypeScript)
│   └── src/
│       ├── components/
│       │   ├── map/            MapLibre GL map, construction markers
│       │   ├── score/          ScoreCard, PlotAnalysisCard
│       │   └── ui/             Shared components (badges, charts, AI cards)
│       ├── pages/              Home (map), AreaDetail, BrochurePage
│       ├── data/               Static city data (TypeScript)
│       ├── store/              Zustand global state
│       ├── lib/                Utilities, plot analysis, area sources
│       └── types/              TypeScript interfaces
│
├── backend/                    FastAPI app (Python)
│   └── app/
│       ├── api/routes/         REST endpoints (stubs in Phase 1)
│       ├── models/             Pydantic + SQLAlchemy models
│       ├── services/           GEE, Gemini, scoring logic
│       └── core/               Config, DB connection
│
├── data/                       Static GeoJSON datasets
└── docs/                       Architecture & planning docs
```

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ✅ Done | 6 cities, static DNA scores, interactive map, PDF export |
| **Phase 2** | 🔄 In Progress | RERA scraper, AI verdict, live news, AVM valuation, brochure analyzer |
| **Phase 3** | 📋 Planned | GEE satellite timelapse, street view, traffic overlay, historical imagery |
| **Phase 4** | 📋 Planned | Pan-India expansion — Tier 2 cities (Ahmedabad, Coimbatore, Indore, Kochi) |
| **Phase 5** | 📋 Planned | Monetization — free / pro tiers, API access, portfolio tracker |

---

## Data Sources

- **Satellite imagery** — Google Earth Engine (Landsat 8, Sentinel-2)
- **Population** — WorldPop open dataset
- **RERA** — TSRERA, MahaRERA, RERA Karnataka, RERA TN, HRERA, UP-RERA
- **Infrastructure** — NHAI, HMDA, BDA, MMRDA, CMDA, DDA
- **Property prices** — 99acres, MagicBricks, NoBroker (scraped + cached)
- **Boundaries** — OpenStreetMap, GADM administrative boundaries

---

## Contributing

Contributions are welcome — especially for:
- Adding construction/pipeline data for more cities
- Improving signal data accuracy for existing areas
- UI/UX improvements

```bash
# Fork → create feature branch → PR against main
git checkout -b feat/your-feature
```

---

<div align="center">

*Built for every Indian who deserves better data before making the biggest investment of their life.*

<br/>
TSX 58.9%

TypeScript 24.5%

Python 15.4%

HTML 0.4%

Shell 0.3%

CSS 0.3%

Other 0.1%

[![GitHub Stars](https://img.shields.io/github/stars/iamnawin/PLOTDNA-AI?style=flat-square&labelColor=050508&color=00e676)](https://github.com/iamnawin/PLOTDNA-AI/stargazers)
[![GitHub Issues](https://img.shields.io/github/issues/iamnawin/PLOTDNA-AI?style=flat-square&labelColor=050508&color=555566)](https://github.com/iamnawin/PLOTDNA-AI/issues)

</div>
