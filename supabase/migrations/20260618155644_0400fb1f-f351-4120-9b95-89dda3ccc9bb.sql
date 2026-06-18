
-- SCORES TABLE
CREATE TABLE public.scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initials CHAR(3) NOT NULL,
  score INTEGER NOT NULL,
  lines INTEGER NOT NULL,
  level INTEGER NOT NULL,
  words_solved INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  client_token UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX scores_score_desc_idx ON public.scores (score DESC, created_at DESC);
CREATE INDEX scores_created_at_idx ON public.scores (created_at DESC);

GRANT SELECT ON public.scores TO anon;
GRANT SELECT ON public.scores TO authenticated;
GRANT ALL ON public.scores TO service_role;

ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Public read of safe columns: leaderboard is meant to be public.
CREATE POLICY "scores are publicly viewable"
  ON public.scores FOR SELECT
  TO anon, authenticated
  USING (true);

-- No INSERT/UPDATE/DELETE policies — only service_role (server) can write.

-- ANALYTICS EVENTS
CREATE TABLE public.analytics_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT NOT NULL,
  session_id UUID NOT NULL,
  props JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX analytics_events_event_created_idx ON public.analytics_events (event, created_at DESC);

GRANT ALL ON public.analytics_events TO service_role;

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
-- No policies → only service_role can access. Reads happen via server functions.
