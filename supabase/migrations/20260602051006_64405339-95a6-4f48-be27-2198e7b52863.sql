
-- 1) Revoke broad UPDATE on profiles, then grant only safe user-editable columns
REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (
  display_name,
  avatar_url,
  preferred_language,
  default_job_role,
  default_experience_level,
  default_interview_mode,
  default_difficulty,
  default_depth,
  resume_text,
  resume_summary,
  resume_url,
  resume_file_name,
  onboarding_completed
) ON public.profiles TO authenticated;

-- INSERT / SELECT / DELETE grants stay as-is (RLS still enforces row ownership).
-- Service role keeps full access for server-side writes (payments, scoring).
GRANT ALL ON public.profiles TO service_role;

-- 2) Make sure the existing SECURITY DEFINER functions that DO need to write
--    billing/gamification columns can still do so. They run as the function
--    owner (postgres), which is unaffected by the GRANT change — so
--    award_xp_and_streak, complete_interview_session, and the payment
--    verification path (which uses the service_role client) continue to work.

-- 3) Defense-in-depth: a trigger that blocks any direct change to protected
--    columns from non-superuser sessions, even if grants are ever widened.
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow when running as a SECURITY DEFINER function (session_user = postgres)
  -- or as the service role.
  IF session_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF NEW.plan IS DISTINCT FROM OLD.plan
     OR NEW.plan_started_at IS DISTINCT FROM OLD.plan_started_at
     OR NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at
     OR NEW.xp IS DISTINCT FROM OLD.xp
     OR NEW.level IS DISTINCT FROM OLD.level
     OR NEW.current_streak IS DISTINCT FROM OLD.current_streak
     OR NEW.longest_streak IS DISTINCT FROM OLD.longest_streak
     OR NEW.last_active_date IS DISTINCT FROM OLD.last_active_date
  THEN
    RAISE EXCEPTION 'Direct modification of billing/gamification columns is not allowed'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.protect_profile_privileged_columns();

REVOKE EXECUTE ON FUNCTION public.protect_profile_privileged_columns() FROM PUBLIC, anon, authenticated;
