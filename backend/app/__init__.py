from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from .database import init_db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Extensions
    CORS(app)
    JWTManager(app)
    
    # Initialize database
    init_db(app)

    # Register Blueprints
    from .routes.auth import auth_bp
    from .routes.doctors import doctors_bp
    from .routes.appointments import appointments_bp
    from .routes.ai import ai_bp
    from .routes.patients import patients_bp
    from .routes.messages import messages_bp
    from .routes.chatbot import chatbot_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(doctors_bp, url_prefix='/api/doctors')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')

    return app

