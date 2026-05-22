# PlotDNA App Feature Map

This file maps the current app behavior to the main files and components that implement it.

## 1. Landing and Home Experience

- `frontend/src/pages/Landing.tsx`
  - Public landing page.
  - Shows the core value proposition, buyer pain points, and entry points into the map flow.

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
  - Hosts the floating assistant dock with area-level context.

- `frontend/src/components/ui/VerdictCard.tsx`
  - AI verdict summary card.
  - Fetches `GET /api/verdict/{city}/{area}` and renders buy/hold/wait/avoid guidance.

- `frontend/src/components/ui/SatelliteCompare.tsx`
  - Satellite growth comparison section.
  - Shows the before/latest visual timeline.

- `frontend/src/components/score/PlotAnalysisCard.tsx`
  - Coordinate-level analysis drawer.
  - Resolves live OSM scoring and falls back to supported locality context.

## 3. Brochure Analysis

- `frontend/src/pages/BrochurePage.tsx`
  - Full-page brochure upload workflow.
  - Extracts property details, RERA number, hidden clauses, pricing, and coordinates.

- `frontend/src/components/ui/BrochureUploadCard.tsx`
  - Inline brochure upload card used inside the map flow.

- `frontend/src/lib/api.ts`
  - Contains `analyzeBrochure()` and the shared backend base URL.

## 4. Assistant / Chat

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

## 5. Scoring and Market Intelligence

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

## 6. Backend Routes

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

## 7. Key Environment Variables

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

## 8. Current Product Flow

1. User opens the landing page.
2. User enters the map workspace.
3. User searches by area name, coordinates, or map link.
4. User can upload a brochure, inspect an area, or open the assistant dock.
5. User can move from city-level view to area-level detail for analysis.

