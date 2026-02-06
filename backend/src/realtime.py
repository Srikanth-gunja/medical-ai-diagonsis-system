import json
import os
import queue
import secrets
import threading
import time
from typing import Dict, List, Optional

from .redis_client import get_redis

_subscribers: Dict[str, List[queue.Queue]] = {}
_lock = threading.Lock()

_SSE_TOKENS: Dict[str, dict] = {}
_TOKEN_LOCK = threading.Lock()
_QUEUE_MAXSIZE = int(os.environ.get("REALTIME_QUEUE_MAXSIZE", "200"))
_SSE_TOKEN_TTL_SECONDS = int(os.environ.get("SSE_TOKEN_TTL_SECONDS", "60"))

_CHANNEL_PREFIX = os.environ.get("REALTIME_CHANNEL_PREFIX", "realtime:user:")
_TOKEN_PREFIX = os.environ.get("SSE_TOKEN_PREFIX", "realtime:token:")


class _LocalSubscriber:
    def __init__(self, user_id: str):
        self.user_id = user_id
        self.queue: queue.Queue = queue.Queue(maxsize=_QUEUE_MAXSIZE)
        with _lock:
            _subscribers.setdefault(user_id, []).append(self.queue)

    def get(self, timeout: int):
        return self.queue.get(timeout=timeout)

    def close(self) -> None:
        with _lock:
            queues = _subscribers.get(self.user_id)
            if not queues:
                return
            try:
                queues.remove(self.queue)
            except ValueError:
                return
            if not queues:
                _subscribers.pop(self.user_id, None)


class _RedisSubscriber:
    def __init__(self, redis_client, channel: str):
        self._pubsub = redis_client.pubsub(ignore_subscribe_messages=True)
        self._pubsub.subscribe(channel)
        self._closed = False

    def get(self, timeout: int):
        if self._closed:
            raise queue.Empty
        message = self._pubsub.get_message(timeout=timeout)
        if not message:
            raise queue.Empty
        data = message.get("data")
        if isinstance(data, bytes):
            data = data.decode("utf-8", errors="replace")
        try:
            payload = json.loads(data)
        except Exception:
            payload = {"event": "message", "data": {"raw": data}}
        return payload

    def close(self) -> None:
        if self._closed:
            return
        self._closed = True
        try:
            self._pubsub.close()
        except Exception:
            pass


def _channel_for_user(user_id: str) -> str:
    return f"{_CHANNEL_PREFIX}{user_id}"


def _token_key(token: str) -> str:
    return f"{_TOKEN_PREFIX}{token}"


def subscribe(user_id: str):
    redis_client = get_redis()
    if redis_client:
        return _RedisSubscriber(redis_client, _channel_for_user(user_id))
    return _LocalSubscriber(user_id)


def unsubscribe(user_id: str, subscriber) -> None:
    if hasattr(subscriber, "close"):
        subscriber.close()
        return
    # Backward-compatible cleanup if a raw queue was passed
    with _lock:
        queues = _subscribers.get(user_id)
        if not queues:
            return
        try:
            queues.remove(subscriber)
        except ValueError:
            return
        if not queues:
            _subscribers.pop(user_id, None)


def publish_event(user_ids: List[str], event: str, data: dict) -> None:
    payload = {
        "event": event,
        "data": data,
    }
    redis_client = get_redis()
    if redis_client:
        message = json.dumps(payload)
        try:
            pipe = redis_client.pipeline()
            for uid in set(user_ids):
                pipe.publish(_channel_for_user(str(uid)), message)
            pipe.execute()
            return
        except Exception:
            # Fall back to local if Redis publish fails
            pass

    with _lock:
        targets = [q for uid in user_ids for q in _subscribers.get(uid, [])]
    for q in targets:
        try:
            q.put_nowait(payload)
        except queue.Full:
            # Drop oldest to make room for latest
            try:
                q.get_nowait()
            except queue.Empty:
                continue
            try:
                q.put_nowait(payload)
            except queue.Full:
                continue


def format_sse_message(payload: dict) -> str:
    event = payload.get("event", "message")
    data = payload.get("data", {})
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


_GETDEL_LUA = (
    "local v = redis.call('GET', KEYS[1]);"
    "if not v then return nil end;"
    "redis.call('DEL', KEYS[1]);"
    "return v;"
)


def issue_sse_token(user_id: str, ttl_seconds: Optional[int] = None) -> str:
    ttl = _SSE_TOKEN_TTL_SECONDS if ttl_seconds is None else ttl_seconds
    token = secrets.token_urlsafe(32)
    redis_client = get_redis()
    if redis_client:
        try:
            redis_client.setex(_token_key(token), ttl, user_id)
            return token
        except Exception:
            pass
    expires_at = time.time() + ttl
    with _TOKEN_LOCK:
        _SSE_TOKENS[token] = {"user_id": user_id, "expires_at": expires_at}
    return token


def consume_sse_token(token: str, single_use: bool = True) -> Optional[str]:
    redis_client = get_redis()
    if redis_client:
        try:
            key = _token_key(token)
            if single_use:
                data = redis_client.eval(_GETDEL_LUA, 1, key)
            else:
                data = redis_client.get(key)
            if data is None:
                return None
            if isinstance(data, bytes):
                data = data.decode("utf-8", errors="replace")
            return str(data)
        except Exception:
            pass

    now = time.time()
    with _TOKEN_LOCK:
        data = _SSE_TOKENS.get(token)
        if not data:
            return None
        if data["expires_at"] < now:
            _SSE_TOKENS.pop(token, None)
            return None
        user_id = data["user_id"]
        if single_use:
            _SSE_TOKENS.pop(token, None)
        return user_id
