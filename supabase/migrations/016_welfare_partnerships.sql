-- Individual welfare department partnerships (donations)

CREATE TYPE welfare_partnership_status AS ENUM (
  'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'
);

CREATE TABLE welfare_partnerships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id          UUID NOT NULL REFERENCES profiles(id),
  amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency            TEXT NOT NULL DEFAULT 'GHS',
  status              welfare_partnership_status NOT NULL DEFAULT 'PENDING',
  payment_reference   TEXT NOT NULL UNIQUE,
  paystack_reference  TEXT,
  partner_note        TEXT,
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX welfare_partnerships_profile_idx ON welfare_partnerships (profile_id);
CREATE INDEX welfare_partnerships_status_idx ON welfare_partnerships (status);
CREATE INDEX welfare_partnerships_created_at_idx ON welfare_partnerships (created_at DESC);

ALTER TABLE welfare_partnerships ENABLE ROW LEVEL SECURITY;

-- Users see their own partnerships
CREATE POLICY "welfare_partnerships_select_own" ON welfare_partnerships
  FOR SELECT USING (profile_id = auth.uid());

-- Welfare + admin see all
CREATE POLICY "welfare_partnerships_select_staff" ON welfare_partnerships
  FOR SELECT USING (get_my_role() IN ('MASTER_ADMIN', 'WELFARE'));

-- Users can create pending partnerships for themselves
CREATE POLICY "welfare_partnerships_insert_own" ON welfare_partnerships
  FOR INSERT WITH CHECK (
    profile_id = auth.uid()
    AND status = 'PENDING'
  );

-- Staff can update (manual reconciliation if needed)
CREATE POLICY "welfare_partnerships_update_staff" ON welfare_partnerships
  FOR UPDATE USING (get_my_role() IN ('MASTER_ADMIN', 'WELFARE'));
