-- Enums
create type public.event_status as enum (
  'confirmed',
  'query',
  'budget_pending',
  'reserved'
);

create type public.payment_type as enum (
  'total',
  'partial'
);

create type public.payment_status as enum (
  'unpaid',
  'partial',
  'paid'
);

-- Updated at trigger helper
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profiles table
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'admin',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.places (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null,
  clarification text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_name_address_unique unique(owner_id, name, address)
);

create table public.events (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  date date not null,
  start_time time not null,
  end_time time,
  place_id uuid references public.places(id) on delete set null,
  description text,
  status public.event_status not null default 'query',
  includes_lighting_budget boolean not null default false,
  image_url text,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_financials (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null unique references public.events(id) on delete cascade,
  total_amount numeric(12,2) not null check (total_amount > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.event_payments (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  amount numeric(12,2) not null check (amount > 0),
  type public.payment_type not null,
  notes text,
  payment_date date not null,
  created_at timestamptz not null default now()
);

-- Indexes for dashboard + calendar
create index events_owner_date_idx on public.events(owner_id, date);
create index events_owner_status_idx on public.events(owner_id, status);
create index events_owner_place_idx on public.events(owner_id, place_id);
create index events_owner_name_search_idx on public.events(owner_id, lower(name));
create index places_owner_name_idx on public.places(owner_id, lower(name));
create index payments_event_date_idx on public.event_payments(event_id, payment_date desc);

-- Payment summary view
create or replace view public.event_payment_summary as
select
  ef.event_id,
  ef.total_amount,
  coalesce(sum(ep.amount), 0)::numeric(12,2) as total_paid,
  (ef.total_amount - coalesce(sum(ep.amount), 0))::numeric(12,2) as balance,
  case
    when coalesce(sum(ep.amount), 0) = 0 then 'unpaid'::public.payment_status
    when coalesce(sum(ep.amount), 0) >= ef.total_amount then 'paid'::public.payment_status
    else 'partial'::public.payment_status
  end as payment_status
from public.event_financials ef
left join public.event_payments ep on ep.event_id = ef.event_id
group by ef.event_id, ef.total_amount;

-- Triggers
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create trigger places_set_updated_at
before update on public.places
for each row execute function public.set_updated_at();

create trigger events_set_updated_at
before update on public.events
for each row execute function public.set_updated_at();

create trigger event_financials_set_updated_at
before update on public.event_financials
for each row execute function public.set_updated_at();

-- Profile auto-create
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

-- RLS
alter table public.profiles enable row level security;
alter table public.places enable row level security;
alter table public.events enable row level security;
alter table public.event_financials enable row level security;
alter table public.event_payments enable row level security;

create policy "profiles_select_own" on public.profiles
for select to authenticated
using (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

create policy "places_all_own" on public.places
for all to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

create policy "events_all_own" on public.events
for all to authenticated
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id and auth.uid() = created_by);

create policy "financials_all_own" on public.event_financials
for all to authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.owner_id = auth.uid()
  )
);

create policy "payments_all_own" on public.event_payments
for all to authenticated
using (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.owner_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from public.events e
    where e.id = event_id and e.owner_id = auth.uid()
  )
);

-- Storage bucket setup (run separately in dashboard if needed):
-- insert into storage.buckets (id, name, public) values ('event-images', 'event-images', true);
-- create policy "event_images_read" on storage.objects for select to authenticated using (bucket_id = 'event-images');
-- create policy "event_images_write" on storage.objects for insert to authenticated with check (bucket_id = 'event-images' and owner = auth.uid());
