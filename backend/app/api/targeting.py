from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional

from app.tools.meta_api import MetaAPI


router = APIRouter()


def get_meta_api(ad_account_id: Optional[str] = None, user_id: Optional[str] = None) -> MetaAPI:
    """Retorna uma instância do MetaAPI."""
    return MetaAPI(ad_account_id=ad_account_id, user_id=user_id)


# ========================================
# Response Models
# ========================================


class Interest(BaseModel):
    id: str
    name: str
    audience_size_lower_bound: int
    audience_size_upper_bound: int
    path: list[str]
    topic: Optional[str] = None


class InterestsResponse(BaseModel):
    success: bool
    interests: list[Interest]


class Location(BaseModel):
    key: str
    name: str
    type: str
    country_code: Optional[str] = None
    country_name: Optional[str] = None
    region: Optional[str] = None
    region_id: Optional[int] = None
    supports_city: bool = False
    supports_region: bool = False


class LocationsResponse(BaseModel):
    success: bool
    locations: list[Location]


class Category(BaseModel):
    id: str
    name: str
    type: Optional[str] = None
    path: Optional[list[str]] = None
    audience_size: Optional[int] = None


class CategoriesResponse(BaseModel):
    success: bool
    categories: list[dict]


# ========================================
# Endpoints
# ========================================


@router.get("/interests", response_model=InterestsResponse)
async def search_interests(
    q: str = Query(..., min_length=2, description="Termo de busca (mín. 2 caracteres)"),
    limit: int = Query(20, ge=1, le=50, description="Número máximo de resultados"),
    user_id: Optional[str] = Query(None),
):
    """
    Busca interesses disponíveis para targeting.

    Retorna uma lista de interesses com estimativa de tamanho do público.
    """
    try:
        meta_api = get_meta_api(user_id=user_id)
        interests = await meta_api.search_interests(q, limit)
        return InterestsResponse(
            success=True,
            interests=[Interest(**i) for i in interests],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/locations", response_model=LocationsResponse)
async def search_locations(
    q: str = Query(..., min_length=2, description="Nome da localização"),
    types: Optional[str] = Query(
        None,
        description="Tipos separados por vírgula: city, region, country, zip, geo_market",
    ),
    limit: int = Query(20, ge=1, le=50, description="Número máximo de resultados"),
    user_id: Optional[str] = Query(None),
):
    """
    Busca localizações para targeting.

    Tipos disponíveis:
    - city: Cidades
    - region: Estados/Regiões
    - country: Países
    - zip: CEPs
    - geo_market: Mercados geográficos (DMAs)
    """
    try:
        meta_api = get_meta_api(user_id=user_id)
        location_types = types.split(",") if types else None
        locations = await meta_api.search_locations(q, location_types, limit)
        return LocationsResponse(
            success=True,
            locations=[Location(**loc) for loc in locations],
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/categories", response_model=CategoriesResponse)
async def get_categories(
    category_class: str = Query(
        "interests",
        description="Classe: interests, behaviors, demographics, life_events, family_statuses",
    ),
    user_id: Optional[str] = Query(None),
):
    """
    Lista categorias de targeting disponíveis.

    Classes disponíveis:
    - interests: Interesses
    - behaviors: Comportamentos
    - demographics: Dados demográficos
    - life_events: Eventos de vida
    - family_statuses: Status familiar
    - industries: Indústrias
    - income: Faixa de renda
    """
    try:
        meta_api = get_meta_api(user_id=user_id)
        categories = await meta_api.get_targeting_categories(category_class)
        return CategoriesResponse(success=True, categories=categories)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
