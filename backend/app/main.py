import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.india import land_verify
from app.api.routes import ai, areas, auth, avm, brochure, entitlements, leads, market_pulse, news, rera, satellite, score, utils, verdict
from app.api.uae import dld_routes

app = FastAPI(
    title="PlotDNA API",
    description="Real estate investment intelligence for India",
    version="0.2.0",
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
app.include_router(areas.router,     prefix="/api/areas",     tags=["areas"])
app.include_router(score.router,     prefix="/api/score",     tags=["score"])
app.include_router(satellite.router, prefix="/api/satellite", tags=["satellite"])
app.include_router(ai.router,        prefix="/api/ai",        tags=["ai"])
app.include_router(news.router,      prefix="/api/news",      tags=["news"])
app.include_router(verdict.router,   prefix="/api/verdict",   tags=["verdict"])
app.include_router(leads.router,     prefix="/api/leads",     tags=["leads"])
app.include_router(utils.router,        prefix="/api/utils",              tags=["utils"])
app.include_router(market_pulse.router, prefix="/api/v1/market-pulse",    tags=["market-pulse"])
app.include_router(avm.router,          prefix="/api/v1/avm",             tags=["avm"])
app.include_router(auth.router,         prefix="/api/v1/auth",            tags=["auth"])
app.include_router(entitlements.router, prefix="/api/v1/entitlements",    tags=["entitlements"])
app.include_router(brochure.router,     prefix="/api/v1",                 tags=["brochure"])
app.include_router(rera.router,         prefix="/api/v1/rera",            tags=["rera"])
app.include_router(land_verify.router,  prefix="/api/india",              tags=["india"])
app.include_router(dld_routes.router,   prefix="/api/uae",                tags=["uae"])


# ── Health & root ────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {
        "service": "PlotDNA API",
        "version": "0.2.0",
        "status": "live",
        "docs": "/docs",
        "endpoints": ["/api/news/{city}", "/api/verdict/{city}/{area}"],
    }


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.2.0"}
