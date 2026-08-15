# APRERA staging data

`quarterly-status-residential-sample.json` is a deterministic ten-record extraction from the official Andhra Pradesh RERA quarterly-update status PDF. It proves the public report can be converted without manual copy-paste.

It is staging evidence, not a supported FlatDNA registry:

- The report supplies project ID, name, dates, type, reported units, area, quarterly filing flags, closure-applied flag, and authority status.
- It does not supply enough developer, locality, coordinate, phase, approval-document, booked-unit, or current-availability evidence for FlatDNA release.
- A quarterly `Y` means a filing was submitted. It does not mean construction is complete or the disclosed facts were independently verified by FlatDNA.
- None of these records may enter search until canonical identity, location, promoter, and evidence review pass the normal FlatDNA registry checks.

Reproduce the sample after downloading the official PDF:

```powershell
uv run --with pdfplumber python scripts/extract_aprera_quarterly_status.py `
  --input <downloaded-pdf> `
  --output data/staging/aprera/quarterly-status-residential-sample.json `
  --source-url "https://rera.ap.gov.in/RERA/DOCUMENTS/Notice/QU%20Status%20Report.pdf" `
  --retrieved-at <ISO-8601-timestamp-with-timezone> `
  --project-type Residential `
  --limit 10
```
