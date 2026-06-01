# Hyderabad Backend Catalog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Hyderabad the first backend-owned market catalog slice and let AreaDetail load Hyderabad profiles from the backend with static frontend data as fallback.

**Architecture:** Add a canonical JSON catalog under `data/catalog/`, a focused backend catalog loader service, and real `/api/areas` endpoints. The frontend will add a resilient API helper and use it only on AreaDetail first, preserving the existing bundled data path if the backend is unavailable.

**Tech Stack:** FastAPI, Pydantic, Python stdlib JSON/pathlib, React 19, TypeScript, Vite, existing fetch API helpers.

---

## File Structure

- Create: `data/catalog/hyderabad.json`
  - Canonical backend-owned Hyderabad market records.
  - Shape matches the frontend `MicroMarket` contract plus city metadata.

- Create: `backend/app/services/market_catalog.py`
  - Loads catalog JSON from repository `data/catalog`.
  - Validates required fields through Pydantic models.
  - Provides `list_city_areas(city_slug)` and `get_city_area(city_slug, area_slug)`.

- Modify: `backend/app/api/routes/areas.py`
  - Replace stub responses with real catalog-backed endpoints.
  - Keep legacy route compatibility where practical.

- Create: `backend/tests/test_market_catalog.py`
  - Service and route tests for Hyderabad list/detail/not-found behavior.

- Modify: `frontend/src/lib/api.ts`
  - Add typed `fetchBackendArea(citySlug, areaSlug)` and `fetchBackendAreas(citySlug)`.
  - Return `null` on failures to preserve graceful fallback behavior.

- Modify: `frontend/src/pages/AreaDetail.tsx`
  - Start with static area for immediate render.
  - Fetch backend Hyderabad detail when the resolved city is Hyderabad.
  - Use backend record when available; keep static fallback for all failures and non-Hyderabad cities.

---

## Catalog Contract

`data/catalog/hyderabad.json` should use this top-level shape:

```json
{
  "city": {
    "slug": "hyderabad",
    "name": "Hyderabad",
    "state": "Telangana",
    "center": [17.385, 78.487],
    "zoom": 10
  },
  "areas": [
    {
      "slug": "adibatla",
      "name": "Adibatla",
      "score": 88,
      "category": "Emerging",
      "center": [17.265, 78.575],
      "polygon": [[17.296, 78.548], [17.304, 78.572]],
      "signals": {
        "infrastructure": 92,
        "population": 85,
        "satellite": 90,
        "rera": 82,
        "employment": 95,
        "priceVelocity": 88,
        "govtScheme": 95
      },
      "livability": {
        "connectivity": 55,
        "amenities": 40,
        "ecommerce": 70,
        "entertainment": 25,
        "greenSpaces": 65
      },
      "highlights": ["Fab City government IT park - 1 lakh+ jobs pipeline"],
      "priceRange": "Rs3,500-5,200/sqft",
      "yoy": 35,
      "activeProjects": [],
      "dataConfidence": "partial",
      "dataAsOf": "2026-05-01",
      "signalsAvailable": 7
    }
  ]
}
```

During implementation, migrate the full Hyderabad records from `frontend/src/data/hyderabad.ts` into `data/catalog/hyderabad.json`. Do not migrate other cities in this plan.

---

### Task 1: Backend Catalog Loader Tests

**Files:**
- Create: `backend/tests/test_market_catalog.py`
- Later implementation target: `backend/app/services/market_catalog.py`

- [ ] **Step 1: Write failing service tests**

Create `backend/tests/test_market_catalog.py`:

```python
import unittest

from app.services.market_catalog import get_city_area, list_city_areas


class MarketCatalogServiceTests(unittest.TestCase):
    def test_lists_hyderabad_areas_from_catalog(self):
        areas = list_city_areas("hyderabad")

        self.assertGreaterEqual(len(areas), 1)
        self.assertTrue(any(area.slug == "adibatla" for area in areas))

    def test_gets_hyderabad_area_detail(self):
        area = get_city_area("hyderabad", "adibatla")

        self.assertEqual(area.slug, "adibatla")
        self.assertEqual(area.name, "Adibatla")
        self.assertEqual(area.category, "Emerging")
        self.assertIsInstance(area.center, list)
        self.assertGreaterEqual(len(area.polygon), 4)
        self.assertEqual(area.signals.infrastructure, 92)

    def test_unknown_city_returns_empty_list(self):
        self.assertEqual(list_city_areas("unknown-city"), [])

    def test_unknown_area_returns_none(self):
        self.assertIsNone(get_city_area("hyderabad", "missing-area"))


if __name__ == "__main__":
    unittest.main()
```

- [ ] **Step 2: Run tests and confirm failure**

Run:

```powershell
cd backend
python -m unittest tests.test_market_catalog -v
```

Expected: fail with `ModuleNotFoundError` or import error because `market_catalog.py` does not exist.

---

### Task 2: Add Canonical Hyderabad Catalog JSON

**Files:**
- Create: `data/catalog/hyderabad.json`
- Read from: `frontend/src/data/hyderabad.ts`
- Read from: `data/cities/hyderabad/localities.json`
- Read from: `data/cities/hyderabad/city.json`

- [ ] **Step 1: Create the catalog directory and JSON file**

Create `data/catalog/hyderabad.json` with:

```json
{
  "city": {
    "slug": "hyderabad",
    "name": "Hyderabad",
    "state": "Telangana",
    "center": [17.385, 78.487],
    "zoom": 10
  },
  "areas": []
}
```

- [ ] **Step 2: Migrate Hyderabad records**

For every object in `frontend/src/data/hyderabad.ts` `hyderabadAreas`, copy the market fields into the matching `areas[]` entry:

```json
{
  "slug": "adibatla",
  "name": "Adibatla",
  "score": 88,
  "category": "Emerging",
  "center": [17.265, 78.575],
  "polygon": [[17.296, 78.548], [17.304, 78.572], [17.298, 78.605], [17.274, 78.614], [17.25, 78.604], [17.238, 78.576], [17.244, 78.546], [17.262, 78.538]],
  "signals": {
    "infrastructure": 92,
    "population": 85,
    "satellite": 90,
    "rera": 82,
    "employment": 95,
    "priceVelocity": 88,
    "govtScheme": 95
  },
  "livability": {
    "connectivity": 55,
    "amenities": 40,
    "ecommerce": 70,
    "entertainment": 25,
    "greenSpaces": 65
  },
  "highlights": [
    "Fab City government IT park - 1 lakh+ jobs pipeline",
    "Aerospace & defence manufacturing corridor",
    "ORR direct access at Node 13",
    "Lowest price-to-growth ratio in Hyderabad"
  ],
  "priceRange": "Rs3,500-5,200/sqft",
  "yoy": 35,
  "activeProjects": [
    {
      "id": "adb-001",
      "name": "Fab City Phase 2 - IT SEZ",
      "type": "it_park",
      "status": "under_construction",
      "developer": "TSIIC / Govt of Telangana",
      "investment": "Rs3,500 Cr",
      "expectedCompletion": "2026 Q3",
      "coordinates": [17.268, 78.582],
      "impact": "high",
      "description": "550-acre IT Special Economic Zone targeting 1 lakh+ jobs pipeline"
    }
  ],
  "dataConfidence": "partial",
  "dataAsOf": "2026-05-01",
  "signalsAvailable": 7
}
```

Use the existing locality helper data from `data/cities/hyderabad/localities.json` for `center` and `polygon`, not hand-created geometry.

- [ ] **Step 3: Validate JSON parses**

Run:

```powershell
python -m json.tool data/catalog/hyderabad.json > $null
```

Expected: exit code `0`.

---

### Task 3: Implement Backend Catalog Loader

**Files:**
- Create: `backend/app/services/market_catalog.py`
- Test: `backend/tests/test_market_catalog.py`

- [ ] **Step 1: Add Pydantic models and loader**

Create `backend/app/services/market_catalog.py`:

```python
from functools import lru_cache
import json
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field


Category = Literal["Established", "High Growth", "Emerging", "Industrial"]
DataConfidence = Literal["verified", "partial", "estimated", "uncovered"]
ProjectType = Literal[
    "metro",
    "highway",
    "flyover",
    "it_park",
    "residential",
    "commercial",
    "hospital",
    "airport",
    "industrial",
    "infrastructure",
]
ProjectStatus = Literal["planning", "approved", "under_construction", "near_completion"]
Impact = Literal["high", "medium", "low"]


class Signals(BaseModel):
    infrastructure: int | None
    population: int | None
    satellite: int | None
    rera: int | None
    employment: int | None
    priceVelocity: int | None
    govtScheme: int | None


class Livability(BaseModel):
    connectivity: int
    amenities: int
    ecommerce: int
    entertainment: int
    greenSpaces: int


class ActiveProject(BaseModel):
    id: str
    name: str
    type: ProjectType
    status: ProjectStatus
    developer: str | None = None
    investment: str | None = None
    expectedCompletion: str | None = None
    coordinates: list[float] = Field(min_length=2, max_length=2)
    impact: Impact
    description: str | None = None


class CityCatalogMeta(BaseModel):
    slug: str
    name: str
    state: str
    center: list[float] = Field(min_length=2, max_length=2)
    zoom: int


class MarketArea(BaseModel):
    slug: str
    name: str
    score: int
    category: Category
    center: list[float] = Field(min_length=2, max_length=2)
    polygon: list[list[float]]
    signals: Signals
    livability: Livability | None = None
    highlights: list[str]
    priceRange: str
    yoy: int
    activeProjects: list[ActiveProject] = Field(default_factory=list)
    dataConfidence: DataConfidence | None = None
    dataAsOf: str | None = None
    signalsAvailable: int | None = None


class CityCatalog(BaseModel):
    city: CityCatalogMeta
    areas: list[MarketArea]


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _catalog_path(city_slug: str) -> Path:
    safe_slug = city_slug.strip().lower()
    return _repo_root() / "data" / "catalog" / f"{safe_slug}.json"


@lru_cache(maxsize=16)
def load_city_catalog(city_slug: str) -> CityCatalog | None:
    path = _catalog_path(city_slug)
    if not path.exists():
        return None
    with path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)
    return CityCatalog.model_validate(payload)


def list_city_areas(city_slug: str) -> list[MarketArea]:
    catalog = load_city_catalog(city_slug)
    if catalog is None:
        return []
    return catalog.areas


def get_city_area(city_slug: str, area_slug: str) -> MarketArea | None:
    normalized = area_slug.strip().lower()
    for area in list_city_areas(city_slug):
        if area.slug == normalized:
            return area
    return None
```

- [ ] **Step 2: Run service tests**

Run:

```powershell
cd backend
python -m unittest tests.test_market_catalog -v
```

Expected: pass once `data/catalog/hyderabad.json` contains `adibatla`.

- [ ] **Step 3: Commit backend loader and catalog**

Use a Lore-style commit message:

```text
Establish Hyderabad as the first backend-owned market catalog

The frontend still owns the public UI path, but Hyderabad now has a canonical JSON catalog that backend routes can serve and tests can validate.

Constraint: Keep frontend static data as fallback during migration
Rejected: Import frontend TypeScript into Python | brittle build/runtime coupling
Confidence: high
Scope-risk: narrow
Tested: python -m unittest tests.test_market_catalog -v
```

---

### Task 4: Replace Area Route Stubs

**Files:**
- Modify: `backend/app/api/routes/areas.py`
- Modify: `backend/tests/test_market_catalog.py`

- [ ] **Step 1: Add route tests**

Append to `backend/tests/test_market_catalog.py`:

```python
from fastapi.testclient import TestClient

from app.main import app


class MarketCatalogRouteTests(unittest.TestCase):
    def test_area_list_route_returns_hyderabad_areas(self):
        client = TestClient(app)

        response = client.get("/api/areas/?city=hyderabad")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["city"]["slug"], "hyderabad")
        self.assertTrue(any(area["slug"] == "adibatla" for area in body["areas"]))

    def test_area_detail_route_returns_hyderabad_area(self):
        client = TestClient(app)

        response = client.get("/api/areas/hyderabad/adibatla")

        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["slug"], "adibatla")
        self.assertEqual(body["name"], "Adibatla")

    def test_area_detail_route_404s_for_missing_area(self):
        client = TestClient(app)

        response = client.get("/api/areas/hyderabad/missing-area")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["detail"], "Area not found")
```

- [ ] **Step 2: Run tests and confirm route failures**

Run:

```powershell
cd backend
python -m unittest tests.test_market_catalog -v
```

Expected: route tests fail because `/api/areas/hyderabad/adibatla` is not implemented.

- [ ] **Step 3: Implement catalog-backed routes**

Replace `backend/app/api/routes/areas.py` with:

```python
from fastapi import APIRouter, HTTPException

from app.services.market_catalog import get_city_area, list_city_areas, load_city_catalog

router = APIRouter()


@router.get("/")
def list_areas(city: str = "hyderabad"):
    """List all backend-owned micro-markets for a supported city."""
    catalog = load_city_catalog(city)
    if catalog is None:
        return {"city": {"slug": city, "name": city, "state": "", "center": [], "zoom": 10}, "areas": []}
    return {"city": catalog.city.model_dump(), "areas": [area.model_dump() for area in catalog.areas]}


@router.get("/{city_slug}/{area_slug}")
def get_area_for_city(city_slug: str, area_slug: str):
    """Get details for a city-scoped micro-market."""
    area = get_city_area(city_slug, area_slug)
    if area is None:
        raise HTTPException(status_code=404, detail="Area not found")
    return area.model_dump()


@router.get("/{area_slug}")
def get_area(area_slug: str, city: str = "hyderabad"):
    """Legacy detail route. Defaults to Hyderabad for backward compatibility."""
    area = get_city_area(city, area_slug)
    if area is None:
        raise HTTPException(status_code=404, detail="Area not found")
    return area.model_dump()
```

- [ ] **Step 4: Run route tests**

Run:

```powershell
cd backend
python -m unittest tests.test_market_catalog -v
```

Expected: all tests pass.

- [ ] **Step 5: Commit route implementation**

Use:

```text
Serve Hyderabad areas through backend catalog APIs

The area route now exposes list and city-scoped detail endpoints while preserving a legacy Hyderabad detail path.

Constraint: Existing frontend routes are slug-only
Confidence: high
Scope-risk: narrow
Tested: python -m unittest tests.test_market_catalog -v
```

---

### Task 5: Add Frontend API Helpers

**Files:**
- Modify: `frontend/src/lib/api.ts`

- [ ] **Step 1: Add imports and types**

At the top of `frontend/src/lib/api.ts`, add:

```ts
import type { CityMeta, MicroMarket } from '@/types'
```

If the file already has type imports, merge this import cleanly.

Add below existing API interfaces:

```ts
export interface BackendAreaList {
  city: CityMeta & { state?: string }
  areas: MicroMarket[]
}
```

- [ ] **Step 2: Add resilient area fetchers**

Add near the other fetch helpers in `frontend/src/lib/api.ts`:

```ts
export async function fetchBackendAreas(citySlug = 'hyderabad'): Promise<BackendAreaList | null> {
  try {
    const res = await fetch(`${BASE_URL}/api/areas/?city=${encodeURIComponent(citySlug)}`, {
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) return null
    return (await res.json()) as BackendAreaList
  } catch {
    return null
  }
}

export async function fetchBackendArea(citySlug: string, areaSlug: string): Promise<MicroMarket | null> {
  try {
    const res = await fetch(
      `${BASE_URL}/api/areas/${encodeURIComponent(citySlug)}/${encodeURIComponent(areaSlug)}`,
      { signal: AbortSignal.timeout(10_000) },
    )
    if (!res.ok) return null
    return (await res.json()) as MicroMarket
  } catch {
    return null
  }
}
```

- [ ] **Step 3: Run frontend lint**

Run:

```powershell
cd frontend
npm run lint
```

Expected: no ESLint errors.

---

### Task 6: Wire AreaDetail to Backend-First Hyderabad Detail

**Files:**
- Modify: `frontend/src/pages/AreaDetail.tsx`

- [ ] **Step 1: Import backend area helper**

Modify the imports:

```ts
import { fetchBackendArea } from '@/lib/api'
```

- [ ] **Step 2: Split static area from displayed area**

Replace:

```ts
const area = getAllAreas().find((a) => a.slug === slug)
```

with:

```ts
const staticArea = getAllAreas().find((a) => a.slug === slug)
const [backendArea, setBackendArea] = useState<MicroMarket | null>(null)
const area = backendArea ?? staticArea
```

- [ ] **Step 3: Resolve static city before fetching**

Immediately after `fallbackContext`, add:

```ts
const staticCityEntry = staticArea ? getCityForArea(staticArea.slug) : undefined
const staticCitySlug = staticCityEntry
  ? Object.entries(CITIES).find(([, v]) => v === staticCityEntry)?.[0] ?? 'hyderabad'
  : 'hyderabad'
```

- [ ] **Step 4: Add backend fetch effect**

Add this effect before the lock/paywall effects:

```ts
useEffect(() => {
  let cancelled = false

  async function loadBackendArea() {
    if (!slug || staticCitySlug !== 'hyderabad') {
      setBackendArea(null)
      return
    }

    const nextArea = await fetchBackendArea(staticCitySlug, slug)
    if (!cancelled) {
      setBackendArea(nextArea)
    }
  }

  void loadBackendArea()

  return () => {
    cancelled = true
  }
}, [slug, staticCitySlug])
```

- [ ] **Step 5: Keep the existing not-found behavior**

Leave this existing block functionally equivalent:

```ts
if (!area) {
  return (
    <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center">
      ...
    </div>
  )
}
```

If the file computes `cityEntry` later from `area`, keep it using the final `area` so backend data drives the rendered page once loaded.

- [ ] **Step 6: Run frontend verification**

Run:

```powershell
cd frontend
npm run lint
npm run build
```

Expected: both pass.

- [ ] **Step 7: Commit frontend integration**

Use:

```text
Load Hyderabad area detail from backend catalog first

AreaDetail now prefers backend-owned Hyderabad records but keeps existing bundled data as a resilient fallback during catalog migration.

Constraint: Backend may be unavailable in local/static frontend demos
Rejected: Remove frontend static data immediately | would make beta demo brittle
Confidence: high
Scope-risk: moderate
Tested: npm run lint; npm run build
```

---

### Task 7: End-to-End Smoke Verification

**Files:**
- No code changes unless a previous task fails.

- [ ] **Step 1: Run backend tests**

Run:

```powershell
cd backend
python -m unittest tests.test_market_catalog tests.test_rera_verification -v
```

Expected: all tests pass.

- [ ] **Step 2: Run frontend build**

Run:

```powershell
cd frontend
npm run lint
npm run build
```

Expected: lint and build pass.

- [ ] **Step 3: Smoke backend area API**

Run:

```powershell
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

In another terminal:

```powershell
Invoke-RestMethod "http://127.0.0.1:8000/api/areas/hyderabad/adibatla" | ConvertTo-Json -Depth 8
```

Expected: JSON contains `"slug": "adibatla"`, `"score": 88`, and `"signals"`.

- [ ] **Step 4: Smoke frontend manually**

Run:

```powershell
cd frontend
npm run dev
```

Open:

```text
http://localhost:5173/area/adibatla
```

Expected:
- Page renders without errors.
- Adibatla detail still shows score, highlights, projects, verdict/news/market-pulse sections.
- Turning backend off and refreshing still renders from static fallback.

- [ ] **Step 5: Final status check**

Run:

```powershell
git status --short --branch
git log -3 --oneline
```

Expected:
- Working tree clean except intentionally untracked local tooling files, if still present.
- Recent commits show the catalog, route, and frontend integration commits.

---

## Self-Review

- Spec coverage: The plan covers backend catalog storage, backend loader, API routes, frontend API helper, AreaDetail backend-first consumption, fallback behavior, and verification.
- Placeholder scan: No `TBD`, `TODO`, or unspecified tests remain.
- Type consistency: Backend `MarketArea` mirrors frontend `MicroMarket`; frontend helpers return `MicroMarket | null`; AreaDetail keeps using existing render logic after selecting `backendArea ?? staticArea`.
- Scope control: Only Hyderabad AreaDetail moves to backend-first behavior. City search, map resolver, other city datasets, and canonical source citations remain out of scope for this first implementation.
