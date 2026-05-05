# PlotDNA Coverage Tiers

## Purpose

PlotDNA should not present every searched place as if it has the same level of intelligence.
This document defines the support tiers the product should use in copy, UI, and internal docs.

## Tier A: Full micro-market support

Use this when the locality is fully supported.

Requirements:

- polygon-defined locality
- stored market profile
- score and area-detail coverage
- curated highlights
- source links
- project coverage
- verdict support

What the UI can claim:

- supported locality
- curated area intelligence
- high-confidence area detail

## Tier B: Resolver or cluster support

Use this when the searched point resolves into a nearby locality or broader supported cluster,
but not an exact supported locality match.

Requirements:

- resolver match exists
- supported nearby locality or cluster exists
- some stored context is available

What the UI should claim:

- approximate supported-market context
- nearby or broad-region intelligence

What the UI should avoid claiming:

- exact locality truth
- exact point-native market intelligence

## Tier C: Dynamic coordinate-only support

Use this when the product can analyze a coordinate but does not have a curated supported-market
package behind it.

Requirements:

- backend or runtime analysis can inspect the point
- no full curated locality package exists

What the UI should claim:

- dynamic coordinate analysis
- partial confidence

What the UI should avoid claiming:

- full area support
- full locality narrative parity with Tier A markets

## Product rule

Tier A, Tier B, and Tier C are not equivalent.

Marketing copy, README language, landing-page messaging, and result labels should always reflect
the real tier of the returned result.

## Current repo implication

The repo today is primarily a Tier A and Tier B product for selected cities, with some Tier C
behavior through dynamic analysis. It is not yet a uniform all-India exact-location engine.

