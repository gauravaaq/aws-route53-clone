import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import event
from sqlalchemy.engine import Engine

# Set SQLite PRAGMA for foreign keys BEFORE importing database/models
@event.listens_for(Engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    # Enforce foreign key constraints in SQLite
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()

from app.core.config import settings
from app.core.database import Base, engine
from app.routers import auth, hosted_zones, dns_records, query_simulator

# Auto-create tables on startup (no migrations needed for simple SQLite setup)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Route53 Clone API",
    description="Backend API for AWS Route53 Clone. Supports authentication, hosted zones CRUD, DNS records CRUD, and DNS rules validation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Setup: Secure and flexible origin checks
# Since we use HttpOnly cookies with credentials, we cannot use allow_origins=["*"].
# We use allow_origin_regex to match localhost, loopback, and any direct IPv4 address 
# (useful for public Azure VM prototype deployment) on any port.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|(?:\d{1,3}\.){3}\d{1,3})(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(auth.router, prefix="/api")
app.include_router(hosted_zones.router, prefix="/api")
app.include_router(dns_records.router, prefix="/api")
app.include_router(query_simulator.router, prefix="/api")

@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy", "environment": settings.ENV}
