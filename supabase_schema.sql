-- ==============================================================================
-- DSA QUESTION TRACKER — SUPABASE DATABASE SCHEMA & ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Run this entire script in your Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)
-- to create all necessary tables, indexes, and security policies.

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Settings & Profile Preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT DEFAULT 'dark',
  ui_state JSONB DEFAULT '{"insightsOpen":true,"streakGoalOpen":true,"analyticsOpen":true,"filtersOpen":true,"questionsOpen":true,"revOpen":true,"dataMgmtOpen":true}'::jsonb,
  daily_goal_target INT DEFAULT 5,
  daily_goal_date TEXT DEFAULT '',
  daily_goal_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Question Progress (Status, Confidence, Attempts, Time, Favorites, Revision)
CREATE TABLE IF NOT EXISTS public.question_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INT NOT NULL,
  status TEXT DEFAULT 'Not Started',
  revision BOOLEAN DEFAULT FALSE,
  confidence INT DEFAULT 0,
  attempts INT DEFAULT 0,
  time_taken INT DEFAULT 0,
  last_solved TEXT DEFAULT '',
  favorite BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT user_question_unique UNIQUE (user_id, question_id)
);

-- 4. Question Personal Notes
CREATE TABLE IF NOT EXISTS public.question_notes (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id INT NOT NULL,
  notes TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, question_id)
);

-- 5. User Heatmap Activity & Streaks
CREATE TABLE IF NOT EXISTS public.user_activity (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date TEXT NOT NULL,
  count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, activity_date)
);

-- 6. Indexes for Query Performance
CREATE INDEX IF NOT EXISTS idx_question_progress_user_q ON public.question_progress(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_question_notes_user_q ON public.question_notes(user_id, question_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date ON public.user_activity(user_id, activity_date);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- 8. Row Level Security Policies (Ensure User A cannot read or write User B's data)

-- Policies for user_settings
DROP POLICY IF EXISTS "Users can manage own settings" ON public.user_settings;
CREATE POLICY "Users can manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for question_progress
DROP POLICY IF EXISTS "Users can manage own question progress" ON public.question_progress;
CREATE POLICY "Users can manage own question progress" ON public.question_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for question_notes
DROP POLICY IF EXISTS "Users can manage own notes" ON public.question_notes;
CREATE POLICY "Users can manage own notes" ON public.question_notes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Policies for user_activity
DROP POLICY IF EXISTS "Users can manage own activity" ON public.user_activity;
CREATE POLICY "Users can manage own activity" ON public.user_activity
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
