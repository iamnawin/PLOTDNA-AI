# RERA Verification Design

Date: 2026-05-31

## Goal

Add a public-beta-safe RERA verification feature that helps users check whether a real estate project registration record exists on the official state RERA source. The feature must not imply that RERA registration proves land title, all approvals, litigation clearance, or investment safety.

## Recommendation

Start with a conservative state-adapter service and expose a narrow verification status. Telangana should be the first UX target because Hyderabad is PlotDNA's flagship market, but the Telangana portal search uses captcha, so the first implementation should gracefully return `manual_verification_required` when official machine lookup is blocked. Andhra Pradesh should be the second adapter because public project detail pages and quarterly status PDFs expose richer fields.

## Public Copy Rules

Use:

- "RERA project registration verified"
- "Official RERA record found"
- "Manual verification required on the official RERA portal"

Avoid:

- "Land approved by RERA"
- "Legally safe"
- "Title verified"
- "All approvals cleared"

Required disclaimer:

> RERA registration verifies project disclosure on the official state portal. It does not by itself verify land title, litigation, every local approval, or investment safety.

## Backend Design

Create a small verification boundary:

- `ReraVerificationRequest`: state, registration number, optional project name/promoter/address.
- `ReraVerificationResult`: state, registration number, status, normalized official fields, matched fields, warnings, confidence, source URL, last checked time, disclaimer.
- `ReraAdapter`: common interface with `verify_registration(request)`.
- `TelanganaReraAdapter`: reads official portal constraints, generates manual verification URL, and later can call a permitted feed/export.
- `AndhraPradeshReraAdapter`: first consumes known official page/PDF sources where project IDs can be matched reliably.

Route:

- `POST /api/v1/rera/verify`

The route should be import-safe, timeout-bound, and never fail app startup if a portal is unavailable.

## Brochure Flow

Brochure parsing already extracts `rera_number` and `rera_state`. After the verification route exists, the brochure endpoint can call the service opportunistically:

- If official record is verified, add verification details.
- If automation is blocked, keep the extracted RERA number and add manual verification instructions.
- Do not change the existing response shape in a breaking way; add a nullable `rera_verification` object.

## Data Flow

1. User uploads brochure or enters a RERA number.
2. Backend normalizes state and registration number.
3. State adapter attempts official lookup within a short timeout.
4. Adapter returns one of:
   - `verified`
   - `not_found`
   - `manual_verification_required`
   - `source_unavailable`
5. UI shows the status, official link, matched fields, mismatch warnings, and disclaimer.

## Error Handling

- Captcha or blocked search: `manual_verification_required`.
- Portal timeout/down: `source_unavailable`.
- Invalid state: validation error with supported states.
- Invalid registration number format: validation warning, not a hard failure unless empty.
- Conflicting project/promoter/address: `verified` may still be true, but confidence drops and warnings are shown.

## Testing

Backend:

- Unit-test normalized request/result models.
- Unit-test Telangana adapter returns manual verification when portal search requires captcha.
- Unit-test AP parser on saved, sanitized fixture snippets/PDF text.
- Smoke-test route import and `/api/v1/rera/verify`.

Frontend:

- Verify brochure page renders existing output when `rera_verification` is absent.
- Verify status chips for verified, manual verification required, source unavailable, and mismatch warnings.

## Out Of Scope

- Captcha solving.
- Bulk scraping all state portals.
- Legal title verification.
- Court/litigation checks.
- Replacing all current RERA scoring in one pass.
