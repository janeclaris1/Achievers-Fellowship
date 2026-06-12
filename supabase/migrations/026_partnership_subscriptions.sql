-- Daily partnership subscriptions (Paystack recurring authorization)

CREATE TYPE partnership_subscription_status AS ENUM (
  'PENDING_SETUP', 'ACTIVE', 'PAUSED', 'CANCELLED', 'FAILED'
);

CREATE TABLE partnership_subscriptions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id              UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  daily_amount            NUMERIC(12,2) NOT NULL CHECK (daily_amount >= 1),
  currency                TEXT NOT NULL DEFAULT 'GHS',
  partnership_arm         TEXT,
  status                  partnership_subscription_status NOT NULL DEFAULT 'PENDING_SETUP',
  paystack_authorization_code TEXT,
  paystack_customer_code  TEXT,
  payer_email             TEXT NOT NULL,
  setup_payment_reference TEXT UNIQUE,
  next_charge_at          DATE,
  last_charged_at         TIMESTAMPTZ,
  consecutive_failures    INT NOT NULL DEFAULT 0 CHECK (consecutive_failures >= 0),
  started_at              TIMESTAMPTZ,
  paused_at               TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX partnership_subscriptions_one_open_per_profile
  ON partnership_subscriptions (profile_id)
  WHERE status IN ('PENDING_SETUP', 'ACTIVE', 'PAUSED');

CREATE INDEX partnership_subscriptions_status_idx ON partnership_subscriptions (status);
CREATE INDEX partnership_subscriptions_next_charge_idx ON partnership_subscriptions (next_charge_at)
  WHERE status = 'ACTIVE';

CREATE TABLE partnership_subscription_charges (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id       UUID NOT NULL REFERENCES partnership_subscriptions(id) ON DELETE CASCADE,
  amount                NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency              TEXT NOT NULL DEFAULT 'GHS',
  status                welfare_partnership_status NOT NULL DEFAULT 'PENDING',
  payment_reference     TEXT NOT NULL UNIQUE,
  paystack_reference    TEXT,
  welfare_partnership_id UUID REFERENCES welfare_partnerships(id),
  failure_reason        TEXT,
  charged_at            TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX partnership_subscription_charges_sub_idx
  ON partnership_subscription_charges (subscription_id, created_at DESC);

ALTER TABLE welfare_partnerships
  ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES partnership_subscriptions(id);

CREATE INDEX IF NOT EXISTS welfare_partnerships_subscription_idx
  ON welfare_partnerships (subscription_id);

CREATE TRIGGER partnership_subscriptions_updated_at
  BEFORE UPDATE ON partnership_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE partnership_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnership_subscription_charges ENABLE ROW LEVEL SECURITY;

-- Subscribers see their own subscription
CREATE POLICY "partnership_subscriptions_select_own" ON partnership_subscriptions
  FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "partnership_subscriptions_select_staff" ON partnership_subscriptions
  FOR SELECT USING (get_my_role() IN ('MASTER_ADMIN', 'WELFARE'));

CREATE POLICY "partnership_subscriptions_update_staff" ON partnership_subscriptions
  FOR UPDATE USING (get_my_role() IN ('MASTER_ADMIN', 'WELFARE'));

-- Charges: own via subscription join
CREATE POLICY "partnership_subscription_charges_select_own" ON partnership_subscription_charges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM partnership_subscriptions s
      WHERE s.id = subscription_id AND s.profile_id = auth.uid()
    )
  );

CREATE POLICY "partnership_subscription_charges_select_staff" ON partnership_subscription_charges
  FOR SELECT USING (get_my_role() IN ('MASTER_ADMIN', 'WELFARE'));
