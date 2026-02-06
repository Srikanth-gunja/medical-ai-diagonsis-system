import secrets
import threading
import time
from collections import defaultdict, deque
from typing import Optional

from .redis_client import get_redis

_RATE_LIMIT_BUCKETS = defaultdict(deque)
_LOCK = threading.Lock()

_RATE_LIMIT_LUA = """
local key = KEYS[1]
local now = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local limit = tonumber(ARGV[3])
local member = ARGV[4]

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = redis.call('ZCARD', key)
if count >= limit then
  return 1
end
redis.call('ZADD', key, now, member)
redis.call('EXPIRE', key, window)
return 0
"""


def _redis_rate_limited(bucket_key: str, limit: int, window_seconds: int) -> Optional[bool]:
    redis_client = get_redis()
    if not redis_client:
        return None
    key = f"rate:{bucket_key}"
    now = time.time()
    member = f"{now}:{secrets.token_hex(4)}"
    try:
        limited = redis_client.eval(_RATE_LIMIT_LUA, 1, key, now, window_seconds, limit, member)
        return bool(limited)
    except Exception:
        return None


def _local_rate_limited(bucket_key: str, limit: int, window_seconds: int) -> bool:
    now = time.time()
    with _LOCK:
        bucket = _RATE_LIMIT_BUCKETS[bucket_key]
        while bucket and now - bucket[0] > window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            return True
        bucket.append(now)
    return False


def is_rate_limited(bucket_key: str, limit: int, window_seconds: int) -> bool:
    redis_result = _redis_rate_limited(bucket_key, limit, window_seconds)
    if redis_result is not None:
        return redis_result
    return _local_rate_limited(bucket_key, limit, window_seconds)
