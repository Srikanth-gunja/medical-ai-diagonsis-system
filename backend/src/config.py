import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


def _is_truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY")
    DEBUG = _is_truthy(os.environ.get("FLASK_DEBUG"))
    JWT_TOKEN_LOCATION = ["headers"]
    JWT_QUERY_STRING_NAME = "token"

    # SECURITY: JWT Token expiration - 24 hours
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=24)

    # MongoDB Configuration
    MONGO_URI = os.environ.get("MONGO_URI") or "mongodb://127.0.0.1:27017/"
    MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME") or "medical_project"

    # Google Gemini API Configuration
    GOOGLE_API_KEY = os.environ.get("GOOGLE_API_KEY") or ""

    # GetStream Configuration
    GETSTREAM_API_KEY = os.environ.get("GETSTREAM_API_KEY") or ""
    GETSTREAM_API_SECRET = os.environ.get("GETSTREAM_API_SECRET") or ""

    # SSE token TTL and realtime queue sizing
    SSE_TOKEN_TTL_SECONDS = int(os.environ.get("SSE_TOKEN_TTL_SECONDS", "60"))
    REALTIME_QUEUE_MAXSIZE = int(os.environ.get("REALTIME_QUEUE_MAXSIZE", "200"))

    # Appointment timezone for scheduling and video call validation
    APPOINTMENT_TIMEZONE = os.environ.get("APPOINTMENT_TIMEZONE", "Asia/Kolkata")

    # Auth rate limiting
    AUTH_RATE_LIMIT_WINDOW_SECONDS = int(
        os.environ.get("AUTH_RATE_LIMIT_WINDOW_SECONDS", "60")
    )
    AUTH_RATE_LIMIT_MAX_LOGIN = int(os.environ.get("AUTH_RATE_LIMIT_MAX_LOGIN", "20"))
    AUTH_RATE_LIMIT_MAX_REGISTER = int(
        os.environ.get("AUTH_RATE_LIMIT_MAX_REGISTER", "10")
    )
