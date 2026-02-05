import os
from src import create_app

app = create_app()

if __name__ == "__main__":
    # SECURITY: Debug mode controlled by environment variable
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() in ("true", "1", "yes")
    app.run(host="0.0.0.0", port=5000, debug=debug_mode)
