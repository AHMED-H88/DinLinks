-- =============================================================================
-- DinLinks — Row Level Security
-- Applied: 2026-06-10
--
-- Architecture: Next.js 14 + Prisma + NextAuth on Vercel.
-- All DB access uses SUPABASE_SERVICE_ROLE_KEY, which bypasses RLS by design.
-- No browser code queries the database directly.
-- No Supabase Auth is used.
--
-- Strategy:
--   Enable RLS on every table.
--   Add NO permissive policies.
--
-- Effect:
--   Service role key  → RLS bypassed → full access (Prisma unaffected)
--   Anon key          → no policies  → all tables fully blocked
--   Direct SQL (psql) → service role → full access (migrations unaffected)
--
-- This resolves all Supabase Security Advisor warnings:
--   ✓ "RLS Disabled in Public"     — fixed by ENABLE ROW LEVEL SECURITY
--   ✓ "Sensitive Columns Exposed"  — fixed by blocking anon key via RLS
-- =============================================================================


-- ─── Step 1: Enable RLS on all tables ────────────────────────────────────────
-- No data is modified. No queries are affected. Service role bypasses all RLS.

ALTER TABLE public._prisma_migrations     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_tokens    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions          ENABLE ROW LEVEL SECURITY;


-- ─── Step 2: Explicitly revoke anon + authenticated roles from all tables ────
-- Belt-and-suspenders: even if a permissive policy were accidentally added
-- later, these revocations ensure the anon key can never read sensitive tables.
--
-- Covers the three tables flagged under "Sensitive Columns Exposed":
--   users (password hash), accounts (OAuth tokens), verification_tokens (tokens)

REVOKE ALL ON public.users               FROM anon, authenticated;
REVOKE ALL ON public.accounts            FROM anon, authenticated;
REVOKE ALL ON public.verification_tokens FROM anon, authenticated;
REVOKE ALL ON public.sessions            FROM anon, authenticated;
REVOKE ALL ON public.subscriptions       FROM anon, authenticated;
REVOKE ALL ON public._prisma_migrations  FROM anon, authenticated;

-- Public-facing tables also blocked — all reads go through the server.
REVOKE ALL ON public.businesses          FROM anon, authenticated;
REVOKE ALL ON public.categories          FROM anon, authenticated;
REVOKE ALL ON public.favorites           FROM anon, authenticated;
REVOKE ALL ON public.reviews             FROM anon, authenticated;


-- ─── Step 3: Verify ──────────────────────────────────────────────────────────
-- Run this SELECT after applying the migration to confirm the result.
-- Every row should show: rls_enabled = true, policy_count = 0.
--
-- SELECT
--   t.tablename,
--   t.rowsecurity                                   AS rls_enabled,
--   COUNT(p.policyname)                             AS policy_count
-- FROM pg_tables t
-- LEFT JOIN pg_policies p
--   ON p.tablename = t.tablename AND p.schemaname = 'public'
-- WHERE t.schemaname = 'public'
-- GROUP BY t.tablename, t.rowsecurity
-- ORDER BY t.tablename;
