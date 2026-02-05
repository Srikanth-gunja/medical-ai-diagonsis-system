import os
from dotenv import load_dotenv

load_dotenv()


def _is_truthy(value: str | None) -> bool:
    if value is None:
        return False
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    DEBUG = _is_truthy(os.environ.get('FLASK_DEBUG'))
    JWT_TOKEN_LOCATION = ['headers']
    
    # MongoDB Configuration
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://127.0.0.1:27017/'
    MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME') or 'medical_project'
    
    # Google Gemini API Configuration
    GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY') or ''

    # GetStream Configuration
    GETSTREAM_API_KEY = os.environ.get('GETSTREAM_API_KEY') or ''
    GETSTREAM_API_SECRET = os.environ.get('GETSTREAM_API_SECRET') or ''
