from pymongo import MongoClient, ASCENDING
from flask import current_app, g


def get_db():
    """Get database connection from Flask application context."""
    if "db" not in g:
        client = MongoClient(current_app.config["MONGO_URI"])
        g.db = client[current_app.config["MONGO_DB_NAME"]]
    return g.db


def close_db(e=None):
    """Close database connection."""
    db = g.pop("db", None)
    if db is not None:
        db.client.close()


def init_db(app):
    """Initialize database connection with Flask app."""
    app.teardown_appcontext(close_db)

    # Create indexes for better query performance
    with app.app_context():
        db = get_db()
        _create_indexes(db)


def _create_indexes(db):
    """Create database indexes for performance optimization."""
    # Users collection indexes
    db[USERS_COLLECTION].create_index([("email", ASCENDING)], unique=True)

    # Doctors collection indexes
    db[DOCTORS_COLLECTION].create_index([("user_id", ASCENDING)])
    db[DOCTORS_COLLECTION].create_index([("verified", ASCENDING)])
    db[DOCTORS_COLLECTION].create_index([("verification_status", ASCENDING)])
    db[DOCTORS_COLLECTION].create_index([("specialty", ASCENDING)])

    # Patients collection indexes
    db[PATIENTS_COLLECTION].create_index([("user_id", ASCENDING)], unique=True)

    # Appointments collection indexes
    db[APPOINTMENTS_COLLECTION].create_index([("patient_id", ASCENDING)])
    db[APPOINTMENTS_COLLECTION].create_index([("doctor_id", ASCENDING)])
    db[APPOINTMENTS_COLLECTION].create_index([("status", ASCENDING)])
    db[APPOINTMENTS_COLLECTION].create_index([("date", ASCENDING)])
    db[APPOINTMENTS_COLLECTION].create_index(
        [("patient_id", ASCENDING), ("status", ASCENDING)]
    )
    # Compound indexes for common query patterns (fixes N+1 queries)
    db[APPOINTMENTS_COLLECTION].create_index(
        [("doctor_id", ASCENDING), ("status", ASCENDING), ("date", ASCENDING)]
    )
    db[APPOINTMENTS_COLLECTION].create_index(
        [("patient_id", ASCENDING), ("doctor_id", ASCENDING), ("status", ASCENDING)]
    )

    # Medical records indexes
    db[MEDICAL_RECORDS_COLLECTION].create_index([("patient_id", ASCENDING)])

    # Prescriptions indexes
    db[PRESCRIPTIONS_COLLECTION].create_index([("patient_id", ASCENDING)])
    db[PRESCRIPTIONS_COLLECTION].create_index([("doctor_id", ASCENDING)])
    db[PRESCRIPTIONS_COLLECTION].create_index([("appointment_id", ASCENDING)])

    # Schedules indexes
    db[SCHEDULES_COLLECTION].create_index([("doctor_id", ASCENDING)], unique=True)

    # Prescriptions indexes - compound for common queries
    db[PRESCRIPTIONS_COLLECTION].create_index(
        [("patient_id", ASCENDING), ("created_at", ASCENDING)]
    )
    db[PRESCRIPTIONS_COLLECTION].create_index(
        [("doctor_id", ASCENDING), ("created_at", ASCENDING)]
    )

    # Notifications indexes
    db[NOTIFICATIONS_COLLECTION].create_index([("user_id", ASCENDING)])
    db[NOTIFICATIONS_COLLECTION].create_index(
        [("user_id", ASCENDING), ("read", ASCENDING)]
    )

    # Chat history indexes
    db[CHAT_HISTORY_COLLECTION].create_index([("user_id", ASCENDING)])

    # Ratings indexes
    db[RATINGS_COLLECTION].create_index([("doctor_id", ASCENDING)])
    db[RATINGS_COLLECTION].create_index([("appointment_id", ASCENDING)])


# Collection names
USERS_COLLECTION = "users"
DOCTORS_COLLECTION = "doctors"
PATIENTS_COLLECTION = "patients"
MEDICAL_RECORDS_COLLECTION = "medical_records"
APPOINTMENTS_COLLECTION = "appointments"
CHAT_HISTORY_COLLECTION = "chat_history"
RATINGS_COLLECTION = "ratings"
PRESCRIPTIONS_COLLECTION = "prescriptions"
SCHEDULES_COLLECTION = "schedules"
NOTIFICATIONS_COLLECTION = "notifications"
