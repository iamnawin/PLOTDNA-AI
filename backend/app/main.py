import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.api.routes import areas, score, satellite, ai, news, verdict, brochure, market_pulse
from app.api.india import land_verify as india_routes
from app.api.uae import dld_routes as uae_routes

app = FastAPI(
    title="PlotDNA API",
    description="Real estate investment intelligence for India and UAE",
    version="1.0.0",
)

# ── CORS ────────────────────────────────────────────────────────────────────
# ALLOWED_ORIGINS env var:
#   "*"                        → allow everything (default, fine for public read-only API)
#   "https://plotdna.in,https://app.plotdna.in"  → restrict in production
_raw_origins = os.getenv("ALLOWED_ORIGINS", "*")

if _raw_origins.strip() == "*":
    # Wildcard mode — cannot use allow_credentials=True with "*"
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["GET", "POST", "OPTIONS"],
        allow_headers=["*"],
    )
else:
    # Specific origins — allow credentials for authenticated routes later
    _origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ── Routes ───────────────────────────────────────────────────────────────────
app.include_router(areas.router,        prefix="/api/areas",        tags=["areas"])
app.include_router(score.router,        prefix="/api/score",        tags=["score"])
app.include_router(satellite.router,    prefix="/api/satellite",    tags=["satellite"])
app.include_router(ai.router,           prefix="/api/ai",           tags=["ai"])
app.include_router(news.router,         prefix="/api/news",         tags=["news"])
app.include_router(verdict.router,      prefix="/api/verdict",      tags=["verdict"])
# Phase 2 — unified v1 routes
app.include_router(brochure.router,     prefix="/api/v1",           tags=["brochure"])
app.include_router(market_pulse.router, prefix="/api/v1",           tags=["market-pulse"])
# Phase 2 — country-specific routes
app.include_router(india_routes.router, prefix="/api/india",        tags=["india"])
app.include_router(uae_routes.router,   prefix="/api/uae",          tags=["uae"])


# ── Health & root ────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "PlotDNA API",
        "version": "1.0.0",
        "status": "live",
        "docs": "/docs",
        "endpoints": [
            "/api/news/{city}",
            "/api/verdict/{city}/{area}",
            "POST /api/v1/analyze-brochure",
            "GET /api/v1/market-pulse/{country}/{area_slug}",
            "GET /api/v1/dld/transactions/{area}",
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
