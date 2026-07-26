import json
from datetime import datetime
from typing import Any, Dict, Literal, Optional
from pydantic import BaseModel, Field, field_validator, model_validator

# Compound type structures
class MXData(BaseModel):
    priority: int = Field(..., ge=0, le=65535, description="MX record priority (0-65535)")
    mail_server: str = Field(..., description="Mail server hostname")

class SRVData(BaseModel):
    priority: int = Field(..., ge=0, le=65535, description="Priority (0-65535)")
    weight: int = Field(..., ge=0, le=65535, description="Weight (0-65535)")
    port: int = Field(..., ge=0, le=65535, description="Port (0-65535)")
    target: str = Field(..., description="Target hostname")

class CAAData(BaseModel):
    flag: int = Field(..., description="CAA record flag (0 or 128)")
    tag: Literal["issue", "issuewild", "iodef"] = Field(..., description="CAA record tag")
    value: str = Field(..., description="CAA record value (e.g. letsencrypt.org)")

class DNSRecordBase(BaseModel):
    name: str = Field(..., description="Record name (relative to zone name, or FQDN)")
    type: Literal["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"] = Field(..., description="DNS record type")
    ttl: int = Field(300, ge=0, description="Time to live (seconds)")
    value: Optional[str] = Field(None, description="Value for simple record types (A, AAAA, CNAME, TXT, NS, PTR)")
    extra_json: Optional[Dict[str, Any]] = Field(None, description="Structured fields for compound record types (MX, SRV, CAA)")

    @field_validator("name")
    @classmethod
    def validate_name(cls, v: str) -> str:
        v = v.strip().lower()
        if not v:
            raise ValueError("Record name cannot be empty")
        # Relative names or '@' or FQDN are validated in service layer once the zone is known
        return v

class DNSRecordCreate(DNSRecordBase):
    @model_validator(mode="after")
    def validate_values_by_type(self) -> "DNSRecordCreate":
        t = self.type
        val = self.value
        ext = self.extra_json

        # Validate that appropriate fields are present/absent
        if t in ["A", "AAAA", "CNAME", "TXT", "NS", "PTR"]:
            if not val or not val.strip():
                raise ValueError(f"Value field is required for record type {t}")
            if ext:
                raise ValueError(f"extra_json is not allowed for record type {t}")
        elif t in ["MX", "SRV", "CAA"]:
            if val:
                raise ValueError(f"value field should be empty for record type {t} (use extra_json instead)")
            if not ext:
                raise ValueError(f"extra_json is required for record type {t}")
            
            # Sub-schema checks
            try:
                if t == "MX":
                    MXData(**ext)
                elif t == "SRV":
                    SRVData(**ext)
                elif t == "CAA":
                    CAAData(**ext)
            except Exception as e:
                raise ValueError(f"Invalid extra_json for record type {t}: {str(e)}")
        
        return self

class DNSRecordUpdate(BaseModel):
    ttl: Optional[int] = Field(None, ge=0, description="Time to live (seconds)")
    value: Optional[str] = Field(None, description="Value for simple record types (A, AAAA, CNAME, TXT, NS, PTR)")
    extra_json: Optional[Dict[str, Any]] = Field(None, description="Structured fields for compound record types (MX, SRV, CAA)")

class DNSRecordOut(BaseModel):
    id: str
    zone_id: str
    name: str
    type: str
    ttl: int
    value: Optional[str] = None
    extra_json: Optional[Dict[str, Any]] = None
    created_at: datetime
    updated_at: datetime

    @model_validator(mode="before")
    @classmethod
    def parse_extra_json(cls, data: Any) -> Any:
        # Check if we are parsing from ORM model
        if hasattr(data, "extra_json") and isinstance(data.extra_json, str) and data.extra_json:
            try:
                # We need to build a dictionary from the ORM object dynamically
                # Pydantic v2 mode='before' receives the model object or a dict
                pass
            except Exception:
                pass
        return data

    class Config:
        from_attributes = True

    # Pydantic v2 requires custom deserializer for database string extra_json to dict
    @classmethod
    def model_validate(cls, obj: Any, *args: Any, **kwargs: Any) -> "DNSRecordOut":
        # Overriding model_validate to handle SQLAlchemy model string-to-dict conversion
        if not isinstance(obj, dict):
            # It's an ORM object
            extra = None
            if hasattr(obj, "extra_json") and obj.extra_json:
                try:
                    extra = json.loads(obj.extra_json)
                except Exception:
                    pass
            
            return cls(
                id=obj.id,
                zone_id=obj.zone_id,
                name=obj.name,
                type=obj.type,
                ttl=obj.ttl,
                value=obj.value,
                extra_json=extra,
                created_at=obj.created_at,
                updated_at=obj.updated_at
            )
        return super().model_validate(obj, *args, **kwargs)
