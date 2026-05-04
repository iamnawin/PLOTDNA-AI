# PlotDNA

<div align="center">

[![Web](https://img.shields.io/badge/Web-plotdna--ai.vercel.app-00e676?style=for-the-badge&labelColor=050508)](https://plotdna-ai.vercel.app/)
[![API](https://img.shields.io/badge/API-Render-22c55e?style=for-the-badge&labelColor=050508)](https://plotdna-api.onrender.com/health)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite-61dafb?style=for-the-badge&labelColor=050508)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&labelColor=050508)](https://fastapi.tiangolo.com/)
[![Mobile](https://img.shields.io/badge/Mobile-Capacitor-119eff?style=for-the-badge&labelColor=050508)](https://capacitorjs.com/)

**Decode any plot before you buy.**

PlotDNA is a real estate intelligence app for land and micro-markets. It combines static market coverage, live coordinate analysis, AI verdicts, resolver-grade locality matching, and mobile-ready packaging.

</div>

---

## What it does

- Scores supported micro-markets with a `0-100` DNA score
- Resolves raw coordinates into exact, nearby, cluster, or uncovered locality context
- Lets users search by area name, coordinates, full map URL, or short map link
- Shows live coordinate analysis through the backend pipeline
- Generates AI verdicts, news context, brochure analysis, and market pulse cards
- Supports a mobile app path through Capacitor
- Enforces `3 free searches`, then asks for email through backend entitlements

## Current coverage

- Hyderabad
- Bangalore
- Mumbai
- Chennai
- Pune
- Delhi NCR
- Vijayawada Capital Region
- Visakhapatnam
- Dubai (starter dataset)

## Product status

### Live now

- Vercel web frontend
- Render backend
- Search gating with anonymous auth + email unlock after free quota
- Mobile-friendly search chips and streamlined Home layout
- Dubai wired into the city registry

### In progress

- Capacitor packaging for Play Store / App Store release
- Subscription / in-app purchase flow
- What-if scenario engine
- Internal-only research workflow for market memos

---

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand |
| Maps | MapLibre GL via `react-map-gl` |
| Animation | Framer Motion |
| Backend | FastAPI |
| AI | Gemini |
| Mobile shell | Capacitor |
| Hosting | Vercel + Render |

---

## Repository layout

```text
frontend/                   React app
  src/
    components/             UI, map, score, brochure, verdict cards
    data/                   Static city and area datasets
    lib/                    API, runtime, resolver, plot analysis helpers
    pages/                  Landing, Home, AreaDetail, BrochurePage
    store/                  Zustand store

backend/                    FastAPI app
  app/
    api/routes/             REST endpoints
    core/                   Config and auth
    services/               Entitlements, scoring, verdict, news, utilities

data/                       Resolver-grade city JSON datasets
docs/                       Plans and architecture notes
```

---

## Local development

### Frontend

```bash
git clone https://github.com/iamnawin/PLOTDNA-AI.git
cd PLOTDNA-AI/frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend runs at `http://localhost:8000`.

### Production envs

#### Vercel

```env
VITE_API_URL=https://plotdna-api.onrender.com
```

#### Render

```env
APP_ENV=production
JWT_SECRET=<long-random-secret>
ALLOWED_ORIGINS=https://plotdna-ai.vercel.app
GEMINI_API_KEY=<optional-for-ai-features>
SUPABASE_URL=<optional>
SUPABASE_KEY=<optional>
```

---

## Mobile app path with Capacitor

Capacitor lets this existing React/Vite app run as a native Android/iOS app shell without rewriting the frontend.

### What Capacitor is used for

- wraps the web app in a native container
- opens native Android Studio / Xcode projects
- gives access to native APIs later:
  - in-app purchases
  - share sheet
  - deep links
  - push notifications
  - splash screen and app icons

### Current mobile behavior

- Native builds use `https://plotdna-api.onrender.com` by default if `VITE_API_URL` is not set
- Web dev still defaults to `http://localhost:8000`
- Runtime resolution lives in `frontend/src/lib/runtime.ts`

### Android setup

```bash
cd frontend
npm install
npm run cap:add:android    # one time
npm run cap:prepare        # build + sync
npm run cap:open:android
```

Then:

- open Android Studio
- choose emulator or connected device
- press `Run`

### iOS setup

```bash
cd frontend
npm run cap:add:ios        # one time
npm run cap:prepare
npm run cap:open:ios
```

Then:

- open Xcode
- choose simulator or device
- press `Run`

---

## Search gating flow

The current public flow is:

1. User starts a search-led analysis action
2. Frontend creates or reuses an anonymous session
3. Frontend calls backend entitlements consume endpoint
4. First `3` analysis actions are free
5. After quota is exhausted, an email modal is shown
6. Email unlocks continued search access

The same gate applies to:

- direct lat/lng analysis
- full map URL analysis
- short map link analysis
- opening full analysis from result CTAs

---

## Key files

| File | Purpose |
|---|---|
| `frontend/src/lib/runtime.ts` | Central API base resolution for web vs native |
| `frontend/src/lib/entitlements.ts` | Anonymous auth and quota/email client |
| `frontend/src/pages/Home.tsx` | Main map + search UI |
| `frontend/src/pages/Landing.tsx` | Landing page search flow |
| `frontend/src/components/ui/EmailGateModal.tsx` | Email unlock modal |
| `frontend/src/components/score/ScoreCard.tsx` | Area score panel |
| `frontend/src/components/score/PlotAnalysisCard.tsx` | Coordinate analysis panel |
| `backend/app/api/routes/auth.py` | Anonymous auth endpoint |
| `backend/app/api/routes/entitlements.py` | Entitlement and email endpoints |
| `backend/app/services/entitlements_store.py` | SQLite-backed MVP usage store |

---

## Deployment

### Web

- Frontend: Vercel
- Backend: Render

### Mobile

- Build native projects with Capacitor
- Generate signed Android `.aab` in Android Studio for Play Store
- Generate signed iOS archive in Xcode for App Store

---

## Notes

- `backend/requirements-render.txt` must include every dependency needed by routes loaded at startup
- FastAPI file upload routes require `python-multipart`
- Coordinate data in app datasets is stored as `[lat, lng]`
- MapLibre expects `[lng, lat]`

---

## Roadmap

- subscription and in-app purchase verification
- what-if scenario engine per micro-market
- richer Dubai / UAE coverage
- cleaner mobile release setup
- internal market research memo pipeline

