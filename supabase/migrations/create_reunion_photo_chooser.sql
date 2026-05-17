-- Photo curation tool (/mekif-chet-2007-reunion/gallery/choose): AI analysis + human review

create table if not exists reunion_photo_analysis (
  file_path text primary key,
  face_count int not null default -1,
  description text not null default '',
  score smallint,
  updated_at timestamptz not null default now()
);

create index if not exists reunion_photo_analysis_score_idx
  on reunion_photo_analysis (score desc nulls last);

create table if not exists reunion_photo_review (
  file_path text primary key,
  auto_selected boolean not null default false,
  human_choice text check (human_choice in ('yes', 'no')),
  updated_at timestamptz not null default now()
);

create index if not exists reunion_photo_review_human_idx
  on reunion_photo_review (human_choice);

alter table reunion_photo_analysis enable row level security;
alter table reunion_photo_review enable row level security;

-- Service role only (API uses admin client)
