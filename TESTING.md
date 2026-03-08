# Testing Guide

This repository includes backend API tests, frontend component tests, and Cypress end-to-end test support.

## Backend testing

The backend test suite uses `pytest` with `mongomock` for isolated database behavior.

### Prerequisites

- Python 3.12+
- Backend dependencies installed in `backend/.venv`

### Run backend tests

```bash
cd backend
source .venv/bin/activate
pytest
```

Useful variants:

```bash
pytest -v
pytest tests/test_routes.py
pytest tests/test_security.py
pytest tests/test_ai_safety.py
pytest tests/test_video_calls.py
```

Notes:

- Pytest configuration lives in `backend/pytest.ini`.
- Most automated tests run against mocked MongoDB behavior through `mongomock`.
- Some files in `backend/tests` are diagnostic scripts rather than normal pytest suites.

## Frontend testing

The frontend uses Jest and React Testing Library for component and context tests.

### Run frontend tests

```bash
cd frontend
npm test
```

Useful variants:

```bash
npm run test:watch
npm run type-check
npm run lint
```

## E2E testing

The project includes Cypress configuration for browser-level testing.

### Prerequisites

Start both applications before running Cypress.

### Terminal 1: backend

```bash
cd backend
source .venv/bin/activate
python app.py
```

Backend URL:

- `http://localhost:5000`

### Terminal 2: frontend

```bash
cd frontend
npm run dev
```

Frontend URL:

- `http://localhost:4028`

### Terminal 3: Cypress

```bash
cd frontend
npm run test:e2e
```

Or open the interactive runner:

```bash
cd frontend
npm run test:e2e:open
```

Notes:

- Cypress is configured with `http://localhost:4028` as the base URL.
- If you change the frontend dev port, update `frontend/cypress.config.ts` to match.
