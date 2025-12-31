from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

from ..services.chatbot_service import (
    process_message,
    get_chat_history,
    clear_chat_history
)

chatbot_bp = Blueprint('chatbot', __name__)


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@chatbot_bp.route('/message', methods=['POST'])
@jwt_required()
def send_message():
    """Send a message to the chatbot and get a response."""
    try:
        current_user = get_current_user()
        user_id = current_user['id']
        
        data = request.get_json()
        message = data.get('message', '').strip()
        
        if not message:
            return jsonify({'error': 'Message is required'}), 400
        
        # Process message and get AI response
        response = process_message(user_id, message)
        
        return jsonify({
            'message': message,
            'response': response,
            'success': True
        })
    
    except ValueError as e:
        return jsonify({'error': str(e)}), 500
    except Exception as e:
        return jsonify({'error': f'Failed to process message: {str(e)}'}), 500


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
    
    except Exception as e:
        return jsonify({'error': f'Failed to get history: {str(e)}'}), 500


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
    
    except Exception as e:
        return jsonify({'error': f'Failed to clear history: {str(e)}'}), 500
