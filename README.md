# Electra — Election Education Assistant

An interactive web application that teaches users about election processes in the
**United Kingdom**, **United States**, and **India**. Designed for first-time voters,
students, and civic groups.

[![Python 3.11](https://img.shields.io/badge/python-3.11-blue)](https://python.org)
[![React 18](https://img.shields.io/badge/react-18-61dafb)](https://react.dev)
[![License: MIT](https://img.shields.io/badge/license-MIT-green)](LICENSE)

---

## Live Application

- **Frontend:** [https://electra-app-2026.web.app](https://electra-app-2026.web.app)
- **Backend API:** [https://electra-api-368835973060.us-central1.run.app/docs](https://electra-api-368835973060.us-central1.run.app/docs)

## Architecture

```
[Browser]
│
├── Firebase Hosting (CDN)
│       └── React 18 SPA (Vite)
│               │
│               ├── Firebase Auth (Google OAuth + email/password)
│               ├── Firebase Analytics (consent-gated, GDPR)
│               └── Google Maps JS API (polling station map)
│
└── Cloud Run (FastAPI backend)
    ├── Cloud Firestore (topics, quiz, users, timeline, feedback)
    ├── Firebase Admin SDK (JWT verification)
    ├── Dialogflow CX (conversational chat assistant)
    └── Google Calendar URL API (Add to Calendar links)
```

## Google Services Used (8 total)

| Service | Purpose | Where Used |
|---|---|---|
| **Firebase Auth** | User login (Google OAuth + email/password) | Frontend + backend JWT verification |
| **Cloud Firestore** | All dynamic data (topics, quiz, users, timeline, feedback) | Backend service layer |
| **Cloud Run** | Backend hosting (auto-scaling, serverless containers) | Backend deployment |
| **Firebase Hosting** | Frontend CDN hosting with global edge caching | Frontend deployment |
| **Google Calendar API** | "Add to Calendar" for election dates (URL approach) | Frontend calendarService.js |
| **Google Maps JS API** | Polling station locator map | Frontend PollingMap.jsx |
| **Firebase Analytics** | User engagement tracking (GDPR-compliant, consent-gated) | Frontend analytics.js |
| **Dialogflow CX** | Conversational assistant chat | Backend chat route → dialogflow_service.py |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3, React Router v6, Recharts |
| Backend | Python 3.11, FastAPI, Pydantic v2, SlowAPI |
| Database | Google Cloud Firestore (native mode) |
| Auth | Firebase Auth (JWT) + Firebase Admin SDK |
| Testing | Vitest + React Testing Library (frontend), pytest + pytest-asyncio (backend) |

## Known Limitations

**Rate limiting**: The backend uses [slowapi](https://github.com/laurentS/slowapi) with
in-memory counters per IP. Cloud Run with multiple instances means each instance has its
own independent counter — the 5/hour feedback limit is not enforced globally across
all instances. For production hardening, replace with a Firestore-based or Redis counter.

## Local Setup

### Prerequisites
- Python 3.11+
- Node.js 20+
- A Google Cloud project with Firestore, Firebase Auth, and Cloud Run enabled
- A Firebase project (can be the same GCP project)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your GOOGLE_CLOUD_PROJECT and FIREBASE_SERVICE_ACCOUNT_KEY in .env

python -m venv venv && source venv/bin/activate
pip install -r requirements-dev.txt

# Seed initial data
python seed_data.py

# Start dev server
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
cp .env.example .env.local
# Fill in all VITE_* variables in .env.local

npm install
npm run dev
# Open http://localhost:5173
```

### Running Tests

```bash
# Backend
cd backend && pytest tests/ --cov=app --cov-report=term-missing

# Frontend
cd frontend && npm test

# With coverage
cd backend && pytest tests/ --cov=app --cov-fail-under=80
cd frontend && npm run test:coverage
```

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `GOOGLE_CLOUD_PROJECT` | GCP project ID | `electra-app-2026` |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | Path to service account JSON (dev only) | `./serviceAccountKey.json` |
| `DIALOGFLOW_AGENT_ID` | Dialogflow CX agent ID (leave empty to disable) | `abc123-uuid` |
| `DIALOGFLOW_LOCATION` | Dialogflow location | `global` |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:5173` |
| `SECRET_KEY` | Random string ≥32 chars | `$(python -c "import secrets; print(secrets.token_hex(32))")` |
| `RATE_LIMIT_PER_MINUTE` | Default slowapi limit | `120` |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Backend API URL including `/api/v1` |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID |
| `VITE_FIREBASE_APP_ID` | Firebase app ID |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics measurement ID |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps JS API key |

## Deployment

See the `.github/workflows/deploy.yml` for the full CI/CD pipeline. The workflow:

1. Runs backend tests with ≥80% coverage requirement
2. Builds and pushes the Docker image to GCR
3. Deploys to Cloud Run
4. Builds the React app with production env vars
5. Runs frontend tests with ≥70% coverage requirement
6. Deploys to Firebase Hosting

## Content Sources

| Country | Authority | URL |
|---|---|---|
| 🇬🇧 UK | Electoral Commission | electoralcommission.org.uk |
| 🇬🇧 UK | GOV.UK | gov.uk/register-to-vote |
| 🇺🇸 US | USA.gov | usa.gov |
| 🇺🇸 US | NCSL | ncsl.org |
| 🇮🇳 India | ECI | eci.gov.in |
| 🇮🇳 India | Voter Portal | voterportal.eci.gov.in |

## Accessibility

Electra targets WCAG 2.1 AA compliance:

- Skip navigation link on every page
- All interactive elements keyboard navigable with visible focus rings
- Screen reader announcements for dynamic content changes
- Colour is never the sole indicator — icons and text labels always accompany colour
- All form inputs have associated `<label>` elements
- Modal dialogs trap focus and restore on close

## License

MIT
