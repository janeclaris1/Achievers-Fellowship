-- =============================================
-- ARCHEIVERS FELLOWSHIP — DATABASE SCHEMA
-- Migration 001: Initial Schema
-- =============================================

-- ENUMS
CREATE TYPE user_role AS ENUM (
  'MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER'
);

CREATE TYPE gender AS ENUM ('MALE', 'FEMALE');

CREATE TYPE member_status AS ENUM (
  'ACTIVE', 'INACTIVE', 'NEW_CONVERT', 'TRANSFERRED', 'DECEASED'
);

CREATE TYPE followup_type AS ENUM ('CALL', 'MESSAGE', 'VISIT');

CREATE TYPE followup_status AS ENUM (
  'PENDING', 'COMPLETED', 'NO_ANSWER', 'RESCHEDULED'
);

CREATE TYPE visit_status AS ENUM (
  'SCHEDULED', 'COMPLETED', 'MISSED', 'CANCELLED'
);

CREATE TYPE program_type AS ENUM (
  'BIRTHDAY', 'BEREAVEMENT', 'HOSPITAL_VISIT',
  'WEDDING', 'SPECIAL_PROGRAM', 'OTHER'
);

CREATE TYPE program_status AS ENUM (
  'PLANNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
);

-- =============================================
-- PROFILES (extends Supabase auth.users)
-- =============================================

CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  role        user_role NOT NULL,
  phone       TEXT,
  cell_group_id UUID,
  is_active   BOOLEAN DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- CELL GROUPS
-- =============================================

CREATE TABLE cell_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  scl_id      UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Add FK on profiles after cell_groups exists
ALTER TABLE profiles
  ADD CONSTRAINT fk_cell_group
  FOREIGN KEY (cell_group_id) REFERENCES cell_groups(id);

-- =============================================
-- MEMBERS
-- =============================================

CREATE TABLE members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  gender          gender NOT NULL,
  dob             DATE NOT NULL,
  phone           TEXT NOT NULL,
  email           TEXT,
  job_title       TEXT,
  location        TEXT NOT NULL,
  status          member_status DEFAULT 'ACTIVE',
  date_joined     DATE NOT NULL,
  cell_group_id   UUID NOT NULL REFERENCES cell_groups(id),
  is_scl          BOOLEAN DEFAULT FALSE,
  is_sub_cl       BOOLEAN DEFAULT FALSE,
  photo_url       TEXT,
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- FOLLOW-UPS
-- =============================================

CREATE TABLE follow_ups (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES members(id),
  logged_by     UUID NOT NULL REFERENCES profiles(id),
  type          followup_type NOT NULL,
  status        followup_status DEFAULT 'PENDING',
  notes         TEXT,
  ai_report     TEXT,
  duration_sec  INT,
  scheduled_at  TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- VISITATIONS
-- =============================================

CREATE TABLE visitations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id     UUID NOT NULL REFERENCES members(id),
  scheduled_by  UUID NOT NULL REFERENCES profiles(id),
  scheduled_at  TIMESTAMPTZ NOT NULL,
  purpose       TEXT NOT NULL,
  status        visit_status DEFAULT 'SCHEDULED',
  report        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BIRTHDAY LOGS
-- =============================================

CREATE TABLE birthday_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id),
  year        INT NOT NULL,
  message     TEXT NOT NULL,
  sent_via    TEXT,
  sent_at     TIMESTAMPTZ,
  sent_by     UUID REFERENCES profiles(id),
  called      BOOLEAN DEFAULT FALSE,
  call_notes  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- WELFARE PROGRAMS
-- =============================================

CREATE TABLE welfare_programs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT,
  type        program_type NOT NULL,
  date        TIMESTAMPTZ NOT NULL,
  budget      NUMERIC(10,2),
  status      program_status DEFAULT 'PLANNED',
  report      TEXT,
  created_by  UUID REFERENCES profiles(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE welfare_program_members (
  program_id  UUID REFERENCES welfare_programs(id) ON DELETE CASCADE,
  member_id   UUID REFERENCES members(id) ON DELETE CASCADE,
  PRIMARY KEY (program_id, member_id)
);

-- =============================================
-- PRAYER REQUESTS
-- =============================================

CREATE TABLE prayer_requests (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id   UUID NOT NULL REFERENCES members(id),
  request     TEXT NOT NULL,
  status      TEXT DEFAULT 'OPEN',
  answered_note TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ATTENDANCE
-- =============================================

CREATE TABLE attendance_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cell_group_id UUID NOT NULL REFERENCES cell_groups(id),
  session_date  DATE NOT NULL,
  notes         TEXT,
  created_by    UUID REFERENCES profiles(id),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance_records (
  session_id  UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  member_id   UUID REFERENCES members(id) ON DELETE CASCADE,
  present     BOOLEAN DEFAULT FALSE,
  PRIMARY KEY (session_id, member_id)
);

-- =============================================
-- NOTIFICATIONS
-- =============================================

CREATE TABLE notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES profiles(id),
  title       TEXT NOT NULL,
  message     TEXT NOT NULL,
  type        TEXT NOT NULL,
  is_read     BOOLEAN DEFAULT FALSE,
  action_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUDIT LOGS
-- =============================================

CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES profiles(id),
  action      TEXT NOT NULL,
  entity      TEXT NOT NULL,
  entity_id   UUID,
  details     JSONB,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- MEMBER TRANSFER HISTORY
-- =============================================

CREATE TABLE member_transfers (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id       UUID NOT NULL REFERENCES members(id),
  from_group_id   UUID REFERENCES cell_groups(id),
  to_group_id     UUID REFERENCES cell_groups(id),
  transferred_by  UUID REFERENCES profiles(id),
  reason          TEXT,
  transferred_at  TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- AUTO-UPDATE updated_at TRIGGER
-- =============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER members_updated_at BEFORE UPDATE ON members
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER welfare_programs_updated_at BEFORE UPDATE ON welfare_programs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- AUTO-CREATE PROFILE ON AUTH USER CREATION
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'SCL')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
