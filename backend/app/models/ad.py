from pydantic import BaseModel
from typing import Optional


class AdCreate(BaseModel):
    name: str
    creative_id: str
    status: str = "PAUSED"


class AdUpdate(BaseModel):
    name: Optional[str] = None
    creative_id: Optional[str] = None
    status: Optional[str] = None


class AdCreative(BaseModel):
    id: str
    name: Optional[str] = None
    object_type: Optional[str] = None  # SHARE, VIDEO, IMAGE, etc.
    thumbnail_url: Optional[str] = None
    image_url: Optional[str] = None
    video_id: Optional[str] = None


class AdInsights(BaseModel):
    spend: float = 0
    impressions: int = 0
    clicks: int = 0
    reach: int = 0
    conversions: int = 0
    leads: int = 0
    purchases: int = 0
    ctr: float = 0
    cpc: float = 0


class AdResponse(BaseModel):
    id: str
    name: str
    status: str
    effective_status: Optional[str] = None
    creative: Optional[AdCreative] = None
    insights: Optional[AdInsights] = None
    created_time: Optional[str] = None
    updated_time: Optional[str] = None


class AdListResponse(BaseModel):
    ads: list[AdResponse]
    total: int
