
REVOKE ALL ON FUNCTION public.award_xp_and_streak(uuid,int) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.complete_interview_session(uuid,int,int,int,int,int,jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_interview_session(uuid,int,int,int,int,int,jsonb) TO authenticated;
