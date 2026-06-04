# Email OTP And User Metrics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add verified email OTP access and user-linked operational metrics for downloads, paid flows, and live activity.

**Architecture:** Keep the current anonymous JWT as the session anchor. Add email OTP request/verify endpoints that attach a verified email to that anonymous user, and add user event tracking plus admin metrics inside the existing entitlement SQLite store. The first release logs OTPs in development so email delivery can be connected later without changing frontend contracts.

**Tech Stack:** FastAPI, Pydantic, SQLite, React, TypeScript, existing frontend fetch helpers.

---

### File Structure

- Modify `backend/app/services/entitlements_store.py`: add verified-email columns, OTP table, user events table, metrics helpers, and compatibility migrations.
- Modify `backend/app/api/routes/auth.py`: add request/verify OTP endpoints.
- Modify `backend/app/api/routes/entitlements.py`: require verified email for access and expose metrics/event routes.
- Modify `backend/app/core/config.py` and `.env.example`: add OTP configuration.
- Add backend tests in `backend/tests/test_email_otp_metrics.py`.
- Modify `frontend/src/lib/entitlements.ts`: replace attach-email with request/verify OTP and add event tracking helper.
- Modify `frontend/src/components/ui/EmailGateModal.tsx`: two-step email/code modal.
- Modify `frontend/src/pages/AreaDetail.tsx`: send user-linked events for downloads and payment starts.
- Add frontend script `frontend/scripts/check-email-otp-contract.mjs` and package script.

### Task 1: Backend OTP Red-Green Cycle

- [ ] Write failing tests for OTP request and verify in `backend/tests/test_email_otp_metrics.py`.
- [ ] Run `python -m unittest backend.tests.test_email_otp_metrics -v` and confirm the new endpoints fail because they do not exist.
- [ ] Add OTP configuration and entitlement-store OTP helpers.
- [ ] Add `/api/v1/auth/email-otp/request` and `/api/v1/auth/email-otp/verify`.
- [ ] Run the focused backend test and confirm it passes.

### Task 2: Verified Email Entitlements

- [ ] Write failing tests showing unverified email does not unlock access and verified email does.
- [ ] Update user schema migration to add `email_verified_at`.
- [ ] Change entitlement reads to expose email only when verified.
- [ ] Keep legacy `set_email` available for admin test setup by marking emails verified by default.
- [ ] Run entitlement and OTP tests.

### Task 3: User Events And Metrics

- [ ] Write failing tests for user event recording, live-user count, download count, payment-start count, and verified-user count.
- [ ] Add `user_events` and `last_seen_at` storage helpers.
- [ ] Add authenticated `POST /api/v1/entitlements/events` and admin-gated `GET /api/v1/entitlements/admin/metrics`.
- [ ] Run focused backend tests.

### Task 4: Frontend OTP Contract

- [ ] Add a frontend contract script that checks `requestEmailOtp`, `verifyEmailOtp`, and `trackUserEvent` exports exist.
- [ ] Run it and confirm it fails before frontend changes.
- [ ] Update `frontend/src/lib/entitlements.ts`.
- [ ] Convert `EmailGateModal` to email step plus OTP step.
- [ ] Wire user-linked download/payment events from `AreaDetail`.
- [ ] Run the contract script.

### Task 5: Verification, Commit, PR

- [ ] Run backend focused tests.
- [ ] Run `npm run test:email-otp-contract`, `npm run lint`, and `npm run build`.
- [ ] Commit with Lore trailers.
- [ ] Push branch and open a draft PR.

### Self-Review

- Spec coverage: OTP, verified email, download/payment/live metrics, and admin metrics are covered.
- Placeholder scan: no placeholders remain in the task list.
- Scope: admin metrics API is included; a full visible admin dashboard is intentionally deferred to keep this PR reviewable.
