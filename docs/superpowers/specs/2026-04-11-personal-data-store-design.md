# Personal Data Store & Practitioner Sharing — Design Spec

**Date:** 2026-04-11
**Status:** Approved
**Author:** Dee + Claude
**Depends on:** Insights v2 (day composites)

---

## Philosophy

The user owns their data. A practitioner sees only what the user explicitly shares, for as long as the user allows. Sharing is opt-in, revocable, and granular. The practitioner is a guest in the patient's data — never a co-owner.

---

## Current State

- `profiles` table has `isAdmin` boolean — no role model
- No practitioner role, no patient-practitioner relationship, no invite system
- Admin routes gated by `requireAdmin()` helper
- Session object: `{ userId, email, firstName, isAdmin, timezone }`

---

## Role Model

Replace the binary `isAdmin` flag with a role system. Three roles:

| Role | Description | Access |
|---|---|---|
| `patient` | Default. Tracks health, views own insights. | Own data only |
| `practitioner` | Health coach, functional medicine provider. Views shared patient data. | Own data + shared patient data (read-only) |
| `admin` | Platform admin. | Everything |

A practitioner is also a patient — they can track their own health too. The role is additive.

### Schema change: `profiles`

```
ALTER TABLE profiles
  ADD COLUMN role text NOT NULL DEFAULT 'patient'
    CHECK (role IN ('patient', 'practitioner', 'admin'));
```

Deprecate `isAdmin` — migrate: `UPDATE profiles SET role = 'admin' WHERE is_admin = true;` then drop column in a follow-up migration.

Session object becomes: `{ userId, email, firstName, role, timezone }`

`requireAdmin()` becomes `requireRole('admin')`. New: `requireRole('practitioner')`.

---

## Patient-Practitioner Relationships

### New table: `practitioner_patients`

```
practitioner_patients
  id                  uuid PK
  practitioner_id     uuid FK → profiles.id NOT NULL
  patient_id          uuid FK → profiles.id NOT NULL
  
  -- Sharing scope
  share_timeline      boolean DEFAULT true
  share_journal       boolean DEFAULT true
  share_insights      boolean DEFAULT true
  share_chat_history  boolean DEFAULT false
  
  -- State
  status              text NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'active', 'revoked', 'expired'))
  invited_at          timestamptz DEFAULT now()
  accepted_at         timestamptz
  revoked_at          timestamptz
  revoked_by          text  -- 'patient' or 'practitioner'
  
  -- Metadata
  practitioner_notes  text  -- private practitioner notes about this patient
  created_at          timestamptz DEFAULT now()
  updated_at          timestamptz DEFAULT now()
  
  UNIQUE(practitioner_id, patient_id)
```

**RLS policies:**
- Patient can read/update/delete rows where `patient_id = auth.uid()`
- Practitioner can read rows where `practitioner_id = auth.uid()` AND `status = 'active'`
- Only patients can revoke (set `status = 'revoked'`)

### Invite Flow

1. **Practitioner generates invite link or code** — `/api/practitioner/invite` creates a row with `status = 'pending'` and returns a shareable code
2. **Patient enters code in Settings** — `/api/settings/practitioner` accepts the code, sets `patient_id = auth.uid()`, status remains `pending` until patient confirms sharing scope
3. **Patient reviews & accepts** — patient sees who's requesting access and chooses what to share (timeline, journal, insights, chat history). Sets `status = 'active'`
4. **Either party can disconnect** — patient revokes instantly. Practitioner can disconnect (sets `status = 'revoked'`, `revoked_by = 'practitioner'`)

### What Practitioners See

When a practitioner views a patient's data, they access the same API endpoints but scoped through the relationship:

- `GET /api/practitioner/patients` — list of active patients
- `GET /api/practitioner/patients/:id/day?date=YYYY-MM-DD` — patient's day composite (if `share_timeline` or `share_journal`)
- `GET /api/practitioner/patients/:id/patterns?days=90` — patient's correlation output (if `share_insights`)
- `GET /api/practitioner/patients/:id/chat` — chat history (if `share_chat_history`)

These are thin wrappers around the existing Insights v2 APIs, with an RLS check that the practitioner has an active relationship with `share_*` flags enabled.

**Practitioner view rendering:** Same data, potentially different component (clinical framing). But per the Insights v2 spec, this is a separate future concern — the computation layer already outputs structured JSON that a practitioner component can consume.

### Practitioner Notes

Practitioners can add private notes per patient:

```
practitioner_notes
  id                  uuid PK
  practitioner_id     uuid FK → profiles.id NOT NULL
  patient_id          uuid FK → profiles.id NOT NULL
  content             text NOT NULL
  created_at          timestamptz DEFAULT now()
  updated_at          timestamptz DEFAULT now()
```

**RLS:** Only the practitioner who wrote the note can read/write it. Patients cannot see practitioner notes. This is standard clinical practice — chart notes belong to the provider.

---

## Data Boundaries

### What lives where

| Data | Owner | Stored in | Shareable? |
|---|---|---|---|
| Timeline entries | Patient | `timeline_entries` (existing) | Via `share_timeline` |
| Journal entries | Patient | `journal_entries` (existing) | Via `share_journal` |
| Day composites | Patient | `day_composites` (Insights v2) | Via `share_timeline` OR `share_journal` |
| Correlation output | Patient | `insight_snapshots` (Insights v2) | Via `share_insights` |
| Insight alerts | Patient | `insight_alerts` (Insights v2) | Not shared |
| Chat history | Patient | `messages` (existing) | Via `share_chat_history` (off by default) |
| Practitioner notes | Practitioner | `practitioner_notes` (new) | Never shared with patient |
| Protocol state | Patient | `user_protocol_state` (existing) | Via `share_timeline` |
| Reintroduction log | Patient | `reintroduction_log` (existing) | Via `share_timeline` |

### What NEVER leaves the user's scope

- Stripe billing info
- Auth credentials
- Device tokens
- Audit log entries
- Insight alert dismiss state

---

## Consent & Revocation

- **Opt-in only.** No data is shared until the patient explicitly accepts and chooses scope.
- **Granular.** Patient controls each data category independently.
- **Instantly revocable.** Patient taps "Disconnect" → status = 'revoked' → practitioner's next API call returns 403 for that patient. No grace period.
- **Audit logged.** Every share/revoke action writes to `audit_log` (existing table).
- **No bulk export for practitioners.** Practitioners can view data in-app but cannot download raw CSV/PDF of patient data. (This is a deliberate friction — the patient's own export feature is separate.)

---

## UI Surfaces

### Patient side (Settings tab)

- **"Your Practitioner"** section in Settings
- Shows connected practitioner (if any) with sharing toggles
- "Connect a practitioner" → enter invite code
- "Disconnect" button with confirmation

### Practitioner side (new tab or section)

- **Patient list** — name, protocol, last active, logging consistency
- **Patient detail** — Day View + All Patterns (same components as user Insights, different data source)
- **Notes** — per-patient private notes

Practitioner UI design is a separate implementation concern — this spec defines the data model and access control. The minimum viable practitioner view is: patient list + read-only Day View + read-only All Patterns.

---

## Migration Path

1. Add `role` column to `profiles` (default 'patient', migrate isAdmin → 'admin')
2. Create `practitioner_patients` table with RLS
3. Create `practitioner_notes` table with RLS
4. Update session object to include `role`
5. Update `requireAdmin()` → `requireRole()`
6. Add practitioner API routes (thin wrappers around existing endpoints with relationship check)
7. Add patient Settings UI for managing practitioner connection
8. Add practitioner patient list + detail view

Steps 1–6 are backend-only and can ship without any practitioner UI. Step 7 is a small Settings addition. Step 8 is the practitioner dashboard v0.

---

## Relationship to Aggregate Research Lake

The personal data store and the research lake are completely separate systems with different access models:

| | Personal Store | Research Lake |
|---|---|---|
| **Identified?** | Yes — user_id on every row | No — de-identified, no user_id |
| **Consent model** | Per-practitioner, per-category | Global opt-in for research |
| **Data unit** | Raw entries + day composites | De-identified day composites (aggregated) |
| **Storage** | Same Supabase Postgres | Separate system (future spec) |
| **Access** | Patient + authorized practitioner | Research partners via API/export |
| **Revocation** | Instant, per-relationship | Withdraw from research pool (de-identified data may persist per consent agreement) |

The day composite is the bridge: it's the canonical unit in the personal store, and a de-identified version of it becomes the row in the research lake.
