-- Tiberia weekend shifts (family, unauthenticated)
create table if not exists tiberia_shifts (
  weekend_date date primary key,
  guard_name text not null,
  updated_at timestamptz default now()
);

create index if not exists idx_tiberia_shifts_guard_name on tiberia_shifts (guard_name);
