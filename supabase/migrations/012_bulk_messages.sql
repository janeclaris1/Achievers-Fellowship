-- Bulk SMS / WhatsApp campaign logs

CREATE TABLE bulk_message_logs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sent_by          UUID NOT NULL REFERENCES profiles(id),
  channel          TEXT NOT NULL CHECK (channel IN ('SMS', 'WHATSAPP', 'BOTH')),
  message          TEXT NOT NULL,
  audience_filter  JSONB DEFAULT '{}',
  recipient_count  INT NOT NULL DEFAULT 0,
  success_count    INT NOT NULL DEFAULT 0,
  failed_count     INT NOT NULL DEFAULT 0,
  skipped_count    INT NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX bulk_message_logs_created_at_idx ON bulk_message_logs (created_at DESC);
CREATE INDEX bulk_message_logs_sent_by_idx ON bulk_message_logs (sent_by);

ALTER TABLE bulk_message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bulk_message_logs_select" ON bulk_message_logs FOR SELECT USING (
  get_my_role() IN ('MASTER_ADMIN', 'WELFARE')
);
