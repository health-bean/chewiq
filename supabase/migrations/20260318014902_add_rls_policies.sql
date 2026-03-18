-- Migration: Enable Row Level Security on all user-scoped tables
-- Date: 2026-03-17
-- Critical security fix: prevents direct PostgREST access to other users' data
--
-- IMPORTANT: Run this migration against your Supabase database.
-- Without RLS, any authenticated user can query all data via the Supabase REST API.

-- ─── Enable RLS on all user-scoped tables ────────────────────────────

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_protocol_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE reintroduction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE reintroduction_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_food_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_food_reactions ENABLE ROW LEVEL SECURITY;

-- ─── Enable RLS on reference tables (permissive read) ────────────────

ALTER TABLE foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE food_trigger_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_food_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE symptoms_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplements_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications_database ENABLE ROW LEVEL SECURITY;
ALTER TABLE detox_types ENABLE ROW LEVEL SECURITY;

-- ─── Profiles: users can only access their own profile ───────────────

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

-- Insert is handled by the signup route using service_role key

-- ─── Conversations: users can only access their own ──────────────────

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own conversations"
  ON conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own conversations"
  ON conversations FOR DELETE
  USING (user_id = auth.uid());

-- ─── Messages: access via conversation ownership ─────────────────────

CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM conversations WHERE user_id = auth.uid()
    )
  );

-- ─── Timeline Entries ────────────────────────────────────────────────

CREATE POLICY "Users can view own timeline entries"
  ON timeline_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own timeline entries"
  ON timeline_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own timeline entries"
  ON timeline_entries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own timeline entries"
  ON timeline_entries FOR DELETE
  USING (user_id = auth.uid());

-- ─── Journal Entries ─────────────────────────────────────────────────

CREATE POLICY "Users can view own journal entries"
  ON journal_entries FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own journal entries"
  ON journal_entries FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own journal entries"
  ON journal_entries FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own journal entries"
  ON journal_entries FOR DELETE
  USING (user_id = auth.uid());

-- ─── User Protocol State ────────────────────────────────────────────

CREATE POLICY "Users can view own protocol state"
  ON user_protocol_state FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own protocol state"
  ON user_protocol_state FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own protocol state"
  ON user_protocol_state FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own protocol state"
  ON user_protocol_state FOR DELETE
  USING (user_id = auth.uid());

-- ─── Reintroduction Log ─────────────────────────────────────────────

CREATE POLICY "Users can view own reintroductions"
  ON reintroduction_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own reintroductions"
  ON reintroduction_log FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reintroductions"
  ON reintroduction_log FOR UPDATE
  USING (user_id = auth.uid());

-- ─── Reintroduction Entries: access via reintroduction ownership ─────

CREATE POLICY "Users can view own reintroduction entries"
  ON reintroduction_entries FOR SELECT
  USING (
    reintroduction_id IN (
      SELECT id FROM reintroduction_log WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own reintroduction entries"
  ON reintroduction_entries FOR INSERT
  WITH CHECK (
    reintroduction_id IN (
      SELECT id FROM reintroduction_log WHERE user_id = auth.uid()
    )
  );

-- ─── Custom Foods ───────────────────────────────────────────────────

CREATE POLICY "Users can view own custom foods"
  ON custom_foods FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own custom foods"
  ON custom_foods FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own custom foods"
  ON custom_foods FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own custom foods"
  ON custom_foods FOR DELETE
  USING (user_id = auth.uid());

-- ─── Custom Food Properties: access via custom food ownership ───────

CREATE POLICY "Users can view own custom food properties"
  ON custom_food_properties FOR SELECT
  USING (
    custom_food_id IN (
      SELECT id FROM custom_foods WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own custom food properties"
  ON custom_food_properties FOR INSERT
  WITH CHECK (
    custom_food_id IN (
      SELECT id FROM custom_foods WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own custom food properties"
  ON custom_food_properties FOR UPDATE
  USING (
    custom_food_id IN (
      SELECT id FROM custom_foods WHERE user_id = auth.uid()
    )
  );

-- ─── User Food Reactions ────────────────────────────────────────────

CREATE POLICY "Users can view own food reactions"
  ON user_food_reactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own food reactions"
  ON user_food_reactions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own food reactions"
  ON user_food_reactions FOR UPDATE
  USING (user_id = auth.uid());

-- ─── Reference Tables: authenticated read-only ──────────────────────

CREATE POLICY "Authenticated users can read foods"
  ON foods FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read food categories"
  ON food_categories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read food subcategories"
  ON food_subcategories FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read food trigger properties"
  ON food_trigger_properties FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read protocols"
  ON protocols FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read protocol phases"
  ON protocol_phases FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read protocol rules"
  ON protocol_rules FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read protocol food overrides"
  ON protocol_food_overrides FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read symptoms"
  ON symptoms_database FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read supplements"
  ON supplements_database FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read medications"
  ON medications_database FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can read detox types"
  ON detox_types FOR SELECT TO authenticated USING (true);

-- ─── Service role bypass note ───────────────────────────────────────
-- The service_role key automatically bypasses RLS.
-- The app uses service_role only in lib/supabase/admin.ts (signup route).
-- All other queries use the anon key or user JWT, which respect RLS.
