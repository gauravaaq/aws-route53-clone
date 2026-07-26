from typing import Generic, List, TypeVar, Dict, Any, Optional
from pydantic import BaseModel

T = TypeVar("T")

class ResponseMeta(BaseModel):
    total: int
    page: int
    limit: int
    total_pages: int

class PaginatedResponse(BaseModel, Generic[T]):
    data: List[T]
    meta: ResponseMeta

class ErrorResponse(BaseModel):
    detail: str
    error_code: str
    fields: Optional[Dict[str, str]] = None
