-- Card validation workflow.
-- Cards created by the admin are auto-approved; cards created from the public
-- client portal start as PENDING and require admin validation before they can
-- use the application features (share, download, save contact, template).
-- Existing cards are back-filled to APPROVED so nothing regresses.
ALTER TABLE cards ADD COLUMN status       TEXT        NOT NULL DEFAULT 'APPROVED';
ALTER TABLE cards ADD COLUMN validated_at TIMESTAMPTZ;
