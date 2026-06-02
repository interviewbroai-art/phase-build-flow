-- Fix protect triggers: use current_user (swapped by SECURITY DEFINER to owner)
-- instead of session_user (which stays as the connecting role).

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
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
$function$;

CREATE OR REPLACE FUNCTION public.protect_payments_columns()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.plan IS DISTINCT FROM OLD.plan
       OR NEW.amount_paise IS DISTINCT FROM OLD.amount_paise
       OR NEW.currency IS DISTINCT FROM OLD.currency
       OR NEW.status IS DISTINCT FROM OLD.status
       OR NEW.razorpay_order_id IS DISTINCT FROM OLD.razorpay_order_id
       OR NEW.razorpay_payment_id IS DISTINCT FROM OLD.razorpay_payment_id
       OR NEW.razorpay_signature IS DISTINCT FROM OLD.razorpay_signature
       OR NEW.receipt_number IS DISTINCT FROM OLD.receipt_number
       OR NEW.paid_at IS DISTINCT FROM OLD.paid_at
       OR NEW.user_id IS DISTINCT FROM OLD.user_id
    THEN
      RAISE EXCEPTION 'Direct modification of payment rows is not allowed'
        USING ERRCODE = '42501';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.tg_enforce_interview_quota()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF current_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  PERFORM public.enforce_interview_quota(NEW.user_id);
  RETURN NEW;
END;
$function$;
