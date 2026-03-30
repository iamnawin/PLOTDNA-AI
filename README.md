<div align="center">

<h1>
  <img src="https://img.shields.io/badge/Plot-DNA-00e676?style=for-the-badge&labelColor=050508&color=00e676" alt="PlotDNA" height="36" />
</h1>

**Decode any plot before you buy.**

AI-powered real estate investment intelligence for India - DNA scores, satellite growth, infrastructure pipeline, and live construction activity for 76 micro-markets across 6 cities.

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




Most Indians make their biggest financial decision - buying land - based on gut feel, a broker's pitch, or a WhatsApp forward. PlotDNA fixes that.

Enter any location in India. Get a **DNA Score (0-100)** backed by 7 real signals: infrastructure pipeline, satellite growth, RERA activity, employment hubs, population trends, price velocity, and government schemes. PlotDNA is currently deepest in Hyderabad and Bangalore, with starter coverage across Mumbai, Chennai, Pune, and Delhi NCR.

---

## Features

### Interactive Intelligence Map
- Polygon overlays for 76 micro-markets across 6 cities
- Color-coded DNA tiers: **Goldzone** Ãƒâ€šÃ‚Â· **Good Growth** Ãƒâ€šÃ‚Â· **Moderate** Ãƒâ€šÃ‚Â· **High Risk**
- Hover tooltip with 7-signal fingerprint, YoY growth, and price range
- 4 basemap styles ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Standard Ãƒâ€šÃ‚Â· Satellite Ãƒâ€šÃ‚Â· Terrain Ãƒâ€šÃ‚Â· Light (no API key needed)
- 3D tilt view for depth and spatial context
- City switcher with smooth fly-to animation

### DNA Score System
A single 0-100 integer that captures investment potential across 7 weighted signals:

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
- `86-100` -> Goldzone - exceptional growth potential
- `66-85` -> Good Growth - strong fundamentals
- `41-65` -> Moderate - balanced risk/reward
- `0-40`  -> High Risk - caution advised

### Active Construction Layer *(new)*
Toggle live construction markers on the map to see:
- Active projects (pulsing) vs approved vs planning
- Type-coded colors: Metro ? IT Park ? Highway ? Residential ? Commercial ? Airport
- Hover tooltip: investment Rs Cr, ETA, developer, impact level

Currently live for **Hyderabad** (50 tracked projects across core and growth corridors) and **Bangalore** (28 tracked projects across the current 20-area support set):

| Area | Key Projects |
|------|-------------|
| Adibatla | Fab City Phase 2 (ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹3,500 Cr), Aerospace SEZ (ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹1,200 Cr) |
| Kokapet | Metro Phase IV (ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹4,200 Cr), Radiance 15M Township |
| Shamshabad | RGIA Terminal 2 (ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹5,500 Cr), Aerotropolis (ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹12,000 Cr) |
| Tukkuguda | NIMZ Phase 1 (ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¹2,800 Cr), Hyperscale Data Centre |
| Narsingi | Prestige Somerville, Lodha Belmondo |
| Financial District | Metro Phase IV Station, Prestige South City |

### Plot Coordinate Analysis
Drop any lat/lng - get the nearest micro-market's DNA score, growth story, 5-year outlook, and confidence level. Works for any plot in India.

### Area Deep Dive
Every micro-market gets a full analysis page:
- Animated DNA score ring with weighted signal breakdown
- Livability Index (connectivity, amenities, green spaces, entertainment)
- Satellite growth before/after comparison
- Active development pipeline with investment totals
- Growth timeline (2009 -> present) and 5-year outlook
- Source links (RERA, HMDA, news, research reports)
- One-click **PDF report** download

### PWA - Install as App
PlotDNA is a Progressive Web App. On mobile, tap **"Add to Home Screen"** to install it as a native-feeling app - no App Store needed.

---

## Cities & Coverage

| City | Micro-markets | Status |
|------|:---:|--------|
| Hyderabad | 32 | Live - resolver-grade coverage |
| Bangalore | 20 | Live - resolver-grade coverage |
| Mumbai | 6 | Live - starter coverage |
| Chennai | 6 | Live - starter coverage |
| Pune | 6 | Live - starter coverage |
| Delhi NCR | 6 | Live - starter coverage |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19 + TypeScript + Vite 7 + Tailwind CSS v4 |
| **Maps** | MapLibre GL via `react-map-gl` (free, no API key) |
| **Basemaps** | CartoCDN Ãƒâ€šÃ‚Â· ArcGIS Satellite Ãƒâ€šÃ‚Â· OpenTopoMap |
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
# ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ http://localhost:5173
```

No API keys needed. All data is static TypeScript files ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â the map works fully offline.

### Backend (optional ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â stubs only in Phase 1)

```bash
cd backend

python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Copy and fill in your keys
cp ../.env.example ../.env

uvicorn app.main:app --reload
# ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ http://localhost:8000
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
ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ frontend/                   React app (Vite + TypeScript)
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ src/
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ components/
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ map/            MapLibre GL map, construction markers
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ score/          ScoreCard, PlotAnalysisCard
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ ui/             Shared components (badges, charts, AI cards)
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ pages/              Home (map), AreaDetail, BrochurePage
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ data/               Static city data (TypeScript)
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ store/              Zustand global state
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ lib/                Utilities, plot analysis, area sources
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ types/              TypeScript interfaces
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡
ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ backend/                    FastAPI app (Python)
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡   ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ app/
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ api/routes/         REST endpoints (stubs in Phase 1)
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ models/             Pydantic + SQLAlchemy models
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ services/           GEE, Gemini, scoring logic
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡       ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ core/               Config, DB connection
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬Å¡
ÃƒÂ¢Ã¢â‚¬ÂÃ…â€œÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ data/                       Static GeoJSON datasets
ÃƒÂ¢Ã¢â‚¬ÂÃ¢â‚¬ÂÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ÃƒÂ¢Ã¢â‚¬ÂÃ¢â€šÂ¬ docs/                       Architecture & planning docs
```

---

## Roadmap

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 1** | ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Done | 6 cities, static DNA scores, interactive map, PDF export |
| **Phase 2** | ÃƒÂ°Ã…Â¸Ã¢â‚¬ÂÃ¢â‚¬Å¾ In Progress | RERA scraper, AI verdict, live news, AVM valuation, brochure analyzer |
| **Phase 3** | ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã¢â‚¬Â¹ Planned | GEE satellite timelapse, street view, traffic overlay, historical imagery |
| **Phase 4** | ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã¢â‚¬Â¹ Planned | Pan-India expansion ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Tier 2 cities (Ahmedabad, Coimbatore, Indore, Kochi) |
| **Phase 5** | ÃƒÂ°Ã…Â¸Ã¢â‚¬Å“Ã¢â‚¬Â¹ Planned | Monetization ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â free / pro tiers, API access, portfolio tracker |

---

## Data Sources

- **Satellite imagery** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â Google Earth Engine (Landsat 8, Sentinel-2)
- **Population** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â WorldPop open dataset
- **RERA** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â TSRERA, MahaRERA, RERA Karnataka, RERA TN, HRERA, UP-RERA
- **Infrastructure** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â NHAI, HMDA, BDA, MMRDA, CMDA, DDA
- **Property prices** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â 99acres, MagicBricks, NoBroker (scraped + cached)
- **Boundaries** ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â OpenStreetMap, GADM administrative boundaries

---

## Contributing

Contributions are welcome ÃƒÂ¢Ã¢â€šÂ¬Ã¢â‚¬Â especially for:
- Adding construction/pipeline data for more cities
- Improving signal data accuracy for existing areas
- UI/UX improvements

```bash
# Fork ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ create feature branch ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ PR against main
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
