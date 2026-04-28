# Dialogflow CX Agent Setup for Electra

## Overview

The Electra chat widget uses **Dialogflow CX** (stable API — not beta) to answer questions about election processes in the UK, US, and India.

The backend proxy endpoint `POST /api/v1/chat` routes user messages to Dialogflow and returns the structured response. **Graceful degradation:** if `DIALOGFLOW_AGENT_ID` is not configured, the endpoint returns a helpful static message (HTTP 200 — not an error). The chat widget continues to function in "offline" mode.

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| GCP project | Dialogflow CX API must be enabled (APIs & Services → Enable APIs) |
| Service account | Needs **"Dialogflow API Client"** role |
| Python package | `google-cloud-dialogflow-cx==1.15.0` (already in `backend/requirements.txt`) |

---

## Creating the Agent

1. Go to [https://dialogflow.cloud.google.com/cx](https://dialogflow.cloud.google.com/cx)
2. Select your GCP project
3. Click **"Create Agent"** with these settings:

| Setting | Value |
|---------|-------|
| Display name | `Electra Assistant` |
| Location | `global` (or `us-central1` for lower latency) |
| Default language | `English (en)` |
| Time zone | `UTC` |

4. Click **Create**

After creation, note the **Agent ID** from the URL:
```
https://dialogflow.cloud.google.com/cx/projects/YOUR_PROJECT/locations/global/agents/AGENT_ID
```

5. Set in `backend/.env`:
```
DIALOGFLOW_AGENT_ID=AGENT_ID
```

---

## Required Intents

Create all 8 intents under the **Default Start Flow**:

---

### 1. `voter_registration_uk`

**Training phrases:**
- "how do I register to vote in the UK"
- "UK voter registration"
- "register to vote England"
- "gov.uk register"
- "electoral roll UK"

**Response:**
```
To register to vote in the UK, visit gov.uk/register-to-vote.
You'll need your National Insurance number and date of birth.
The deadline is usually 12 working days before election day.
```

**Custom payload:**
```json
{ "suggestedTopics": ["voter-registration", "voter-id-uk"] }
```

---

### 2. `voter_registration_us`

**Training phrases:**
- "how do I register to vote in the US"
- "USA voter registration"
- "register to vote America"
- "vote.gov"
- "secretary of state voter registration"

**Response:**
```
US voter registration is managed by each state. Visit usa.gov or your
state's Secretary of State website to register. Deadlines vary by state —
typically 7–30 days before Election Day.
```

**Custom payload:**
```json
{ "suggestedTopics": ["voter-registration", "voter-id-us"] }
```

---

### 3. `voter_registration_india`

**Training phrases:**
- "how do I register to vote in India"
- "voter ID card India"
- "EPIC card"
- "Form 6"
- "voterportal.eci.gov.in"
- "new voter registration India"

**Response:**
```
To register to vote in India, complete Form 6 at voterportal.eci.gov.in
or through the Voter Helpline app. You must be 18 as of 1 January of the qualifying year.
```

**Custom payload:**
```json
{ "suggestedTopics": ["voter-registration", "voter-id-india"] }
```

---

### 4. `voter_id`

**Training phrases:**
- "what ID do I need to vote"
- "voter identification"
- "photo ID polling station"
- "EPIC card voting"
- "VAC voter authority certificate"

**Response:**
```
Voter ID requirements differ by country. In England, photo ID is required
at polling stations since May 2023 — a free Voter Authority Certificate is available.
In India, the EPIC card is the primary ID, with 12 alternative documents accepted.
In the US, requirements vary by state.
```

**Custom payload:**
```json
{ "suggestedTopics": ["voter-id-uk", "voter-id-us", "voter-id-india"] }
```

---

### 5. `election_date`

**Training phrases:**
- "when is the next election"
- "election day date"
- "polling day"
- "when do polls open"
- "election schedule"
- "election timeline"

**Response:**
```
Check the Election Timeline tab for upcoming election dates in your country.
I can provide information about registration deadlines, polling day, and results.
```

**Custom payload:**
```json
{ "suggestedTopics": ["timeline"] }
```

---

### 6. `polling_station`

**Training phrases:**
- "where is my polling station"
- "find polling place"
- "where to vote"
- "polling station locator"
- "how do I find where to vote"

**Response:**
```
Use the Polling Station Finder on the Topics page.
UK: gov.uk/find-polling-station | US: usa.gov/find-a-polling-place | India: eci.gov.in
```

**Custom payload:**
```json
{ "suggestedTopics": [] }
```

---

### 7. `campaign_rules`

**Training phrases:**
- "campaign finance rules"
- "how much can candidates spend"
- "MCC India"
- "model code of conduct"
- "FEC rules"
- "political advertising rules UK"

**Response:**
```
Campaign rules differ by country. I can explain UK spending limits and purdah,
the US FEC system and Super PACs, or India's Model Code of Conduct.
```

**Custom payload:**
```json
{ "suggestedTopics": ["campaign-rules"] }
```

---

### 8. Default Fallback Intent (built-in — edit the response)

This intent is created automatically by Dialogflow. Update its response text:

**Response:**
```
I can answer questions about voter registration, voter ID requirements,
election dates, polling stations, and campaign rules in the UK, US, and India.
What would you like to know?
```

**Custom payload:**
```json
{ "suggestedTopics": [] }
```

---

## Configuring Custom Payload for Suggested Topics

The Electra backend extracts `suggestedTopics` from the Dialogflow response payload. In each intent's response, add a **Custom Payload** entry with this JSON format:

```json
{
  "suggestedTopics": ["slug-1", "slug-2"]
}
```

> [!IMPORTANT]
> Slugs must exactly match existing topic **document IDs** in the `topics` Firestore collection. The chat widget renders these as clickable pills navigating to `/topics/{slug}`.

---

## Testing the Agent

### In the Dialogflow CX Console

Use the **Test Agent** panel (right sidebar):

1. Enter: `how do I register to vote in the UK`
2. Expected: `voter_registration_uk` intent matches with gov.uk link in response

### End-to-End via Backend

```bash
curl -X POST http://localhost:8000/api/v1/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "register to vote UK",
    "session_id": "test-123",
    "country": "UK",
    "language_code": "en"
  }'
```

Expected response shape:
```json
{
  "reply": "To register to vote in the UK...",
  "intent": "voter_registration_uk",
  "session_id": "test-123",
  "suggested_topics": ["voter-registration", "voter-id-uk"]
}
```

---

## Exporting the Agent (for version control)

After setting up the agent:

1. Dialogflow CX Console → **Agent Settings** → **Export Agent**
2. Export to GCS: `gs://your-bucket/dialogflow-agent-backup.blob`
3. Download and commit to: `docs/dialogflow-agent/electra-agent.blob`

> [!NOTE]
> The agent export is a binary blob. If it exceeds 10 MB, add it to `.gitignore` and link to the GCS bucket in this README instead.

---

## SDK Notes

The backend uses the **stable API** (not beta):

```python
# CORRECT — stable API
from google.cloud.dialogflow_cx_v3.services.sessions import SessionsClient

# WRONG — do not use
# from google.cloud.dialogflow_cx_v3beta1 import ...
```

**Package:** `google-cloud-dialogflow-cx==1.15.0`

**Endpoint by location:**

| Location | Endpoint |
|----------|---------|
| `global` | `dialogflow.googleapis.com` |
| `us-central1` | `us-central1-dialogflow.googleapis.com` |

Set the correct endpoint in `backend/app/services/dialogflow_service.py` based on your agent's location.
