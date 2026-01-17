from bson import ObjectId
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from ..database import get_db, USERS_COLLECTION

class User:
    """User model for authentication."""
    
    @staticmethod
    def create(email, password, role):
        """Create a new user."""
        db = get_db()
        user_data = {
            'email': email.lower(),
            'password': generate_password_hash(password),
            'role': role,
            'created_at': datetime.utcnow()
        }
        result = db[USERS_COLLECTION].insert_one(user_data)
        user_data['_id'] = result.inserted_id
        return user_data
    
    @staticmethod
    def find_by_email(email):
        """Find a user by email."""
        db = get_db()
        return db[USERS_COLLECTION].find_one({'email': email.lower()})
    
    @staticmethod
    def find_by_id(user_id):
        """Find a user by ID."""
        db = get_db()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return db[USERS_COLLECTION].find_one({'_id': user_id})
    
    @staticmethod
    def check_password(user, password):
        """Check if password matches."""
        return check_password_hash(user['password'], password)
    
    @staticmethod
    def delete(user_id):
        """Delete a user."""
        db = get_db()
        if isinstance(user_id, str):
            user_id = ObjectId(user_id)
        return db[USERS_COLLECTION].delete_one({'_id': user_id})
    
    @staticmethod
    def to_dict(user):
        """Convert user to dictionary."""
        return {
            'id': str(user['_id']),
            'email': user['email'],
            'role': user['role'],
            'created_at': user.get('created_at', '').isoformat() if user.get('created_at') else None
        }
