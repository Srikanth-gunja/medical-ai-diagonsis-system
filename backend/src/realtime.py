import json
import os
import queue
import secrets
import threading
import time
from typing import Dict, List, Optional

_subscribers: Dict[str, List[queue.Queue]] = {}
_lock = threading.Lock()

_SSE_TOKENS: Dict[str, dict] = {}
_TOKEN_LOCK = threading.Lock()
_QUEUE_MAXSIZE = int(os.environ.get("REALTIME_QUEUE_MAXSIZE", "200"))
_SSE_TOKEN_TTL_SECONDS = int(os.environ.get("SSE_TOKEN_TTL_SECONDS", "60"))


def subscribe(user_id: str) -> queue.Queue:
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
    payload = {
        "event": event,
        "data": data,
    }
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


def issue_sse_token(user_id: str, ttl_seconds: Optional[int] = None) -> str:
    ttl = _SSE_TOKEN_TTL_SECONDS if ttl_seconds is None else ttl_seconds
    token = secrets.token_urlsafe(32)
    expires_at = time.time() + ttl
    with _TOKEN_LOCK:
        _SSE_TOKENS[token] = {"user_id": user_id, "expires_at": expires_at}
    return token


def consume_sse_token(token: str, single_use: bool = True) -> Optional[str]:
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
