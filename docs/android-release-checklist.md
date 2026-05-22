# Android Release Checklist

## Purpose

This checklist is for the Android release path once the Capacitor/mobile baseline is synced into
this repo. In the current repo state, treat this as release-prep documentation rather than a
completed implementation.

## Product truth before release

Before Play Store submission, confirm public copy does not overclaim:

- supported cities are listed explicitly
- supported-zone behavior is described honestly
- approximate or cluster matches are labeled as such
- "works for any plot in India" is not used as an exact-intelligence claim

## Pre-implementation prerequisites

Before running Android packaging work in this repo:

- sync Capacitor config and scripts into `frontend/`
- add Android native project generation path
- confirm backend production URL
- confirm app identity decisions:
  - app name
  - package id
  - icon
  - splash

## After Capacitor is present

Expected commands:

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

1. Sync mobile baseline into this repo
2. Android emulator smoke test
3. Physical device smoke test
4. Internal testing track
5. Closed testing
6. Public release

