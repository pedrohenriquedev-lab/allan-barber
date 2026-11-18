-- ALLAN BARBER | Estrutura inicial de produção
-- Execute este arquivo no SQL Editor do projeto Supabase.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where user_id = auth.uid()
  );
$$;

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(10,2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.availability_slots (
  id uuid primary key default gen_random_uuid(),
  slot_date date not null,
  start_time time not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (slot_date, start_time)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid not null references public.availability_slots(id),
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  price numeric(10,2) not null check (price >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  customer_name text not null,
  customer_phone text not null,
  status text not null default 'Confirmado'
    check (status in ('Confirmado', 'Concluído', 'Pendente', 'Cancelado')),
  payment_status text not null default 'Pendente'
    check (payment_status in ('Pendente', 'Pago')),
  created_at timestamptz not null default now()
);

create index if not exists availability_slots_date_idx
  on public.availability_slots (slot_date, start_time);

create index if not exists bookings_slot_idx on public.bookings (slot_id);
create index if not exists bookings_status_idx on public.bookings (status);

create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  caption text not null default '',
  position integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.services enable row level security;
alter table public.availability_slots enable row level security;
alter table public.bookings enable row level security;
alter table public.gallery enable row level security;

drop policy if exists "Admins manage admin users" on public.admin_users;
create policy "Admins manage admin users" on public.admin_users
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active services" on public.services;
create policy "Public reads active services" on public.services
  for select to anon, authenticated using (active = true or public.is_admin());

drop policy if exists "Admins manage services" on public.services;
create policy "Admins manage services" on public.services
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active slots" on public.availability_slots;
create policy "Public reads active slots" on public.availability_slots
  for select to anon, authenticated using (active = true or public.is_admin());

drop policy if exists "Admins manage slots" on public.availability_slots;
create policy "Admins manage slots" on public.availability_slots
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins read bookings" on public.bookings;
create policy "Admins read bookings" on public.bookings
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins update bookings" on public.bookings;
create policy "Admins update bookings" on public.bookings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public reads active gallery" on public.gallery;
create policy "Public reads active gallery" on public.gallery
  for select to anon, authenticated using (active = true or public.is_admin());

drop policy if exists "Admins manage gallery" on public.gallery;
create policy "Admins manage gallery" on public.gallery
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.create_booking(
  p_slot_id uuid,
  p_service_id uuid,
  p_customer_name text,
  p_customer_phone text
)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_slot public.availability_slots%rowtype;
  v_service public.services%rowtype;
  v_booking public.bookings%rowtype;
  v_start timestamp;
  v_end timestamp;
begin
  if length(trim(coalesce(p_customer_name, ''))) < 2 then
    raise exception 'Informe seu nome completo.';
  end if;

  if length(regexp_replace(coalesce(p_customer_phone, ''), '\\D', '', 'g')) < 10 then
    raise exception 'Informe um telefone válido.';
  end if;

  select * into v_slot
  from public.availability_slots
  where id = p_slot_id and active = true
  for update;

  if not found then
    raise exception 'Este horário não está mais disponível.';
  end if;

  select * into v_service
  from public.services
  where id = p_service_id and active = true;

  if not found then
    raise exception 'Serviço indisponível.';
  end if;

  v_start := v_slot.slot_date + v_slot.start_time;
  v_end := v_start + make_interval(mins => v_service.duration_minutes);

  if exists (
    select 1
    from public.bookings b
    join public.availability_slots s on s.id = b.slot_id
    where b.status <> 'Cancelado'
      and s.slot_date = v_slot.slot_date
      and (s.slot_date + s.start_time) < v_end
      and (s.slot_date + s.start_time + make_interval(mins => b.duration_minutes)) > v_start
  ) then
    raise exception 'Este horário conflita com outro agendamento. Escolha outro.';
  end if;

  insert into public.bookings (
    slot_id, service_id, service_name, price, duration_minutes,
    customer_name, customer_phone
  ) values (
    v_slot.id, v_service.id, v_service.name, v_service.price,
    v_service.duration_minutes, trim(p_customer_name),
    regexp_replace(p_customer_phone, '\\D', '', 'g')
  )
  returning * into v_booking;

  return v_booking;
end;
$$;

revoke all on function public.create_booking(uuid, uuid, text, text) from public;
grant execute on function public.create_booking(uuid, uuid, text, text) to anon, authenticated;

grant select on public.services, public.availability_slots, public.gallery to anon, authenticated;
grant select, update on public.bookings to authenticated;
grant all on public.services, public.availability_slots, public.gallery to authenticated;
grant all on public.admin_users to authenticated;

-- Depois de criar o usuário do Allan em Authentication > Users,
-- execute a linha abaixo substituindo pelo UUID real:
-- insert into public.admin_users (user_id) values ('UUID-DO-USUARIO-ALLAN');
