from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

# Mount API routes under /api/v1
api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(transactions.router, prefix=api_prefix)
app.include_router(reconciliation.router, prefix=api_prefix)
app.include_router(anomalies.router, prefix=api_prefix)
app.include_router(journals.router, prefix=api_prefix)
app.include_router(assistant.router, prefix=api_prefix)
app.include_router(reports.router, prefix=api_prefix)
app.include_router(settings_api.router, prefix=api_prefix)

@app.get("/")
def health_check():
    return {
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs"
    }

