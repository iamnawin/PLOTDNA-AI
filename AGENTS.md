# Repository Guidelines

## Project Structure & Module Organization
`frontend/` contains the Vite + React + TypeScript client. Main UI code lives in `frontend/src/`, with page-level screens in `src/pages/`, reusable UI in `src/components/`, API helpers in `src/lib/`, and static/public assets in `public/`. `backend/` contains the FastAPI service; application setup is in `backend/app/main.py`, HTTP routes live in `backend/app/api/routes/`, and shared business logic sits in `backend/app/services/`. Supporting docs and rollout plans live in `docs/`, utility scripts in `scripts/`, and seed/reference data in `data/`.

## Build, Test, and Development Commands
Frontend:

- `cd frontend && npm install` installs client dependencies.
- `cd frontend && npm run dev` starts the local UI on Vite.
- `cd frontend && npm run build` runs TypeScript build checks and produces `frontend/dist/`.
- `cd frontend && npm run lint` runs ESLint across the app.

Backend:

- `cd backend && python -m venv venv` creates a local virtual environment.
- `cd backend && venv\Scripts\activate` on Windows, then `pip install -r requirements.txt` installs API dependencies.
- `cd backend && uvicorn app.main:app --reload` starts the FastAPI server on `http://localhost:8000`.

## Coding Style & Naming Conventions
Follow existing conventions instead of introducing new ones. Frontend files use 2-space indentation, PascalCase for React components (`BrochureUploadCard.tsx`), and camelCase for helpers/hooks. Backend Python uses 4-space indentation, snake_case for modules and functions, and thin route modules that delegate to `services/`. Use the existing ESLint setup in `frontend/eslint.config.js`; keep TypeScript strict enough to pass `npm run build`.

## Testing Guidelines
There is no committed end-to-end or unit test suite yet. For UI changes, run `npm run lint` and `npm run build`; for backend changes, start `uvicorn` and smoke-test the affected endpoint locally. Add focused automated tests when you introduce non-trivial behavior, and place them close to the feature or in a new `tests/` directory with names like `test_<feature>.py`.

## Commit & Pull Request Guidelines
Recent history mixes conventional subjects (`feat: ...`) with imperative one-line summaries (`Bring Pune to resolver-grade coverage...`). Prefer concise imperative subjects that explain why the change matters. This repository also expects Lore-style commit trailers for context, such as `Constraint:`, `Confidence:`, and `Tested:`. Pull requests should include a short summary, affected areas (`frontend`, `backend`, `docs`), linked issues if any, verification performed, and screenshots for visible UI changes.
