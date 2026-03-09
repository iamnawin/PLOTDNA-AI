from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import areas, score, satellite, ai, news, verdict

app = FastAPI(
    title="PlotDNA API",
    description="Real estate investment intelligence for India",
    version="0.2.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(areas.router,     prefix="/api/areas",    tags=["areas"])
app.include_router(score.router,     prefix="/api/score",    tags=["score"])
app.include_router(satellite.router, prefix="/api/satellite",tags=["satellite"])
app.include_router(ai.router,        prefix="/api/ai",       tags=["ai"])
app.include_router(news.router,      prefix="/api/news",     tags=["news"])
app.include_router(verdict.router,   prefix="/api/verdict",  tags=["verdict"])


@app.get("/health")
def health():
    return {"status": "ok", "version": "0.2.0"}
