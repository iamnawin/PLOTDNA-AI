# PlotDNA — Phase 2: Professional Investment Platform

> **Status:** In Development — 2026-03-11
> **Branch:** `claude/epic-euclid`
> **Goal:** Transform PlotDNA from a static demo into a live, AI-powered real estate intelligence platform supporting India + UAE.

---

## What Phase 1 Delivered

- ✅ 6 Indian cities: Hyderabad, Bangalore, Mumbai, Chennai, Pune, Delhi NCR
- ✅ MapLibre GL map with polygon overlays, hover tooltips, tier filtering
- ✅ DNA Score (7-signal static algorithm), AreaDetail full analysis page
- ✅ FastAPI backend deployed on Render (stubs, verdict service with Gemini 1.5 Flash)
- ✅ PDF export, source links, city switcher, 3D tilt, 4 basemap styles

**Gap:** All score data is static. No live signals, no brochure intelligence, no UAE support, no real market pulse.

---

## Phase 2 Scope

### 2.1 Multimodal Brochure Parser  ← **Priority Feature**

**Endpoint:** `POST /api/v1/analyze-brochure`

Users upload a real estate PDF/Image brochure. Gemini 2.0 Flash analyzes it with vision to extract:

| Field | Type | Description |
|---|---|---|
| `plot_area_sqft` | float | Total plot/site area |
| `carpet_area_sqft` | float | Net carpet area (after loading) |
| `loading_percentage` | float | Hidden loading %, e.g. "10% super area loading" |
| `latitude` | float \| null | Extracted from QR/map if present |
| `longitude` | float \| null | Extracted from QR/map if present |
| `launch_date` | string \| null | Project launch date |
| `possession_date` | string \| null | Expected possession |
| `price_per_sqft` | float \| null | Listed ₹/sqft or AED/sqft |
| `total_price_range` | string \| null | Full price range shown |
| `hidden_clauses` | list[str] | Extracted caveats, asterisked notes, loading terms |
| `project_name` | string | Developer + project name |
| `rera_number` | string \| null | RERA registration if shown |
| `currency` | "INR" \| "AED" | Auto-detected |
| `country` | "India" \| "UAE" | Auto-detected |
| `confidence` | float | 0–1 extraction confidence |
| `raw_text_excerpt` | string | First 500 chars of extracted text |

**Flow:**
```
Client uploads PDF/Image
    → FastAPI receives multipart/form-data
    → Save to temp file
    → genai.upload_file() → Gemini Files API
    → send to gemini-2.0-flash with system prompt
    → parse JSON response
    → (optional) save to Supabase with lat/lng
    → return BrochureExtraction JSON
```

### 2.2 Multi-Country Backend Structure

```
backend/app/
├── services/
│   ├── brochure_parser.py     ← NEW: Gemini 2.0 Flash multimodal
│   ├── dld_client.py          ← NEW: Dubai Land Department API
│   ├── news_intel.py          ← NEW: NewsAPI.org micro-market news
│   ├── advanced_scorer.py     ← NEW: Phase 2 DNA scoring algorithm
│   ├── verdict_service.py     ← EXISTING: upgrade to gemini-2.0-flash
│   ├── news_aggregator.py     ← EXISTING: RSS feed aggregation
│   └── entity_router.py       ← EXISTING: area name → slug mapping
├── api/routes/
│   ├── brochure.py            ← NEW
│   └── ... (existing stubs)
└── core/
    └── config.py              ← UPDATED: UAE/India keys
```

**Country detection:** Brochure parser auto-detects INR → India, AED → UAE. Country flag stored in `BrochureExtraction.country` and routes data to correct validation source (RERA for India, DLD for UAE).

### 2.3 Cross-Border Data Integration

#### UAE — Dubai Land Department (DLD)
- Source: `data.gov.ae` / Dubai Pulse Open Data
- API: `GET https://gateway.data.gov.ae/datasets/dld_transactions`
- Returns: Transaction price (AED/sqft), area, property type, date
- Cache: 24h Redis/in-memory per area name

#### India — Land Intelligence
- **Bhuvan WMS** (ISRO): `bhuvan.nrsc.gov.in/bhuvan/wms`
  - Layers: `vegetation_cover`, `built_up_area`, `land_use_2023`
  - Used to verify plot boundary + land-use classification
- **GEE** (Google Earth Engine): Built-up area growth (Sentinel-2)
  - Already in requirements.txt — Phase 3 priority

#### News — Market Sentiment
- Source: NewsAPI.org (`newsapi.org/v2/everything`)
- Query: `{area_name} real estate OR property OR RERA`
- Extract: Last 7 articles, sentiment, relevance score
- Cache: 6h per area slug

### 2.4 Advanced DNA Scoring (Phase 2 Algorithm)

New 4-signal scoring for areas with brochure data:

| Signal | Weight | Source |
|---|---|---|
| Government Infrastructure Pipeline | 30% | Static signals + news NER |
| Market Sentiment from News | 20% | NewsAPI + Gemini sentiment |
| Brochure Accuracy vs. RERA Filing | 20% | Brochure parser → RERA cross-check |
| Historical Price Appreciation | 30% | DLD (UAE) / 99acres proxy (India) |

**Score formula:**
```python
phase2_score = (
    infra_score      * 0.30 +
    sentiment_score  * 0.20 +
    accuracy_score   * 0.20 +
    appreciation_score * 0.30
)
```

Phase 2 score is shown alongside Phase 1 score in AreaDetail as "Live Signal Score" vs "Static DNA Score".

---

## API Contracts

### POST /api/v1/analyze-brochure

```
Content-Type: multipart/form-data
Body: file (PDF or image, max 10MB)
      city_slug (optional, string)
      country (optional, "India"|"UAE", default "India")
```

**Response 200:**
```json
{
  "project_name": "Prestige Kokapet Enclave",
  "country": "India",
  "currency": "INR",
  "plot_area_sqft": 2400,
  "carpet_area_sqft": 1920,
  "loading_percentage": 20.0,
  "latitude": 17.3616,
  "longitude": 78.3197,
  "launch_date": "2024-Q1",
  "possession_date": "Dec 2027",
  "price_per_sqft": 8500,
  "total_price_range": "₹2.04Cr – ₹2.20Cr",
  "hidden_clauses": [
    "Subject to 10% loading on super built-up area",
    "GST of 5% applicable additionally",
    "Parking extra at ₹3L per slot"
  ],
  "rera_number": "P02400001234",
  "confidence": 0.87,
  "raw_text_excerpt": "PRESTIGE KOKAPET ENCLAVE | TSRERA Approved...",
  "supabase_id": "uuid-here-if-saved"
}
```

**Response 422:** File too large / unsupported type
**Response 503:** Gemini API unavailable (returns partial data)

### GET /api/v1/market-pulse/{country}/{area_slug}

```json
{
  "area_slug": "kokapet",
  "country": "India",
  "currency": "INR",
  "median_price_sqft": 8200,
  "price_trend_6m": "+12.3%",
  "news_sentiment": "positive",
  "sentiment_score": 72,
  "top_news": [
    {
      "title": "Metro Phase 2 station to come up in Kokapet",
      "url": "...",
      "published_at": "2026-03-10",
      "relevance_score": 0.91
    }
  ],
  "phase2_score": 79,
  "last_updated": "2026-03-11T10:00:00Z"
}
```

### GET /api/v1/dld/transactions/{area_name}  (UAE only)

```json
{
  "area": "Business Bay",
  "currency": "AED",
  "transactions": [
    {
      "date": "2026-03-08",
      "price_per_sqft_aed": 2100,
      "property_type": "Apartment",
      "area_sqft": 850
    }
  ],
  "median_price_aed_sqft": 2050,
  "total_transactions_30d": 143
}
```

---

## Supabase Schema (Phase 2)

```sql
-- Brochure extractions
CREATE TABLE brochure_extractions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  project_name TEXT,
  country      TEXT CHECK (country IN ('India', 'UAE')),
  currency     TEXT CHECK (currency IN ('INR', 'AED')),
  city_slug    TEXT,
  area_slug    TEXT,
  coordinates  GEOGRAPHY(POINT, 4326),  -- PostGIS lat/lng
  plot_area_sqft     FLOAT,
  carpet_area_sqft   FLOAT,
  loading_pct        FLOAT,
  price_per_sqft     FLOAT,
  rera_number        TEXT,
  possession_date    TEXT,
  hidden_clauses     JSONB,
  confidence         FLOAT,
  raw_extraction     JSONB   -- full Gemini output
);

-- Phase 2 scores
CREATE TABLE area_scores_v2 (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  updated_at      TIMESTAMPTZ DEFAULT NOW(),
  area_slug       TEXT UNIQUE,
  city_slug       TEXT,
  country         TEXT,
  infra_score     INT,
  sentiment_score INT,
  accuracy_score  INT,
  appreciation_score INT,
  phase2_score    INT,
  phase1_score    INT
);

-- Market news cache
CREATE TABLE market_news_cache (
  area_slug    TEXT PRIMARY KEY,
  articles     JSONB,
  sentiment    TEXT,
  score        INT,
  cached_at    TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Frontend Additions (Phase 2)

### AreaDetail page additions:
1. **Brochure Upload button** → drag-drop PDF → shows extraction results inline
2. **Live Signal Score** card → Phase 2 score alongside existing DNA Score
3. **Market Pulse** section → news articles + sentiment gauge
4. **UAE toggle** → switch currency/score context if UAE area detected

### New pages:
- `/brochure` → Upload + analyze any brochure (standalone tool)
- `/compare` → Side-by-side area comparison (India vs India, or India vs UAE)

---

## Implementation Order

```
Week 1:
  [x] docs/PHASE2.md (this file)
  [ ] backend/app/services/brochure_parser.py
  [ ] backend/app/api/routes/brochure.py
  [ ] Update config.py + requirements.txt

Week 2:
  [ ] backend/app/services/news_intel.py
  [ ] backend/app/services/dld_client.py
  [ ] backend/app/services/advanced_scorer.py

Week 3:
  [ ] Supabase schema migration
  [ ] Frontend: Brochure upload UI
  [ ] Frontend: Market Pulse section

Week 4:
  [ ] UAE area data (Dubai localities)
  [ ] Full end-to-end test
  [ ] Deploy to Render + Vercel
```

---

## Environment Variables Added

```env
# Phase 2 additions to .env

# News
NEWS_API_KEY=your_newsapi_org_key

# UAE
DLD_API_KEY=your_data_gov_ae_key

# File uploads
MAX_BROCHURE_SIZE_MB=10
UPLOAD_TEMP_DIR=/tmp/plotdna_uploads

# Country
DEFAULT_COUNTRY=India
SUPPORTED_COUNTRIES=India,UAE
```

---

---

## 2.5 Automated Valuation Model (AVM)

**File:** `backend/app/services/avm_scorer.py`

Regression-based valuation with spatial + legal inputs:

```
Value = β0 + β1(Area) + β2(Proximity_to_IT_km) + β3(Infrastructure_Score) + ε

Adjustments:
  + Metro within 1km    → +₹5,400/sqft
  + IT park within 3km  → +₹7,500/sqft
  + High Phase 2 score  → up to +₹1,750/sqft
  - No RERA            → -₹800/sqft
  - Active litigation  → -₹1,500/sqft
  - Agricultural land  → -₹2,000/sqft
```

**Output:** `estimated_total_value`, `valuation_range_low/high`, `gross_yield_pct`, `payback_years`, `projected_value_5yr`

---

## 2.6 Country-Specific Routes

```
/api/india/rera/{state}/{rera_number}          → Verify RERA registration
/api/india/land-record/{state}/{district}/{sn} → Land record + litigation check
/api/india/spatial?lat=&lng=                   → Bhuvan + OSM land use
/api/india/infra-pipeline?lat=&lng=            → NIP projects nearby

/api/uae/transactions/{area_name}              → DLD transaction prices
/api/uae/spatial?lat=&lng=                     → OSM zone classification
/api/uae/zones                                 → Dubai investment zones
```

---

## 2.7 Tech Stack Upgrade Recommendations

| Component | Current | Recommended Upgrade | When |
|---|---|---|---|
| Data orchestration | Manual scripts | Apache Airflow (daily RERA/DLD sync) | Phase 3 |
| Search | Basic filtering | Algolia / Meilisearch (instant across 50k+ plots) | Phase 3 |
| Geo storage | PostGIS (Supabase) | GeoServer (complex zoning heatmaps) | Phase 4 |
| OCR (RERA PDFs) | None | Gemini 2.0 Flash vision / Tesseract | Phase 2 |
| Language | English only | Bilingual (Arabic/Hindi) via Gemini translate | Phase 4 |
| Data ingestion | RSS + scraping | API Setu (India) + DLD Open Data (UAE) | Phase 2 ← now |
| Price index | Static | REIDIN API (UAE Bloomberg equivalent) | Phase 3 |
| ML valuation | Regression AVM | XGBoost on Supabase transaction history | Phase 4 |

---

## Notes + Decisions

| Decision | Choice | Reason |
|---|---|---|
| Gemini model for brochure | `gemini-2.0-flash` | Vision + JSON output, free tier 1500/day |
| File upload method | Gemini Files API (`genai.upload_file`) | Supports PDF natively, no manual PDF parsing |
| UAE data source | `data.gov.ae` (Dubai Open Data) | Free, official DLD data |
| India land verification | Bhuvan WMS (Phase 2) → GEE (Phase 3) | WMS is simpler, GEE adds satellite built-up layer |
| News source | NewsAPI.org | 100 req/day free, structured JSON |
| Brochure storage | Supabase + PostGIS | lat/lng → maps to MapLibre polygon |
| Currency handling | Auto-detected from brochure text | No manual switch needed |
