# PlotDNA Score Methodology

## Overview

The DNA Score is a single number (0-100) representing the investment potential
of a land parcel or micro-market. Higher means better long-term investment
potential.

## Score Interpretation

| Range | Color | Label |
|---|---|---|
| 0-40 | Red | High Risk / Saturated |
| 41-65 | Yellow | Moderate / Watch |
| 66-80 | Green | Good Growth Potential |
| 81-100 | Emerald | Emerging Goldzone |

## Signal Weights

```text
DNA Score = sum(weight x normalized_signal_score)

Signal                      Weight    Source
---------------------------------------------------------
Infrastructure Pipeline      25%      NHAI + Metro + Airport data
Population Growth Trend      20%      WorldPop + Census projections
Satellite Built-up Growth    20%      GEE Landsat / Sentinel-2
RERA New Project Activity    15%      State RERA scraper
Employment Hub Proximity     10%      OSM + IT park / SEZ data
Property Price Velocity       5%      99acres / MagicBricks trend
Smart City / Govt Scheme      5%      Smart Cities Mission
```

## Signal Computation

### Infrastructure Pipeline (0-100)

- Metro line within 5km: +30 points
- National highway within 2km: +20 points
- Airport within 30km: +15 points
- Railway station within 5km: +15 points
- Upcoming infra project announced: +20 points

### Population Growth Trend (0-100)

- Uses WorldPop 2015 -> 2020 -> 2025 data
- Normalized against city average
- >15% growth over 5 years = 80+

### Satellite Built-up Growth (0-100)

- Compares NDBI (Normalized Difference Built-up Index) at t-5 vs t-0
- Source: Landsat 8 via GEE
- >20% built-up area increase = 80+

### RERA Activity (0-100)

- Count of new project registrations in the last 24 months
- Weighted by project size (units)
- >50 new units/sq km = 80+

### Employment Hub Proximity (0-100)

- Distance to nearest IT park, SEZ, or industrial estate
- <3km = 90+, 3-8km = 70, 8-15km = 50, >15km = 20

### Price Velocity (0-100)

- YoY price appreciation vs city average
- >15% YoY = 85+

### Smart City / Govt Scheme (0-100)

- Binary flags: Smart City selected (100), AMRUT (60), None (0)
- Weighted by scheme funding received

## Current Production Note

Current production uses a hybrid model:

- curated stored market scores for Hyderabad, Bangalore, Mumbai, Chennai, Pune, Delhi NCR, Vijayawada, and Vizag
- live coordinate scoring from the backend analyzer

As the canonical city catalog grows, these inputs should move toward computed
and periodically refreshed market data rather than city-file-only curation.
