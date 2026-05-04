# Android Release Checklist

## Identity

- App name: `PlotDNA`
- Package id: `com.plotdna.app`
- Primary icon source: `frontend/public/icon.svg`
- Splash source: `frontend/public/splash.svg`
- Theme color: `#00e676`
- Background color: `#050508`

## Before creating the native project

- Confirm `frontend/capacitor.config.ts`
- Confirm `frontend/src/lib/runtime.ts` points native builds to Render
- Run:

```bash
cd frontend
npm install
npm run cap:add:android
npm run cap:prepare
```

## After `android/` exists

- Open Android Studio with:

```bash
cd frontend
npm run cap:open:android
```

- Set app icon from `frontend/public/icon.svg`
- Set splash screen from `frontend/public/splash.svg`
- Confirm app label is `PlotDNA`
- Confirm package id is `com.plotdna.app`
- Confirm internet permission exists
- Confirm launch on:
  - small Android phone
  - large Android phone
  - tablet

## Environment

- Backend URL must resolve to:
  - `https://plotdna-api.onrender.com`
- Test:
  - search by area
  - lat/lng analysis
  - full analysis CTA
  - 3 free searches -> email gate

## Play Store prep

- Generate signed `.aab`
- Create Play Console app
- Add:
  - app icon
  - feature graphic
  - screenshots
  - privacy policy URL
  - short description
  - full description
- Complete:
  - Data safety form
  - Content rating
  - App access section if gated areas exist

## Recommended release order

1. Android identity polish
2. Physical device smoke test
3. Play Store internal testing
4. What-if scenario MVP
5. Subscription / in-app purchase flow
