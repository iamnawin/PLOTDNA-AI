# RERA Source Audit

Last checked: 2026-05-31

## Purpose

PlotDNA should verify official RERA project registration records without implying that RERA alone proves land title, local sanction, litigation safety, or investment safety. The product language should say "RERA project registration verified" or "official RERA record found", not "land approved by RERA".

## Official Baseline

The Government of India states that RERA authorities are required to publish and maintain a public web portal with relevant details of registered real estate projects. RERA is state/UT-operated, so integrations must be state adapters rather than one assumed national API.

Useful official references:

- Government of India PIB note on RERA implementation: `https://www.pib.gov.in/Pressreleaseshare.aspx?PRID=1910165`
- MoHUA RERA FAQ PDF: `https://rera.mohua.gov.in/new-img-rera/FAQs-on-RERA.pdf`

## Telangana RERA

Official portals:

- Public authority site: `https://rera.telangana.gov.in/Home/Index`
- Search registered projects and agents: `https://rerait.telangana.gov.in/SearchList/Search`

Observed access:

- The public authority site links to "Search Registered Projects and Agents".
- The search page includes fields for project name, promoter name, registration/certificate number, district, taluka, village, project type, proposed completion date, and survey number.
- The search page includes a captcha before search submission.
- The search page exposes supporting AJAX endpoints for location dropdowns, such as `/SearchList/GetDistrict`, `/SearchList/GetTaluka`, and `/SearchList/GetVillage`.
- Because captcha protects record search, backend automation must not depend on blind scraping as the primary path for public beta.

Product implication:

- For beta, Telangana should support manual RERA-number verification by opening/deep-linking the official portal and storing user-entered evidence only when available.
- If we later obtain a permitted data feed or exported official dataset, replace the current synthetic `backend/app/services/tsrera_scraper.py` seed data with verified records.
- The existing synthetic TSRERA project cache must not be presented as official RERA verification.

## Andhra Pradesh RERA

Official portals:

- Public authority site: `https://rera.ap.gov.in/RERA/Views/index.html`
- Project detail page pattern: `https://rera.ap.gov.in/RERA/Views/Project.aspx`
- Quarterly update PDF: `https://rera.ap.gov.in/RERA/DOCUMENTS/Notice/QU%20Status%20Report.pdf`

Observed access:

- The public authority page says developers must post project plan, layout, government approvals, land title status, contractors, and completion schedule with AP RERA.
- The project detail page exposes structured sections for promoter, project details, site address, plan approving authority, building plan number, approval date, survey number, ongoing status, and document download links.
- Search result snippets show encrypted project-detail links for individual project records.
- The quarterly update PDF includes ProjectID, project name, approval date, validity date, project type, units, total area, quarterly submission flags, closure applied, and status.

Product implication:

- AP can be a better second adapter after Telangana because official project detail pages and quarterly status PDFs expose richer record fields.
- The first API should normalize only fields we can prove from public official pages/PDFs and retain `raw_source_url`.

## Recommended Beta Scope

Phase 1 should be a verification endpoint and UI status model, not a full crawler:

- Input: state, RERA/project registration number, optional project name/promoter/address from brochure or user.
- Output: normalized verification status, official source URL, matched fields, mismatch warnings, confidence, `last_checked_at`, and explicit legal disclaimer.
- States: `telangana` first for UX fit, `andhra_pradesh` next for richer public records.
- Behavior when official automation is blocked by captcha: return `manual_verification_required` with official portal URL and explain the blocked data path.

Do not score a property as "safe" only because a RERA number exists. Score the narrower claim:

- registration number present
- official record found or manual verification needed
- project/promoter/name/address match quality
- registration/validity/completion status, if available
- quarterly-update compliance, if available
- phase/tower/survey-number match, if available

## Normalized Record Contract

Suggested backend model:

```json
{
  "state": "telangana",
  "registration_number": "P02400000000",
  "status": "verified | not_found | manual_verification_required | source_unavailable",
  "project_name": null,
  "promoter_name": null,
  "project_type": null,
  "district": null,
  "mandal_or_taluka": null,
  "village": null,
  "survey_number": null,
  "approval_authority": null,
  "approval_number": null,
  "approval_date": null,
  "validity_date": null,
  "proposed_completion_date": null,
  "quarterly_update_status": null,
  "official_source_url": "https://...",
  "matched_fields": [],
  "warnings": [],
  "confidence": 0.0,
  "last_checked_at": "2026-05-31T00:00:00Z",
  "disclaimer": "RERA registration verifies project disclosure on the official portal. It does not by itself verify title, litigation, all local approvals, or investment safety."
}
```

## Implementation Notes

- Add state-specific adapters behind a common interface.
- Do not add browser automation or captcha solving for beta.
- Cache successful official lookups with a short TTL and show `last_checked_at`.
- Keep raw official fields for auditability, even when normalized fields are sparse.
- Brochure analysis can extract RERA number/state and call verification opportunistically; if blocked, it should still return the extracted number with a manual verification link.

## Remaining Questions

- Whether TG RERA offers a formal export, API, or permissioned feed for registered projects.
- Whether AP RERA search can be queried lawfully without captcha, or whether only project detail links/PDFs should be consumed.
- Which states after Telangana/AP should be prioritized: Karnataka, Maharashtra, Tamil Nadu, Haryana, Uttar Pradesh, or user demand.
