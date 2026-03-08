# Backend

Flask API for the MediCare platform.

This service handles authentication, doctor and patient profiles, appointments, schedules, messaging, notifications, analytics, reports, AI chatbot requests, realtime event streaming, and video call orchestration.

## Stack

- Python 3.12
- Flask
- PyMongo
- MongoDB
- Flask-JWT-Extended
- LangChain + Google Gemini
- ReportLab
- Pytest + mongomock

## Important files

- `app.py`: backend entry point
- `src/__init__.py`: Flask app factory and route registration
- `src/config.py`: environment-based configuration
- `src/database.py`: MongoDB client setup and index creation
- `src/realtime.py`: server-sent event pub/sub helpers
- `seed_data.py`: sample data seeding script

## API route groups

- `/api/auth`
- `/api/doctors`
- `/api/appointments`
- `/api/patients`
- `/api/messages`
- `/api/chatbot`
- `/api/ratings`
- `/api/prescriptions`
- `/api/schedules`
- `/api/analytics`
- `/api/reports`
- `/api/activities`
- `/api/notifications`
- `/api/admin`
- `/api/video-calls`
- `/api/events`
- `/api/health`

## Setup

### Install dependencies with uv

```bash
cd backend
uv sync
source .venv/bin/activate
```

### Or install with pip

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Environment

Copy the example file and fill in secrets:

```bash
cp .env.example .env
```

Minimum required values:

```env
SECRET_KEY=replace-this
JWT_SECRET_KEY=replace-this-too
MONGO_URI=mongodb://127.0.0.1:27017/
MONGO_DB_NAME=medical_project
CORS_ORIGINS=http://localhost:4028
APPOINTMENT_TIMEZONE=Asia/Kolkata
```

Optional integrations:

```env
GOOGLE_API_KEY=your_google_gemini_key
GETSTREAM_API_KEY=your_stream_key
GETSTREAM_API_SECRET=your_stream_secret
FLASK_DEBUG=true
```

Notes:

- `SECRET_KEY` and `JWT_SECRET_KEY` are required or the app will fail at startup.
- `GOOGLE_API_KEY` enables chatbot and AI-assisted report functionality.
- `GETSTREAM_API_KEY` and `GETSTREAM_API_SECRET` enable video calling.

## Run locally

```bash
cd backend
source .venv/bin/activate
python app.py
```

Default local URLs:

- API base: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## Seed sample data

```bash
cd backend
source .venv/bin/activate
python seed_data.py
```

## Tests

```bash
cd backend
source .venv/bin/activate
pytest
```

Useful test targets:

```bash
pytest tests/test_routes.py
pytest tests/test_security.py
pytest tests/test_ai_safety.py
pytest tests/test_video_calls.py
```

## Deployment

The repository includes a Render service definition in the root `render.yaml`.

Configured production command:

```bash
python -m gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --worker-class gthread --threads 8
```
