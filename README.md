# PlotDNA

> Decode any plot before you buy.

PlotDNA is an AI-powered real estate investment intelligence platform for India.
Enter any location — get a DNA score, satellite growth analysis, infrastructure pipeline,
population trends, and an AI answer to "is this worth buying?"

## Features (Roadmap)

- **DNA Score (0–100)** — One number capturing 7 investment signals
- **Satellite Timelapse** — See how any area has grown over 10 years via Google Earth Engine
- **Infrastructure Radar** — Upcoming metro lines, highways, IT parks near your plot
- **Population Heatmap** — WorldPop density trends
- **RERA Activity** — New project filings, builder reputation
- **AI Chat** — Ask "Is Adibatla good for 5-year investment?" and get a data-backed answer

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind v4 |
| Maps | Leaflet.js + OpenStreetMap |
| Charts | Recharts |
| Backend | FastAPI (Python) |
| Database | Supabase (PostgreSQL + PostGIS) |
| Satellite | Google Earth Engine |
| AI | Gemini 2.0 Flash |

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.11+
- Git

### Frontend
```bash
cd frontend
npm install
npm run dev
# Opens at http://localhost:5173
```

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate    # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example ../.env  # Fill in your keys
uvicorn app.main:app --reload
# Opens at http://localhost:8000
```

## Phase 1 Launch Cities
- [x] Hyderabad (20 micro-markets)
- [ ] Bangalore
- [ ] Mumbai
- [ ] Chennai
- [ ] Pune

## Data Sources
- **Satellite**: Google Earth Engine (Landsat + Sentinel-2)
- **Population**: WorldPop open dataset
- **RERA**: TSRERA, MahaRERA, RERA Karnataka (scraped)
- **Infrastructure**: NHAI, HMDA, OpenStreetMap
- **Property prices**: 99acres / MagicBricks (scraped + cached)

---

*Built for every Indian who deserves better data before making the biggest investment of their life.*
