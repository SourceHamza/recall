-- Recall schema. Paste into Supabase → SQL Editor → Run.
-- Safe to run once on a fresh project.

create extension if not exists vector with schema extensions;

create type bit_type as enum ('bookmark', 'video', 'post');
create type tag_color as enum ('green', 'teal', 'orange', 'blue', 'rose');

-- One row per person, created automatically on sign-up (trigger below).
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  is_pinned boolean not null default false,   -- pinned projects show under "Pinned"
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()  -- "last updated" in the header
);
create index on projects (user_id, is_pinned);

-- A "bit" is anything you save: a link, a video, a social post.
create table bits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  project_id uuid not null references projects on delete cascade,
  type bit_type not null default 'bookmark',
  title text not null,                        -- the heading
  description text,
  url text not null,
  thumbnail_url text,
  -- Reserved for semantic search + chat (nothing writes these yet):
  content text,                               -- extracted page text / transcript
  embedding extensions.vector(1536),          -- match your embedding model's size
  embedded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on bits (project_id, created_at desc);
create index bits_embedding_idx on bits using hnsw (embedding extensions.vector_cosine_ops);

create table tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  color tag_color not null default 'green',
  unique (user_id, name)
);

create table bit_tags (
  bit_id uuid not null references bits on delete cascade,
  tag_id uuid not null references tags on delete cascade,
  primary key (bit_id, tag_id)
);
create index on bit_tags (tag_id);

-- ── Row level security: everyone only sees their own rows ──────────────
alter table profiles enable row level security;
alter table projects enable row level security;
alter table bits enable row level security;
alter table tags enable row level security;
alter table bit_tags enable row level security;

create policy "own profile" on profiles for all
  using (id = auth.uid()) with check (id = auth.uid());

create policy "own projects" on projects for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own bits" on bits for all
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and exists (select 1 from projects p where p.id = project_id and p.user_id = auth.uid())
  );

create policy "own tags" on tags for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "own bit_tags" on bit_tags for all
  using (exists (select 1 from bits b where b.id = bit_id and b.user_id = auth.uid()))
  with check (
    exists (select 1 from bits b where b.id = bit_id and b.user_id = auth.uid())
    and exists (select 1 from tags t where t.id = tag_id and t.user_id = auth.uid())
  );

-- ── Triggers ───────────────────────────────────────────────────────────
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, split_part(new.email, '@', 1));
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger bits_touch before update on bits
  for each row execute function public.touch_updated_at();

-- Any change to a bit bumps its project's "last updated".
create function public.touch_project() returns trigger language plpgsql as $$
declare pid uuid;
begin
  if tg_op = 'DELETE' then pid := old.project_id; else pid := new.project_id; end if;
  update public.projects set updated_at = now() where id = pid;
  return null;
end $$;

create trigger bits_touch_project after insert or update or delete on bits
  for each row execute function public.touch_project();

-- ── Semantic search (ready for later) ──────────────────────────────────
-- Embed the query in your app, then: supabase.rpc('match_bits', { query_embedding, ... })
-- Runs as the caller, so row level security still applies.
create function public.match_bits(
  query_embedding extensions.vector(1536),
  match_count int default 20,
  filter_project uuid default null
) returns table (id uuid, title text, similarity float)
language sql stable as $$
  select b.id, b.title, 1 - (b.embedding <=> query_embedding) as similarity
  from public.bits b
  where b.embedding is not null
    and (filter_project is null or b.project_id = filter_project)
  order by b.embedding <=> query_embedding
  limit match_count;
$$;
