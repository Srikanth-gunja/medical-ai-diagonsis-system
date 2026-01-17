from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.notification import Notification
import json

notifications_bp = Blueprint('notifications', __name__)


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


@notifications_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get notifications for current user."""
    current_user = get_current_user()
    
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    limit = int(request.args.get('limit', 20))
    
    notifications = Notification.find_by_user(
        current_user['id'], 
        limit=limit, 
        unread_only=unread_only
    )
    
    return jsonify({
        'notifications': [Notification.to_dict(n) for n in notifications],
        'unreadCount': Notification.get_unread_count(current_user['id'])
    })


@notifications_bp.route('/count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get unread notification count."""
    current_user = get_current_user()
    count = Notification.get_unread_count(current_user['id'])
    return jsonify({'count': count})


@notifications_bp.route('/<notification_id>/read', methods=['POST'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read."""
    Notification.mark_as_read(notification_id)
    return jsonify({'success': True})


@notifications_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read."""
    current_user = get_current_user()
    Notification.mark_all_as_read(current_user['id'])
    return jsonify({'success': True})


@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification."""
    Notification.delete(notification_id)
    return jsonify({'success': True})
