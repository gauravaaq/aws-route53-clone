import uuid
from sqlalchemy import Column, String, DateTime, Integer, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, nullable=False)  # 'public' or 'private'
    comment = Column(String, nullable=True)
    record_count = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    records = relationship("DNSRecord", back_populates="zone", cascade="all, delete-orphan")
    events = relationship("ZoneEvent", back_populates="zone", cascade="all, delete-orphan")
