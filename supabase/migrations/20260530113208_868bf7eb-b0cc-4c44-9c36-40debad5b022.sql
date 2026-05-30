
-- 1) Profile preference columns
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS default_job_role text,
  ADD COLUMN IF NOT EXISTS default_experience_level text,
  ADD COLUMN IF NOT EXISTS default_interview_mode text NOT NULL DEFAULT 'friendly';

-- 2) XP / level / streak helper
CREATE OR REPLACE FUNCTION public.award_xp_and_streak(p_user uuid, p_xp int)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev public.profiles;
  new_xp int;
  new_level int;
  today date := (now() at time zone 'utc')::date;
  new_streak int;
  new_longest int;
  result public.profiles;
BEGIN
  SELECT * INTO prev FROM public.profiles WHERE id = p_user FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found for %', p_user;
  END IF;

  new_xp := COALESCE(prev.xp, 0) + GREATEST(p_xp, 0);
  -- 500 XP per level, level 1 floor
  new_level := GREATEST(1, (new_xp / 500) + 1);

  IF prev.last_active_date IS NULL THEN
    new_streak := 1;
  ELSIF prev.last_active_date = today THEN
    new_streak := COALESCE(prev.current_streak, 1);
  ELSIF prev.last_active_date = today - INTERVAL '1 day' THEN
    new_streak := COALESCE(prev.current_streak, 0) + 1;
  ELSE
    new_streak := 1;
  END IF;

  new_longest := GREATEST(COALESCE(prev.longest_streak, 0), new_streak);

  UPDATE public.profiles
  SET xp = new_xp,
      level = new_level,
      current_streak = new_streak,
      longest_streak = new_longest,
      last_active_date = today,
      updated_at = now()
  WHERE id = p_user
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- 3) Complete-interview RPC
CREATE OR REPLACE FUNCTION public.complete_interview_session(
  p_session uuid,
  p_overall int,
  p_confidence int,
  p_communication int,
  p_technical int,
  p_duration int,
  p_feedback jsonb DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  s public.interview_sessions;
  awarded int;
  updated public.profiles;
BEGIN
  SELECT * INTO s FROM public.interview_sessions WHERE id = p_session FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'session not found';
  END IF;
  IF s.user_id <> auth.uid() THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  UPDATE public.interview_sessions
  SET status = 'completed',
      overall_score = p_overall,
      confidence_score = p_confidence,
      communication_score = p_communication,
      technical_score = p_technical,
      duration_seconds = COALESCE(p_duration, duration_seconds),
      feedback = COALESCE(p_feedback, feedback),
      completed_at = now()
  WHERE id = p_session;

  -- XP formula: 50 base + score
  awarded := 50 + COALESCE(p_overall, 0);
  updated := public.award_xp_and_streak(auth.uid(), awarded);
  RETURN updated;
END;
$$;

GRANT EXECUTE ON FUNCTION public.complete_interview_session(uuid,int,int,int,int,int,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_and_streak(uuid,int) TO authenticated;
