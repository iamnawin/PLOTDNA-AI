# Android Release Checklist

## Purpose

This checklist is for the Android release path for the current Capacitor-enabled repo state.
Release readiness still depends on honest product copy, backend verification, and native testing.

## Product truth before release

Before Play Store submission, confirm public copy does not overclaim:

- supported cities are listed explicitly
- supported-zone behavior is described honestly
- approximate or cluster matches are labeled as such
- "works for any plot in India" is not used as an exact-intelligence claim

## Pre-release prerequisites

Before packaging:

- confirm `frontend/capacitor.config.ts`
- confirm backend production URL
- confirm app identity decisions:
  - app name
  - package id
  - icon
  - splash

## Android build path

```bash
cd frontend
npm install
npm run cap:add:android
npm run cap:prepare
npm run cap:open:android
```

## Native validation

Confirm:

- app launches on emulator
- app launches on physical device
- internet permission exists
- map renders
- search works
- supported-area detail pages load
- coordinate analysis works against production backend
- unsupported areas are labeled honestly

## Release validation

Test:

- area search
- map-link search
- lat/lng input
- fallback disclosure messaging
- verdict flow
- PDF/report flow if exposed
- auth or quota flow if enabled

## Play Console prep

- create Play Console app
- generate signed `.aab`
- add icon
- add feature graphic
- add phone screenshots
- add tablet screenshots if tablet support is claimed
- add privacy policy URL
- complete data safety form
- complete content rating
- complete app access section for gated flows if needed

## Recommended release order

1. Android emulator smoke test
2. Physical device smoke test
3. Internal testing track
4. Closed testing
5. Public release

