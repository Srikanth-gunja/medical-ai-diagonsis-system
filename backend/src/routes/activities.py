from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from bson import ObjectId
from ..database import get_db
import json
from datetime import datetime, timedelta

activities_bp = Blueprint('activities', __name__)

ACTIVITIES_COLLECTION = 'activities'


def get_current_user():
    """Parse JWT identity and return user dict."""
    identity = get_jwt_identity()
    if isinstance(identity, str):
        return json.loads(identity)
    return identity


def format_timestamp(dt):
    """Format datetime to relative time string."""
    now = datetime.utcnow()
    diff = now - dt
    
    if diff.total_seconds() < 60:
        return "Just now"
    elif diff.total_seconds() < 3600:
        minutes = int(diff.total_seconds() / 60)
        return f"{minutes} minute{'s' if minutes != 1 else ''} ago"
    elif diff.total_seconds() < 86400:
        hours = int(diff.total_seconds() / 3600)
        return f"{hours} hour{'s' if hours != 1 else ''} ago"
    elif diff.days == 1:
        return "Yesterday"
    elif diff.days < 7:
        return f"{diff.days} days ago"
    elif diff.days < 30:
        weeks = diff.days // 7
        return f"{weeks} week{'s' if weeks != 1 else ''} ago"
    else:
        return dt.strftime('%b %d, %Y')


@activities_bp.route('', methods=['GET'])
@jwt_required()
def get_activities():
    """Get recent activities for the current user."""
    current_user = get_current_user()
    user_id = current_user['id']
    
    db = get_db()
    
    # Get activities for this user, sorted by timestamp descending
    activities = list(db[ACTIVITIES_COLLECTION].find(
        {'user_id': ObjectId(user_id)}
    ).sort('timestamp', -1).limit(10))
    
    result = []
    for activity in activities:
        result.append({
            'id': str(activity['_id']),
            'type': activity.get('type', 'message'),
            'title': activity.get('title', ''),
            'description': activity.get('description', ''),
            'timestamp': format_timestamp(activity['timestamp']) if isinstance(activity.get('timestamp'), datetime) else activity.get('timestamp', ''),
            'icon': activity.get('icon', 'BellIcon'),
            'color': activity.get('color', 'bg-primary'),
        })
    
    return jsonify(result)


@activities_bp.route('/create', methods=['POST'])
@jwt_required()
def create_activity():
    """Create a new activity (internal use)."""
    from flask import request
    current_user = get_current_user()
    data = request.get_json()
    
    db = get_db()
    activity = {
        'user_id': ObjectId(data.get('user_id', current_user['id'])),
        'type': data.get('type', 'message'),
        'title': data.get('title', ''),
        'description': data.get('description', ''),
        'timestamp': datetime.utcnow(),
        'icon': data.get('icon', 'BellIcon'),
        'color': data.get('color', 'bg-primary'),
    }
    
    result = db[ACTIVITIES_COLLECTION].insert_one(activity)
    activity['_id'] = result.inserted_id
    
    return jsonify({
        'id': str(activity['_id']),
        'message': 'Activity created successfully'
    }), 201
