# TG-RERA Catalog Processing Fixtures

Files in this directory are sanitized `TEST` inputs for the deterministic FlatDNA catalog processor. They are not exports from TG-RERA, do not establish market coverage, and must never be published or imported into production.

Automated production acquisition remains controlled by `data/cities/hyderabad/flatdna/acquisition-policy.json`. While that policy is `UNAPPROVED`, only offline fixture processing is permitted.
