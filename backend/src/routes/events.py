import queue
import json
from flask import Blueprint, Response, stream_with_context
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..realtime import subscribe, unsubscribe, format_sse_message

events_bp = Blueprint('events', __name__)


def get_current_user():
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@events_bp.route('/stream', methods=['GET'])
@jwt_required()
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
