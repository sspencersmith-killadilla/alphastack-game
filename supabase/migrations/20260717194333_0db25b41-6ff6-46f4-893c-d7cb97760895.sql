-- Realtime delivery requires a SELECT policy AND column-level SELECT privilege.
-- Server functions use service_role and are unaffected.

-- rooms: allow public read of lobby state, but hide host_token
CREATE POLICY "Rooms are readable for realtime"
  ON public.rooms FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT (id, code, status, seed, round_seconds, started_at, created_at)
  ON public.rooms TO anon, authenticated;
REVOKE SELECT (host_token) ON public.rooms FROM anon, authenticated;

-- room_players: public read so lobby join/ready updates stream to players
CREATE POLICY "Room players are readable for realtime"
  ON public.room_players FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.room_players TO anon, authenticated;

-- room_scores: public read so live match scores stream to players
CREATE POLICY "Room scores are readable for realtime"
  ON public.room_scores FOR SELECT
  TO anon, authenticated
  USING (true);

GRANT SELECT ON public.room_scores TO anon, authenticated;