-- =============================================
-- ARCHEIVERS FELLOWSHIP — ROW LEVEL SECURITY
-- Migration 002: RLS Policies
-- =============================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_ups ENABLE ROW LEVEL SECURITY;
ALTER TABLE visitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE birthday_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE welfare_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE welfare_program_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE member_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE cell_groups ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION get_my_cell_group()
RETURNS UUID AS $$
  SELECT cell_group_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT role = 'MASTER_ADMIN' FROM profiles WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- =============================================
-- PROFILES POLICIES
-- =============================================

CREATE POLICY "profiles_select_own" ON profiles FOR SELECT USING (
  id = auth.uid() OR get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (
  id = auth.uid() OR get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "profiles_insert_admin" ON profiles FOR INSERT WITH CHECK (
  get_my_role() = 'MASTER_ADMIN'
);

-- =============================================
-- CELL GROUPS POLICIES
-- =============================================

CREATE POLICY "cell_groups_select" ON cell_groups FOR SELECT USING (TRUE);

CREATE POLICY "cell_groups_insert_admin" ON cell_groups FOR INSERT WITH CHECK (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "cell_groups_update_admin" ON cell_groups FOR UPDATE USING (
  get_my_role() = 'MASTER_ADMIN'
);

-- =============================================
-- MEMBERS POLICIES
-- =============================================

-- SCLs see only their cell group; others see all
CREATE POLICY "members_select" ON members FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
  OR (get_my_role() = 'SCL' AND cell_group_id = get_my_cell_group())
);

CREATE POLICY "members_insert" ON members FOR INSERT WITH CHECK (
  get_my_role() = 'MASTER_ADMIN'
  OR (get_my_role() = 'SCL' AND cell_group_id = get_my_cell_group())
);

CREATE POLICY "members_update" ON members FOR UPDATE USING (
  get_my_role() = 'MASTER_ADMIN'
  OR (get_my_role() = 'SCL' AND cell_group_id = get_my_cell_group())
);

CREATE POLICY "members_delete_admin" ON members FOR DELETE USING (
  get_my_role() = 'MASTER_ADMIN'
);

-- =============================================
-- FOLLOW-UPS POLICIES
-- =============================================

CREATE POLICY "followups_select" ON follow_ups FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'FOLLOWUP', 'CALL_CENTER', 'WELFARE')
  OR (get_my_role() = 'SCL' AND member_id IN (
    SELECT id FROM members WHERE cell_group_id = get_my_cell_group()
  ))
);

CREATE POLICY "followups_insert" ON follow_ups FOR INSERT WITH CHECK (
  get_my_role() IN ('MASTER_ADMIN', 'FOLLOWUP', 'CALL_CENTER')
);

CREATE POLICY "followups_update" ON follow_ups FOR UPDATE USING (
  get_my_role() IN ('MASTER_ADMIN', 'FOLLOWUP', 'CALL_CENTER')
);

-- =============================================
-- VISITATIONS POLICIES
-- =============================================

CREATE POLICY "visitations_select" ON visitations FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'FOLLOWUP', 'WELFARE')
  OR (get_my_role() = 'SCL' AND member_id IN (
    SELECT id FROM members WHERE cell_group_id = get_my_cell_group()
  ))
);

CREATE POLICY "visitations_insert" ON visitations FOR INSERT WITH CHECK (
  get_my_role() IN ('MASTER_ADMIN', 'FOLLOWUP', 'WELFARE')
);

CREATE POLICY "visitations_update" ON visitations FOR UPDATE USING (
  get_my_role() IN ('MASTER_ADMIN', 'FOLLOWUP', 'WELFARE')
);

-- =============================================
-- NOTIFICATIONS POLICIES
-- =============================================

CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (
  user_id = auth.uid()
);

CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (
  user_id = auth.uid()
);

-- =============================================
-- BIRTHDAY LOGS POLICIES
-- =============================================

CREATE POLICY "birthday_logs_select" ON birthday_logs FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
  OR (get_my_role() = 'SCL' AND member_id IN (
    SELECT id FROM members WHERE cell_group_id = get_my_cell_group()
  ))
);

CREATE POLICY "birthday_logs_insert" ON birthday_logs FOR INSERT WITH CHECK (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

CREATE POLICY "birthday_logs_upsert" ON birthday_logs FOR UPDATE USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

-- =============================================
-- WELFARE PROGRAMS POLICIES
-- =============================================

CREATE POLICY "welfare_programs_select" ON welfare_programs FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

CREATE POLICY "welfare_programs_insert" ON welfare_programs FOR INSERT WITH CHECK (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

CREATE POLICY "welfare_programs_update" ON welfare_programs FOR UPDATE USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

-- =============================================
-- PRAYER REQUESTS POLICIES
-- =============================================

CREATE POLICY "prayer_requests_select" ON prayer_requests FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
  OR (get_my_role() = 'SCL' AND member_id IN (
    SELECT id FROM members WHERE cell_group_id = get_my_cell_group()
  ))
);

CREATE POLICY "prayer_requests_insert" ON prayer_requests FOR INSERT WITH CHECK (TRUE);

CREATE POLICY "prayer_requests_update" ON prayer_requests FOR UPDATE USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);

-- =============================================
-- ATTENDANCE POLICIES
-- =============================================

CREATE POLICY "attendance_sessions_select" ON attendance_sessions FOR SELECT USING (
  get_my_role() = 'MASTER_ADMIN'
  OR cell_group_id = get_my_cell_group()
);

CREATE POLICY "attendance_sessions_insert" ON attendance_sessions FOR INSERT WITH CHECK (
  get_my_role() = 'MASTER_ADMIN'
  OR cell_group_id = get_my_cell_group()
);

CREATE POLICY "attendance_records_select" ON attendance_records FOR SELECT USING (
  get_my_role() = 'MASTER_ADMIN'
  OR session_id IN (
    SELECT id FROM attendance_sessions WHERE cell_group_id = get_my_cell_group()
  )
);

CREATE POLICY "attendance_records_insert" ON attendance_records FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "attendance_records_update" ON attendance_records FOR UPDATE USING (TRUE);

-- =============================================
-- AUDIT LOGS POLICIES
-- =============================================

CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT USING (
  get_my_role() = 'MASTER_ADMIN'
);

CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT WITH CHECK (TRUE);

-- =============================================
-- MEMBER TRANSFERS POLICIES
-- =============================================

CREATE POLICY "member_transfers_select" ON member_transfers FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'SCL')
);

CREATE POLICY "member_transfers_insert_admin" ON member_transfers FOR INSERT WITH CHECK (
  get_my_role() = 'MASTER_ADMIN'
);

-- =============================================
-- PROTECT MASTER_ADMIN FROM DELETION
-- =============================================

CREATE OR REPLACE FUNCTION prevent_master_admin_deletion()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role = 'MASTER_ADMIN' THEN
    RAISE EXCEPTION 'Cannot delete a MASTER_ADMIN account';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER protect_master_admin
  BEFORE DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION prevent_master_admin_deletion();
