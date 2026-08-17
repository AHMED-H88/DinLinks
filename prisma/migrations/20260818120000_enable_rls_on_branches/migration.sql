-- Enable Row Level Security on public.branches.
--
-- branches is the only table in the public schema without RLS: every other
-- table — businesses, users, reviews, categories and the rest — already has it
-- enabled with zero policies. It was added by a later migration than the one
-- that turned RLS on everywhere else, and was missed.
--
-- Why no policies are added with it. The application never reaches this table
-- through PostgREST; all branch reads and writes go through Prisma, which
-- connects as `postgres` — the table's owner, and a role with BYPASSRLS — so
-- row security never applies to it. Adding policies would invent an
-- authorization model the application does not use and does not need.
--
-- With RLS enabled and no policy present, PostgREST's `anon` and
-- `authenticated` roles are denied every row, which is the same posture the
-- other ten tables already run under. This changes no data and no privilege
-- grant; it only stops the grants those roles already hold from reaching rows.

ALTER TABLE "public"."branches" ENABLE ROW LEVEL SECURITY;
