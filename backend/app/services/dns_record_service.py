import json
from typing import List, Tuple, Optional
from sqlalchemy import and_
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.models.zone_event import ZoneEvent
from app.schemas.dns_record import DNSRecordCreate, DNSRecordUpdate
from app.services.dns_validators import validate_record_value, normalize_fqdn, is_valid_hostname
from app.services.zone_service import ZoneService

class DNSRecordService:
    @staticmethod
    def get_records(
        db: Session,
        zone_id: str,
        search: Optional[str] = None,
        record_type: Optional[str] = None,
        page: int = 1,
        limit: int = 20
    ) -> Tuple[List[DNSRecord], int]:
        # Verify zone exists
        ZoneService.get_zone_by_id(db, zone_id)
        
        query = db.query(DNSRecord).filter(DNSRecord.zone_id == zone_id)

        if record_type:
            query = query.filter(DNSRecord.type == record_type.upper().strip())
            
        if search:
            search_clean = search.strip().lower()
            # Can match name or value
            query = query.filter(
                or_(
                    DNSRecord.name.ilike(f"%{search_clean}%"),
                    DNSRecord.value.ilike(f"%{search_clean}%")
                )
            )

        # Order by name and type
        query = query.order_by(DNSRecord.name.asc(), DNSRecord.type.asc())

        total = query.count()
        offset = (page - 1) * limit
        records = query.offset(offset).limit(limit).all()

        from sqlalchemy import or_  # Ensure or_ is in namespace if search is used
        return records, total

    @staticmethod
    def get_record_by_id(db: Session, zone_id: str, record_id: str) -> DNSRecord:
        record = db.query(DNSRecord).filter(
            and_(DNSRecord.zone_id == zone_id, DNSRecord.id == record_id)
        ).first()
        if not record:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="DNS Record not found"
            )
        return record

    @staticmethod
    def create_record(db: Session, zone_id: str, record_in: DNSRecordCreate) -> DNSRecord:
        zone = ZoneService.get_zone_by_id(db, zone_id)
        
        # 1. Normalize record name to FQDN
        normalized_name = normalize_fqdn(record_in.name, zone.name)
        
        # Double check if the name is a valid hostname label structure
        if not is_valid_hostname(normalized_name, allow_wildcard=True):
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Record name '{record_in.name}' is not a valid DNS name",
                headers={"error_code": "INVALID_RECORD_NAME"}
            )
            
        # 2. DNS Value / JSON Validation
        val_error = validate_record_value(record_in.type, record_in.value, record_in.extra_json)
        if val_error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=val_error,
                headers={"error_code": "INVALID_RECORD_VALUE"}
            )

        # 3. CNAME Exclusivity & Apex Checks
        is_cname = record_in.type == "CNAME"
        
        if is_cname:
            # A CNAME is not allowed at the zone apex
            if normalized_name == zone.name:
                raise HTTPException(
                    status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                    detail="CNAME record cannot be created at the zone apex (@)",
                    headers={"error_code": "CNAME_AT_ZONE_APEX"}
                )
            
            # CNAME cannot coexist with other record types
            existing_records = db.query(DNSRecord).filter(
                and_(DNSRecord.zone_id == zone_id, DNSRecord.name == normalized_name)
            ).all()
            if existing_records:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A CNAME record cannot coexist with other records at the same name",
                    headers={"error_code": "CNAME_COEXISTENCE_CONFLICT"}
                )
        else:
            # Check if a CNAME record already exists at this name
            existing_cname = db.query(DNSRecord).filter(
                and_(
                    DNSRecord.zone_id == zone_id, 
                    DNSRecord.name == normalized_name,
                    DNSRecord.type == "CNAME"
                )
            ).first()
            if existing_cname:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="Cannot add record because a CNAME record already exists at this name",
                    headers={"error_code": "CNAME_COEXISTENCE_CONFLICT"}
                )

        # 4. Check for duplicate record (same name, type, and value/extra_json)
        value_to_check = record_in.value
        extra_json_str = json.dumps(record_in.extra_json) if record_in.extra_json else None
        
        duplicate_query = db.query(DNSRecord).filter(
            and_(
                DNSRecord.zone_id == zone_id,
                DNSRecord.name == normalized_name,
                DNSRecord.type == record_in.type
            )
        )
        
        if value_to_check:
            duplicate_query = duplicate_query.filter(DNSRecord.value == value_to_check)
        else:
            duplicate_query = duplicate_query.filter(DNSRecord.extra_json == extra_json_str)
            
        if duplicate_query.first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A record with this name, type, and value already exists",
                headers={"error_code": "DUPLICATE_RECORD"}
            )

        # 5. Save the record
        new_record = DNSRecord(
            zone_id=zone_id,
            name=normalized_name,
            type=record_in.type,
            ttl=record_in.ttl,
            value=value_to_check,
            extra_json=extra_json_str
        )
        db.add(new_record)
        
        # 6. Update Hosted Zone Record Count
        zone.record_count += 1
        
        # 7. Log event
        event = ZoneEvent(
            zone_id=zone_id,
            event_type="RECORD_CREATED",
            description=f"Created {record_in.type} record for '{normalized_name}'."
        )
        db.add(event)
        
        db.commit()
        db.refresh(new_record)
        return new_record

    @staticmethod
    def update_record(db: Session, zone_id: str, record_id: str, record_in: DNSRecordUpdate) -> DNSRecord:
        record = DNSRecordService.get_record_by_id(db, zone_id, record_id)
        
        # Collect values to update, fallback to existing
        new_ttl = record_in.ttl if record_in.ttl is not None else record.ttl
        new_value = record_in.value if record_in.value is not None else record.value
        new_extra = record_in.extra_json if record_in.extra_json is not None else (json.loads(record.extra_json) if record.extra_json else None)

        # DNS Value / JSON Validation
        val_error = validate_record_value(record.type, new_value, new_extra)
        if val_error:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=val_error,
                headers={"error_code": "INVALID_RECORD_VALUE"}
            )

        # Duplicate check if value is changing
        extra_json_str = json.dumps(new_extra) if new_extra else None
        if new_value != record.value or extra_json_str != record.extra_json:
            dup_query = db.query(DNSRecord).filter(
                and_(
                    DNSRecord.zone_id == zone_id,
                    DNSRecord.name == record.name,
                    DNSRecord.type == record.type,
                    DNSRecord.id != record_id
                )
            )
            if new_value:
                dup_query = dup_query.filter(DNSRecord.value == new_value)
            else:
                dup_query = dup_query.filter(DNSRecord.extra_json == extra_json_str)
                
            if dup_query.first():
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="A record with this name, type, and value already exists",
                    headers={"error_code": "DUPLICATE_RECORD"}
                )

        # Apply updates
        record.ttl = new_ttl
        record.value = new_value
        record.extra_json = extra_json_str
        
        # Log event
        event = ZoneEvent(
            zone_id=zone_id,
            event_type="RECORD_UPDATED",
            description=f"Updated {record.type} record for '{record.name}'."
        )
        db.add(event)
        
        db.commit()
        db.refresh(record)
        return record

    @staticmethod
    def delete_record(db: Session, zone_id: str, record_id: str) -> None:
        zone = ZoneService.get_zone_by_id(db, zone_id)
        record = DNSRecordService.get_record_by_id(db, zone_id, record_id)
        
        # SOA and NS records matching the zone name cannot be deleted as they are system-required apex records
        # in standard Route53. We should block this to show absolute DNS fidelity!
        if record.name == zone.name and record.type in ["NS", "SOA"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot delete system-required default {record.type} record at zone apex.",
                headers={"error_code": "SYSTEM_RECORD_PROTECTED"}
            )
            
        record_name = record.name
        record_type = record.type
        
        db.delete(record)
        
        # Update Hosted Zone Record Count
        zone.record_count = max(0, zone.record_count - 1)
        
        # Log event
        event = ZoneEvent(
            zone_id=zone_id,
            event_type="RECORD_DELETED",
            description=f"Deleted {record_type} record for '{record_name}'."
        )
        db.add(event)
        
        db.commit()
