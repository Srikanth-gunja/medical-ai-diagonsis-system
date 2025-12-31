from bson import ObjectId
from datetime import datetime
from ..database import get_db, CHAT_HISTORY_COLLECTION


class ChatHistory:
    """Model for storing chatbot conversation history."""
    
    @staticmethod
    def find_by_user_id(user_id):
        """Get chat history for a user."""
        db = get_db()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return db[CHAT_HISTORY_COLLECTION].find_one({'user_id': user_id})
    
    @staticmethod
    def create(user_id, messages=None):
        """Create a new chat history entry."""
        db = get_db()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        chat_data = {
            'user_id': user_id,
            'messages': messages or [],
            'created_at': datetime.utcnow(),
            'updated_at': datetime.utcnow()
        }
        result = db[CHAT_HISTORY_COLLECTION].insert_one(chat_data)
        chat_data['_id'] = result.inserted_id
        return chat_data
    
    @staticmethod
    def add_message(user_id, role, content):
        """Add a message to chat history."""
        db = get_db()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        
        message = {
            'role': role,  # 'user' or 'assistant'
            'content': content,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        # Try to update existing history
        result = db[CHAT_HISTORY_COLLECTION].update_one(
            {'user_id': user_id},
            {
                '$push': {'messages': message},
                '$set': {'updated_at': datetime.utcnow()}
            }
        )
        
        # If no existing history, create new
        if result.matched_count == 0:
            ChatHistory.create(user_id, [message])
        
        return message
    
    @staticmethod
    def get_messages(user_id):
        """Get all messages for a user."""
        history = ChatHistory.find_by_user_id(user_id)
        if history:
            return history.get('messages', [])
        return []
    
    @staticmethod
    def clear_history(user_id):
        """Clear chat history for a user."""
        db = get_db()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return db[CHAT_HISTORY_COLLECTION].delete_one({'user_id': user_id})
    
    @staticmethod
    def to_dict(history):
        """Convert chat history to dictionary."""
        return {
            'id': str(history['_id']),
            'user_id': str(history['user_id']),
            'messages': history.get('messages', []),
            'created_at': history.get('created_at', '').isoformat() if history.get('created_at') else '',
            'updated_at': history.get('updated_at', '').isoformat() if history.get('updated_at') else ''
        }
