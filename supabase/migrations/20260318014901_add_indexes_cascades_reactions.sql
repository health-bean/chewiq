-- Migration: Add missing indexes, cascade deletes, and user_food_reactions table
-- Date: 2026-03-17
-- Part of Tier 2 database integrity improvements

-- ─── Missing Indexes ──────────────────────────────────────────────────

-- P0: Messages conversation lookup (every chat message send)
CREATE INDEX IF NOT EXISTS messages_conversation_id_created_at_idx
  ON messages (conversation_id, created_at);

-- P1: Custom foods user lookup
CREATE INDEX IF NOT EXISTS custom_foods_user_id_idx
  ON custom_foods (user_id);

-- P1: Timeline entries food_id for JOINs
CREATE INDEX IF NOT EXISTS timeline_entries_food_id_idx
  ON timeline_entries (food_id);

-- P1: Reintroduction log date sorting
CREATE INDEX IF NOT EXISTS reintroduction_log_user_id_start_date_idx
  ON reintroduction_log (user_id, start_date);

-- ─── Cascade Delete Fixes ─────────────────────────────────────────────

-- timeline_entries.food_id → SET NULL on delete (was no action)
ALTER TABLE timeline_entries
  DROP CONSTRAINT IF EXISTS timeline_entries_food_id_foods_id_fk,
  ADD CONSTRAINT timeline_entries_food_id_foods_id_fk
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL;

-- timeline_entries.source_message_id → SET NULL on delete (was no action)
ALTER TABLE timeline_entries
  DROP CONSTRAINT IF EXISTS timeline_entries_source_message_id_messages_id_fk,
  ADD CONSTRAINT timeline_entries_source_message_id_messages_id_fk
    FOREIGN KEY (source_message_id) REFERENCES messages(id) ON DELETE SET NULL;

-- reintroduction_log.food_id → SET NULL on delete (was no action)
ALTER TABLE reintroduction_log
  DROP CONSTRAINT IF EXISTS reintroduction_log_food_id_foods_id_fk,
  ADD CONSTRAINT reintroduction_log_food_id_foods_id_fk
    FOREIGN KEY (food_id) REFERENCES foods(id) ON DELETE SET NULL;

-- profiles.current_protocol_id → SET NULL on delete (was no action)
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_current_protocol_id_protocols_id_fk,
  ADD CONSTRAINT profiles_current_protocol_id_protocols_id_fk
    FOREIGN KEY (current_protocol_id) REFERENCES protocols(id) ON DELETE SET NULL;

-- ─── New Table: user_food_reactions ───────────────────────────────────

CREATE TABLE IF NOT EXISTS user_food_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  food_id UUID REFERENCES foods(id) ON DELETE SET NULL,
  food_name VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL, -- safe, unsafe, sensitive
  reintroduction_id UUID REFERENCES reintroduction_log(id) ON DELETE SET NULL,
  confirmed_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_food_reactions_user_id_idx
  ON user_food_reactions (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS user_food_reactions_user_food_idx
  ON user_food_reactions (user_id, food_name);
