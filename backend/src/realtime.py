import json
import queue
import threading
from typing import Dict, List

_subscribers: Dict[str, List[queue.Queue]] = {}
_lock = threading.Lock()


def subscribe(user_id: str) -> queue.Queue:
    q: queue.Queue = queue.Queue()
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
        q.put(payload)


def format_sse_message(payload: dict) -> str:
    event = payload.get("event", "message")
    data = payload.get("data", {})
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"
