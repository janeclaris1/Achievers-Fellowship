-- Run this in Supabase SQL Editor if cell group saves fail
-- (adds is_active + scl_member_id columns from migrations 007 and 008)

ALTER TABLE cell_groups
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE cell_groups SET is_active = TRUE WHERE is_active IS NULL;

ALTER TABLE cell_groups
  ADD COLUMN IF NOT EXISTS scl_member_id UUID REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cell_groups_scl_member_id ON cell_groups(scl_member_id);
