from app.schemas.common import ResponseMeta, PaginatedResponse, ErrorResponse
from app.schemas.auth import LoginRequest, UserOut, Token
from app.schemas.hosted_zone import HostedZoneCreate, HostedZoneUpdate, HostedZoneOut, ZoneEventOut
from app.schemas.dns_record import DNSRecordCreate, DNSRecordUpdate, DNSRecordOut, MXData, SRVData, CAAData

__all__ = [
    "ResponseMeta", "PaginatedResponse", "ErrorResponse",
    "LoginRequest", "UserOut", "Token",
    "HostedZoneCreate", "HostedZoneUpdate", "HostedZoneOut", "ZoneEventOut",
    "DNSRecordCreate", "DNSRecordUpdate", "DNSRecordOut", "MXData", "SRVData", "CAAData"
]
