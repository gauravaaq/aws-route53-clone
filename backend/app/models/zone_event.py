import uuid
from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class ZoneEvent(Base):
    __tablename__ = "zone_events"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    zone_id = Column(String, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False)
    event_type = Column(String, nullable=False)  # 'ZONE_CREATED', 'ZONE_UPDATED', 'ZONE_DELETED', 'RECORD_CREATED', 'RECORD_UPDATED', 'RECORD_DELETED'
    description = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    zone = relationship("HostedZone", back_populates="events")
