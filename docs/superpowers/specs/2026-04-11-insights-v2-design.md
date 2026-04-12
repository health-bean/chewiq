# Insights v2 — Design Spec

**Date:** 2026-04-11
**Status:** Approved
**Author:** Dee + Claude

---

## Philosophy

Observe, don't prescribe. The app is a mirror that gets smarter the more you use it. No recommendations, no judgments, no scores. Show what the data says — the user and their practitioner decide what it means.

- Language: "seen 14 times" not "high confidence"
- Tone: neutral observation, not coaching
- No "you should," "try this," or "good/bad day" framing
- Frequency, recency, and consistency describe strength — not statistical jargon

---

## Audience

User-first. Designed for people with chronic illness (brain fog, fatigue). Mobile-first.

The computation layer produces a structured JSON payload that a future practitioner view can render differently (clinical voice, statistical detail). That's a separate spec — this one covers the user surface.

---

## Two Jobs

1. **"What's making me feel bad?"** — trigger identification. Single-factor and multi-factor correlations. Food properties. Stress amplification. Timing patterns.
2. **"Am I getting better?"** — progress through observation. "Headache frequency: 6 in March, 2 so far in April." Not a judgment — just a fact the user interprets.

These are answered through the same data, surfaced differently.

---

## Surfaces

### 1. Your Day (default view)

The thing the user sees every time they open the Insights tab. Mobile-first card stack.

**Contents:**
- **Log summary:** What you ate, supplements taken, symptoms logged, exercise — compact list with timestamps
- **Reflect entries:** Sleep, energy, mood, stress, pain numbers displayed as neutral facts (no color coding, no arrows, no "good/bad")
- **Food property tags:** Every food shows ambient labels — "Tomato — nightshade · high histamine" — regardless of protocol. Always present, always teaching.
- **Protocol compliance:** If on a protocol, foods show allowed/avoid/moderation inline (existing system). Off-protocol entries clearly marked.
- **Logging consistency:** "12 of last 14 days" — not a streak to maintain, just context for how much data the engine has.

**Interaction:**
- Swipe between days (mobile gesture) or date picker
- Tap a food → expand to show full properties + protocol status
- Tap a symptom → see what else happened that day (scroll to context)

**Cold start (< 7 days):** Shows exactly what's above — a mirror of what you logged. No patterns section. The tab is useful from day 1 as a daily health journal.

### 2. Pattern Alerts (inline, event-driven)

Appear at the top of the Day View when the engine discovers something new or notable. Not a separate page — they surface within the daily flow.

**Trigger conditions:**
- New pattern detected (crosses occurrence gate for the first time)
- Existing pattern strengthened (moved from single → 2-factor, or occurrence count crossed a threshold)
- Pattern recurrence after absence ("nightshade → joint pain — seen again after 3 weeks")
- Progress milestone ("headache frequency: lowest 30-day count since you started tracking")

**Card format:**
- One sentence: "New pattern: eggs + poor sleep → headache (seen 5 times)"
- Tap to expand → full detail (contributing days, timing, co-factors)
- Dismiss to acknowledge → moves to All Patterns
- Un-dismissed alerts persist across sessions

**What does NOT trigger an alert:**
- Patterns the user has already seen and dismissed
- Marginal changes (occurrence count went from 7 to 8)
- Anything below the occurrence gates

### 3. All Patterns (deeper layer)

Accessible from the Insights tab via a "View all patterns" link or tab. The full library.

**Contents:**
- Every correlation the engine has found, organized by type:
  - **Triggers** — things that worsen symptoms (foods, exposures, stress, timing)
  - **Helpers** — things that improve outcomes (supplements, exercise, sleep)
  - **Property patterns** — grouped by food property ("High-histamine foods → flushing: tomato, aged cheese, wine, sauerkraut")
- Sorted by impact (frequency × consistency × recency)

**Card format:**
- Reads as a sentence: "On days with nightshades + poor sleep, joint pain was 3x more frequent (seen 8 times)"
- Badges: frequency ("seen 14 times"), recency ("last seen 3 days ago"), factor count (1×, 2×, 3×)
- Tap to expand → contributing days, timeline of occurrences, trend (increasing/decreasing/stable)
- Multi-factor cards show each contributing factor as a sub-element

**Progress observations** (the (b) job):
- Interspersed with pattern cards: "Headache frequency: 6 in March → 2 in April (8 days in)"
- "Flare-free streak: 12 days (your longest)"
- These are observations, not judgments. No "great job" — just the numbers.

---

## Food Property Tags

Ambient labels on all foods throughout the entire app — search results, log entries, day view, quick-log. Not just in Insights.

**Source:** `food_trigger_properties` table (8 property types: oxalate, histamine, lectin, nightshade, FODMAP, salicylate, amines, tyramine) with severity levels (high, moderate, low).

**Display:** Small, neutral pills/tags. "nightshade" "high histamine" "moderate oxalate". No red/green — use warm-neutral tinting from the design system. Present on every food, every time, whether the user is on a protocol or not.

**Purpose:** Informal education. People learn what's in their food by seeing it repeatedly. "Oh, tomatoes are a nightshade" becomes ambient knowledge.

**Protocol compliance** (existing, preserved): When on a protocol, foods additionally show allowed/avoid/moderation status with the existing `ProtocolComplianceWarning` modal on log attempt. Tags and compliance are independent — tags always show, compliance only shows with an active protocol.

---

## Correlation Engine v2

### Architecture: Two Layers

**Layer 1 — Day Composites**
One composite object per user per day. Aggregates everything:
- Foods eaten (with properties, protocol compliance, meal timing)
- Supplements taken (with timing)
- Medications taken
- Symptoms logged (with severity, timing)
- Exposures logged
- Exercise (type, intensity, duration, energy level)
- Journal scores (sleep, energy, mood, stress, pain)
- Protocol compliance summary (% compliant, violations)
- Metadata: entry count, logging completeness

Used for: multi-factor analysis ("days where X + Y + Z → outcome"), progress tracking, trend detection, and as the canonical row for the future aggregate research data lake.

**Layer 2 — Event Windows**
Sliding time windows (4h, 8h, 24h, 48h) around specific events. Preserves the existing analyzer logic.
- Food → symptom within 8h/24h/48h
- Supplement → next-day sleep quality
- Medication → symptom within 6h
- Late meal (after 20:00) → symptom within 12h
- Exercise → energy within 2h/4h/8h/24h

Used for: specific trigger identification with temporal precision.

Both layers feed into the same Insights output. Day composites power multi-factor cards. Event windows power single-factor timing cards.

### N-Factor Correlation with Pruning

The engine doesn't test every possible combination. It prunes.

**Level 1 — Single factors.**
Run all 7 existing analyzers (food→symptom, supplement→effect, medication→symptom, supplement→sleep, stress→amplification, late-meals→symptom, exercise→energy). Additionally: journal score correlations (e.g., low sleep score → elevated symptom severity next day).

Gate: minimum 3 occurrences.

**Level 2 — 2-factor combinations.**
Take every significant single-factor result. Test all pairs against the day composite: "Does nightshade + poor sleep predict joint pain better than nightshade alone?" Compare the conditional probability of the symptom given both factors vs. given each factor alone.

Gate: minimum 5 co-occurrences of both factors.

Only promote to 2-factor if the combined signal is meaningfully stronger than either single factor. Threshold: ≥ 1.5x the symptom rate vs. the stronger single factor alone.

**Level 3 — 3-factor combinations.**
Take every significant 2-factor result. Test adding each remaining significant single factor. Same conditional probability comparison.

Gate: minimum 7 co-occurrences of all three factors.

Only promote if ≥ 1.3x the symptom rate vs. the strongest 2-factor sub-combination.

**Absorption:** When a multi-factor pattern is promoted, the weaker single-factor components are absorbed (hidden from the main view, accessible in "All Patterns" under an "absorbed by" note). This prevents showing "eggs → headache" AND "eggs + poor sleep → headache" as separate top-level insights.

### Cold-Start Progression

The engine's output naturally evolves with data volume:

| Data volume | Engine output | User sees |
|---|---|---|
| Days 1–7 | Nothing passes gates | Day View only — pure mirror |
| Days 7–14 | First single-factor signals (3+ occurrences) | Day View + first pattern alert ("Early pattern: ...") |
| Days 14–30 | Single factors solidify, first 2-factor tests | Pattern alerts for new findings, "All Patterns" starts populating |
| Days 30–60 | 2-factor combinations emerge (5+ co-occurrences) | Multi-factor cards appear, progress observations begin |
| Days 60+ | 3-factor combinations possible (7+ co-occurrences) | Rich pattern library, clear progress trends |

No artificial phases — just occurrence gates. Users who log more frequently progress faster.

### What Counts as a "Factor"

Factors are drawn from the day composite:

| Category | Factors | Source |
|---|---|---|
| Food | Individual foods, food properties (high histamine, nightshade, etc.) | timeline_entries (type=food) + food_trigger_properties |
| Supplement | Individual supplements, supplement timing | timeline_entries (type=supplement) |
| Medication | Individual medications | timeline_entries (type=medication) |
| Exposure | Exposure types (mold, chemical, EMF) | timeline_entries (type=exposure) |
| Exercise | Exercise type, intensity level, presence/absence | timeline_entries (type=exercise) |
| Sleep | Sleep score (bucketed: poor ≤4, moderate 5–6, good ≥7) | journal_entries.sleep_score |
| Stress | Stress score (bucketed: low ≤4, moderate 5–6, high ≥7) | journal_entries.stress_score |
| Energy | Energy score (bucketed) | journal_entries.energy_score |
| Mood | Mood score (bucketed) | journal_entries.mood_score |
| Pain | Pain score (bucketed) | journal_entries.pain_score |
| Timing | Late meal (after 20:00), meal spacing | timeline_entries timestamps |
| Protocol | Compliance % for the day, number of violations | Computed from protocol rules engine |

**Outcomes** (what factors predict):
- Symptom occurrence (any symptom, or specific symptom)
- Symptom severity
- Next-day journal scores (sleep, energy, mood, pain)
- Flare days (defined as: ≥2 symptoms or any symptom severity ≥7)

### Computation Strategy

**When:** On-demand when user opens Insights, with 5-minute Redis cache (existing pattern). Day composites are computed and cached longer (1 hour) since historical days don't change.

**Performance:** N-factor pruning keeps computation bounded. Worst case with 90 days of data: ~50 significant single factors → ~1,225 pair tests → ~100 significant pairs → ~5,000 triple tests. Each test is a simple conditional probability on pre-aggregated day composites. Sub-second on Vercel.

**Future:** When computation time exceeds acceptable thresholds (likely at 6+ months of dense data), move to materialized day composites in Postgres + pg_cron nightly refresh. The on-demand path becomes a cache read. This is the Phase 3 background-jobs path from the infrastructure doc — now with a concrete trigger.

---

## Data Model

### New: `day_composites` table

Materialized daily summary. One row per user per day.

```
day_composites
  id              uuid PK
  user_id         uuid FK → profiles.id (RLS)
  date            date NOT NULL
  
  -- Counts
  food_count      integer
  symptom_count   integer
  supplement_count integer
  medication_count integer
  exposure_count  integer
  exercise_count  integer
  
  -- Journal scores (nullable — user may not have filled Reflect)
  sleep_score     integer
  energy_score    integer
  mood_score      integer
  stress_score    integer
  pain_score      integer
  
  -- Protocol
  protocol_id     uuid FK → protocols.id (nullable)
  compliance_pct  numeric(5,2) (nullable)
  violation_count integer
  
  -- Aggregated detail (JSONB for flexibility)
  foods           jsonb  -- [{food_id, name, properties: [...], meal_type, time, protocol_status}]
  symptoms        jsonb  -- [{name, severity, time}]
  supplements     jsonb  -- [{name, time}]
  medications     jsonb  -- [{name, time}]
  exposures       jsonb  -- [{type, severity, time}]
  exercises       jsonb  -- [{type, intensity, duration, energy_level, time}]
  
  -- Metadata
  entry_count     integer
  has_journal     boolean
  
  -- Derived flags (for fast querying)
  is_flare_day    boolean  -- ≥2 symptoms or any severity ≥7
  has_late_meal   boolean  -- any food entry after 20:00
  
  created_at      timestamptz DEFAULT now()
  updated_at      timestamptz DEFAULT now()
  
  UNIQUE(user_id, date)
```

**RLS:** `user_id = auth.uid()`

**Population strategy:**
- Computed on-demand when Insights are loaded (for recent/changed days)
- Backfilled for historical data on first Insights load
- Future: pg_cron nightly refresh for previous day

**Why JSONB for detail columns:** The composite is a read-optimized denormalization. The source of truth remains the normalized tables (timeline_entries, journal_entries). JSONB lets us store the full day picture in one row without a rigid column-per-food schema, and it's what the engine iterates over during correlation. Postgres JSONB operators handle the query patterns we need.

### New: `insight_snapshots` table

Stores the engine's output so we can detect "new" vs "seen" patterns and support future digest/delta features.

```
insight_snapshots
  id              uuid PK
  user_id         uuid FK → profiles.id (RLS)
  computed_at     timestamptz DEFAULT now()
  days_analyzed   integer
  
  -- Engine output
  triggers        jsonb  -- [{factors: [...], outcome, frequency, recency, impact_score, factor_count}]
  helpers         jsonb  -- [{factors: [...], outcome, frequency, recency, impact_score, factor_count}]
  patterns        jsonb  -- [{property, foods: [...], outcome, frequency}]
  progress        jsonb  -- [{metric, current_period, previous_period, change_pct}]
  
  -- Metadata
  single_count    integer
  two_factor_count integer
  three_factor_count integer
  
  UNIQUE(user_id, computed_at)
```

### New: `insight_alerts` table

Tracks which pattern alerts the user has seen/dismissed.

```
insight_alerts
  id              uuid PK
  user_id         uuid FK → profiles.id (RLS)
  alert_type      text  -- 'new_pattern' | 'pattern_strengthened' | 'recurrence' | 'progress_milestone'
  insight_key     text  -- deterministic hash of factors + outcome (for deduplication)
  title           text
  body            text
  detail          jsonb
  
  dismissed       boolean DEFAULT false
  created_at      timestamptz DEFAULT now()
  dismissed_at    timestamptz
```

### Modified: existing tables

No schema changes to existing tables. The day composite reads from `timeline_entries` + `journal_entries` + `food_trigger_properties` + `protocol_rules`. All existing data flows in.

---

## API Design

### GET /api/insights/day?date=YYYY-MM-DD

Returns the day composite for a specific date. Powers the Day View.

Response:
```json
{
  "date": "2026-04-11",
  "foods": [{"name": "Tomato", "properties": ["nightshade", "high histamine"], "protocol_status": "avoid", "time": "12:30"}],
  "symptoms": [{"name": "Joint pain", "severity": 6, "time": "18:00"}],
  "supplements": [...],
  "exercises": [...],
  "journal": {"sleep": 5, "energy": 4, "mood": 6, "stress": 7, "pain": 5},
  "compliance_pct": 85,
  "entry_count": 12,
  "is_flare_day": true
}
```

### GET /api/insights/patterns?days=90

Returns the full correlation output. Powers "All Patterns" and pattern alerts.

Response:
```json
{
  "triggers": [
    {
      "factors": ["nightshade", "sleep_poor"],
      "factor_count": 2,
      "outcome": "joint_pain",
      "outcome_label": "Joint pain",
      "frequency": 8,
      "recency_days": 3,
      "impact_score": 0.82,
      "description": "On days with nightshades + poor sleep, joint pain was 3x more frequent",
      "trend": "stable",
      "absorbed": ["nightshade→joint_pain"]
    }
  ],
  "helpers": [...],
  "property_patterns": [...],
  "progress": [
    {
      "metric": "headache_frequency",
      "label": "Headache frequency",
      "current_period": {"count": 2, "days": 8, "label": "April"},
      "previous_period": {"count": 6, "days": 31, "label": "March"},
      "observation": "Headache frequency: 6 in March, 2 so far in April (8 days in)"
    }
  ],
  "data_status": {
    "days_tracked": 47,
    "days_analyzed": 90,
    "logging_consistency": 0.85,
    "single_factors": 23,
    "two_factor_patterns": 5,
    "three_factor_patterns": 1
  }
}
```

### GET /api/insights/alerts

Returns undismissed alerts for the current user. Powers the inline pattern alerts on Day View.

### PATCH /api/insights/alerts/:id

Dismiss an alert.

---

## Component Architecture

```
InsightsPage (tab root)
├── DayView (default surface)
│   ├── AlertStack (undismissed pattern alerts)
│   │   └── AlertCard (one per alert, dismissable)
│   ├── DayHeader (date, navigation, swipe)
│   ├── JournalSummary (reflect scores — neutral display)
│   ├── LogSummary (foods, supplements, symptoms, exercise)
│   │   ├── FoodEntry (name + ambient property tags + protocol badge)
│   │   ├── SymptomEntry
│   │   ├── SupplementEntry
│   │   └── ExerciseEntry
│   ├── DayStats (entry count, compliance %, logging note)
│   └── ViewAllPatternsLink
├── AllPatterns (deeper layer)
│   ├── PatternFilters (triggers / helpers / properties / progress)
│   ├── PatternCard (multi-factor or single-factor)
│   │   ├── FactorPills (contributing factors)
│   │   ├── OutcomeBadge
│   │   ├── FrequencyBadge
│   │   ├── RecencyBadge
│   │   └── TrendIndicator (increasing / decreasing / stable)
│   └── ProgressCard (observation-only)
└── FoodPropertyTag (shared component, used app-wide)
```

### FoodPropertyTag (shared)

Used everywhere a food appears — Insights, Log, Chat, Search, Quick-Log.

```
<FoodPropertyTag property="nightshade" />
<FoodPropertyTag property="histamine" severity="high" />
```

Renders as a small neutral pill using warm-neutral design system colors. No red/green.

---

## Out of Scope (separate specs)

- **Practitioner view** — role-aware rendering of the same computation layer. Separate spec when practitioner dashboard is designed.
- **Aggregate research data lake** — de-identified, multi-modal time-series store. Day composites are designed to feed into this, but the lake itself is a separate system with its own consent model, de-identification strategy, and storage. Separate spec.
- **Push notifications for insights** — requires `device_tokens` table and notification dispatch. Deferred.
- **Predictive insights** — "you might flare tomorrow." Requires more data science work. Deferred.
- **Charts / sparklines / calendar heatmap** — can be added to the existing card structure later without architectural changes. Not in initial build.
- **Dark mode** — deferred.

---

## Migration from Current Insights

The current Insights page (`app/(app)/insights/page.tsx`) and correlation engine (`lib/correlations/`) are replaced, not extended. The current engine has the right analyzers but wrong architecture (no day composites, no multi-factor, no alerts).

**What's preserved:**
- All 7 analyzer algorithms (refactored into the new engine, not rewritten from scratch)
- Food property pattern detection logic
- Scoring/impact calculation approach
- Redis caching strategy
- `checkComplianceSync()` and protocol rules engine (unchanged)
- `ExerciseInsights` display logic (absorbed into PatternCard)
- `InsightCard` rendering approach (evolved into PatternCard)

**What's new:**
- Day composite table + computation
- N-factor pruning layer
- Alert system (table + API + UI)
- Insight snapshots (for delta detection)
- Day View as default surface
- Food property tags as shared component
- Progress observations

**What's removed:**
- Static "Triggers / What Helps" section layout (replaced by sorted pattern cards)
- Separate ExerciseInsights component (absorbed into unified pattern system)
- Hardcoded 90-day window (replaced by user-selectable range on All Patterns)
