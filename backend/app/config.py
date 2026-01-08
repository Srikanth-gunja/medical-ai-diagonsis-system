import os
from dotenv import load_dotenv
load_dotenv()
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-me'
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or 'jwt-secret-key-change-me'
    DEBUG = True
    
    # MongoDB Configuration
    MONGO_URI = os.environ.get('MONGO_URI') or 'mongodb://127.0.0.1:27017/'
    MONGO_DB_NAME = os.environ.get('MONGO_DB_NAME') or 'medical_project'
    
    # Google Gemini API Configuration
    GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY') or ''
