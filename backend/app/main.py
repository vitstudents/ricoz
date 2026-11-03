import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from app.config import settings
from app.database import engine, Base, SessionLocal
from app.api import auth, transactions, reconciliation, anomalies, journals, assistant, reports, settings as settings_api
from app.services.synthetic import seed_database_if_empty

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables
    Base.metadata.create_all(bind=engine)
    # Seed initial dataset if empty
    db = SessionLocal()
    try:
        seed_database_if_empty(db)
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Autonomous continuous bank reconciliation, AI bookkeeping, multi-currency processing, and anomaly detection platform.",
    lifespan=lifespan
)

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Active Phase 1 (45% Scope) API routes under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(transactions.router, prefix=api_prefix)
app.include_router(reconciliation.router, prefix=api_prefix)

@app.get("/api", include_in_schema=False)
@app.get("/api/", include_in_schema=False)
@app.get("/api/index.py", include_in_schema=False)
@app.get("/api/index.py/", include_in_schema=False)
@app.get("/api/v1", include_in_schema=False)
@app.get("/api/v1/", include_in_schema=False)
def api_index():
    return {
        "service": settings.PROJECT_NAME,
        "milestone": "Phase 1 Baseline (45% Scope)",
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "active_endpoints": {
            "transactions": "/api/v1/transactions",
            "reconciliation_status": "/api/v1/reconciliation/status",
            "reconciliation_run": "/api/v1/reconciliation/run/{bank_account_id}",
            "reconciliation_unmatched": "/api/v1/reconciliation/unmatched/{bank_account_id}"
        },
        "upcoming_phase_2": [
            "anomalies",
            "double_entry_journals",
            "conversational_assistant",
            "close_reports"
        ]
    }


# Health endpoint
@app.get("/health", tags=["system"])
def health_check():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs"
    }

# Check frontend distribution path
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

@app.get("/", include_in_schema=False)
def serve_root():
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return health_check()

@app.get("/index.html", include_in_schema=False)
def serve_index_html():
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return health_check()

@app.get("/favicon.svg", include_in_schema=False)
def serve_favicon():
    fav = os.path.join(frontend_dist, "favicon.svg")
    if os.path.exists(fav):
        return FileResponse(fav)
    raise HTTPException(status_code=404, detail="Not Found")

@app.get("/icons.svg", include_in_schema=False)
def serve_icons():
    icons = os.path.join(frontend_dist, "icons.svg")
    if os.path.exists(icons):
        return FileResponse(icons)
    raise HTTPException(status_code=404, detail="Not Found")

# SPA Fallback for all client-side navigation routes
@app.get("/{full_path:path}", include_in_schema=False)
def serve_spa(full_path: str):
    # Don't hijack API or documentation routes
    if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
        raise HTTPException(status_code=404, detail="Not Found")
    
    file_path = os.path.join(frontend_dist, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
        
    index_path = os.path.join(frontend_dist, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
        
    raise HTTPException(status_code=404, detail="Not Found")
