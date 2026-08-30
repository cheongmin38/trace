create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.places (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, address text, latitude double precision not null, longitude double precision not null,
  category text not null default 'PLACE', resolved_category text, external_place_id text,
  visit_count integer not null default 0, photo_count integer not null default 0,
  first_visited_at timestamptz, last_visited_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.visits (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade, place_id text not null references public.places(id),
  started_at timestamptz not null, ended_at timestamptz, duration_minutes integer, latitude double precision not null, longitude double precision not null,
  visit_number integer not null default 1, source text not null default 'gps', confidence double precision, memory_ids text[] not null default '{}',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.memories (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade, place_id text not null references public.places(id), visit_id text not null references public.visits(id),
  title text not null, visit_number integer not null default 1, started_at timestamptz not null, ended_at timestamptz not null,
  latitude double precision not null, longitude double precision not null, summary text, cover_photo_id text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), deleted_at timestamptz
);

create table if not exists public.photos (
  id text primary key, user_id uuid not null references auth.users(id) on delete cascade, memory_id text references public.memories(id) on delete set null,
  asset_id text, storage_path text, uri text, captured_at timestamptz not null, latitude double precision, longitude double precision, width integer, height integer,
  created_at timestamptz not null default now(), deleted_at timestamptz
);

alter table public.profiles enable row level security;
create policy "profile_owner_all" on public.profiles for all to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
do $$ declare table_name text; begin foreach table_name in array array['places','visits','memories','photos'] loop execute format('alter table public.%I enable row level security', table_name); execute format('drop policy if exists "trace_owner_select" on public.%I', table_name); execute format('create policy "trace_owner_select" on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name); execute format('drop policy if exists "trace_owner_insert" on public.%I', table_name); execute format('create policy "trace_owner_insert" on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name); execute format('drop policy if exists "trace_owner_update" on public.%I', table_name); execute format('create policy "trace_owner_update" on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name); execute format('drop policy if exists "trace_owner_delete" on public.%I', table_name); execute format('create policy "trace_owner_delete" on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name); end loop; end $$;

create index if not exists places_user_updated_idx on public.places(user_id, updated_at);
create index if not exists visits_user_started_idx on public.visits(user_id, started_at);
create index if not exists memories_user_started_idx on public.memories(user_id, started_at);
