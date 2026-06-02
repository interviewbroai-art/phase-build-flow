
-- ============================================================
-- 1) Lock down public.payments
-- ============================================================
-- Drop the permissive user-side UPDATE/INSERT policies. All writes
-- now go through the server using the service_role client.
DROP POLICY IF EXISTS "Users update own payments" ON public.payments;
DROP POLICY IF EXISTS "Users insert own payments" ON public.payments;

REVOKE INSERT, UPDATE ON public.payments FROM authenticated;
-- SELECT for own rows stays (users need to see their receipts).
GRANT ALL ON public.payments TO service_role;

-- Defense-in-depth: even if INSERT/UPDATE grants ever come back,
-- block tampering with billing-critical columns from non-trusted sessions.
CREATE OR REPLACE FUNCTION public.protect_payments_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF session_user IN ('postgres', 'supabase_admin', 'service_role') THEN
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
$$;

DROP TRIGGER IF EXISTS trg_protect_payments_columns ON public.payments;
CREATE TRIGGER trg_protect_payments_columns
BEFORE UPDATE ON public.payments
FOR EACH ROW
EXECUTE FUNCTION public.protect_payments_columns();

REVOKE EXECUTE ON FUNCTION public.protect_payments_columns() FROM PUBLIC, anon, authenticated;

-- ============================================================
-- 2) Enforce interview quota at the database level
-- ============================================================
-- Trigger fires on every INSERT into interview_sessions regardless of
-- whether it comes from the client SDK, a server function, or an RPC.
CREATE OR REPLACE FUNCTION public.tg_enforce_interview_quota()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Service role bypasses (admin maintenance, backfills).
  IF session_user IN ('postgres', 'supabase_admin', 'service_role') THEN
    RETURN NEW;
  END IF;

  PERFORM public.enforce_interview_quota(NEW.user_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_interview_quota ON public.interview_sessions;
CREATE TRIGGER trg_enforce_interview_quota
BEFORE INSERT ON public.interview_sessions
FOR EACH ROW
EXECUTE FUNCTION public.tg_enforce_interview_quota();

REVOKE EXECUTE ON FUNCTION public.tg_enforce_interview_quota() FROM PUBLIC, anon, authenticated;
