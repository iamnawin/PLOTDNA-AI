# PlotDNA App Feature Map

This file maps the current app behavior to the main files and components that implement it.

## 1. Landing and Home Experience

- `frontend/src/pages/Landing.tsx`
  - Public landing page.
  - Shows the core value proposition, buyer pain points, and entry points into the map flow.
  - Displays live-now social proof with a launch floor of 143 plus live metric updates.

- `frontend/src/pages/Home.tsx`
  - Main map workspace.
  - Handles search, map link resolution, coordinate analysis, city switching, and map mode toggles.
  - Hosts the brochure uploader and the floating assistant dock.

- `frontend/src/components/view/SpatialView.tsx`
  - Renders the 2D/3D geographic view.
  - Supports city markers, map/globe presentation, and selected coordinate context.

- `frontend/src/components/view/ViewModeToggle.tsx`
  - Switches between map and globe presentation.

## 2. Area Detail Experience

- `frontend/src/pages/AreaDetail.tsx`
  - Detailed locality page for a supported micro-market.
  - Shows score, growth story, active projects, news, market pulse, AVM, sources, and alternatives.
  - Renders the sticky feature rail for Verdict, Sources, Growth, Risk, Compare, and PDF sections.
  - Uses Motion for active feature tab transitions, rainbow-border CTA entry, and report scroll progress.
  - Routes AreaDetail compare CTAs back to the map workspace with `getMapReturnPath()` instead of sending users to the standalone compare route.
  - Hides the upper PDF/payment card when the timed preview lock is visible to avoid duplicate Rs 99 cards.
  - Shows a welcome-back card after paid access recovery instead of auto-downloading the PDF.
  - Hosts the floating assistant dock with area-level context.

- `frontend/src/index.css`
  - Owns the shared visual tokens: Manrope/Inter typography, neutral ink background, subtle grid texture, elevated glass panels, and emerald/cyan/amber support accents.

- `frontend/src/components/ui/VerdictCard.tsx`
  - AI verdict summary card.
  - Fetches `GET /api/verdict/{city}/{area}` and renders buy/hold/wait/avoid guidance.

- `frontend/src/components/ui/SatelliteCompare.tsx`
  - Satellite growth comparison section.
  - Shows the before/latest visual timeline.

- `frontend/src/components/score/PlotAnalysisCard.tsx`
  - Coordinate-level analysis drawer.
  - Resolves live OSM scoring and falls back to supported locality context.

- `frontend/src/pages/CompareAreas.tsx`
  - Compares three Hyderabad micro-markets.
  - Provides Back and top-right close controls that return to the originating full DNA report, falling back to the first compared area.

## 3. Paid Access, Preview Lock, and Reports

- `frontend/src/pages/AreaDetail.tsx`
  - Owns the Rs 99 lifetime access CTA, timed preview lock, compact locked-feature carousel, and PDF download entry point.
  - Keeps the feature navigator above the main area card so users can understand the report workflow before scanning every section.
  - Uses `useScroll({ container })` and `useTransform()` from Motion to drive the progress line below the top feature tabs from the report scroll container.

- `frontend/src/components/ui/rainbow-borders-button.tsx`
  - Shared Motion CTA used by both Rs 99 lifetime actions.
  - Adds the animated rainbow border and glow without the older white reflection sweep or duplicate button styling inside report sections.

- `frontend/src/components/ui/CustomReportLeadModal.tsx`
  - Collects name, email, and phone first so payment recovery feels like account matching.
  - Keeps Razorpay Payment ID as the fallback field for users who have the success screen open.

- `backend/app/services/custom_report_leads.py`
  - Stores and recovers paid lead state.
  - Supports direct Razorpay Payment ID recovery when the payment exists but the PlotDNA lead row was not created earlier.

- `backend/app/api/routes/leads.py`
  - Exposes the custom report lead and payment recovery route contracts used by the frontend.
  - Verifies signed Razorpay webhooks at `POST /api/leads/razorpay/webhook` before marking a lead paid.

- `frontend/scripts/check-area-feature-navigation.mjs`
  - Guards the top feature rail, section anchors, Motion transitions, preview carousel, and scroll-driven progress line.

- `frontend/scripts/check-area-dna-paywall.mjs`
  - Guards the timed preview lock and verifies duplicate payment-card behavior does not return.

- `frontend/scripts/check-report-pricing-copy.mjs`
  - Guards Rs 99 lifetime access and report pricing copy.

- `frontend/scripts/check-payment-recognition.mjs`
  - Guards the Razorpay-return access re-check and keeps Payment ID entry as a hidden fallback.

- `frontend/scripts/check-visual-design-tokens.mjs`
  - Guards the shared UI styling decisions so future visual edits keep the refined typography, background, surfaces, accents, and reflection-free rainbow CTA.

## 4. Brochure Analysis

- `frontend/src/pages/BrochurePage.tsx`
  - Full-page brochure upload workflow.
  - Extracts property details, RERA number, hidden clauses, pricing, and coordinates.

- `frontend/src/components/ui/BrochureUploadCard.tsx`
  - Inline brochure upload card used inside the map flow.

- `frontend/src/lib/api.ts`
  - Contains `analyzeBrochure()` and the shared backend base URL.

## 5. Assistant / Chat

- `frontend/src/components/ui/AssistantDock.tsx`
  - Floating chat entry point used on the map and area pages.
  - Opens as a compact bottom sheet on mobile and a right-side dock on larger screens.
  - Sends page context, city/area context, and recent chat history to the backend.

- `frontend/src/lib/assistant.ts`
  - Shared client helper for `POST /api/ai/chat`.

- `backend/app/api/routes/ai.py`
  - Chat API route.
  - Builds the prompt from user question, page context, and history.
  - Returns structured JSON with answer, sources, and follow-ups.

- `backend/app/services/ai_provider.py`
  - Shared text model wrapper.
  - Tries Gemini first, then NVIDIA, then a deterministic fallback.

## 6. Scoring and Market Intelligence

- `frontend/src/components/score/ScoreCard.tsx`
  - DNA score and growth summary presentation.

- `frontend/src/components/score/PlotAnalysisCard.tsx`
  - Live coordinate scoring and fallback locality context.

- `frontend/src/lib/plotAnalysis.ts`
  - Coordinate parsing, locality fallback resolution, growth timeline, and outlook helpers.

- `frontend/src/lib/recommendations.ts`
  - Recommendation goal ranking and nearby area suggestions.

- `frontend/src/lib/areaSources.ts`
  - Area-level source mapping and source labels.

- `frontend/src/lib/utils.ts`
  - Shared score labels, colors, and signal helpers.

## 7. Backend Routes

- `backend/app/main.py`
  - FastAPI app setup and router registration.

- `backend/app/api/routes/score.py`
  - OSM-based scoring endpoint.

- `backend/app/api/routes/verdict.py`
  - AI verdict endpoint for supported areas.

- `backend/app/api/routes/utils.py`
  - Brochure and map-link utilities.

- `backend/app/api/routes/news.py`
  - Area and city news endpoints.

- `backend/app/api/routes/market_pulse.py`
  - Market pulse summary API.

- `backend/app/api/routes/avm.py`
  - Automated valuation model API.

- `backend/app/api/routes/leads.py`
  - Custom buyer brief lead capture and paid access recovery routes.

## 8. Key Environment Variables

- `VITE_API_URL`
  - Frontend backend base URL.

- `GEMINI_API_KEY`
  - Primary AI provider key.

- `GEMINI_CHAT_MODELS`
  - Ordered Gemini models for chat and text generation.

- `AI_PROVIDER_ORDER`
  - Provider order for chat text generation.

- `NVIDIA_API_KEY`
  - Optional NVIDIA fallback provider key.

- `NVIDIA_BASE_URL`
  - NVIDIA OpenAI-compatible endpoint base URL.

- `NVIDIA_CHAT_MODELS`
  - Ordered NVIDIA model names for chat.

- `VITE_RAZORPAY_PDF_LINK`
  - Payment Link used by the Rs 99 lifetime access and instant PDF CTA.

- `VITE_RAZORPAY_CUSTOM_REPORT_LINK`
  - Payment Link used by the Rs 499 custom buyer verification brief CTA.

- `RAZORPAY_WEBHOOK_SECRET`
  - Secret used to verify Razorpay webhook signatures before paid access is activated.

## 9. Current Product Flow

1. User opens the landing page.
2. User enters the map workspace.
3. User searches by area name, coordinates, or map link.
4. User can upload a brochure, inspect an area, or open the assistant dock.
5. User can move from city-level view to area-level detail for analysis.
6. User uses the top feature rail to jump between report sections.
7. After the live preview period, the page shows a compact locked-feature carousel and the Rs 99 lifetime access CTA.
8. After Razorpay payment, the app re-checks access when the user returns and unlocks the report once the signed webhook has marked the lead paid.
9. Paid users see a welcome-back state and can explicitly download the source-of-truth PDF.

