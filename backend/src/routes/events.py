import json
import queue
import time
from flask import Blueprint, Response, stream_with_context, current_app, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..realtime import subscribe, unsubscribe, format_sse_message, publish_event

events_bp = Blueprint('events', __name__)


def get_current_user():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@events_bp.route('/stream', methods=['GET'])
@jwt_required(locations=["headers", "query_string"])
def stream_events():
    current_user = get_current_user()
    user_id = current_user['id']
    q = subscribe(user_id)

    def generate():
        try:
            yield "retry: 3000\n\n"
            while True:
                try:
                    payload = q.get(timeout=20)
                    yield format_sse_message(payload)
                except queue.Empty:
                    yield ": keep-alive\n\n"
        finally:
            unsubscribe(user_id, q)

    headers = {
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    }
    return Response(stream_with_context(generate()), headers=headers, mimetype='text/event-stream')


@events_bp.route('/test', methods=['POST'])
@jwt_required()
def test_event():
    # Only allow in debug mode to avoid accidental exposure in production.
    if not current_app.config.get('DEBUG'):
        return jsonify({"error": "Not found"}), 404

    current_user = get_current_user()
    payload = request.get_json(silent=True) or {}
    event = payload.get("event", "notifications.updated")
    data = payload.get("data", {"ts": time.time()})

    publish_event([str(current_user['id'])], event, data)
    return jsonify({"ok": True, "event": event, "data": data})
