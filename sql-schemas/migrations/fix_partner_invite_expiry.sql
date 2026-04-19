-- Extend all pending (unused) partner invites to a 10-year window.
-- Old invites had a 72-hour expiry from the link-based flow; the email-based
-- activation system has no time limit, so we backfill existing records.

UPDATE partner_invites
SET expires_at = now() + interval '10 years'
WHERE used_at IS NULL;
