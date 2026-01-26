from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.config import get_settings
from app.api.campaigns import router as campaigns_router
from app.api.chat import router as chat_router
from app.api.sync import router as sync_router
from app.api.settings import router as settings_router
from app.api.alerts import router as alerts_router
from app.api.targeting import router as targeting_router
from app.api.whatsapp import router as whatsapp_router

settings = get_settings()

limiter = Limiter(key_func=get_remote_address)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting Meta Campaign Manager API...")
    yield
    # Shutdown
    print("Shutting down Meta Campaign Manager API...")


app = FastAPI(
    title="Meta Campaign Manager API",
    description="API para gerenciamento de campanhas Meta Ads com agentes de IA",
    version="1.0.0",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(campaigns_router, prefix="/api/campaigns", tags=["campaigns"])
app.include_router(chat_router, prefix="/api/agent", tags=["agent"])
app.include_router(sync_router, prefix="/api/sync", tags=["sync"])
app.include_router(settings_router, prefix="/api/settings", tags=["settings"])
app.include_router(alerts_router, prefix="/api/alerts", tags=["alerts"])
app.include_router(targeting_router, prefix="/api/targeting", tags=["targeting"])
app.include_router(whatsapp_router, prefix="/api/whatsapp", tags=["whatsapp"])


@app.get("/")
async def root():
    return {"message": "Meta Campaign Manager API", "version": "1.0.0"}


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
