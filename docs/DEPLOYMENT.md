# Electra — Deployment Guide

> **Referenced by:** README.md → Deployment section  
> **Audience:** Developers deploying Electra to production on Google Cloud Platform

---

## Prerequisites

Before deploying, ensure you have the following tools installed and authenticated:

| Tool | Minimum Version | Install |
|------|----------------|---------|
| `gcloud` CLI | ≥ 450.0.0 | [cloud.google.com/sdk](https://cloud.google.com/sdk/docs/install) |
| `firebase` CLI | ≥ 13.0.0 | `npm install -g firebase-tools` |
| Node.js | 20.x LTS | [nodejs.org](https://nodejs.org) |
| Python | 3.11+ | [python.org](https://python.org) |
| Docker | Latest stable | [docker.com](https://docker.com) (needed for local builds only) |

Authenticate both CLIs before proceeding:

```bash
gcloud auth login
gcloud auth application-default login
firebase login
```

---

## 1. Google Cloud Setup (one-time)

### 1.1 Create or select a GCP project

```bash
# Create a new project (replace XXXX with a unique suffix)
gcloud projects create electra-XXXX --name="Electra"

# Or select an existing project
gcloud config set project YOUR_PROJECT_ID
```

### 1.2 Enable required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  firestore.googleapis.com \
  firebase.googleapis.com \
  dialogflow.googleapis.com \
  maps-backend.googleapis.com \
  analytics.googleapis.com
```

### 1.3 Create Firestore database

```bash
gcloud firestore databases create \
  --location=us-central1 \
  --type=firestore-native
```

> **Note:** Choose `us-central1` for lowest latency with Cloud Run in the same region.

### 1.4 Link Firebase

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Add project** → select your existing GCP project
3. Enable **Firebase Auth**:
   - Go to **Authentication → Sign-in method**
   - Enable: **Google** and **Email/Password** providers

### 1.5 Create a backend service account

```bash
# Create the service account
gcloud iam service-accounts create electra-backend \
  --display-name "Electra Backend Service Account"

# Grant required roles
PROJECT_ID=$(gcloud config get-value project)
SA_EMAIL="electra-backend@${PROJECT_ID}.iam.gserviceaccount.com"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/datastore.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/firebase.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/dialogflow.client"
```

### 1.6 Store credentials in Secret Manager

```bash
# Download the key (temporary — delete after storing in Secret Manager)
gcloud iam service-accounts keys create /tmp/sa-key.json \
  --iam-account="${SA_EMAIL}"

# Store in Secret Manager
gcloud secrets create FIREBASE_SERVICE_ACCOUNT_KEY \
  --data-file=/tmp/sa-key.json

# IMPORTANT: delete the local copy immediately
rm /tmp/sa-key.json
```

> **⚠ CAUTION:** Never commit `sa-key.json` or any `*-key.json` file to the repository.
> The `.gitignore` is configured to reject them, but verify manually before pushing.

### 1.7 Restrict the Google Maps API key

1. GCP Console → **APIs & Services → Credentials**
2. Find your Maps API key → click **Edit**
3. Under **Application restrictions**: select **HTTP referrers (websites)**
4. Add your Firebase Hosting domain: `https://your-project.web.app/*`

---

## 2. Firebase Setup (one-time)

```bash
# From repo root
firebase init hosting
# ↳ Select existing project
# ↳ Public directory: frontend/dist
# ↳ Single-page app rewrite: yes
# ↳ Overwrite index.html: no

firebase init firestore
# ↳ Uses existing firestore.rules and firestore.indexes.json from the repo

# Deploy security rules and indexes
firebase deploy --only firestore:rules,firestore:indexes
```

---

## 3. Seed Initial Data

Run once to populate Firestore with the 10 topics, 10 timeline events, and 13 quiz questions:

```bash
cd backend
pip install -r requirements.txt

export GOOGLE_CLOUD_PROJECT=your-project-id
export FIREBASE_SERVICE_ACCOUNT_KEY=/path/to/temporary-key.json

python seed_data.py
```

Verify the data was written:

```bash
# Using Firebase CLI
firebase firestore:get /topics --project your-project-id

# Or check Firebase Console → Firestore → Data
```

---

## 4. Backend Deployment (Cloud Run via Cloud Build)

### 4.1 First deployment (manual)

```bash
# From repo root — submit the backend/ directory as the build context
gcloud builds submit backend/ \
  --config backend/cloudbuild.yaml \
  --substitutions _REGION=us-central1
```

This builds the Docker image, pushes it to Container Registry, and deploys to Cloud Run.
Build takes approximately 3–5 minutes on E2_HIGHCPU_8.

### 4.2 Set Cloud Run environment variables

```bash
gcloud run services update electra-api \
  --update-env-vars ALLOWED_ORIGINS=https://your-project.web.app \
  --update-env-vars DIALOGFLOW_AGENT_ID=your-agent-id \
  --update-env-vars DIALOGFLOW_LOCATION=global \
  --update-env-vars ENVIRONMENT=production \
  --update-secrets FIREBASE_SERVICE_ACCOUNT_KEY=FIREBASE_SERVICE_ACCOUNT_KEY:latest \
  --region us-central1
```

Verify the service is running:

```bash
gcloud run services describe electra-api --region us-central1 --format="value(status.url)"
```

---

## 5. Frontend Deployment (Firebase Hosting)

```bash
cd frontend

# Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local — fill in all VITE_* values from Firebase Console

# Build production bundle
npm run build

# Deploy to Firebase Hosting
firebase deploy --only hosting
```

The app will be available at `https://your-project.web.app`.

---

## 6. GitHub Actions CI/CD Setup

All CI/CD workflows are in `.github/workflows/`. They run automatically on push to `main`.

### Required GitHub Secrets

Add these in your repo: **Settings → Secrets and variables → Actions → New repository secret**

| Secret | Value |
|--------|-------|
| `GCP_PROJECT_ID` | Your GCP project ID |
| `GCP_SA_KEY` | JSON of service account with Cloud Build + Run + Storage + Firebase roles |
| `FIREBASE_SERVICE_ACCOUNT` | JSON of Firebase service account (for `firebase deploy`) |
| `VITE_API_BASE_URL` | `https://electra-api-xxx.run.app/api/v1` |
| `VITE_FIREBASE_API_KEY` | From Firebase Console → Project Settings → Web App |
| `VITE_FIREBASE_AUTH_DOMAIN` | `your-project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Your GCP/Firebase project ID |
| `VITE_FIREBASE_STORAGE_BUCKET` | `your-project.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | From Firebase Console |
| `VITE_FIREBASE_APP_ID` | From Firebase Console |
| `VITE_FIREBASE_MEASUREMENT_ID` | From Firebase Console (Analytics) |
| `VITE_GOOGLE_MAPS_API_KEY` | Your restricted Maps API key |

### CI/CD Pipeline Order

```
push to main
  ├── backend-test.yml    → pytest + coverage check (≥ 80%)
  ├── deploy.yml          → (after tests pass)
  │     ├── gcloud builds submit  → Cloud Run deployment
  │     └── firebase deploy       → Hosting deployment (after frontend tests pass)
  └── e2e.yml             → Playwright E2E tests (on PR + main)
```

---

## 7. Dialogflow CX Agent Setup

Dialogflow CX provides the chat assistant. The backend degrades gracefully if not configured.

1. GCP Console → **Dialogflow CX** → Create Agent
2. Set location to match `DIALOGFLOW_LOCATION` (default: `global`)
3. Create the following intents (or import from `docs/dialogflow-agent/` if provided):
   - `voter_registration_uk`
   - `voter_registration_us`
   - `voter_registration_in`
   - `voter_id`
   - `polling_station`
   - `election_date`
   - `campaign_rules`
4. Copy the **Agent ID** from the agent URL
5. Update Cloud Run:

```bash
gcloud run services update electra-api \
  --update-env-vars DIALOGFLOW_AGENT_ID=your-agent-id \
  --region us-central1
```

6. Test via the API:

```bash
curl -X POST https://electra-api-xxx.run.app/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"How do I register to vote?","session_id":"test-001","country":"UK","language_code":"en"}'
```

---

## 8. Post-Deployment Verification

Run the smoke test immediately after every production deployment:

```bash
export API_URL=https://electra-api-xxx.run.app/api/v1
bash scripts/smoke-test.sh
```

Expected output: all checks show `✓` and the script exits with code `0`.

---

## 9. Rollback Procedure

### Backend rollback (Cloud Run traffic splitting)

```bash
# List recent revisions
gcloud run revisions list --service=electra-api --region=us-central1

# Roll back to a specific revision
gcloud run services update-traffic electra-api \
  --to-revisions electra-api-XXXXXXX=100 \
  --region us-central1
```

### Frontend rollback (Firebase Hosting)

```bash
# Option 1: Redeploy from a previous build artifact (dist/)
firebase deploy --only hosting

# Option 2: Firebase Console → Hosting → Release history → Roll back
```

---

## 10. Cost Estimation (approximate, low-traffic)

| Service | Free Tier | Estimated Monthly Cost |
|---------|-----------|----------------------|
| Cloud Run | 2M requests/month | $0–$5 |
| Firestore | 50K reads, 20K writes/day | $0–$3 |
| Firebase Hosting | 10 GB storage, 360 MB/day transfer | Free for small projects |
| Maps API | 28,500 map loads/month | $0 (within free tier) |
| Dialogflow CX | 1,000 text requests/month | $0 (within free tier) |
| Cloud Build | 120 build-minutes/day | $0 (within free tier) |
| **Total** | | **< $10/month** |

> Costs scale with usage. Enable GCP billing alerts at a reasonable threshold (e.g. $20/month).
