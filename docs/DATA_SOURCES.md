# PlotDNA - Data Sources

## Free APIs Used in MVP

| Source | Type | Endpoint / Access | Limit |
|---|---|---|---|
| OpenStreetMap | Map tiles | `tile.openstreetmap.org` | Unlimited |
| Nominatim | Geocoding | `nominatim.openstreetmap.org` | 1 req/sec |
| WorldPop | Population | `worldpop.org` REST API | Free download |
| Gemini 2.0 Flash | AI | `generativelanguage.googleapis.com` | 1500/day free |
| GEE (free account) | Satellite | Python SDK | Non-commercial free |
| Overpass API | OSM data | `overpass-api.de` | Free |
| Supabase | Database | Supabase project | 500MB free |

## India Government Data Sources

| Source | Data | URL | Access |
|---|---|---|---|
| TSRERA | Telangana RERA projects | `rera.telangana.gov.in` | Scraping |
| HMDA | Hyderabad zone maps | `hmda.gov.in` | PDF + scraping |
| Karnataka Stamps & Registration | Registration department surface | `revenue.karnataka.gov.in` | Official portal |
| Kaveri Online | Encumbrance and registration workflows | `kaverionline.karnataka.gov.in` | Official portal |
| BMRCL | Bangalore metro expansion and network context | `english.bmrc.co.in` | Official portal |
| Karnataka OGD | State housing and public datasets | `karnataka.data.gov.in` | Dataset portal |
| NHAI | Highway projects | `nhai.gov.in` | Scraping |
| Census India | Population 2011 | `censusindia.gov.in` | Free download |
| Smart Cities | Mission projects | `smartcities.gov.in` | API or scraping |

## Satellite Data

| Dataset | Coverage | Resolution | Access |
|---|---|---|---|
| Landsat 8/9 | 1972-present | 30m | GEE free |
| Sentinel-2 | 2015-present | 10m | GEE free / Copernicus |
| MODIS | 2000-present | 250m | GEE free |

## Property Price Data

- 99acres.com - scrape listing prices per sq ft by area
- MagicBricks.com - locality trend data
- RBI HPI context - city-level benchmark, not locality-level market pricing
- Official Karnataka sources do not provide a single locality-level market trend API, so price velocity still needs listing ingestion or a paid market-data source
- Cache scraped data for 7 days and respect rate limits

## When to Upgrade (Paid APIs)

| Trigger | Upgrade To | Cost |
|---|---|---|
| >10k map loads/month | Mapbox GL JS | ~$50/month |
| Commercial GEE use | GEE Cloud | ~$200/month |
| Better geocoding | LocationIQ Pro | ~$30/month |
| More AI requests | Gemini paid tier | Pay-per-use |
