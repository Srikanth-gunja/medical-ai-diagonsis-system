from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from ..models.notification import Notification
from ..realtime import publish_event
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
    try:
        limit = int(request.args.get('limit', 20))
    except (TypeError, ValueError):
        limit = 20
    max_limit = int(current_app.config.get('NOTIFICATIONS_MAX_LIMIT', 100))
    limit = max(1, min(limit, max_limit))
    
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
    current_user = get_current_user()
    notification = Notification.find_by_id(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    if str(notification.get('user_id')) != current_user['id'] and current_user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    Notification.mark_as_read(notification_id)
    publish_event([str(notification['user_id'])], 'notifications.updated', {})
    return jsonify({'success': True})


@notifications_bp.route('/read-all', methods=['POST'])
@jwt_required()
def mark_all_as_read():
    """Mark all notifications as read."""
    current_user = get_current_user()
    Notification.mark_all_as_read(current_user['id'])
    publish_event([current_user['id']], 'notifications.updated', {})
    return jsonify({'success': True})


@notifications_bp.route('/<notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification."""
    current_user = get_current_user()
    notification = Notification.find_by_id(notification_id)
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    if str(notification.get('user_id')) != current_user['id'] and current_user.get('role') != 'admin':
        return jsonify({'error': 'Unauthorized'}), 403
    Notification.delete(notification_id)
    publish_event([str(notification['user_id'])], 'notifications.updated', {})
    return jsonify({'success': True})
