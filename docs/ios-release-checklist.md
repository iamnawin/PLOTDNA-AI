# iOS Release Checklist

## Purpose

This checklist is for the iOS release path for the current Capacitor-enabled repo state.
Release readiness still depends on honest product copy, backend verification, and native testing.

## Product truth before release

Before TestFlight or App Store submission, confirm public copy does not overclaim:

- supported cities are listed explicitly
- supported-zone behavior is described honestly
- approximate or cluster matches are labeled as such
- dynamic coordinate analysis is not presented as equal to curated locality support

## Pre-release prerequisites

Before packaging:

- confirm `frontend/capacitor.config.ts`
- confirm backend production URL
- confirm app identity decisions:
  - app name
  - bundle id
  - icon
  - splash

## iOS build path

```bash
cd frontend
npm install
npm run cap:add:ios
npm run cap:prepare
npm run cap:open:ios
```

## Native validation

Confirm:

- app launches on simulator
- app launches on physical iPhone
- network calls succeed against production backend
- map renders
- area search works
- coordinate analysis works
- supported-area detail pages load
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

## App Store Connect prep

- create App Store Connect app record
- choose bundle id
- archive signed build in Xcode
- upload to TestFlight
- add icon set
- add iPhone screenshots
- add iPad screenshots if iPad support is claimed
- add privacy policy URL
- complete app privacy questionnaire
- complete age rating
- complete app review notes for any gated flow

## Recommended release order

1. iOS simulator smoke test
2. Physical iPhone smoke test
3. TestFlight internal testing
4. External TestFlight testing
5. App Store submission
