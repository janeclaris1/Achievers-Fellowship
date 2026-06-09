-- Allow Call Center to view bulk message history

DROP POLICY IF EXISTS "bulk_message_logs_select" ON bulk_message_logs;

CREATE POLICY "bulk_message_logs_select" ON bulk_message_logs FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE', 'CALL_CENTER')
);
