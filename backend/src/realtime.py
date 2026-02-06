import json
import os
import queue
import secrets
import threading
import time
from typing import Dict, List, Optional

try:
    import redis  # type: ignore
except Exception:  # pragma: no cover - optional dependency
    redis = None

_subscribers: Dict[str, List[queue.Queue]] = {}
_lock = threading.Lock()

_SSE_TOKENS: Dict[str, dict] = {}
_TOKEN_LOCK = threading.Lock()
_QUEUE_MAXSIZE = int(os.environ.get("REALTIME_QUEUE_MAXSIZE", "200"))
_SSE_TOKEN_TTL_SECONDS = int(os.environ.get("SSE_TOKEN_TTL_SECONDS", "60"))
_PUBSUB_CHANNEL = os.environ.get("REALTIME_CHANNEL", "realtime.events")
_REDIS_URL = os.environ.get("REDIS_URL")

_REDIS_LOCK = threading.Lock()
_redis_client = None
_pubsub_thread = None


def subscribe(user_id: str) -> queue.Queue:
    _ensure_pubsub_listener()
    q: queue.Queue = queue.Queue(maxsize=_QUEUE_MAXSIZE)
    with _lock:
        _subscribers.setdefault(user_id, []).append(q)
    return q


def unsubscribe(user_id: str, q: queue.Queue) -> None:
    with _lock:
        queues = _subscribers.get(user_id)
        if not queues:
            return
        try:
            queues.remove(q)
        except ValueError:
            return
        if not queues:
            _subscribers.pop(user_id, None)


def publish_event(user_ids: List[str], event: str, data: dict) -> None:
    payload = {"event": event, "data": data}
    client = _get_redis_client()
    if client:
        _ensure_pubsub_listener()
        try:
            client.publish(
                _PUBSUB_CHANNEL,
                json.dumps({"user_ids": user_ids, "event": event, "data": data}),
            )
            return
        except Exception:
            # Fallback to local delivery
            _deliver_local(user_ids, payload)
            return

    _deliver_local(user_ids, payload)


def format_sse_message(payload: dict) -> str:
    event = payload.get("event", "message")
    data = payload.get("data", {})
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def issue_sse_token(user_id: str, ttl_seconds: Optional[int] = None) -> str:
    ttl = _SSE_TOKEN_TTL_SECONDS if ttl_seconds is None else ttl_seconds
    token = secrets.token_urlsafe(32)
    client = _get_redis_client()
    if client:
        try:
            client.setex(_sse_key(token), ttl, user_id)
            return token
        except Exception:
            pass

    expires_at = time.time() + ttl
    with _TOKEN_LOCK:
        _SSE_TOKENS[token] = {"user_id": user_id, "expires_at": expires_at}
    return token


def consume_sse_token(token: str, single_use: bool = True) -> Optional[str]:
    client = _get_redis_client()
    if client:
        key = _sse_key(token)
        try:
            if single_use:
                # Atomic get + delete
                result = client.eval(
                    "local v=redis.call('GET', KEYS[1]); "
                    "if v then redis.call('DEL', KEYS[1]); end; return v",
                    1,
                    key,
                )
                return result
            return client.get(key)
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


def _sse_key(token: str) -> str:
    return f"sse:token:{token}"


def _get_redis_client():
    if not _REDIS_URL or not redis:
        return None
    global _redis_client
    with _REDIS_LOCK:
        if _redis_client is None:
            _redis_client = redis.Redis.from_url(_REDIS_URL, decode_responses=True)
        return _redis_client


def _deliver_local(user_ids: List[str], payload: dict) -> None:
    with _lock:
        targets = [q for uid in user_ids for q in _subscribers.get(uid, [])]
    for q in targets:
        try:
            q.put_nowait(payload)
        except queue.Full:
            try:
                q.get_nowait()
            except queue.Empty:
                continue
            try:
                q.put_nowait(payload)
            except queue.Full:
                continue


def _ensure_pubsub_listener() -> None:
    client = _get_redis_client()
    if not client:
        return
    global _pubsub_thread
    if _pubsub_thread and _pubsub_thread.is_alive():
        return

    def _run():
        while True:
            try:
                pubsub = client.pubsub(ignore_subscribe_messages=True)
                pubsub.subscribe(_PUBSUB_CHANNEL)
                for message in pubsub.listen():
                    if not message or message.get("type") != "message":
                        continue
                    data = message.get("data")
                    if not data:
                        continue
                    try:
                        payload = json.loads(data)
                    except Exception:
                        continue
                    user_ids = payload.get("user_ids") or []
                    event = payload.get("event", "message")
                    event_data = payload.get("data", {})
                    _deliver_local(user_ids, {"event": event, "data": event_data})
            except Exception:
                time.sleep(1)

    _pubsub_thread = threading.Thread(target=_run, daemon=True)
    _pubsub_thread.start()
