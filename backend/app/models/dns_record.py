import uuid
from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Index
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base

class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    zone_id = Column(String, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    type = Column(String, nullable=False)  # 'A', 'AAAA', 'CNAME', 'TXT', 'MX', 'NS', 'PTR', 'SRV', 'CAA'
    ttl = Column(Integer, default=300, nullable=False)
    value = Column(String, nullable=True)  # Simple record value
    extra_json = Column(String, nullable=True)  # JSON string for compound fields (MX, SRV, CAA)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    zone = relationship("HostedZone", back_populates="records")

    # Composite Index on (zone_id, name, type)
    __table_args__ = (
        Index("idx_records_zone_name_type", "zone_id", "name", "type"),
    )
