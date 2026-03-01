from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import areas, score, satellite, ai

app = FastAPI(
    title="PlotDNA API",
    description="Real estate investment intelligence for India",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(areas.router, prefix="/api/areas", tags=["areas"])
app.include_router(score.router, prefix="/api/score", tags=["score"])
app.include_router(satellite.router, prefix="/api/satellite", tags=["satellite"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.1.0"}
