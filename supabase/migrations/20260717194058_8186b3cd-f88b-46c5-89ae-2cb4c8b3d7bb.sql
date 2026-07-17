-- Remove public SELECT exposure on scores and daily_scores tables.
-- All reads go through server functions that use service_role, so no
-- anon/authenticated direct table access is required.

DROP POLICY IF EXISTS "scores are publicly viewable" ON public.scores;
DROP POLICY IF EXISTS "daily scores are publicly viewable" ON public.daily_scores;

REVOKE SELECT ON public.scores FROM anon, authenticated;
REVOKE SELECT ON public.daily_scores FROM anon, authenticated;

GRANT ALL ON public.scores TO service_role;
GRANT ALL ON public.daily_scores TO service_role;