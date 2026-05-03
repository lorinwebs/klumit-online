-- Run this in Supabase SQL Editor

create table if not exists reunion_badges (
  id              uuid primary key default gen_random_uuid(),
  first_name      text not null default '',
  last_name       text not null default '',
  gender          text not null default '',
  marital_status  text not null default 'single',
  married_name    text default '',
  other_status    text default '',
  grade           text not null,
  city            text not null,
  occupation      text not null,
  num_children    int not null default 0,
  png_path        text,
  created_at      timestamptz default now(),
  -- legacy column kept for existing rows
  full_name       text,
  status          text
);

create index if not exists reunion_badges_created_at_idx
  on reunion_badges (created_at desc);

alter table reunion_badges enable row level security;

create policy "anon insert reunion_badges"
  on reunion_badges for insert to anon
  with check (true);

create or replace function public.reunion_badges_count()
returns int language sql stable security definer as
$$ select count(*)::int from reunion_badges $$;

grant execute on function public.reunion_badges_count() to anon;

-- Storage: create a private bucket named "reunion-badges" manually in the
-- Supabase dashboard (Storage → New bucket → name: reunion-badges, private)

-- Migration for existing table (run if table already exists):
-- ALTER TABLE reunion_badges ADD COLUMN IF NOT EXISTS first_name text not null default '';
-- ALTER TABLE reunion_badges ADD COLUMN IF NOT EXISTS last_name text not null default '';
-- ALTER TABLE reunion_badges ADD COLUMN IF NOT EXISTS gender text not null default '';
-- ALTER TABLE reunion_badges ADD COLUMN IF NOT EXISTS marital_status text not null default 'single';
-- ALTER TABLE reunion_badges ADD COLUMN IF NOT EXISTS married_name text default '';
-- ALTER TABLE reunion_badges ADD COLUMN IF NOT EXISTS other_status text default '';
-- ALTER TABLE reunion_badges ADD COLUMN IF NOT EXISTS num_children int not null default 0;
