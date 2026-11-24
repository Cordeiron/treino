-- REBECA RACING — Schema PostgreSQL + Row Level Security (Supabase)
-- Execute este script no SQL Editor do seu projeto Supabase.

create extension if not exists "pgcrypto";

-- 1. PROFILES
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  name text not null,
  age integer not null check (age >= 14 and age <= 100),
  height_cm integer not null check (height_cm >= 120 and height_cm <= 230),
  current_weight_kg numeric(5,2) not null check (current_weight_kg >= 30 and current_weight_kg <= 250),
  target_weight_kg numeric(5,2),
  goal text not null check (goal in ('emagrecer', 'manter', 'massa_muscular', 'ficar_gostosa')),
  experience text not null check (experience in ('nunca_treinei', 'iniciante', 'intermediario', 'experiente')),
  days_per_week integer not null check (days_per_week between 2 and 6),
  session_minutes integer not null check (session_minutes in (30, 45, 60, 90)),
  focus_regions text[] not null default '{}',
  disliked_exercises text default '',
  injuries text default '',
  physical_limitations text default '',
  avoid_exercises text default '',
  professional_guidance text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_profiles_user_id on public.profiles(user_id);

-- 2. WORKOUT PLANS
create table if not exists public.workout_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  goal text not null,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now()
);

create index if not exists idx_workout_plans_user_id on public.workout_plans(user_id);

-- 3. WORKOUT DAYS
create table if not exists public.workout_days (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.workout_plans(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  day_index integer not null check (day_index between 0 and 6),
  day_name text not null,
  session_code text not null,
  title text not null,
  muscle_groups text not null,
  is_rest_day boolean not null default false,
  warmup_note text default '',
  notes text default ''
);

create index if not exists idx_workout_days_plan_id on public.workout_days(plan_id);
create index if not exists idx_workout_days_user_id on public.workout_days(user_id);

-- 4. EXERCISES
create table if not exists public.exercises (
  id uuid primary key default gen_random_uuid(),
  workout_day_id uuid not null references public.workout_days(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  order_index integer not null,
  illustration_key text not null,
  name text not null,
  main_muscle text not null,
  secondary_muscles text[] not null default '{}',
  equipment text not null,
  difficulty text not null,
  sets integer not null,
  reps text not null,
  rest_seconds integer not null,
  instructions text not null,
  common_mistakes text not null
);

create index if not exists idx_exercises_day_id on public.exercises(workout_day_id);
create index if not exists idx_exercises_user_id on public.exercises(user_id);

-- 5. EXERCISE COMPLETIONS
create table if not exists public.exercise_completions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_key text not null,
  day_index integer not null check (day_index between 0 and 6),
  exercise_id text not null,
  exercise_name text not null,
  completed_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (user_id, week_key, day_index, exercise_id)
);

create index if not exists idx_exercise_completions_user_date
  on public.exercise_completions(user_id, completed_date desc);

-- 6. PROGRESS HISTORY (Peso, medidas, fotos, cargas e sessões)
create table if not exists public.progress_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_type text not null check (entry_type in ('checkpoint', 'session')),
  recorded_date date not null default current_date,
  weight_kg numeric(5,2),
  waist_cm numeric(5,2),
  hip_cm numeric(5,2),
  thigh_cm numeric(5,2),
  arm_cm numeric(5,2),
  photo_url text,
  session_title text,
  duration_minutes integer,
  rpe numeric(3,1),
  total_volume_kg integer,
  sets_payload jsonb default '[]'::jsonb,
  pr_exercises text[] default '{}',
  notes text default '',
  created_at timestamptz not null default now()
);

create index if not exists idx_progress_history_user_date
  on public.progress_history(user_id, recorded_date desc);

-- 7. DAILY CHECKINS
create table if not exists public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  checkin_date date not null default current_date,
  mood text not null,
  energy_label text not null,
  nauhan_reply text not null,
  notes text default '',
  created_at timestamptz not null default now(),
  unique (user_id, checkin_date)
);

create index if not exists idx_daily_checkins_user_date
  on public.daily_checkins(user_id, checkin_date desc);

-- 8. DAILY MESSAGES (Histórico de mensagens diárias exibidas)
create table if not exists public.daily_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  message_date date not null default current_date,
  message_index integer not null,
  message_text text not null,
  created_at timestamptz not null default now(),
  unique (user_id, message_date)
);

create index if not exists idx_daily_messages_user_date
  on public.daily_messages(user_id, message_date desc);

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.workout_plans enable row level security;
alter table public.workout_days enable row level security;
alter table public.exercises enable row level security;
alter table public.exercise_completions enable row level security;
alter table public.progress_history enable row level security;
alter table public.daily_checkins enable row level security;
alter table public.daily_messages enable row level security;

create policy "profiles_own_all" on public.profiles
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workout_plans_own_all" on public.workout_plans
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "workout_days_own_all" on public.workout_days
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercises_own_all" on public.exercises
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "exercise_completions_own_all" on public.exercise_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "progress_history_own_all" on public.progress_history
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_checkins_own_all" on public.daily_checkins
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "daily_messages_own_all" on public.daily_messages
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
