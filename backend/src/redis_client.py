import os
from functools import lru_cache
from typing import Optional

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover - optional dependency for local dev
    redis = None


def _resolve_redis_url() -> Optional[str]:
    url = os.environ.get("REDIS_URL", "").strip()
    try:
        from flask import current_app

        if current_app:
            cfg_url = current_app.config.get("REDIS_URL")
            if cfg_url:
                url = str(cfg_url).strip()
    except Exception:
        # Not in app context or flask not available
        pass
    return url or None


@lru_cache
def _client_for_url(url: str):
    # Lazy connection; redis-py connects on first command
    return redis.Redis.from_url(url, decode_responses=False)


def get_redis():
    if redis is None:
        return None
    url = _resolve_redis_url()
    if not url:
        return None
    try:
        return _client_for_url(url)
    except Exception:
        return None
