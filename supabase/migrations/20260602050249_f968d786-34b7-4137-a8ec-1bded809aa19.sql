
-- 1. Fix avatars bucket: drop public-role policies, recreate scoped to authenticated.
-- Public reads continue to work via the storage CDN for public buckets; restricting
-- the SELECT policy also prevents listing of all files via the API.
DROP POLICY IF EXISTS "Avatar images are publicly viewable" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;

CREATE POLICY "Users can view own avatar"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'avatars' AND (auth.uid())::text = (storage.foldername(name))[1]);

-- 2. Lock down SECURITY DEFINER functions: revoke from public/anon; grant
-- EXECUTE only where the application actually needs it.
REVOKE EXECUTE ON FUNCTION public.award_xp_and_streak(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.award_xp_and_streak(uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.complete_interview_session(uuid, integer, integer, integer, integer, integer, jsonb) FROM PUBLIC, anon;
-- authenticated still needs EXECUTE (called via supabase.rpc from server fn with user JWT)
GRANT EXECUTE ON FUNCTION public.complete_interview_session(uuid, integer, integer, integer, integer, integer, jsonb) TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
-- handle_new_user is a trigger function; only the trigger owner (service_role) needs to call it.
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- 3. Server-side quota enforcement helper: returns plan limits for a user.
CREATE OR REPLACE FUNCTION public.enforce_interview_quota(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_expires timestamptz;
  v_limit int;
  v_used int;
BEGIN
  SELECT plan, plan_expires_at INTO v_plan, v_expires FROM public.profiles WHERE id = p_user;
  IF v_plan IS NULL THEN v_plan := 'free'; END IF;
  IF v_expires IS NOT NULL AND v_expires < now() THEN v_plan := 'free'; END IF;

  v_limit := CASE v_plan
    WHEN 'premium' THEN -1
    WHEN 'pro' THEN 50
    ELSE 5
  END;

  IF v_limit = -1 THEN RETURN; END IF;

  SELECT count(*) INTO v_used FROM public.interview_sessions
    WHERE user_id = p_user AND created_at >= now() - INTERVAL '30 days';

  IF v_used >= v_limit THEN
    RAISE EXCEPTION 'Monthly interview quota exceeded for plan %', v_plan USING ERRCODE = 'P0001';
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.enforce_interview_quota(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.enforce_interview_quota(uuid) TO authenticated, service_role;
