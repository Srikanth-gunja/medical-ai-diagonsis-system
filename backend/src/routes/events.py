import json
import queue
import time
from flask import Blueprint, Response, stream_with_context, current_app, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..realtime import (
    subscribe,
    unsubscribe,
    format_sse_message,
    publish_event,
    issue_sse_token,
    consume_sse_token,
)

events_bp = Blueprint('events', __name__)


def get_current_user():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@events_bp.route('/token', methods=['POST'])
@jwt_required()
def create_stream_token():
    current_user = get_current_user()
    ttl = current_app.config.get("SSE_TOKEN_TTL_SECONDS", 60)
    token = issue_sse_token(str(current_user["id"]), ttl_seconds=ttl)
    return jsonify({"token": token, "expires_in": ttl})


@events_bp.route('/stream', methods=['GET'])
def stream_events():
    token = (request.args.get("token") or "").strip()
    if not token:
        return jsonify({"error": "Missing stream token"}), 401

    user_id = consume_sse_token(token, single_use=True)
    if not user_id:
        return jsonify({"error": "Invalid or expired stream token"}), 401
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
