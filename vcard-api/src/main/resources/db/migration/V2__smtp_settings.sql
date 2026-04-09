CREATE TABLE smtp_settings (
    id                INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    enabled           BOOLEAN     NOT NULL DEFAULT FALSE,
    host              TEXT,
    port              INT         NOT NULL DEFAULT 587,
    username          TEXT,
    password          TEXT,
    protocol          TEXT        NOT NULL DEFAULT 'smtp',
    auth              BOOLEAN     NOT NULL DEFAULT TRUE,
    starttls_enabled  BOOLEAN     NOT NULL DEFAULT TRUE,
    ssl_enabled       BOOLEAN     NOT NULL DEFAULT FALSE,
    from_email        TEXT,
    from_name         TEXT,
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
