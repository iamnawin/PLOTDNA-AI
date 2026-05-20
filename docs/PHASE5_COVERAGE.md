# Phase 5 Coverage Ledger

Phase 5 is implemented as a coverage ladder, not as fabricated all-India locality scoring.

## Tier 1/2 Baseline Metros

These markets have static micro-market datasets plus resolver-grade locality, alias, and cluster files:

| Market | City slug | Coverage status |
| --- | --- | --- |
| NCR: Gurugram, Noida, Greater Noida, Faridabad, Ghaziabad pockets | `delhi` | Baseline micro-market support |
| Bengaluru core and growth corridors | `bangalore` | Baseline micro-market support |
| Pune PMC/PCMC corridors | `pune` | Baseline micro-market support |
| Mumbai MMR: Mumbai, Thane, Navi Mumbai, Kalyan-Dombivli pockets | `mumbai` | Baseline micro-market support |
| Chennai CMDA/OMR/GST corridors | `chennai` | Baseline micro-market support |

Baseline support means PlotDNA can resolve exact, nearby, and city-cluster matches for the curated localities already present in `frontend/src/data/` and `data/cities/`.

## Regional Fallback

All 28 Indian states and 8 union territories are represented in `data/india/regions.json` for broad regional fallback.

Tier-2 and tier-3 city catchments remain in `data/india/regional-markets.json`. Those catchments are more specific than state/UT fallback and are resolved first when a coordinate lands near a known regional market.

Regional fallback is intentionally labeled as regional-only coverage. It does not create a locality score, substitute a nearby micro-market, or present state-level coverage as verified locality intelligence.

## Product Rules

- Exact or nearby metro matches can show stored market context.
- City cluster matches can show broad metro context without substituting a locality.
- State/UT regional matches can show only regional coverage status.
- Uncovered remains available for coordinates outside all supported regional polygons.

## Remaining Data Work

The roadmap target of 1,000+ verified localities still requires curated polygons, verified signals, source links, and market profiles. Until those datasets exist, Phase 5 expansion should remain honest regional coverage rather than generated scores.
