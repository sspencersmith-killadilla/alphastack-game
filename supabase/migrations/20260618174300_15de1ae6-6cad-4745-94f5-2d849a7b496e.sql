CREATE TABLE public.daily_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  puzzle_date DATE NOT NULL,
  initials CHAR(3) NOT NULL,
  score INTEGER NOT NULL,
  lines INTEGER NOT NULL,
  level INTEGER NOT NULL,
  words_solved INTEGER NOT NULL,
  duration_seconds INTEGER NOT NULL,
  client_token UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX daily_scores_date_token_uidx
  ON public.daily_scores (puzzle_date, client_token);

CREATE INDEX daily_scores_date_score_idx
  ON public.daily_scores (puzzle_date, score DESC);

GRANT SELECT ON public.daily_scores TO anon, authenticated;
GRANT ALL ON public.daily_scores TO service_role;

ALTER TABLE public.daily_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily scores are publicly viewable"
  ON public.daily_scores
  FOR SELECT
  TO anon, authenticated
  USING (true);
-- No INSERT/UPDATE/DELETE policies: writes go only through service_role (server functions).