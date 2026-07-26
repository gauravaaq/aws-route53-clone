import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Ensure backend root is in sys.path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import Base
from app.core.dependencies import get_db
from app.core.security import get_password_hash
from app.main import app

# Import all models to ensure they register on Base.metadata
from app.models.user import User
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.models.zone_event import ZoneEvent

# Use file-based SQLite database for testing to allow sharing across threads
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_route53.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(name="db")
def session_fixture():
    # Force foreign keys inside in-memory test database too
    from sqlalchemy import event
    from sqlalchemy.engine import Engine
    
    @event.listens_for(Engine, "connect")
    def set_sqlite_pragma(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        # Create test user
        test_user = User(
            email="test@route53.com",
            password_hash=get_password_hash("testpassword"),
            name="Test User"
        )
        db.add(test_user)
        db.commit()
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)
        # Dispose engine to close all connections and release file lock before deletion
        engine.dispose()
        if os.path.exists("test_route53.db"):
            try:
                os.remove("test_route53.db")
            except Exception:
                pass

@pytest.fixture(name="client")
def client_fixture(db):
    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()

@pytest.fixture(name="auth_client")
def auth_client_fixture(client):
    # Log in and get token to set as cookie
    response = client.post(
        "/api/auth/login",
        json={"email": "test@route53.com", "password": "testpassword"}
    )
    assert response.status_code == 200
    # The client session will retain the cookie set in the response automatically!
    return client
