-- Migration: Add audit_log and user_notifications tables
-- Date: 2026-03-18
-- Part of Tier 3 — Revenue Enablement & HIPAA compliance

-- ─── Audit Log ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NOT NULL,
  target_id VARCHAR(255),
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_log_user_id_idx ON audit_log (user_id);
CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log (action);
CREATE INDEX IF NOT EXISTS audit_log_created_at_idx ON audit_log (created_at);

-- RLS: Only admins can read audit logs, service_role can write
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON audit_log FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── User Notifications ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS user_notifications_user_id_read_idx
  ON user_notifications (user_id, is_read);

-- RLS
ALTER TABLE user_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON user_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON user_notifications FOR UPDATE
  USING (user_id = auth.uid());
