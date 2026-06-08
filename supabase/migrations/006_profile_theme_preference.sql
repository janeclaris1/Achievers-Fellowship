-- Store theme preference on user profile (no browser localStorage)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS theme_preference TEXT
  CHECK (theme_preference IN ('light', 'dark'));
