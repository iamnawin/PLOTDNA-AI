# FlatDNA Project Search API

Batch 0E exposes deterministic project identity resolution for the supported
Hyderabad FlatDNA registry. It does not provide valuation, evidence, live RERA
lookup, or AI fallback.

## Feature gate

The backend setting `ENABLE_FLAT_DNA` is authoritative and defaults to `false`.
When disabled, both FlatDNA routes return HTTP 404:

- `GET /api/v1/flat/status`
- `GET /api/v1/flat/projects/search`

## Request

```http
GET /api/v1/flat/projects/search?q=My%20Home%20Nishada
```

`q` is required. Outer whitespace is trimmed. The remaining value must contain
usable identity characters and be between 1 and 160 characters. Missing, empty,
whitespace-only, overlong, and punctuation/emoji-only values return HTTP 422.

## Responses

All valid resolver outcomes return HTTP 200.

### Matched

```json
{
  "outcome": "MATCHED",
  "project": {
    "project_id": "421c032d-37c5-4e88-8c18-3b1185ac825f",
    "canonical_name": "My Home Nishada",
    "developer_name": "My Home Constructions",
    "city_slug": "hyderabad",
    "locality_slug": "kokapet"
  },
  "match_type": "CANONICAL"
}
```

`match_type` is `CANONICAL`, `ALIAS`, or `FUZZY`.

### Ambiguous

```json
{
  "outcome": "AMBIGUOUS",
  "candidates": [
    {
      "project_id": "067db042-3467-44c1-b31a-ace541f37f3c",
      "canonical_name": "Aparna Sarovar Zicon",
      "developer_name": "Aparna Constructions",
      "city_slug": "hyderabad",
      "locality_slug": "nallagandla"
    }
  ]
}
```

Candidates preserve resolver ranking and are capped at five. No candidate is
automatically selected.

### Not found

```json
{
  "outcome": "NOT_FOUND",
  "code": "PROJECT_NOT_FOUND"
}
```

`NOT_FOUND` is a successful domain result, not HTTP 404.

## HTTP status summary

- `200`: `MATCHED`, `AMBIGUOUS`, or `NOT_FOUND`
- `404`: FlatDNA is disabled
- `422`: invalid or missing query
- `503`: PostgreSQL project search is unavailable

The endpoint reads only supported Hyderabad registry identities from PostgreSQL.
It does not expose DRAFT/EXCLUDED research candidates, raw rows, resolver scores,
evidence records, SQL details, or credentials. There is no fixture fallback when
PostgreSQL is unavailable.
