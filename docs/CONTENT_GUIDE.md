# docs/CONTENT_GUIDE.md
# Electra Election Education Assistant
# Content Contributor Guide

---

## Overview

Electra stores all educational content in **Google Cloud Firestore**. There are three content types:

| Type | Firestore Collection | Who Updates |
|------|----------------------|-------------|
| **Topics** | `topics` | Content editors |
| **Timeline Events** | `timeline_events` | Researchers / elections team |
| **Quiz Questions** | `quiz_questions` | Subject matter experts |

> [!IMPORTANT]
> Content is **live in Firestore**  -  no code changes or deployments are required to add, update, or hide content. Changes take effect immediately.

---

## Accessing Firestore

### Option A  -  Firebase Console (recommended for non-developers)

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Select your Electra project
3. Click **Firestore Database** -> **Data** tab
4. Navigate to the collection you want to edit
5. Click any document to edit its fields inline

### Option B  -  Firebase CLI (batch imports)

```bash
firebase firestore:import <file.json>
```

See `backend/seed_data.py` for the exact JSON format used during initial seeding.

### Option C  -  `seed_data.py` (developers only)

```bash
cd backend && python seed_data.py
```

Safe to re-run  -  all writes use `merge=True` and will not overwrite manually edited fields.

> [!NOTE]
> All Firestore field names use **camelCase** (e.g. `topicId`, `updatedAt`, `officialUrl`).  
> The backend maps these to snake_case for the API. Content editors write camelCase in Firestore directly.

---

## Content Types

### Topics

**Collection:** `topics`  
**Document ID:** URL-safe slug  -  lowercase, hyphens only (e.g. `voter-registration-2026`)

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `slug` | string | Same as the document ID. Must be unique. |
| `title` | string | Displayed in the topic list and as the page heading. Keep under 60 characters. |
| `content` | string | Full lesson in **Markdown** format. See the [Markdown Guide](#markdown-format-for-topic-content) below. |
| `category` | string | **Must** be one of: `registration` \| `eligibility` \| `ballot` \| `campaign` \| `counting` \| `dispute` \| `timeline` |
| `country` | array | Array of country codes. **Must** be one or more of: `"UK"`, `"US"`, `"IN"`, `"ALL"` |
| `order` | number | Display order within the category. Lower numbers appear first. |
| `published` | boolean | `true` = visible in the app. `false` = hidden (draft). |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `prerequisites` | array | Array of topic slugs the user should read first. Use `[]` for none. |
| `updatedAt` | timestamp | Set to the current time when editing. |

#### Example Document

```json
{
  "slug": "voter-registration-uk",
  "title": "How to Register to Vote in the UK",
  "content": "## Registering to Vote\n\nYou must be registered to vote...",
  "category": "registration",
  "country": ["UK"],
  "order": 1,
  "published": true,
  "prerequisites": [],
  "updatedAt": "2026-04-28T00:00:00Z"
}
```

---

### Markdown Format for Topic Content

Electra renders topic `content` as Markdown. Use standard Markdown syntax:

```markdown
## Main Section Heading

### Subsection Heading

Normal paragraph text. **Bold** and *italic* are supported.

- Bullet list item
- Another item

> Blockquote for important notes or official guidance

[Link text](https://official-source-url.gov)

Source: [Electoral Commission](https://www.electoralcommission.org.uk)
```

#### Content Rules

> [!IMPORTANT]
> All content must follow these rules before publication:

1. **Every factual claim must have a citation.** Format:
   `Source: [Organisation Name](https://url.gov)`

2. **Politically neutral.** Do not favour any party, candidate, or political position.

3. **Official sources only.** Link exclusively to government websites:
   - UK: `gov.uk`, `electoralcommission.org.uk`
   - US: `usa.gov`, `fec.gov`, `vote.gov`
   - India: `eci.gov.in`, `nvsp.in`

4. **No speculation** about future election outcomes.

5. **No index-adjusted figures** (e.g. FEC contribution limits) without noting that amounts are subject to change and citing the year.

6. **Length limit:** Keep content under **3,000 words** per topic for readability.

7. **Heading hierarchy:** Start headings at `##` (h2). Do not use `#` (h1)  -  the page title is the h1.

---

### Timeline Events

**Collection:** `timeline_events`  
**Document ID:** Descriptive slug (e.g. `uk-ge-2028-poll-day`)

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Short event name (e.g. `"General Election Day"`). Under 60 characters. |
| `description` | string | 1-3 sentences explaining the event. |
| `date` | timestamp | The event date. Use **midnight UTC** of the event day. |
| `country` | string | Exactly one of: `"UK"` \| `"US"` \| `"IN"` |
| `level` | string | **Must** be one of: `"local"` \| `"state"` \| `"national"` |
| `type` | string | **Must** be one of: `"deadline"` \| `"poll_day"` \| `"result"` \| `"campaign_start"` \| `"nomination"` |
| `officialUrl` | string | URL to the authoritative source for this event. |

#### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| `stateProvince` | string\|null | US state abbreviation (e.g. `"CA"`) or Indian state name. Use `null` for national events. |
| `updatedAt` | timestamp | Update on any field change. |

#### Adding a New Election Date

1. Open Firestore Console -> `timeline_events` collection
2. Click **Add document**, choose a slug as the document ID
3. Fill in all required fields above
4. The event appears in the app **immediately**  -  no deployment needed

> [!NOTE]
> Events are displayed relative to today's date. Events with a `date` in the past will display with a "Past" badge. Events in the future display "Add to Calendar" links.

---

### Quiz Questions

**Collection:** `quiz_questions`  
**Document ID:** Pattern `q_{topic_abbrev}_{number}` (e.g. `q_vr_006`)

#### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| `topicId` | string | Must exactly match an existing topic's `slug`. |
| `question` | string | The question text. Clear and unambiguous. |
| `options` | array | **Exactly 4** strings. The answer options. |
| `correctIndex` | number | `0`, `1`, `2`, or `3`  -  the index of the correct option in `options`. |
| `explanation` | string | Shown after submission. Explains WHY the correct answer is right. Include a source citation. 1-3 sentences. |
| `country` | array | Array of country codes this question applies to (same format as topics). |
| `difficulty` | string | **Must** be one of: `"easy"` \| `"medium"` \| `"hard"` |

> [!CAUTION]
> **Security:** `correctIndex` and `explanation` are **never sent to users before they answer**. They are stripped from the `GET /quiz` response and only revealed in the quiz result. Do not worry about users seeing them in browser dev tools.

#### Example Document

```json
{
  "topicId": "voter-registration-uk",
  "question": "What is the minimum voting age for UK general elections?",
  "options": ["16", "17", "18", "21"],
  "correctIndex": 2,
  "explanation": "The minimum voting age for UK general elections is 18. Source: Electoral Commission (electoralcommission.org.uk).",
  "country": ["UK"],
  "difficulty": "easy"
}
```

#### Important: `correctIndex` counts from 0

```
options[0] = "16"   -> correctIndex: 0
options[1] = "17"   -> correctIndex: 1
options[2] = "18"   -> correctIndex: 2  OK correct
options[3] = "21"   -> correctIndex: 3
```

---

## Unpublishing or Archiving Content

| Action | How |
|--------|-----|
| **Hide a topic** | Set `published` to `false`. Disappears from the app immediately. |
| **Restore a hidden topic** | Set `published` back to `true`. |
| **Delete a topic** | Remove the document from Firestore. **Also delete its quiz questions separately.** |
| **Update a topic** | Edit the `content` field. Update `updatedAt` to the current timestamp. |

> [!WARNING]
> Deleting a topic document does **not** cascade-delete its quiz questions. Remove them manually from `quiz_questions` (filter by `topicId`) to avoid orphaned data.

---

## Quality Checklist Before Publishing

Use this checklist before setting `published: true` on any new content:

```
[ ] All facts sourced from official government websites
[ ] Source URLs included inline in the Markdown content
[ ] Country codes correct (UK / US / IN / ALL  -  uppercase)
[ ] Category is one of the allowed values
[ ] published = true (when ready to go live)
[ ] Quiz questions added (if this is a core learning topic)
[ ] correctIndex verified  -  count from 0, not 1
[ ] Content tested in the live app after publish
[ ] Content is politically neutral
[ ] No broken links (all href values verified)
```

---

## Getting Help

| Topic | Where to ask |
|-------|-------------|
| Content accuracy | GitHub Issue with label `content` |
| Firestore / technical | `docs/DEPLOYMENT.md` |
| App behaviour (bug) | GitHub Issue with label `bug` |
| New feature request | GitHub Issue with label `enhancement` |

For urgent content corrections (factual errors), open a GitHub Issue with label `content` and `urgent`. Tag a maintainer directly.
