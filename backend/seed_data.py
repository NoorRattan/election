"""
Seed script for the Electra Firestore database.

Populates:
  - 10 topic documents in the 'topics' collection
  - 10 timeline event documents in the 'timeline_events' collection
  - 13 quiz question documents in the 'quiz_questions' collection

Safe to re-run: all writes use merge=True (upsert behaviour).

Usage:
    cd backend
    python seed_data.py
"""

import os
import sys
from datetime import datetime, timezone

from google.cloud import firestore

# ──────────────────────────────────────────────────────────────────────────────
project = os.environ.get("GOOGLE_CLOUD_PROJECT")
if not project:
    print("ERROR: GOOGLE_CLOUD_PROJECT environment variable is not set.")
    sys.exit(1)

db = firestore.Client(project=project)
print(f"Connected to Firestore project: {project}\n")


def write_doc(collection: str, doc_id: str, data: dict) -> None:
    db.collection(collection).document(doc_id).set(data, merge=True)
    print(f"  ✓ {collection}/{doc_id}")


def dt(year: int, month: int, day: int) -> datetime:
    return datetime(year, month, day, 0, 0, 0, tzinfo=timezone.utc)


# ──────────────────────────────────────────────────────────────────────────────
# TOPICS (10 documents)
# ──────────────────────────────────────────────────────────────────────────────
print("Seeding topics...")

topics = [
    {
        "id": "voter-registration",
        "slug": "voter-registration",
        "title": "Voter Registration",
        "category": "registration",
        "country": ["ALL"],
        "order": 1,
        "published": True,
        "prerequisites": [],
        "updatedAt": dt(2026, 4, 1),
        "content": """## Voter Registration

Registering to vote is the first step in participating in democracy.

### United Kingdom 🇬🇧

Register online at [gov.uk/register-to-vote](https://www.gov.uk/register-to-vote).
You will need your **National Insurance number** and **date of birth**.
The deadline is approximately **12 working days before polling day**.

### United States 🇺🇸

Each US state sets its own registration rules and deadlines (typically 7–30 days before
Election Day). Some states offer same-day or automatic registration.
Check your state at [usa.gov/voter-registration](https://www.usa.gov/voter-registration).

### India 🇮🇳

Indian voters must appear on the **Electoral Roll** for their constituency.
- **Form 6**: new voter registration
- **Form 6A**: for Non-Resident Indians (NRIs)
- **Form 8**: to correct errors

Register at [voterportal.eci.gov.in](https://voterportal.eci.gov.in).

*Sources: [Electoral Commission](https://www.electoralcommission.org.uk),
[USA.gov](https://www.usa.gov), [ECI](https://eci.gov.in)*""",
    },
    {
        "id": "voter-eligibility",
        "slug": "voter-eligibility",
        "title": "Voter Eligibility",
        "category": "eligibility",
        "country": ["ALL"],
        "order": 2,
        "published": True,
        "prerequisites": [],
        "updatedAt": dt(2026, 4, 1),
        "content": """## Voter Eligibility

### United Kingdom 🇬🇧
- Aged **18 or over** on polling day (16 in Scotland/Wales for devolved elections)
- A **British citizen**, qualifying Commonwealth citizen, or qualifying EU citizen
- **Ordinarily resident** at a UK address

### United States 🇺🇸
- Aged **18 or over**
- A **US citizen** (naturalised or born)
- A **resident** of the state where you register
- Felony conviction rules vary by state

### India 🇮🇳
- Aged **18 or over** as of 1 January of the qualifying year
- An **Indian citizen**
- **Ordinarily resident** of the constituency where you register

*Sources: [Electoral Commission](https://www.electoralcommission.org.uk),
[USA.gov](https://www.usa.gov), [ECI](https://eci.gov.in)*""",
    },
    {
        "id": "voter-id-uk",
        "slug": "voter-id-uk",
        "title": "Voter ID — United Kingdom",
        "category": "eligibility",
        "country": ["UK"],
        "order": 3,
        "published": True,
        "prerequisites": ["voter-eligibility"],
        "updatedAt": dt(2026, 4, 1),
        "content": """## Voter ID in the United Kingdom

Since **May 2023**, voters in **England** must show an accepted form of photo ID
at polling stations. Northern Ireland has required photo ID since **2003**.
Scotland and Wales do not require photo ID.

### Accepted documents in England
- UK or foreign passport
- UK driving licence (full or provisional)
- Blue Badge / Older Person's Bus Pass / Freedom Pass
- HM Armed Forces Veteran Card
- National identity card (EU/EEA/Swiss)
- **Voter Authority Certificate (VAC)** — free to apply

### Voter Authority Certificate (VAC)
Apply free at [gov.uk/apply-for-photo-id-voter-authority-certificate](https://www.gov.uk/apply-for-photo-id-voter-authority-certificate)
at least **15 working days** before polling day.

*Source: [Electoral Commission](https://www.electoralcommission.org.uk)*""",
    },
    {
        "id": "voter-id-us",
        "slug": "voter-id-us",
        "title": "Voter ID — United States",
        "category": "eligibility",
        "country": ["US"],
        "order": 4,
        "published": True,
        "prerequisites": ["voter-eligibility"],
        "updatedAt": dt(2026, 4, 1),
        "content": """## Voter ID in the United States

Voter ID requirements vary significantly by state. There is no single federal rule.

| Type | Examples |
|---|---|
| **Strict photo ID** | Indiana, Georgia, Wisconsin |
| **Non-strict photo ID** | Texas, Florida |
| **Non-strict non-photo** | Ohio, Michigan |
| **No ID required** | California, Illinois, New York |

If you cannot provide the required ID, you may cast a **provisional ballot**.

Check your state at [ncsl.org](https://www.ncsl.org/elections-and-campaigns/voter-id).

*Sources: [USA.gov](https://www.usa.gov), [NCSL](https://www.ncsl.org)*""",
    },
    {
        "id": "voter-id-india",
        "slug": "voter-id-india",
        "title": "Voter ID — India",
        "category": "eligibility",
        "country": ["IN"],
        "order": 5,
        "published": True,
        "prerequisites": ["voter-eligibility"],
        "updatedAt": dt(2026, 4, 1),
        "content": """## Voter ID in India

### EPIC Card (Electoral Photo Identity Card)
The EPIC card is India's primary voter identification document. Apply via your local
**Electoral Registration Officer** or online at [voterportal.eci.gov.in](https://voterportal.eci.gov.in).

**e-EPIC**: A digital PDF version downloadable from the voter portal or via **DigiLocker**.

### 12 Alternative Documents
Aadhaar Card, MNREGA Job Card, Passbook with photo, Health Smart Card, Driving Licence,
PAN Card, Indian Passport, Smart Card (RGI), Pension document with photo,
Service Identity Card (Govt), NPR Smart Card, Disability certificate with photo.

*Source: [Election Commission of India](https://eci.gov.in)*""",
    },
    {
        "id": "ballot-types",
        "slug": "ballot-types",
        "title": "Types of Ballots and Voting Technology",
        "category": "ballot",
        "country": ["ALL"],
        "order": 6,
        "published": True,
        "prerequisites": [],
        "updatedAt": dt(2026, 4, 1),
        "content": """## Types of Ballots and Voting Technology

### Paper Ballots (UK)
UK polling stations use **paper ballots** marked with a pencil (voters mark an **X**).
**Postal vote**: apply by **5pm, 11 working days** before polling day.
**Proxy vote**: appoint someone to vote on your behalf.

### Electronic Voting Machines — India
India uses **EVMs** in all Lok Sabha and Vidhan Sabha elections. Voters press a button
next to their chosen candidate. **VVPAT** prints a slip visible for 7 seconds confirming
the vote, then drops into a sealed compartment.

### Absentee and Mail-in Voting — USA
- **Absentee ballot**: available in most states (some require a reason)
- **Universal mail-in voting**: Oregon, Colorado, and Washington mail ballots to all voters
- Ballots may be returned by mail or dropped in secure **drop boxes**

*Sources: [Electoral Commission](https://www.electoralcommission.org.uk),
[ECI](https://eci.gov.in), [USA.gov](https://www.usa.gov)*""",
    },
    {
        "id": "voting-methods",
        "slug": "voting-methods",
        "title": "How to Vote — Step by Step",
        "category": "ballot",
        "country": ["ALL"],
        "order": 7,
        "published": True,
        "prerequisites": ["ballot-types"],
        "updatedAt": dt(2026, 4, 1),
        "content": """## How to Vote

### In-Person Voting Hours
- **UK**: 7am to 10pm. Bring photo ID (England only).
- **USA**: typically 7am to 8pm local time. If in line when polls close, you may still vote.
- **India**: typically 7am to 6pm. Bring EPIC card or an alternative document.

### Step-by-Step at the Polling Station (UK)
1. Give your name and address to the polling station staff
2. Show your photo ID (England only)
3. Receive your ballot paper
4. Go to a private booth and mark an **X** next to your chosen candidate
5. Fold the ballot and place it in the ballot box

*Your vote is secret — no one can see who you voted for.*

*Sources: [Electoral Commission](https://www.electoralcommission.org.uk),
[ECI](https://eci.gov.in), [USA.gov](https://www.usa.gov)*""",
    },
    {
        "id": "campaign-rules",
        "slug": "campaign-rules",
        "title": "Campaign Rules and Finance",
        "category": "campaign",
        "country": ["ALL"],
        "order": 8,
        "published": True,
        "prerequisites": [],
        "updatedAt": dt(2026, 4, 1),
        "content": """## Campaign Rules and Finance

### United Kingdom 🇬🇧
- **Candidate deposit**: £500 for UK Parliament (returned if ≥5% of votes)
- **Broadcast advertising**: political ads are **banned on TV and radio**
- **Purdah**: government restricts policy announcements once election is called

### United States 🇺🇸
- Regulated by the **FEC** at [fec.gov](https://www.fec.gov)
- **Super PACs**: unlimited fundraising; cannot coordinate directly with campaigns
- All contributions above reporting threshold publicly disclosed at fec.gov

### India 🇮🇳
- **Model Code of Conduct (MCC)**: takes effect the **moment ECI announces** the schedule
- **48-hour silence period**: all campaigning stops 48 hours before polls close
- All campaign expenditure submitted to ECI within **30 days of the result**

*Sources: [Electoral Commission](https://www.electoralcommission.org.uk),
[FEC](https://www.fec.gov), [ECI](https://eci.gov.in)*""",
    },
    {
        "id": "counting-results",
        "slug": "counting-results",
        "title": "Vote Counting and Results",
        "category": "counting",
        "country": ["ALL"],
        "order": 9,
        "published": True,
        "prerequisites": ["voting-methods"],
        "updatedAt": dt(2026, 4, 1),
        "content": """## Vote Counting and Results

### United Kingdom 🇬🇧
- Counting begins immediately after polls close at **10pm**
- Overseen by the **Returning Officer**; candidates and agents may observe
- UK uses **First Past the Post (FPTP)**: most votes wins

### United States 🇺🇸
- **Provisional ballots** counted after eligibility verification
- Final results require **state certification** (can take days to weeks)
- Very close races may trigger automatic **recounts**

### India 🇮🇳
- **Counting day** is a separate announced date
- EVM tallies counted round by round at designated centres
- Results published live at [results.eci.gov.in](https://results.eci.gov.in)

### What is FPTP?
**First Past the Post**: the candidate with the most votes wins, even without an
absolute majority.

*Sources: [Electoral Commission](https://www.electoralcommission.org.uk),
[ECI](https://eci.gov.in), [USA.gov](https://www.usa.gov)*""",
    },
    {
        "id": "dispute-resolution",
        "slug": "dispute-resolution",
        "title": "Election Disputes and Legal Challenges",
        "category": "dispute",
        "country": ["ALL"],
        "order": 10,
        "published": True,
        "prerequisites": ["counting-results"],
        "updatedAt": dt(2026, 4, 1),
        "content": """## Election Disputes and Legal Challenges

### United Kingdom 🇬🇧
- An **Election Petition** must be filed in the **High Court** within **21 days** of
  the result declaration
- Grounds: corrupt practices, illegal practices, errors in the count

### United States 🇺🇸
- **Recounts** triggered automatically when margin falls below a threshold
- Legal challenges filed in **state court** or **federal court**
- The **Electoral Count Reform Act (2022)** clarified the VP's ceremonial role

### India 🇮🇳
- An **Election Petition** must be filed in the **High Court** within **45 days**
  of the result declaration
- Legal basis: **Representation of the People Act, 1951** (Sections 80–81)
- Further appeal to the **Supreme Court of India**

*Sources: [Electoral Commission](https://www.electoralcommission.org.uk),
[ECI](https://eci.gov.in), [USA.gov](https://www.usa.gov)*""",
    },
]

for topic in topics:
    doc_id = topic.pop("id")
    write_doc("topics", doc_id, topic)

print(f"\n✓ Seeded {len(topics)} topics\n")


# ──────────────────────────────────────────────────────────────────────────────
# TIMELINE EVENTS (10 documents)
# ──────────────────────────────────────────────────────────────────────────────
print("Seeding timeline events...")

timeline_events = [
    # UK — 4 events
    {
        "name": "Voter Registration Deadline",
        "description": "Last day to register to vote in the May 2026 local elections in England.",
        "date": dt(2026, 4, 20),
        "country": "UK",
        "state_province": None,
        "level": "local",
        "type": "deadline",
        "official_url": "https://www.gov.uk/register-to-vote",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "name": "Postal Vote Application Deadline (5pm)",
        "description": "Last day to apply for a postal vote for the May 2026 local elections.",
        "date": dt(2026, 4, 22),
        "country": "UK",
        "state_province": None,
        "level": "local",
        "type": "deadline",
        "official_url": "https://www.electoralcommission.org.uk",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "name": "Voter Authority Certificate Deadline",
        "description": "Last day to apply for a free Voter Authority Certificate (photo ID) for the May 2026 elections.",
        "date": dt(2026, 4, 28),
        "country": "UK",
        "state_province": None,
        "level": "local",
        "type": "deadline",
        "official_url": "https://www.gov.uk/apply-for-photo-id-voter-authority-certificate",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "name": "Local Election Day",
        "description": "Polling day for the May 2026 local elections in England. Polls open 7am to 10pm. Bring photo ID.",
        "date": dt(2026, 5, 7),
        "country": "UK",
        "state_province": None,
        "level": "local",
        "type": "poll_day",
        "official_url": "https://www.electoralcommission.org.uk",
        "updatedAt": dt(2026, 4, 1),
    },
    # US — 2 events
    {
        "name": "Registration Deadlines Vary by State",
        "description": "Voter registration deadlines for the 2026 midterm elections vary by state. Most states require registration 7–30 days before Election Day.",
        "date": dt(2026, 10, 5),
        "country": "US",
        "state_province": None,
        "level": "national",
        "type": "deadline",
        "official_url": "https://www.usa.gov/voter-registration",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "name": "2026 Midterm Election Day",
        "description": "All 435 House seats and approximately one-third of Senate seats are up for election.",
        "date": dt(2026, 11, 3),
        "country": "US",
        "state_province": None,
        "level": "national",
        "type": "poll_day",
        "official_url": "https://www.usa.gov",
        "updatedAt": dt(2026, 4, 1),
    },
    # India — 4 events
    {
        "name": "Election Schedule Announced — MCC Begins",
        "description": "ECI announces the state election schedule. The Model Code of Conduct comes into immediate effect.",
        "date": dt(2026, 3, 15),
        "country": "IN",
        "state_province": None,
        "level": "state",
        "type": "campaign_start",
        "official_url": "https://eci.gov.in",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "name": "Nomination Filing Closes",
        "description": "Last day for candidates to file nomination papers for state assembly elections.",
        "date": dt(2026, 3, 28),
        "country": "IN",
        "state_province": None,
        "level": "state",
        "type": "nomination",
        "official_url": "https://eci.gov.in",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "name": "Polling Day — Phase 1",
        "description": "Polling day for Phase 1 of state assembly elections. Bring your EPIC card or an alternative document. Polls open 7am to 6pm.",
        "date": dt(2026, 4, 18),
        "country": "IN",
        "state_province": None,
        "level": "state",
        "type": "poll_day",
        "official_url": "https://eci.gov.in",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "name": "Counting of Votes",
        "description": "Counting of votes for state assembly elections. Results published live at results.eci.gov.in.",
        "date": dt(2026, 5, 4),
        "country": "IN",
        "state_province": None,
        "level": "state",
        "type": "result",
        "official_url": "https://results.eci.gov.in",
        "updatedAt": dt(2026, 4, 1),
    },
]

timeline_ids = [
    "uk-local-2026-reg-deadline",
    "uk-local-2026-postal-deadline",
    "uk-voter-id-deadline",
    "uk-local-2026-poll-day",
    "us-midterm-2026-reg-note",
    "us-midterm-2026-election-day",
    "in-state-2026-schedule-announced",
    "in-state-2026-nomination-closes",
    "in-state-2026-poll-day",
    "in-state-2026-counting",
]

for doc_id, event in zip(timeline_ids, timeline_events):
    write_doc("timeline_events", doc_id, event)

print(f"\n✓ Seeded {len(timeline_events)} timeline events\n")


# ──────────────────────────────────────────────────────────────────────────────
# QUIZ QUESTIONS (13 documents)
# ──────────────────────────────────────────────────────────────────────────────
print("Seeding quiz questions...")

quiz_questions = [
    # Topic: voter-registration (5 questions)
    {
        "topicId": "voter-registration",
        "question": "What is the minimum voting age in the UK for general elections?",
        "options": ["16", "17", "18", "21"],
        "correctIndex": 2,
        "explanation": "The minimum voting age in the UK for general elections is 18. It is 16 in Scotland and Wales for devolved elections.",
        "country": ["ALL"],
        "difficulty": "easy",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "topicId": "voter-registration",
        "question": "What is the official website to register to vote online in the UK?",
        "options": ["gov.uk/vote", "register.co.uk/vote", "gov.uk/register-to-vote", "electoralcommission.org.uk/register"],
        "correctIndex": 2,
        "explanation": "The official UK voter registration website is gov.uk/register-to-vote.",
        "country": ["UK"],
        "difficulty": "easy",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "topicId": "voter-registration",
        "question": "Which form must a new voter in India submit to register on the electoral roll?",
        "options": ["Form 7", "Form 6", "Form 8", "Form 6A"],
        "correctIndex": 1,
        "explanation": "Form 6 is used for new voter registration in India. Form 6A is for NRIs, Form 7 for objections, and Form 8 for corrections.",
        "country": ["IN"],
        "difficulty": "medium",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "topicId": "voter-registration",
        "question": "Who sets voter registration deadlines in the United States?",
        "options": ["The President", "The Federal Election Commission", "Each state individually", "The Supreme Court"],
        "correctIndex": 2,
        "explanation": "Each US state sets its own voter registration rules and deadlines. North Dakota has no registration requirement at all.",
        "country": ["US"],
        "difficulty": "medium",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "topicId": "voter-registration",
        "question": "What document is required alongside your date of birth to register to vote online in the UK?",
        "options": ["Passport number", "National Insurance number", "Driving licence number", "NHS number"],
        "correctIndex": 1,
        "explanation": "UK online voter registration requires your National Insurance number and date of birth.",
        "country": ["UK"],
        "difficulty": "easy",
        "updatedAt": dt(2026, 4, 1),
    },
    # Topic: voter-id-uk (2 questions)
    {
        "topicId": "voter-id-uk",
        "question": "In which part of the UK did mandatory photo ID at polling stations first become required in May 2023?",
        "options": ["Scotland", "Wales", "England", "Northern Ireland"],
        "correctIndex": 2,
        "explanation": "Mandatory photo ID was introduced in England in May 2023. Northern Ireland has had this requirement since 2003.",
        "country": ["UK"],
        "difficulty": "easy",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "topicId": "voter-id-uk",
        "question": "What is the name of the free photo ID document that UK voters can apply for if they have no other accepted ID?",
        "options": ["Electoral Photo Card", "Voter Authority Certificate", "Citizen Identification Card", "Polling Station Pass"],
        "correctIndex": 1,
        "explanation": "The Voter Authority Certificate (VAC) is a free photo ID document. Apply at least 15 working days before polling day.",
        "country": ["UK"],
        "difficulty": "medium",
        "updatedAt": dt(2026, 4, 1),
    },
    # Topic: ballot-types (2 questions)
    {
        "topicId": "ballot-types",
        "question": "What does VVPAT stand for in Indian elections?",
        "options": ["Verified Voting Paper Audit Trail", "Voter Verifiable Paper Audit Trail", "Verified Vote Polling Audit Terminal", "Voter Verified Paper Allocation Tally"],
        "correctIndex": 1,
        "explanation": "VVPAT stands for Voter Verifiable Paper Audit Trail. It prints a slip showing the candidate's symbol for 7 seconds.",
        "country": ["IN"],
        "difficulty": "medium",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "topicId": "ballot-types",
        "question": "By when must a UK postal vote application be received?",
        "options": ["7 working days before polling day", "14 working days before polling day", "5pm, 11 working days before polling day", "Any time before polling day"],
        "correctIndex": 2,
        "explanation": "UK postal vote applications must be received by 5pm, 11 working days before polling day.",
        "country": ["UK"],
        "difficulty": "hard",
        "updatedAt": dt(2026, 4, 1),
    },
    # Topic: campaign-rules (2 questions)
    {
        "topicId": "campaign-rules",
        "question": "When does India's Model Code of Conduct (MCC) come into effect?",
        "options": ["One week before polling day", "The moment ECI announces the election schedule", "When nominations open", "On the first day of campaigning"],
        "correctIndex": 1,
        "explanation": "The MCC comes into effect immediately when ECI announces the election schedule.",
        "country": ["IN"],
        "difficulty": "medium",
        "updatedAt": dt(2026, 4, 1),
    },
    {
        "topicId": "campaign-rules",
        "question": "How many hours before polls close in India must all campaigning stop?",
        "options": ["24 hours", "36 hours", "48 hours", "72 hours"],
        "correctIndex": 2,
        "explanation": "India's 48-hour silence period requires all campaigning to stop 48 hours before polls close.",
        "country": ["IN"],
        "difficulty": "easy",
        "updatedAt": dt(2026, 4, 1),
    },
    # Topic: counting-results (1 question)
    {
        "topicId": "counting-results",
        "question": "What is a provisional ballot in the United States?",
        "options": [
            "A ballot cast before Election Day by mail",
            "A ballot cast when a voter's eligibility is questioned, counted after verification",
            "A ballot used in primary elections only",
            "A digital ballot used in electronic voting machines",
        ],
        "correctIndex": 1,
        "explanation": "A provisional ballot is set aside when eligibility is questioned and counted only after officials verify registration.",
        "country": ["US"],
        "difficulty": "medium",
        "updatedAt": dt(2026, 4, 1),
    },
    # Topic: dispute-resolution (1 question)
    {
        "topicId": "dispute-resolution",
        "question": "How many days does a candidate have to file an election petition in India after the result is declared?",
        "options": ["21 days", "30 days", "45 days", "60 days"],
        "correctIndex": 2,
        "explanation": "Under the Representation of the People Act, 1951 (Sections 80–81), an election petition must be filed within 45 days.",
        "country": ["IN"],
        "difficulty": "hard",
        "updatedAt": dt(2026, 4, 1),
    },
]

quiz_ids = [
    "q_vr_001", "q_vr_002", "q_vr_003", "q_vr_004", "q_vr_005",
    "q_uid_001", "q_uid_002",
    "q_bt_001", "q_bt_002",
    "q_cr_001", "q_cr_002",
    "q_cnt_001",
    "q_dr_001",
]

for doc_id, question in zip(quiz_ids, quiz_questions):
    write_doc("quiz_questions", doc_id, question)

print(f"\n✓ Seeded {len(quiz_questions)} quiz questions\n")

print("=" * 60)
print("Seed complete. Summary:")
print(f"  Topics:          {len(topics)}")
print(f"  Timeline events: {len(timeline_events)}")
print(f"  Quiz questions:  {len(quiz_questions)}")
print("=" * 60)
