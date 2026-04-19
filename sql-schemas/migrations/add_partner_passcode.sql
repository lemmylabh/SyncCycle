-- Add passcode column to partner_invites for the email+passcode activation flow.
-- The passcode is generated when the main user registers a partner email in settings.
-- Activation requires BOTH the partner's email (from session) AND this passcode.

ALTER TABLE partner_invites
  ADD COLUMN IF NOT EXISTS passcode text;
