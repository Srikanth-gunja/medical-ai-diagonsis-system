from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
import json
import logging
from datetime import datetime, timedelta

from ..services.chatbot_service import (
    process_message,
    get_chat_history,
    clear_chat_history
)
from ..database import get_db, CHATBOT_RATE_LIMITS_COLLECTION

chatbot_bp = Blueprint('chatbot', __name__)
logger = logging.getLogger(__name__)


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


def _is_chatbot_rate_limited(user_id: str, limit: int, window_seconds: int) -> bool:
    if limit <= 0:
        return False

    if not current_app.config.get('CHATBOT_RATE_LIMIT_USE_DB', True):
        return False

    db = get_db()
    now = datetime.utcnow()
    window_start = now - timedelta(seconds=window_seconds)
    filter_query = {'user_id': user_id, 'created_at': {'$gte': window_start}}

    count = db[CHATBOT_RATE_LIMITS_COLLECTION].count_documents(filter_query)
    if count >= limit:
        return True

    db[CHATBOT_RATE_LIMITS_COLLECTION].insert_one(
        {'user_id': user_id, 'created_at': now}
    )
    return False


@chatbot_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message to the chatbot and get a response."""
    try:
        current_user = get_current_user()
        user_id = current_user['id']
        
        data = request.get_json() or {}
        message = data.get('message', '').strip()
        max_length = int(current_app.config.get('CHATBOT_MAX_MESSAGE_LENGTH', 2000))
        rate_window = int(current_app.config.get('CHATBOT_RATE_LIMIT_WINDOW_SECONDS', 60))
        rate_limit = int(current_app.config.get('CHATBOT_RATE_LIMIT_MAX_MESSAGES', 30))
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        if len(message) > max_length:
            return jsonify({'error': f'Message too long. Maximum {max_length} characters.'}), 400
        if _is_chatbot_rate_limited(user_id, rate_limit, rate_window):
            return jsonify({'error': 'Too many chatbot requests. Please try again later.'}), 429
        
        # Process message and get AI response
        response = process_message(user_id, message)
        
        return jsonify({
            'message': message,
            'response': response,
            'success': True
        })
    
    except ValueError:
        logger.exception("Chatbot configuration/validation error")
        return jsonify({'error': 'Chatbot service is temporarily unavailable.'}), 503
    except Exception:
        logger.exception("Failed to process chatbot message")
        return jsonify({'error': 'Failed to process message. Please try again.'}), 500


@chatbot_bp.route('/history', methods=['GET'])
@jwt_required()
def get_history():
    """Get chat history for the current user."""
    try:
        current_user = get_current_user()
        user_id = current_user['id']
        
        history = get_chat_history(user_id)
        
        return jsonify({
            'history': history,
            'success': True
        })
    
    except Exception:
        logger.exception("Failed to get chatbot history")
        return jsonify({'error': 'Failed to get history. Please try again.'}), 500


@chatbot_bp.route('/history', methods=['DELETE'])
@jwt_required()
def delete_history():
    """Clear chat history for the current user."""
    try:
        current_user = get_current_user()
        user_id = current_user['id']
        
        clear_chat_history(user_id)
        
        return jsonify({
            'message': 'Chat history cleared',
            'success': True
        })
    
    except Exception:
        logger.exception("Failed to clear chatbot history")
        return jsonify({'error': 'Failed to clear history. Please try again.'}), 500
