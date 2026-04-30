import logging
import os

import firebase_admin
import firebase_admin.credentials
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings
from app.limiter import limiter
from app.routes import chat, feedback, quiz, timeline, topics, user

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


def _init_firebase() -> None:
    if firebase_admin._apps:
        # Already initialised - happens during tests where conftest pre-initialises a mock
        return

    key_path = settings.firebase_service_account_key

    if key_path and os.path.isfile(key_path):
        # Development: service account JSON file present on disk
        cred = firebase_admin.credentials.Certificate(key_path)
        firebase_admin.initialize_app(
            cred,
            {
                "projectId": settings.google_cloud_project,
            },
        )
        logger.info("Firebase initialised from service account file: %s", key_path)
    else:
        # Production (Cloud Run): use Application Default Credentials
        # The Cloud Run service account has the required IAM roles
        firebase_admin.initialize_app(
            options={
                "projectId": settings.google_cloud_project,
            }
        )
        logger.info("Firebase initialised with Application Default Credentials.")


_init_firebase()

app = FastAPI(
    title="Electra - Election Education Assistant API",
    version=settings.api_version,
    description="Backend API for the Interactive Election Education Assistant.",
    docs_url=None if settings.is_production else "/docs",
    redoc_url=None if settings.is_production else "/redoc",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
app.add_middleware(SlowAPIMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    if settings.is_production:
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(
        "Unhandled exception on %s %s: %s",
        request.method,
        request.url.path,
        exc,
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal error occurred. Please try again later."},
    )


PREFIX = "/api/v1"

app.include_router(topics.router, prefix=PREFIX, tags=["Topics"])
app.include_router(timeline.router, prefix=PREFIX, tags=["Timeline"])
app.include_router(quiz.router, prefix=PREFIX, tags=["Quiz"])
app.include_router(user.router, prefix=PREFIX, tags=["User"])
app.include_router(feedback.router, prefix=PREFIX, tags=["Feedback"])
app.include_router(chat.router, prefix=PREFIX, tags=["Chat"])


@app.get("/", include_in_schema=False)
async def root():
    return {
        "name": "Electra API",
        "version": settings.api_version,
        "status": "ok",
        "docs": "/docs" if not settings.is_production else None,
    }


@app.get("/api/v1/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "version": settings.api_version,
        "environment": settings.environment,
    }
