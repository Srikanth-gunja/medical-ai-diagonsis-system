from flask import Flask, request
from flask_jwt_extended import JWTManager
from .config import Config
from .database import init_db, close_mongo_client


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Disable strict slashes to prevent 308 redirects that break CORS
    app.url_map.strict_slashes = False

    # Extensions
    JWTManager(app)

    def _allowed_origins():
        raw = app.config.get("CORS_ORIGINS", "")
        return [origin.strip() for origin in raw.split(",") if origin.strip()]

    def _set_cors_headers(response):
        allowed_origins = _allowed_origins()
        origin = request.headers.get("Origin")

        # Credentialed requests (including EventSource with credentials) require
        # a concrete origin, never "*".
        if origin:
            if not allowed_origins or origin in allowed_origins:
                response.headers["Access-Control-Allow-Origin"] = origin
                existing_vary = response.headers.get("Vary", "")
                if "Origin" not in existing_vary:
                    response.headers["Vary"] = (
                        f"{existing_vary}, Origin" if existing_vary else "Origin"
                    )
        elif not allowed_origins:
            # Allow non-browser clients when CORS_ORIGINS is not configured.
            response.headers["Access-Control-Allow-Origin"] = "*"

        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = (
            "GET, POST, PUT, PATCH, DELETE, OPTIONS"
        )
        response.headers["Access-Control-Allow-Headers"] = (
            "Content-Type, Authorization, X-Requested-With, Accept, Origin"
        )
        response.headers["Access-Control-Expose-Headers"] = (
            "Content-Type, Authorization"
        )
        return response

    if not app.config.get("SECRET_KEY") or not app.config.get("JWT_SECRET_KEY"):
        raise RuntimeError(
            "SECRET_KEY and JWT_SECRET_KEY must be set via environment variables."
        )

    # Add CORS headers to ALL responses including error responses
    @app.after_request
    def after_request(response):
        response = _set_cors_headers(response)
        if request.path.startswith("/api/") and "Cache-Control" not in response.headers:
            # Prevent browser/proxy cache reuse across different authenticated users.
            response.headers["Cache-Control"] = (
                "no-store, no-cache, must-revalidate, max-age=0, private"
            )
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        return response

    # Handle preflight OPTIONS requests
    @app.before_request
    def handle_preflight():
        if request.method == "OPTIONS":
            from flask import make_response

            response = make_response()
            response = _set_cors_headers(response)
            response.headers["Access-Control-Max-Age"] = "86400"
            return response

    # Initialize database
    init_db(app)
    app.teardown_appcontext(close_mongo_client)

    @app.route("/api/health")
    def health_check():
        return {"status": "operational"}, 200

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
    from .routes.video_calls import video_calls_bp
    from .routes.events import events_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(doctors_bp, url_prefix="/api/doctors")
    app.register_blueprint(appointments_bp, url_prefix="/api/appointments")
    app.register_blueprint(patients_bp, url_prefix="/api/patients")
    app.register_blueprint(messages_bp, url_prefix="/api/messages")
    app.register_blueprint(chatbot_bp, url_prefix="/api/chatbot")
    app.register_blueprint(ratings_bp, url_prefix="/api/ratings")
    app.register_blueprint(prescriptions_bp, url_prefix="/api/prescriptions")
    app.register_blueprint(schedules_bp, url_prefix="/api/schedules")
    app.register_blueprint(analytics_bp, url_prefix="/api/analytics")
    app.register_blueprint(reports_bp, url_prefix="/api/reports")
    app.register_blueprint(activities_bp, url_prefix="/api/activities")
    app.register_blueprint(notifications_bp, url_prefix="/api/notifications")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(video_calls_bp, url_prefix="/api/video-calls")
    app.register_blueprint(events_bp, url_prefix="/api/events")

    return app
