-- Track which welfare partnership arm each sponsorship supports

ALTER TABLE welfare_partnerships
  ADD COLUMN IF NOT EXISTS partnership_arm TEXT;

CREATE INDEX IF NOT EXISTS welfare_partnerships_arm_idx ON welfare_partnerships (partnership_arm);
