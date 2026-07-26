from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.common import PaginatedResponse, ResponseMeta
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneOut, HostedZoneUpdate, ZoneEventOut
from app.services.zone_service import ZoneService

router = APIRouter(prefix="/hosted-zones", tags=["Hosted Zones"])

@router.get("", response_model=PaginatedResponse[HostedZoneOut], summary="List all hosted zones")
def list_zones(
    search: Optional[str] = Query(None, description="Search by zone name"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: str = Query("name", description="Sort by field: name, type, record_count, created_at"),
    sort_order: str = Query("asc", description="Sort order: asc or desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    zones, total = ZoneService.get_zones(
        db, search=search, page=page, limit=limit, sort_by=sort_by, sort_order=sort_order
    )
    
    total_pages = (total + limit - 1) // limit
    
    return PaginatedResponse(
        data=zones,
        meta=ResponseMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )

@router.post("", response_model=HostedZoneOut, status_code=status.HTTP_201_CREATED, summary="Create a new hosted zone")
def create_zone(
    zone_in: HostedZoneCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ZoneService.create_zone(db, zone_in)

@router.get("/{zone_id}", response_model=HostedZoneOut, summary="Get hosted zone details")
def get_zone(
    zone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ZoneService.get_zone_by_id(db, zone_id)

@router.put("/{zone_id}", response_model=HostedZoneOut, summary="Update hosted zone comment")
def update_zone(
    zone_id: str,
    zone_in: HostedZoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ZoneService.update_zone(db, zone_id, zone_in)

@router.delete("/{zone_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a hosted zone")
def delete_zone(
    zone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ZoneService.delete_zone(db, zone_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

@router.get("/{zone_id}/events", response_model=List[ZoneEventOut], summary="List audit events for a zone")
def list_zone_events(
    zone_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return ZoneService.get_zone_events(db, zone_id)
