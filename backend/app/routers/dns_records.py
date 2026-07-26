from typing import Optional
from fastapi import APIRouter, Depends, Query, Response, status
from sqlalchemy.orm import Session
from app.core.dependencies import get_db, get_current_user
from app.models.user import User
from app.schemas.common import PaginatedResponse, ResponseMeta
from app.schemas.dns_record import DNSRecordCreate, DNSRecordOut, DNSRecordUpdate
from app.services.dns_record_service import DNSRecordService

router = APIRouter(prefix="/hosted-zones/{zone_id}/records", tags=["DNS Records"])

@router.get("", response_model=PaginatedResponse[DNSRecordOut], summary="List all DNS records in a hosted zone")
def list_records(
    zone_id: str,
    search: Optional[str] = Query(None, description="Search by record name or value"),
    type: Optional[str] = Query(None, description="Filter by record type (A, CNAME, etc.)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    records, total = DNSRecordService.get_records(
        db, zone_id, search=search, record_type=type, page=page, limit=limit
    )
    
    total_pages = (total + limit - 1) // limit
    
    # We must explicitly validate and transform ORM objects to serializable pydantic outputs
    formatted_data = [DNSRecordOut.model_validate(r) for r in records]
    
    return PaginatedResponse(
        data=formatted_data,
        meta=ResponseMeta(
            total=total,
            page=page,
            limit=limit,
            total_pages=total_pages
        )
    )

@router.post("", response_model=DNSRecordOut, status_code=status.HTTP_201_CREATED, summary="Create a new DNS record in a zone")
def create_record(
    zone_id: str,
    record_in: DNSRecordCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_rec = DNSRecordService.create_record(db, zone_id, record_in)
    return DNSRecordOut.model_validate(db_rec)

@router.get("/{record_id}", response_model=DNSRecordOut, summary="Get details of a specific DNS record")
def get_record(
    zone_id: str,
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_rec = DNSRecordService.get_record_by_id(db, zone_id, record_id)
    return DNSRecordOut.model_validate(db_rec)

@router.put("/{record_id}", response_model=DNSRecordOut, summary="Update an existing DNS record")
def update_record(
    zone_id: str,
    record_id: str,
    record_in: DNSRecordUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    db_rec = DNSRecordService.update_record(db, zone_id, record_id, record_in)
    return DNSRecordOut.model_validate(db_rec)

@router.delete("/{record_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a DNS record")
def delete_record(
    zone_id: str,
    record_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    DNSRecordService.delete_record(db, zone_id, record_id)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
