-- Active/inactive flag for cell groups
ALTER TABLE cell_groups
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

UPDATE cell_groups SET is_active = TRUE WHERE is_active IS NULL;
