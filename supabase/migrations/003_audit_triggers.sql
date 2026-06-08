-- =============================================
-- ARCHEIVERS FELLOWSHIP — AUDIT TRIGGERS
-- Migration 003: Audit Logging
-- =============================================

CREATE OR REPLACE FUNCTION log_audit()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, entity, entity_id, details)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    jsonb_build_object(
      'old', CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
      'new', CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END
    )
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply to key tables
CREATE TRIGGER audit_members
  AFTER INSERT OR UPDATE OR DELETE ON members
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_cell_groups
  AFTER INSERT OR UPDATE OR DELETE ON cell_groups
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_follow_ups
  AFTER INSERT OR UPDATE ON follow_ups
  FOR EACH ROW EXECUTE FUNCTION log_audit();

CREATE TRIGGER audit_welfare_programs
  AFTER INSERT OR UPDATE OR DELETE ON welfare_programs
  FOR EACH ROW EXECUTE FUNCTION log_audit();
