-- Migration: 001_initial_schema.sql
-- NyayAPP initial database schema

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ─── Users ────────────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('citizen', 'lawyer', 'admin');

CREATE TABLE IF NOT EXISTS users (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name          VARCHAR(255) NOT NULL,
    email         VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role          user_role NOT NULL DEFAULT 'citizen',
    phone         VARCHAR(20),
    avatar        TEXT,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ─── Legal Documents ─────────────────────────────────────────────────────────
CREATE TYPE document_type AS ENUM ('constitution', 'act', 'amendment');

CREATE TABLE IF NOT EXISTS legal_documents (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title          VARCHAR(500) NOT NULL,
    type           document_type NOT NULL,
    part           VARCHAR(100),
    article_number INTEGER,
    article_title  VARCHAR(500),
    content        TEXT NOT NULL,
    language       VARCHAR(10) NOT NULL DEFAULT 'en',
    tags           TEXT[] DEFAULT '{}',
    search_vector  TSVECTOR,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_type            ON legal_documents(type);
CREATE INDEX IF NOT EXISTS idx_legal_article_number  ON legal_documents(article_number);
CREATE INDEX IF NOT EXISTS idx_legal_part            ON legal_documents(part);
CREATE INDEX IF NOT EXISTS idx_legal_search          ON legal_documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_legal_content_trgm    ON legal_documents USING GIN(content gin_trgm_ops);

-- Auto-update search vector
CREATE OR REPLACE FUNCTION legal_documents_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.article_title, '') || ' ' || COALESCE(NEW.content, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER legal_documents_search_vector_trigger
    BEFORE INSERT OR UPDATE ON legal_documents
    FOR EACH ROW EXECUTE FUNCTION legal_documents_search_vector_update();

-- ─── Complaints ───────────────────────────────────────────────────────────────
CREATE TYPE complaint_status AS ENUM ('pending', 'in_review', 'resolved', 'rejected');

CREATE TABLE IF NOT EXISTS complaints (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title        VARCHAR(500) NOT NULL,
    description  TEXT NOT NULL,
    category     VARCHAR(100) NOT NULL,
    status       complaint_status NOT NULL DEFAULT 'pending',
    tracking_id  VARCHAR(20) NOT NULL UNIQUE,
    attachments  TEXT[] DEFAULT '{}',
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_complaints_user_id    ON complaints(user_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status     ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_tracking   ON complaints(tracking_id);

-- ─── Bookmarks ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookmarks (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    legal_id   UUID NOT NULL REFERENCES legal_documents(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, legal_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);

-- ─── Auto-updated timestamps ──────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_users_updated_at       BEFORE UPDATE ON users            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_complaints_updated_at  BEFORE UPDATE ON complaints        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER set_legal_updated_at       BEFORE UPDATE ON legal_documents   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
