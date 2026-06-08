-- Require phone and email on password reset requests (if 014 was already applied)

ALTER TABLE password_reset_requests
  ALTER COLUMN phone SET NOT NULL,
  ALTER COLUMN email SET NOT NULL;
