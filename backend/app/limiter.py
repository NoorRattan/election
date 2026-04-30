"""
Shared SlowAPI rate limiter instance.

Defined here (not in main.py) to prevent a circular import:
  app.routes.feedback -> app.main -> app.routes.* (circular)

Both main.py and route files import from this module.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
