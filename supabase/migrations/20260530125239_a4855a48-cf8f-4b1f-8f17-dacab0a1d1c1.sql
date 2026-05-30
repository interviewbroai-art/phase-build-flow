
-- Phase 4: difficulty/depth controls + resume context for personalised interviews

ALTER TABLE public.interview_sessions
  ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS depth TEXT NOT NULL DEFAULT 'moderate';

ALTER TABLE public.interview_sessions
  ADD CONSTRAINT interview_sessions_difficulty_check
    CHECK (difficulty IN ('easy','medium','hard','brutal')),
  ADD CONSTRAINT interview_sessions_depth_check
    CHECK (depth IN ('shallow','moderate','deep'));

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS resume_text TEXT,
  ADD COLUMN IF NOT EXISTS resume_summary TEXT,
  ADD COLUMN IF NOT EXISTS default_difficulty TEXT NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS default_depth TEXT NOT NULL DEFAULT 'moderate';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_default_difficulty_check
    CHECK (default_difficulty IN ('easy','medium','hard','brutal')),
  ADD CONSTRAINT profiles_default_depth_check
    CHECK (default_depth IN ('shallow','moderate','deep'));
