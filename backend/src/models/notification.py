from datetime import datetime
from bson import ObjectId
from ..database import get_db, NOTIFICATIONS_COLLECTION


class Notification:
    """Notification model for user notifications."""
    
    @staticmethod
    def create(user_id, title, message, notification_type='info', link=None, reference_id=None):
        """Create a new notification."""
        db = get_db()
        notification_data = {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'title': title,
            'message': message,
            'type': notification_type,  # info, success, warning, error, appointment, message
            'link': link,
            'reference_id': reference_id,  # Optional: link to appointment or other entity
            'read': False,
            'created_at': datetime.utcnow()
        }
        
        result = db[NOTIFICATIONS_COLLECTION].insert_one(notification_data)
        notification_data['_id'] = result.inserted_id
        return notification_data
    
    @staticmethod
    def find_by_user(user_id, limit=20, unread_only=False):
        """Find notifications for a user."""
        db = get_db()
        query = {
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id
        }
        if unread_only:
            query['read'] = False
            
        return list(db[NOTIFICATIONS_COLLECTION].find(query).sort('created_at', -1).limit(limit))
    
    @staticmethod
    def get_unread_count(user_id):
        """Get count of unread notifications."""
        db = get_db()
        return db[NOTIFICATIONS_COLLECTION].count_documents({
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'read': False
        })
    
    @staticmethod
    def mark_as_read(notification_id):
        """Mark a single notification as read."""
        db = get_db()
        db[NOTIFICATIONS_COLLECTION].update_one(
            {'_id': ObjectId(notification_id) if isinstance(notification_id, str) else notification_id},
            {'$set': {'read': True}}
        )
    
    @staticmethod
    def mark_all_as_read(user_id):
        """Mark all notifications as read for a user."""
        db = get_db()
        db[NOTIFICATIONS_COLLECTION].update_many(
            {'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id},
            {'$set': {'read': True}}
        )
    
    @staticmethod
    def delete(notification_id):
        """Delete a notification."""
        db = get_db()
        db[NOTIFICATIONS_COLLECTION].delete_one({
            '_id': ObjectId(notification_id) if isinstance(notification_id, str) else notification_id
        })
    
    @staticmethod
    def delete_by_reference(user_id, reference_id):
        """Delete notifications by reference_id for a specific user."""
        db = get_db()
        db[NOTIFICATIONS_COLLECTION].delete_many({
            'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
            'reference_id': reference_id
        })
    
    @staticmethod
    def mark_read_by_reference(user_id, reference_id):
        """Mark notifications as read by reference_id."""
        db = get_db()
        db[NOTIFICATIONS_COLLECTION].update_many(
            {
                'user_id': ObjectId(user_id) if isinstance(user_id, str) else user_id,
                'reference_id': reference_id
            },
            {'$set': {'read': True}}
        )
    
    @staticmethod
    def to_dict(notification):
        """Convert notification document to dict."""
        if not notification:
            return None
        return {
            'id': str(notification['_id']),
            'userId': str(notification['user_id']),
            'title': notification['title'],
            'message': notification['message'],
            'type': notification['type'],
            'link': notification.get('link'),
            'referenceId': notification.get('reference_id'),
            'read': notification['read'],
            'createdAt': notification['created_at'].isoformat() if notification.get('created_at') else None
        }
