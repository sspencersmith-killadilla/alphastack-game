DROP POLICY IF EXISTS "rooms are publicly viewable" ON public.rooms;
DROP POLICY IF EXISTS "room players are publicly viewable" ON public.room_players;
DROP POLICY IF EXISTS "room scores are publicly viewable" ON public.room_scores;

REVOKE SELECT ON public.rooms FROM anon, authenticated;
REVOKE SELECT ON public.room_players FROM anon, authenticated;
REVOKE SELECT ON public.room_scores FROM anon, authenticated;

GRANT ALL ON public.rooms TO service_role;
GRANT ALL ON public.room_players TO service_role;
GRANT ALL ON public.room_scores TO service_role;