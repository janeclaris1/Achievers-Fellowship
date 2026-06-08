-- Password reset requests (admin-mediated, no self-service email reset)

CREATE TYPE password_reset_position AS ENUM (
  'SENIOR_CELL_LEADER',
  'CELL_LEADER'
);

CREATE TYPE password_reset_request_status AS ENUM (
  'PENDING',
  'RESOLVED',
  'REJECTED'
);

CREATE TABLE password_reset_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_group_id   UUID NOT NULL REFERENCES cell_groups(id),
  full_name       TEXT NOT NULL,
  position        password_reset_position NOT NULL,
  request_details TEXT NOT NULL,
  email           TEXT NOT NULL,
  phone           TEXT NOT NULL,
  status          password_reset_request_status NOT NULL DEFAULT 'PENDING',
  admin_note      TEXT,
  resolved_by     UUID REFERENCES profiles(id),
  resolved_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX password_reset_requests_status_idx ON password_reset_requests (status);
CREATE INDEX password_reset_requests_created_at_idx ON password_reset_requests (created_at DESC);

ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including logged-out users) can submit a request
CREATE POLICY "password_reset_requests_insert" ON password_reset_requests
  FOR INSERT WITH CHECK (true);

-- Admin only: view and manage requests
CREATE POLICY "password_reset_requests_select_admin" ON password_reset_requests
  FOR SELECT USING (get_my_role() = 'MASTER_ADMIN');

CREATE POLICY "password_reset_requests_update_admin" ON password_reset_requests
  FOR UPDATE USING (get_my_role() = 'MASTER_ADMIN');
