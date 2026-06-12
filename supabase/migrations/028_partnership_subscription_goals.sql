-- Partnership subscription goals (monthly, quarterly, yearly targets)

CREATE TYPE partnership_goal_period AS ENUM ('MONTHLY', 'QUARTERLY', 'YEARLY');

ALTER TABLE partnership_subscriptions
  ADD COLUMN IF NOT EXISTS goal_amount NUMERIC(12,2)
    CHECK (goal_amount IS NULL OR goal_amount > 0),
  ADD COLUMN IF NOT EXISTS goal_period partnership_goal_period,
  ADD COLUMN IF NOT EXISTS goal_set_at TIMESTAMPTZ;

-- goal_period should be set when goal_amount is set
ALTER TABLE partnership_subscriptions
  ADD CONSTRAINT partnership_subscriptions_goal_pair_check
  CHECK (
    (goal_amount IS NULL AND goal_period IS NULL)
    OR (goal_amount IS NOT NULL AND goal_period IS NOT NULL)
  );
