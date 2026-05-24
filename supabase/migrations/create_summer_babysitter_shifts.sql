-- Summer babysitter shifts (family, unauthenticated)
create table if not exists summer_babysitter_shifts (
  shift_date date not null,
  sitter_name text not null,
  updated_at timestamptz default now(),
  primary key (shift_date, sitter_name)
);

create index if not exists idx_summer_babysitter_shifts_sitter_name
  on summer_babysitter_shifts (sitter_name);
