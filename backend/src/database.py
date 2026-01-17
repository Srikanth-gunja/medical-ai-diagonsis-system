from pymongo import MongoClient
from flask import current_app, g

def get_db():
    """Get database connection from Flask application context."""
    if 'db' not in g:
        client = MongoClient(current_app.config['MONGO_URI'])
        g.db = client[current_app.config['MONGO_DB_NAME']]
    return g.db

def close_db(e=None):
    """Close database connection."""
    db = g.pop('db', None)
    if db is not None:
        db.client.close()

def init_db(app):
    """Initialize database connection with Flask app."""
    app.teardown_appcontext(close_db)

# Collection names
USERS_COLLECTION = 'users'
DOCTORS_COLLECTION = 'doctors'
PATIENTS_COLLECTION = 'patients'
MEDICAL_RECORDS_COLLECTION = 'medical_records'
APPOINTMENTS_COLLECTION = 'appointments'
CHAT_HISTORY_COLLECTION = 'chat_history'
RATINGS_COLLECTION = 'ratings'
PRESCRIPTIONS_COLLECTION = 'prescriptions'
SCHEDULES_COLLECTION = 'schedules'
NOTIFICATIONS_COLLECTION = 'notifications'
