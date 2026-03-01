# PlotDNA — Roadmap

## Phase 1: Hyderabad MVP (Weeks 1–4)
Goal: Working app with static data. Validate the concept.

### Features
- [ ] Leaflet map of Hyderabad with 20 micro-market zones
- [ ] Color-coded DNA scores (static JSON data)
- [ ] Area detail page: score breakdown, key stats
- [ ] Search bar (geocode by area name)
- [ ] Mobile responsive layout

### Micro-markets (Hyderabad)
| Zone | Category | Initial DNA Score |
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

## Phase 2: Dynamic Data Pipeline (Weeks 5–8)
- [ ] TSRERA scraper (new project filings)
- [ ] HMDA zone map integration
- [ ] WorldPop population layer
- [ ] Nominatim geocoding (search any address)
- [ ] Gemini AI chat ("Ask about this area")
- [ ] Supabase database integration

---

## Phase 3: Satellite Intelligence (Weeks 9–12)
- [ ] GEE account setup + service account
- [ ] Landsat built-up area growth computation
- [ ] Sentinel-2 NDVI change detection
- [ ] Satellite timelapse thumbnail generation
- [ ] Cache all GEE results (expensive to recompute)

---

## Phase 4: Pan-India Expansion (Weeks 13–16)
- [ ] Bangalore (20 micro-markets)
- [ ] Mumbai (20 micro-markets)
- [ ] Chennai (15 micro-markets)
- [ ] Pune (15 micro-markets)
- [ ] City comparison tool

---

## Phase 5: Monetization (Weeks 17–20)
- [ ] Free tier: 5 area lookups/day
- [ ] Pro tier ₹499/month: unlimited + PDF reports
- [ ] Developer API: ₹2999/month
- [ ] Builder/Agent B2B plan

---

## Scale Trigger Points

| Users | Action |
|---|---|
| 1k MAU | Add Mapbox GL JS (better UX) |
| 5k MAU | GEE Cloud commercial ($200/month) |
| 10k MAU | Upgrade to Railway.app backend |
| 50k MAU | Add Redis caching, CDN for map tiles |
