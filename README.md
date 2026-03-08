# MediCare

Full-stack healthcare platform for patient onboarding, doctor onboarding, appointment booking, AI-assisted symptom guidance, real-time updates, secure messaging, prescriptions, reports, and video consultations.

This project is split into:

- `frontend/`: Next.js application for patients, doctors, and admins
- `backend/`: Flask API backed by MongoDB

## What the project does

### Patient experience
- Register and manage a patient profile
- Browse doctors and check available slots
- Book, reschedule, cancel, and review appointments
- Access prescriptions, lab reports, and medical history
- Chat with doctors
- Use an AI chatbot for symptom guidance
- Join video consultations

### Doctor experience
- Register for doctor onboarding and verification
- Manage appointment requests and schedules
- Review patient history
- Chat with patients
- Create prescriptions
- Track dashboard analytics
- Start and end video consultations

### Admin experience
- Review doctor verification requests
- View platform-level stats
- Manage users and profile update approvals

## Tech stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- Tailwind CSS
- TanStack Query
- GetStream Video SDK
- Jest + React Testing Library
- Cypress

### Backend
- Python 3.12
- Flask
- PyMongo + MongoDB
- Flask-JWT-Extended
- LangChain + Google Gemini
- ReportLab
- Pytest + mongomock

## Architecture

### Frontend
- App Router application in `frontend/src/app`
- Role-based flows for patient, doctor, and admin dashboards
- Shared providers for auth, theme, React Query, toast notifications, and video calls
- API client in `frontend/src/lib/api.ts`

### Backend
- Flask app factory in `backend/src/__init__.py`
- Entry point in `backend/app.py`
- Modular route groups under `backend/src/routes`
- MongoDB collections and indexes initialized in `backend/src/database.py`
- Realtime updates delivered with server-sent events under `/api/events`

## Project structure

```text
medical-ai-diagonsis-system/
├── README.md
├── TESTING.md
├── render.yaml
├── backend/
│   ├── app.py
│   ├── seed_data.py
│   ├── requirements.txt
│   ├── pyproject.toml
│   ├── pytest.ini
│   ├── src/
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── realtime.py
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   └── tests/
└── frontend/
    ├── package.json
    ├── next.config.mjs
    ├── cypress.config.ts
    └── src/
        ├── app/
        ├── components/
        ├── contexts/
        ├── hooks/
        ├── lib/
        ├── providers/
        └── styles/
```

## Core API modules

The Flask backend exposes these main route groups:

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

Additional documentation:

- Backend setup and API service notes: `backend/README.md`
- Test workflow: `TESTING.md`

## Prerequisites

- Python 3.12+
- Node.js 18+
- MongoDB
- `npm`
- `uv` recommended for backend dependency management

## Environment variables

### Backend

Create `backend/.env` with at least, or start from `backend/.env.example`:

```env
SECRET_KEY=replace-this
JWT_SECRET_KEY=replace-this-too
MONGO_URI=mongodb://127.0.0.1:27017/
MONGO_DB_NAME=medical_project
CORS_ORIGINS=http://localhost:4028
APPOINTMENT_TIMEZONE=Asia/Kolkata
```

Optional backend variables:

```env
GOOGLE_API_KEY=your_google_gemini_key
GETSTREAM_API_KEY=your_stream_key
GETSTREAM_API_SECRET=your_stream_secret
FLASK_DEBUG=true
```

Notes:

- `SECRET_KEY` and `JWT_SECRET_KEY` are required. The backend will not start without them.
- `GOOGLE_API_KEY` is required for chatbot and AI-generated report features.
- `GETSTREAM_API_KEY` and `GETSTREAM_API_SECRET` are required for video calling.

### Frontend

Create `frontend/.env.local` with:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_GETSTREAM_API_KEY=your_stream_key
```

Notes:

- `NEXT_PUBLIC_API_URL` should point to the Flask backend for local development.
- `NEXT_PUBLIC_GETSTREAM_API_KEY` is only needed if you want video calls enabled in the UI.

## Installation

### 1. Backend setup

```bash
cd backend
uv sync
source .venv/bin/activate
```

If you do not want to use `uv`, install from `requirements.txt` instead.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Frontend setup

```bash
cd frontend
npm install
```

## Running locally

### Backend

```bash
cd backend
source .venv/bin/activate
python app.py
```

Backend runs on:

- `http://localhost:5000`

Health check:

- `http://localhost:5000/api/health`

### Frontend

```bash
cd frontend
npm run dev
```

Frontend runs on:

- `http://localhost:4028`

The root route redirects to:

- `http://localhost:4028/homepage`

## Optional seed data

To populate MongoDB with sample data:

```bash
cd backend
source .venv/bin/activate
python seed_data.py
```

## Quick start

### Terminal 1

```bash
cd backend
uv sync
source .venv/bin/activate
python app.py
```

### Terminal 2

```bash
cd frontend
npm install
npm run dev
```

## Testing

### Backend tests

```bash
cd backend
source .venv/bin/activate
pytest
```

Backend tests cover:

- authentication flows
- booking flow
- RBAC and security behavior
- chatbot service behavior
- AI safety checks
- video call metadata handling

### Frontend tests

```bash
cd frontend
npm test
npm run type-check
npm run lint
```

### E2E tests

```bash
cd frontend
npm run test:e2e
```

The Cypress base URL is configured for:

- `http://localhost:4028`

## Realtime and video

- Realtime dashboard updates use server-sent events through `/api/events`
- Appointment and message activity can publish live events to subscribed users
- Video calls are built on GetStream

## Deployment

The repository includes `render.yaml` for backend deployment on Render.

Configured backend deployment:

- root directory: `backend`
- build command: `pip install -r requirements.txt`
- start command: `python -m gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --worker-class gthread --threads 8`

## Important note

The AI chatbot in this project is an assistive feature. It should be treated as informational support, not as a replacement for professional medical advice, diagnosis, or treatment.
