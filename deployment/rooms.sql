create table public.island_rooms (
  code text primary key,
  revision integer not null,
  updated_ms bigint not null,
  state jsonb not null
);
alter table public.island_rooms enable row level security;
revoke all on public.island_rooms from anon, authenticated, public;
grant select, insert, update, delete on public.island_rooms to service_role;
create index island_rooms_expiry on public.island_rooms(updated_ms);
