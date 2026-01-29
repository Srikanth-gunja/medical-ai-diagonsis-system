from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .config import Config
from .database import init_db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    
    # Disable strict slashes to prevent 308 redirects that break CORS
    app.url_map.strict_slashes = False

    # Extensions - Enhanced CORS to handle preflight requests properly
    CORS(app, resources={r"/api/*": {"origins": "*", "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], "allow_headers": ["Content-Type", "Authorization"]}})
    JWTManager(app)
    
    # Initialize database
    init_db(app)

    # Register Blueprints
    from .routes.auth import auth_bp
    from .routes.doctors import doctors_bp
    from .routes.appointments import appointments_bp
    from .routes.patients import patients_bp
    from .routes.messages import messages_bp
    from .routes.chatbot import chatbot_bp
    from .routes.ratings import ratings_bp
    from .routes.prescriptions import prescriptions_bp
    from .routes.schedules import schedules_bp
    from .routes.analytics import analytics_bp
    from .routes.reports import reports_bp
    from .routes.activities import activities_bp
    from .routes.notifications import notifications_bp
    from .routes.admin import admin_bp
    from .routes.video import video_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(doctors_bp, url_prefix='/api/doctors')
    app.register_blueprint(appointments_bp, url_prefix='/api/appointments')
    app.register_blueprint(patients_bp, url_prefix='/api/patients')
    app.register_blueprint(messages_bp, url_prefix='/api/messages')
    app.register_blueprint(chatbot_bp, url_prefix='/api/chatbot')
    app.register_blueprint(ratings_bp, url_prefix='/api/ratings')
    app.register_blueprint(prescriptions_bp, url_prefix='/api/prescriptions')
    app.register_blueprint(schedules_bp, url_prefix='/api/schedules')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(activities_bp, url_prefix='/api/activities')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    app.register_blueprint(video_bp, url_prefix='/api/video')

    return app

