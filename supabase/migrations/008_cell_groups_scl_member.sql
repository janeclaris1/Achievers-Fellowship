-- Assign SCL from the members table (any active member can be a cell group leader)
ALTER TABLE cell_groups
  ADD COLUMN IF NOT EXISTS scl_member_id UUID REFERENCES members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_cell_groups_scl_member_id ON cell_groups(scl_member_id);
