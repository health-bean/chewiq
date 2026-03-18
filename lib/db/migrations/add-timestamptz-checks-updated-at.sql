-- Migration: Switch timestamps to timestamptz, add CHECK constraints, add updated_at columns
-- Date: 2026-03-18
-- Part of Tier 2 database integrity improvements

-- ─── Switch timestamp → timestamptz ──────────────────────────────────
-- This preserves existing data while adding timezone awareness.

ALTER TABLE foods ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE food_trigger_properties ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE protocols ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE protocol_phases ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE profiles ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE profiles ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE conversations ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE conversations ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE messages ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE timeline_entries ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE journal_entries ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE user_protocol_state ALTER COLUMN started_at TYPE timestamptz USING started_at AT TIME ZONE 'UTC';
ALTER TABLE user_protocol_state ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE reintroduction_log ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE reintroduction_entries ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE custom_foods ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE custom_foods ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';
ALTER TABLE custom_food_properties ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';
ALTER TABLE user_food_reactions ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC';

-- ─── Add updated_at to timeline_entries and reintroduction_log ───────

ALTER TABLE timeline_entries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE reintroduction_log ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ─── Auto-update trigger for updated_at columns ─────────────────────

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles', 'conversations', 'custom_foods',
    'user_protocol_state', 'timeline_entries', 'reintroduction_log'
  ])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ─── CHECK Constraints ──────────────────────────────────────────────

-- timeline_entries.entry_type
ALTER TABLE timeline_entries DROP CONSTRAINT IF EXISTS timeline_entries_entry_type_check;
ALTER TABLE timeline_entries ADD CONSTRAINT timeline_entries_entry_type_check
  CHECK (entry_type IN ('food', 'symptom', 'supplement', 'medication', 'exposure', 'detox', 'exercise', 'energy', 'off_protocol'));

-- timeline_entries.severity (1-10)
ALTER TABLE timeline_entries DROP CONSTRAINT IF EXISTS timeline_entries_severity_check;
ALTER TABLE timeline_entries ADD CONSTRAINT timeline_entries_severity_check
  CHECK (severity IS NULL OR (severity >= 1 AND severity <= 10));

-- journal_entries scores (1-10)
ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_sleep_score_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_sleep_score_check
  CHECK (sleep_score IS NULL OR (sleep_score >= 1 AND sleep_score <= 10));

ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_energy_score_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_energy_score_check
  CHECK (energy_score IS NULL OR (energy_score >= 1 AND energy_score <= 10));

ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_mood_score_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_mood_score_check
  CHECK (mood_score IS NULL OR (mood_score >= 1 AND mood_score <= 10));

ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_stress_score_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_stress_score_check
  CHECK (stress_score IS NULL OR (stress_score >= 1 AND stress_score <= 10));

ALTER TABLE journal_entries DROP CONSTRAINT IF EXISTS journal_entries_pain_score_check;
ALTER TABLE journal_entries ADD CONSTRAINT journal_entries_pain_score_check
  CHECK (pain_score IS NULL OR (pain_score >= 1 AND pain_score <= 10));

-- reintroduction_log.status
ALTER TABLE reintroduction_log DROP CONSTRAINT IF EXISTS reintroduction_log_status_check;
ALTER TABLE reintroduction_log ADD CONSTRAINT reintroduction_log_status_check
  CHECK (status IN ('active', 'passed', 'failed', 'inconclusive', 'cancelled'));

-- messages.role
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_role_check;
ALTER TABLE messages ADD CONSTRAINT messages_role_check
  CHECK (role IN ('user', 'assistant'));

-- user_food_reactions.status
ALTER TABLE user_food_reactions DROP CONSTRAINT IF EXISTS user_food_reactions_status_check;
ALTER TABLE user_food_reactions ADD CONSTRAINT user_food_reactions_status_check
  CHECK (status IN ('safe', 'unsafe', 'sensitive'));
