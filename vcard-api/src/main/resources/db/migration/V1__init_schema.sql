CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE departments (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    label_fr   TEXT        NOT NULL,
    label_en   TEXT        NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE job_titles (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    label_fr   TEXT        NOT NULL,
    label_en   TEXT        NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE cards (
    id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    email         TEXT        UNIQUE NOT NULL,
    first_name    TEXT,
    last_name     TEXT,
    company       TEXT,
    title         TEXT,
    phone         TEXT,
    fax           TEXT,
    mobile        TEXT,
    department_id UUID        REFERENCES departments(id) ON DELETE SET NULL,
    job_title_id  UUID        REFERENCES job_titles(id)  ON DELETE SET NULL,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE admin_login (
    id            INT         PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    email         TEXT        NOT NULL,
    password_hash TEXT        NOT NULL,
    updated_at    TIMESTAMPTZ DEFAULT now()
);
