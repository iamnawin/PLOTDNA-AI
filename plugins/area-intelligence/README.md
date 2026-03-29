# Area Intelligence Plugin

Repo-local plugin for PlotDNA.

This plugin keeps one narrow concern in one place: locality parsing and fallback behavior when a user provides coordinates, a full map URL, a short map link, or a brochure-derived address.

## Included

- `skills/smart-locality-fallback/SKILL.md`

## What the skill covers

- local parsing of raw coordinates and full map URLs
- backend resolution for short map links
- reverse-geocoded locality labels for coordinate analysis
- nearest-supported-area fallback when live coverage is unavailable
- explicit uncovered-state behavior when PlotDNA should not fake precision

## Scope

This plugin is repo-local and intentionally minimal. It does not add hooks, MCP config, apps, or marketplace metadata.
