-- ================================
-- EXTENSIONS
-- ================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ================================
-- PROFILES (AUTH)
-- ================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- ROLES (RBAC)
-- ================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL
);

INSERT INTO public.roles (name)
VALUES ('citizen'), ('lawyer'), ('admin')
ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.user_roles (
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    role_id UUID REFERENCES public.roles(id),
    PRIMARY KEY (user_id, role_id)
);

-- ================================
-- LEGAL ACTS
-- ================================
CREATE TABLE IF NOT EXISTS public.legal_acts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    category TEXT,
    year INT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- LEGAL SECTIONS
-- ================================
CREATE TABLE IF NOT EXISTS public.legal_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    act_id UUID REFERENCES public.legal_acts(id) ON DELETE CASCADE,
    section_number TEXT,
    title TEXT,
    content TEXT,
    plain_summary TEXT,
    search_vector tsvector,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sections_search ON public.legal_sections USING GIN(search_vector);

-- ================================
-- CASE LAW
-- ================================
CREATE TABLE IF NOT EXISTS public.cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT,
    court TEXT,
    judge TEXT,
    judgment_date DATE,
    summary TEXT,
    full_judgment TEXT,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- DRAFTS
-- ================================
CREATE TABLE IF NOT EXISTS public.draft_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT,
    content TEXT
);

CREATE TABLE IF NOT EXISTS public.user_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES public.draft_templates(id),
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- BOOKMARKS
-- ================================
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    item_id UUID,
    type TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- SEARCH TRIGGER
-- ================================
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    to_tsvector('english', COALESCE(NEW.title,'') || ' ' || COALESCE(NEW.content,''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tsvector_update
BEFORE INSERT OR UPDATE ON public.legal_sections
FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- ================================
-- UPDATED_AT TRIGGER
-- ================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_acts BEFORE UPDATE ON public.legal_acts
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sections BEFORE UPDATE ON public.legal_sections
FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================
-- AUTH TRIGGER
-- ================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, split_part(NEW.email,'@',1))
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ================================
-- RLS
-- ================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_self" ON public.profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "bookmarks_self" ON public.bookmarks
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "drafts_self" ON public.user_drafts
FOR ALL USING (auth.uid() = user_id);

-- Public read
ALTER TABLE public.legal_acts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.legal_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_read_acts" ON public.legal_acts FOR SELECT USING (true);
CREATE POLICY "public_read_sections" ON public.legal_sections FOR SELECT USING (true);
CREATE POLICY "public_read_cases" ON public.cases FOR SELECT USING (true);