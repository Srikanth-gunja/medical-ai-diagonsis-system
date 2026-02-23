import json
import os
import queue
import secrets
import threading
import time
from typing import Any, Dict, List, Optional

_subscribers: Dict[str, List[queue.Queue]] = {}
_lock = threading.Lock()

_SSE_TOKENS: Dict[str, dict] = {}
_TOKEN_LOCK = threading.Lock()
_QUEUE_MAXSIZE = int(os.environ.get("REALTIME_QUEUE_MAXSIZE", "200"))
_SSE_TOKEN_TTL_SECONDS = int(os.environ.get("SSE_TOKEN_TTL_SECONDS", "60"))
_MAX_SSE_TOKENS = int(os.environ.get("REALTIME_MAX_SSE_TOKENS", "10000"))
_TOKEN_CLEANUP_INTERVAL_SECONDS = int(
    os.environ.get("SSE_TOKEN_CLEANUP_INTERVAL_SECONDS", "60")
)
_LAST_TOKEN_CLEANUP = 0.0

_PENDING_VIDEO_CALL_INVITES: Dict[str, dict] = {}
_PENDING_INVITES_LOCK = threading.Lock()
_PENDING_VIDEO_CALL_TTL_SECONDS = int(
    os.environ.get("PENDING_VIDEO_CALL_TTL_SECONDS", "90")
)
_PENDING_VIDEO_CALL_CLEANUP_INTERVAL_SECONDS = int(
    os.environ.get("PENDING_VIDEO_CALL_CLEANUP_INTERVAL_SECONDS", "60")
)
_MAX_PENDING_VIDEO_CALLS = int(
    os.environ.get("REALTIME_MAX_PENDING_VIDEO_CALLS", "10000")
)
_LAST_PENDING_VIDEO_CALL_CLEANUP = 0.0


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


def _cleanup_sse_tokens(now: float) -> None:
    global _LAST_TOKEN_CLEANUP
    if now - _LAST_TOKEN_CLEANUP < _TOKEN_CLEANUP_INTERVAL_SECONDS:
        return
    _LAST_TOKEN_CLEANUP = now

    for key in list(_SSE_TOKENS.keys()):
        data = _SSE_TOKENS.get(key)
        if not data or data.get("expires_at", 0) < now:
            _SSE_TOKENS.pop(key, None)

    overflow = len(_SSE_TOKENS) - _MAX_SSE_TOKENS
    if overflow > 0:
        oldest = sorted(
            _SSE_TOKENS.items(), key=lambda item: item[1].get("expires_at", 0.0)
        )
        for token, _ in oldest[:overflow]:
            _SSE_TOKENS.pop(token, None)


def issue_sse_token(user_id: str, ttl_seconds: Optional[int] = None) -> str:
    ttl = _SSE_TOKEN_TTL_SECONDS if ttl_seconds is None else ttl_seconds
    token = secrets.token_urlsafe(32)
    expires_at = time.time() + ttl
    with _TOKEN_LOCK:
        _cleanup_sse_tokens(time.time())
        _SSE_TOKENS[token] = {"user_id": user_id, "expires_at": expires_at}
    return token


def consume_sse_token(token: str, single_use: bool = True) -> Optional[str]:
    now = time.time()
    with _TOKEN_LOCK:
        _cleanup_sse_tokens(now)
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


def _cleanup_pending_video_call_invites(now: float) -> None:
    global _LAST_PENDING_VIDEO_CALL_CLEANUP
    if now - _LAST_PENDING_VIDEO_CALL_CLEANUP < _PENDING_VIDEO_CALL_CLEANUP_INTERVAL_SECONDS:
        return
    _LAST_PENDING_VIDEO_CALL_CLEANUP = now

    for key in list(_PENDING_VIDEO_CALL_INVITES.keys()):
        item = _PENDING_VIDEO_CALL_INVITES.get(key)
        if not item or item.get("expires_at", 0) < now:
            _PENDING_VIDEO_CALL_INVITES.pop(key, None)

    overflow = len(_PENDING_VIDEO_CALL_INVITES) - _MAX_PENDING_VIDEO_CALLS
    if overflow > 0:
        oldest = sorted(
            _PENDING_VIDEO_CALL_INVITES.items(),
            key=lambda item: item[1].get("expires_at", 0.0),
        )
        for user_id, _ in oldest[:overflow]:
            _PENDING_VIDEO_CALL_INVITES.pop(user_id, None)


def store_pending_video_call_invite(
    user_id: str, payload: Dict[str, Any], ttl_seconds: Optional[int] = None
) -> None:
    ttl = _PENDING_VIDEO_CALL_TTL_SECONDS if ttl_seconds is None else ttl_seconds
    now = time.time()
    with _PENDING_INVITES_LOCK:
        _cleanup_pending_video_call_invites(now)
        _PENDING_VIDEO_CALL_INVITES[user_id] = {
            "payload": payload,
            "expires_at": now + max(1, int(ttl)),
        }


def get_pending_video_call_invite(
    user_id: str, consume: bool = True
) -> Optional[Dict[str, Any]]:
    now = time.time()
    with _PENDING_INVITES_LOCK:
        _cleanup_pending_video_call_invites(now)
        item = _PENDING_VIDEO_CALL_INVITES.get(user_id)
        if not item:
            return None
        if item.get("expires_at", 0) < now:
            _PENDING_VIDEO_CALL_INVITES.pop(user_id, None)
            return None
        payload = item.get("payload")
        if consume:
            _PENDING_VIDEO_CALL_INVITES.pop(user_id, None)
        return payload if isinstance(payload, dict) else None


def clear_pending_video_call_invite(user_id: str, call_id: Optional[str] = None) -> None:
    with _PENDING_INVITES_LOCK:
        item = _PENDING_VIDEO_CALL_INVITES.get(user_id)
        if not item:
            return
        if call_id:
            payload = item.get("payload", {})
            if not isinstance(payload, dict) or str(payload.get("call_id")) != str(call_id):
                return
        _PENDING_VIDEO_CALL_INVITES.pop(user_id, None)
