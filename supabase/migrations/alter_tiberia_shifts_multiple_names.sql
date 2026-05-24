-- Allow multiple people per date
alter table tiberia_shifts drop constraint if exists tiberia_shifts_pkey;
alter table tiberia_shifts add primary key (weekend_date, guard_name);
