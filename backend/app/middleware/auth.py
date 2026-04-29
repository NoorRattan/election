"""
Firebase JWT authentication dependency for FastAPI.

Usage in any route:
    from app.middleware.auth import AuthToken

    @router.get("/protected")
    async def my_route(token: AuthToken):
        uid = token["uid"]

IMPORTANT: verify_id_token() is synchronous — it is always called via run_in_executor
to avoid blocking the async event loop.
"""

import asyncio
import logging
from typing import Annotated

import firebase_admin.auth
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

logger = logging.getLogger(__name__)

bearer_scheme = HTTPBearer(auto_error=False)


async def require_auth(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> dict:
    if credentials is None or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = credentials.credentials
    loop = asyncio.get_event_loop()
    try:
        decoded_token = await loop.run_in_executor(
            None,
            firebase_admin.auth.verify_id_token,
            token,
        )
    except firebase_admin.auth.ExpiredIdTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err
    except firebase_admin.auth.InvalidIdTokenError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err
    except firebase_admin.auth.UserDisabledError as err:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account has been disabled.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from err
    except Exception as exc:
        logger.error("Unexpected error during token verification: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    return decoded_token


AuthToken = Annotated[dict, Depends(require_auth)]
