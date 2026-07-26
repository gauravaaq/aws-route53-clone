from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

class HostedZoneBase(BaseModel):
    name: str = Field(..., description="Fully qualified domain name of the hosted zone (e.g. example.com.)")
    type: Literal["public", "private"] = Field(..., description="Hosted zone type: public or private")
    comment: Optional[str] = Field(None, description="An optional comment about the hosted zone")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Hosted zone name cannot be empty")
        # Ensure trailing dot is appended if not present
        if not v.endswith("."):
            v += "."
        # Simple domain label checks
        clean_name = v[:-1]
        labels = clean_name.split(".")
        if len(labels) < 1:
            raise ValueError("Hosted zone name must be a valid domain")
        for label in labels:
            if not label:
                raise ValueError("Domain labels cannot be empty")
            if len(label) > 63:
                raise ValueError("Domain labels cannot exceed 63 characters")
            if label.startswith("-") or label.endswith("-"):
                raise ValueError("Domain labels cannot start or end with a hyphen")
            # Character set: alphanumeric and hyphen
            if not all(c.isalnum() or c == "-" for c in label):
                raise ValueError("Domain labels can only contain alphanumeric characters and hyphens")
        return v

class HostedZoneCreate(HostedZoneBase):
    pass

class HostedZoneUpdate(BaseModel):
    comment: Optional[str] = Field(None, description="An optional comment to update")

class HostedZoneOut(HostedZoneBase):
    id: str
    record_count: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
        
class ZoneEventOut(BaseModel):
    id: str
    zone_id: str
    event_type: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True
