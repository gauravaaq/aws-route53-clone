from typing import List, Tuple, Optional
from sqlalchemy import or_, func
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.hosted_zone import HostedZone
from app.models.dns_record import DNSRecord
from app.models.zone_event import ZoneEvent
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneUpdate

class ZoneService:
    @staticmethod
    def get_zones(
        db: Session,
        search: Optional[str] = None,
        page: int = 1,
        limit: int = 20,
        sort_by: str = "name",
        sort_order: str = "asc"
    ) -> Tuple[List[HostedZone], int]:
        query = db.query(HostedZone)

        if search:
            # Strip trailing dot for search comparison if user typed it
            search_clean = search.strip().lower()
            if search_clean.endswith("."):
                search_clean = search_clean[:-1]
            query = query.filter(HostedZone.name.ilike(f"%{search_clean}%"))

        # Sorting logic
        # Default sort field mapping
        sort_field = HostedZone.name
        if sort_by == "type":
            sort_field = HostedZone.type
        elif sort_by == "record_count":
            sort_field = HostedZone.record_count
        elif sort_by == "created_at":
            sort_field = HostedZone.created_at

        if sort_order == "desc":
            query = query.order_by(sort_field.desc())
        else:
            query = query.order_by(sort_field.asc())

        total = query.count()
        offset = (page - 1) * limit
        zones = query.offset(offset).limit(limit).all()

        return zones, total

    @staticmethod
    def get_zone_by_id(db: Session, zone_id: str) -> HostedZone:
        zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
        if not zone:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Hosted zone not found"
            )
        return zone

    @staticmethod
    def get_zone_by_name(db: Session, name: str) -> Optional[HostedZone]:
        name_normalized = name.strip().lower()
        if not name_normalized.endswith("."):
            name_normalized += "."
        return db.query(HostedZone).filter(HostedZone.name == name_normalized).first()

    @staticmethod
    def create_zone(db: Session, zone_in: HostedZoneCreate) -> HostedZone:
        name_normalized = zone_in.name.strip().lower()
        if not name_normalized.endswith("."):
            name_normalized += "."

        # Check uniqueness
        existing_zone = ZoneService.get_zone_by_name(db, name_normalized)
        if existing_zone:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Hosted zone with name '{name_normalized}' already exists",
                headers={"error_code": "DUPLICATE_ZONE_NAME"}
            )

        new_zone = HostedZone(
            name=name_normalized,
            type=zone_in.type,
            comment=zone_in.comment,
            record_count=2  # Auto-created SOA and NS records
        )
        db.add(new_zone)
        db.flush()  # Retrieve zone ID

        # Create Default SOA and NS records as Route53 does
        soa_value = f"ns-1.awsdns.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
        default_soa = DNSRecord(
            zone_id=new_zone.id,
            name=name_normalized,
            type="NS",
            ttl=172800,
            value="ns-1.awsdns.com."
        )
        default_ns = DNSRecord(
            zone_id=new_zone.id,
            name=name_normalized,
            type="TXT",  # Set TXT with SOA parameters
            ttl=900,
            value=f"\"ns-1.awsdns.com. hostmaster.{name_normalized} 2026072601 7200 900 1209600 86400\""
        )
        # Note: In real Route53, it creates an SOA and NS record.
        # Let's adjust types correctly:
        default_soa.type = "SOA"
        default_soa.value = f"ns-1.awsdns.com. hostmaster.{name_normalized} 1 7200 900 1209600 86400"
        
        default_ns.type = "NS"
        default_ns.value = "ns-1.awsdns.com."

        db.add(default_soa)
        db.add(default_ns)

        # Log event
        event = ZoneEvent(
            zone_id=new_zone.id,
            event_type="ZONE_CREATED",
            description=f"Hosted zone '{name_normalized}' ({zone_in.type}) was created."
        )
        db.add(event)

        db.commit()
        db.refresh(new_zone)
        return new_zone

    @staticmethod
    def update_zone(db: Session, zone_id: str, zone_in: HostedZoneUpdate) -> HostedZone:
        zone = ZoneService.get_zone_by_id(db, zone_id)
        
        if zone_in.comment is not None:
            zone.comment = zone_in.comment

        event = ZoneEvent(
            zone_id=zone.id,
            event_type="ZONE_UPDATED",
            description=f"Hosted zone '{zone.name}' comment was updated."
        )
        db.add(event)
        
        db.commit()
        db.refresh(zone)
        return zone

    @staticmethod
    def delete_zone(db: Session, zone_id: str) -> None:
        zone = ZoneService.get_zone_by_id(db, zone_id)
        db.delete(zone)
        # Cascade delete is handled by DB FK setup, but we commit to save
        db.commit()

    @staticmethod
    def get_zone_events(db: Session, zone_id: str) -> List[ZoneEvent]:
        # Verify zone exists
        ZoneService.get_zone_by_id(db, zone_id)
        return db.query(ZoneEvent).filter(ZoneEvent.zone_id == zone_id).order_by(ZoneEvent.created_at.desc()).all()
