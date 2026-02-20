from pymongo import MongoClient, ASCENDING
from flask import current_app, g
import logging


logger = logging.getLogger(__name__)


def _create_mongo_client():
    """Create a process-wide Mongo client with pooling options."""
    max_pool_size = int(current_app.config.get("MONGO_MAX_POOL_SIZE", 100))
    min_pool_size = int(current_app.config.get("MONGO_MIN_POOL_SIZE", 5))
    server_selection_timeout_ms = int(
        current_app.config.get("MONGO_SERVER_SELECTION_TIMEOUT_MS", 5000)
    )
    connect_timeout_ms = int(current_app.config.get("MONGO_CONNECT_TIMEOUT_MS", 10000))
    socket_timeout_ms = int(current_app.config.get("MONGO_SOCKET_TIMEOUT_MS", 10000))

    return MongoClient(
        current_app.config["MONGO_URI"],
        maxPoolSize=max_pool_size,
        minPoolSize=min_pool_size,
        serverSelectionTimeoutMS=server_selection_timeout_ms,
        connectTimeoutMS=connect_timeout_ms,
        socketTimeoutMS=socket_timeout_ms,
    )


def get_mongo_client():
    """Get shared MongoClient from Flask app extensions."""
    client = current_app.extensions.get("mongo_client")
    if client is None:
        client = _create_mongo_client()
        current_app.extensions["mongo_client"] = client
    return client


def get_db():
    """Get database connection from Flask application context."""
    if "db" not in g:
        client = get_mongo_client()
        g.db = client[current_app.config["MONGO_DB_NAME"]]
    return g.db


def close_db(e=None):  # noqa: ARG001
    """Remove request-local db handle (shared MongoClient stays alive)."""
    g.pop("db", None)


def close_mongo_client(e=None):  # noqa: ARG001
    """Close shared Mongo client when application shuts down."""
    client = current_app.extensions.pop("mongo_client", None)
    if client is not None:
        client.close()


def init_db(app):
    """Initialize database connection with Flask app."""
    app.teardown_appcontext(close_db)

    # Create indexes for better query performance
    with app.app_context():
        try:
            db = get_db()
            _create_indexes(db)
        except Exception:
            logger.exception("Skipping DB index initialization because database is unavailable")


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
    # Enforce one active booking per doctor/date/time to prevent race-condition double-booking.
    try:
        db[APPOINTMENTS_COLLECTION].create_index(
            [("doctor_id", ASCENDING), ("date", ASCENDING), ("time", ASCENDING)],
            unique=True,
            partialFilterExpression={
                "status": {"$in": ["pending", "confirmed", "in_progress", "completed", "no_show"]}
            },
            name="uniq_active_doctor_slot",
        )
    except Exception as exc:
        logger.warning("Could not create uniq_active_doctor_slot index: %s", exc)
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

    # Chatbot rate limits indexes (distributed window counting)
    db[CHATBOT_RATE_LIMITS_COLLECTION].create_index(
        [("user_id", ASCENDING), ("created_at", ASCENDING)]
    )
    # Keep rate-limit events for 24 hours
    db[CHATBOT_RATE_LIMITS_COLLECTION].create_index(
        [("created_at", ASCENDING)],
        expireAfterSeconds=24 * 60 * 60,
        name="chatbot_rate_limits_ttl_24h",
    )

    # Ratings indexes
    db[RATINGS_COLLECTION].create_index([("doctor_id", ASCENDING)])
    db[RATINGS_COLLECTION].create_index([("appointment_id", ASCENDING)])

    # Messages indexes (chat performance)
    db[MESSAGES_COLLECTION].create_index(
        [("appointment_id", ASCENDING), ("created_at", ASCENDING)]
    )
    db[MESSAGES_COLLECTION].create_index(
        [("appointment_id", ASCENDING), ("sender_role", ASCENDING), ("read", ASCENDING)]
    )


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
MESSAGES_COLLECTION = "messages"
CHATBOT_RATE_LIMITS_COLLECTION = "chatbot_rate_limits"
