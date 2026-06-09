-- Call center outreach: channel + message body on follow-up logs

ALTER TABLE follow_ups
  ADD COLUMN IF NOT EXISTS channel TEXT CHECK (channel IN ('PHONE', 'SMS', 'WHATSAPP')),
  ADD COLUMN IF NOT EXISTS message_body TEXT,
  ADD COLUMN IF NOT EXISTS twilio_sid TEXT;

CREATE INDEX IF NOT EXISTS follow_ups_channel_idx ON follow_ups (channel);
CREATE INDEX IF NOT EXISTS follow_ups_created_at_idx ON follow_ups (created_at DESC);
