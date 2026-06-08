-- Allow all portal roles to view welfare programs (read-only for non-welfare users)

DROP POLICY IF EXISTS "welfare_programs_select" ON welfare_programs;

CREATE POLICY "welfare_programs_select" ON welfare_programs FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'SCL', 'WELFARE', 'FOLLOWUP', 'CALL_CENTER')
);
