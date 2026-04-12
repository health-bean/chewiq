# Aggregate Research Data Lake — Design Spec

**Date:** 2026-04-11
**Status:** Draft (future system — not for immediate build)
**Author:** Dee + Claude
**Depends on:** Insights v2 (day composites), Personal Data Store (consent model)

---

## Purpose

A de-identified, aggregate data store that enables:
- Population-level pattern discovery ("Do AIP patients with high stress have worse outcomes in month 2?")
- Research partnerships (Cleveland Clinic, functional medicine institutions)
- Clinical evidence generation for protocol effectiveness
- Future ML models (predictive flare detection, personalized protocol optimization)

This is NOT the user's database. It's a separate system that receives de-identified copies of consented user data. Users never query it. Researchers and ML pipelines do.

---

## Why a Separate System

The personal data store (Supabase Postgres) is optimized for:
- Single-user queries (one patient's data at a time)
- Low-latency reads (Insights tab loads in <1s)
- Row-level security (user sees only their data)
- OLTP workloads (frequent small writes)

The research lake needs:
- Cross-user aggregate queries ("all patients on AIP with histamine sensitivity")
- Column-oriented scans over millions of day-composite rows
- No user identity — de-identified by design
- OLAP workloads (infrequent heavy reads)
- ML pipeline integration (batch reads, feature extraction)

Trying to serve both from one Postgres instance is a mistake — the query patterns conflict, and mixing identified + de-identified data in one system is a compliance risk.

---

## Consent Model

### Opt-in, separate from practitioner sharing

- Research consent is a separate toggle in Settings, independent of practitioner sharing
- Displayed as: "Contribute anonymized data to chronic illness research" with a clear explanation of what's shared and what isn't
- Default: OFF
- Can be turned on/off at any time

### What consent covers

- De-identified day composites (no name, email, user_id — replaced with a random research_id)
- Protocol information (which protocols, which phase)
- Demographic bucket (age range, sex — if voluntarily provided, never required)
- Condition tags (if voluntarily provided — "autoimmune", "histamine intolerance", etc.)

### What consent does NOT cover

- Chat messages (contain free text, hard to de-identify)
- Practitioner notes
- Billing information
- Device information
- Any raw text fields

### Withdrawal

- User turns off research consent → no new data flows to the lake
- Already-contributed data: de-identified data may persist per the consent agreement (standard research practice — you can't un-analyze aggregated data). This must be clearly stated in the consent flow.
- If required by regulation: support a "delete my research data" request that removes rows matching the user's `research_id`. This is possible because the mapping `user_id → research_id` is stored in the personal data store (not the lake).

---

## Data Model

### Core unit: De-identified Day Composite

One row per consented user per day. Structurally identical to `day_composites` from Insights v2, but:
- `user_id` replaced with `research_id` (random UUID, not derivable from user_id)
- No `email`, `name`, or other PII
- Timestamps truncated to date (no exact times — reduces re-identification risk)
- Food names kept (they're not PII), symptom names kept
- Custom food names replaced with "custom_food" (user-created names could contain PII)

```
research_day_composites
  id                  uuid PK
  research_id         uuid NOT NULL  -- random, not FK to anything in this DB
  date                date NOT NULL
  
  -- Demographics (optional, bucketed)
  age_bucket          text  -- '18-25', '26-35', '36-45', '46-55', '56-65', '65+'
  sex                 text  -- 'male', 'female', 'other', null
  condition_tags      text[]  -- ['autoimmune', 'histamine_intolerance', ...]
  
  -- Protocol context
  protocol_name       text  -- 'AIP', 'Low Histamine', etc. (not protocol_id — no FK)
  protocol_phase      text  -- 'elimination', 'reintroduction', etc.
  days_on_protocol    integer
  
  -- Same structure as day_composites, de-identified
  food_count          integer
  symptom_count       integer
  supplement_count    integer
  medication_count    integer
  exposure_count      integer
  exercise_count      integer
  
  sleep_score         integer
  energy_score        integer
  mood_score          integer
  stress_score        integer
  pain_score          integer
  
  compliance_pct      numeric(5,2)
  violation_count     integer
  
  -- Detail (JSONB, de-identified)
  foods               jsonb  -- [{name (system foods only), properties, meal_type}] — no times
  symptoms            jsonb  -- [{name, severity}] — no times
  supplements         jsonb  -- [{name}]
  medications         jsonb  -- [{name}]
  exposures           jsonb  -- [{type, severity}]
  exercises           jsonb  -- [{type, intensity, duration, energy_level}]
  
  -- Derived
  is_flare_day        boolean
  has_late_meal       boolean
  entry_count         integer
  has_journal         boolean
  
  -- Metadata
  contributed_at      timestamptz DEFAULT now()
  
  UNIQUE(research_id, date)
```

### Mapping table (lives in personal data store, NOT the lake)

```
research_consent
  id                  uuid PK
  user_id             uuid FK → profiles.id (RLS: user_id = auth.uid())
  research_id         uuid NOT NULL UNIQUE  -- the random ID used in the lake
  consented           boolean DEFAULT false
  consented_at        timestamptz
  withdrawn_at        timestamptz
  demographics        jsonb  -- {age_bucket, sex, condition_tags} — voluntarily provided
```

This is the only place where `user_id ↔ research_id` mapping exists. It lives in the user's own DB, protected by RLS. The research lake never stores this mapping.

---

## Data Flow

```
User logs entries (timeline_entries, journal_entries)
  ↓
Day composite computed (day_composites table — Insights v2)
  ↓
If user has research consent ON:
  ↓
De-identification pipeline:
  - Replace user_id with research_id (from research_consent table)
  - Strip timestamps to date-only
  - Replace custom food names with "custom_food"
  - Attach demographic bucket + protocol context
  - Strip any free-text fields
  ↓
Write to research lake (research_day_composites)
```

**When:** Piggybacks on day composite computation. When a day composite is created or updated, if the user has research consent, the de-identified version is pushed to the lake. This can be async (queue/webhook) to avoid adding latency to the user's Insights load.

---

## Storage Options (decision deferred)

The lake doesn't need to be built yet. When it's time, evaluate:

| Option | Pros | Cons | When |
|---|---|---|---|
| **Separate Supabase project** | Same tooling, Drizzle ORM, familiar. Easy to start. | Postgres isn't ideal for OLAP at scale. | < 10K users, initial research partnerships |
| **Supabase + pg_analytics / DuckDB** | Columnar queries on Postgres. Best of both. | Newer extension, less battle-tested. | 10K–100K users |
| **BigQuery / Snowflake** | Purpose-built for analytics. Scales infinitely. ML pipeline integrations. | Different tooling, cost model, operational overhead. | 100K+ users, serious ML work |
| **ClickHouse** | Fast columnar, self-hostable, great for time-series. | Operational overhead. | If self-hosting is preferred |

**Recommendation:** Start with a separate Supabase project. It's free to set up, uses the same tools, and the schema above works as-is in Postgres. When query patterns demand columnar storage, migrate — the schema is simple enough that migration is mechanical.

---

## Research Query Examples

What researchers would ask this data:

1. **Protocol effectiveness:** "Average symptom count on day 30 vs day 1 for AIP patients" → simple aggregate on `research_day_composites` grouped by `protocol_name`, `days_on_protocol`

2. **Compound triggers:** "For patients with histamine sensitivity, does stress amplify symptom severity?" → join `foods` JSONB (filter histamine property) with `stress_score` bucketing, compare `symptom_count` and severity

3. **Exercise impact:** "Does moderate exercise reduce next-day pain scores?" → lag analysis on `exercises` JSONB presence vs next row's `pain_score`

4. **Population baselines:** "What's the average flare frequency by protocol?" → count `is_flare_day = true` per `research_id` per `protocol_name`, aggregate

5. **Multi-modal time series for ML:** "Train a model to predict flare days from the previous 7 days of features" → sliding window over `research_day_composites` ordered by `(research_id, date)`, extract feature vectors from JSONB columns + score columns

---

## ML Readiness

The `research_day_composites` table is designed as a feature-ready time series:

- **One row = one observation** (user-day)
- **Fixed columns** for numeric features (scores, counts, compliance)
- **JSONB columns** for variable-length features (foods, symptoms) — extractable to feature vectors via SQL or Python
- **`research_id` + `date`** = natural time-series index
- **`is_flare_day`** = natural binary classification target
- **`protocol_name` + `days_on_protocol`** = natural segmentation dimensions

A basic ML pipeline (e.g., scikit-learn, XGBoost) could:
1. Query all rows for a protocol segment
2. Create sliding windows (7-day lookback)
3. Extract features: score means, food property frequencies, supplement presence, exercise frequency
4. Predict: `is_flare_day` on day N+1

More sophisticated approaches (LSTMs, transformers for time series) would use the same data with different windowing.

---

## Privacy & Compliance Considerations

### De-identification strength

- No direct identifiers (name, email, user_id)
- Timestamps truncated to date (no time-of-day patterns)
- Custom food names stripped (could contain PII like "mom's chicken soup")
- Demographics bucketed (age ranges, not exact age)
- Research ID is random UUID with no mathematical relationship to user ID

### Re-identification risk

- A user with a very rare protocol + rare condition tags + unique food patterns could theoretically be re-identified by a sufficiently motivated attacker with access to both the lake and external data
- Mitigation: condition tags are optional and coarse; food-level detail could be further aggregated (food properties only, not individual foods) if risk assessment demands it
- For formal HIPAA de-identification: would need a Safe Harbor or Expert Determination review. This spec provides the foundation but does not claim HIPAA compliance.

### Data residency

- The lake should reside in the same region as the primary DB (currently US)
- Research partnerships may require data processing agreements (DPAs)
- Terms of service must disclose the research data program and link to the consent flow

---

## What's NOT in This Spec

- **Research partner portal / API** — how external researchers actually query the data. Separate concern.
- **IRB approval process** — institutional review board requirements for formal research. Operational, not technical.
- **ML model training pipeline** — how models are trained, validated, deployed. Separate spec when the data exists.
- **Revenue model for research data** — licensing, partnerships. Business decision.
- **Real-time streaming** — the lake is batch-updated, not real-time. Streaming is premature.

---

## Build Sequence

This is the last thing built. The dependency chain is:

1. **Insights v2** (day composites) — the data unit that feeds everything
2. **Personal data store** (practitioner sharing) — the consent and role model
3. **Aggregate research lake** — consumes de-identified day composites

For the initial research lake:
1. Add `research_consent` table to main DB with consent toggle in Settings
2. Create separate Supabase project for the lake
3. Build de-identification pipeline (runs on day composite create/update)
4. Backfill consented users' historical data
5. Build basic query API for internal analytics
6. External research API when partnerships materialize
