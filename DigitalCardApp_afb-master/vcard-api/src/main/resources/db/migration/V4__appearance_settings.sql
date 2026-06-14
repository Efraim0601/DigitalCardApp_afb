CREATE TABLE appearance_settings (
    id                   INT         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    allow_user_template  BOOLEAN     NOT NULL DEFAULT FALSE,
    default_template     TEXT        NOT NULL DEFAULT 'classic',
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO appearance_settings (id, allow_user_template, default_template)
VALUES (1, FALSE, 'classic')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE cards ADD COLUMN template_id TEXT;
