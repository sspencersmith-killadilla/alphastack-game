
-- ROOMS
CREATE TABLE public.rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  host_token uuid NOT NULL,
  status text NOT NULL DEFAULT 'lobby' CHECK (status IN ('lobby','playing','finished')),
  seed text,
  round_seconds integer NOT NULL DEFAULT 180,
  started_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX rooms_code_idx ON public.rooms(code);
CREATE INDEX rooms_created_at_idx ON public.rooms(created_at);
GRANT SELECT ON public.rooms TO anon, authenticated;
GRANT ALL ON public.rooms TO service_role;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rooms are publicly viewable" ON public.rooms FOR SELECT TO anon, authenticated USING (true);

-- ROOM PLAYERS
CREATE TABLE public.room_players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  client_token uuid NOT NULL,
  initials char(3) NOT NULL,
  is_ready boolean NOT NULL DEFAULT false,
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, client_token)
);
CREATE INDEX room_players_room_idx ON public.room_players(room_id);
GRANT SELECT ON public.room_players TO anon, authenticated;
GRANT ALL ON public.room_players TO service_role;
ALTER TABLE public.room_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room players are publicly viewable" ON public.room_players FOR SELECT TO anon, authenticated USING (true);

-- ROOM SCORES
CREATE TABLE public.room_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  client_token uuid NOT NULL,
  initials char(3) NOT NULL,
  score integer NOT NULL DEFAULT 0,
  lines integer NOT NULL DEFAULT 0,
  words_solved integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  topped_out boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, client_token)
);
CREATE INDEX room_scores_room_idx ON public.room_scores(room_id);
GRANT SELECT ON public.room_scores TO anon, authenticated;
GRANT ALL ON public.room_scores TO service_role;
ALTER TABLE public.room_scores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "room scores are publicly viewable" ON public.room_scores FOR SELECT TO anon, authenticated USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.room_scores;
