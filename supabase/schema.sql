-- Supabase schema for the scholarship catalog + student profiles.
-- Apply with: supabase db push  (or paste into the SQL editor).

create table if not exists scholarships (
  id text primary key,
  name text not null,
  amount integer not null,
  min_gpa real not null default 0,
  majors text[] not null default '{}',
  years text[] not null default '{}',
  states text[] not null default '{}',
  citizenship text[] not null default '{}',
  need_based boolean not null default false,
  first_gen_only boolean not null default false,
  target_activities text[] not null default '{}',
  tags text[] not null default '{}'
);

create table if not exists student_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  gpa real not null,
  major text not null,
  year text not null,
  state text,
  citizenship text not null default 'us',
  financial_need real not null default 0,
  first_gen boolean not null default false,
  activities text[] not null default '{}',
  created_at timestamptz not null default now()
);

-- Saved matches let users revisit their ranked list.
create table if not exists saved_matches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references student_profiles(id) on delete cascade,
  scholarship_id text references scholarships(id) on delete cascade,
  score real not null,
  created_at timestamptz not null default now()
);
