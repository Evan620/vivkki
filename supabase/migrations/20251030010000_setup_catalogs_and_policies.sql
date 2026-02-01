-- Catalog tables (create if not exists)
create table if not exists public.medical_providers_complete (
  id bigserial primary key,
  name text not null,
  type text not null default 'Other',
  street_address text default '',
  city text default '',
  state text default 'OK',
  zip_code text default '',
  phone text default '',
  fax text default '',
  email text default '',
  request_method text default 'Email',
  notes text default '',
  created_at timestamptz default now()
);

create table if not exists public.health_insurance (
  id bigserial primary key,
  name text not null,
  type text default 'Other',
  phone text default '',
  created_at timestamptz default now()
);

create table if not exists public.auto_insurance_complete (
  id bigserial primary key,
  name text not null,
  state text default 'OK',
  phone text default '',
  created_at timestamptz default now()
);

-- Helpful indexes
create index if not exists idx_medprov_name on public.medical_providers_complete(name);
create index if not exists idx_medprov_city on public.medical_providers_complete(city);
create index if not exists idx_medprov_type on public.medical_providers_complete(type);
create index if not exists idx_health_name on public.health_insurance(name);
create index if not exists idx_auto_name on public.auto_insurance_complete(name);

-- Ensure medical_bills has foreign keys (if table exists)
do $$ begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='medical_bills') then
    alter table public.medical_bills
      add column if not exists client_id bigint,
      add column if not exists medical_provider_id bigint;
  end if;
exception when others then null; end $$;

-- Enable RLS and policies for basic select/insert for authenticated users
alter table if exists public.medical_providers_complete enable row level security;
alter table if exists public.health_insurance enable row level security;
alter table if exists public.auto_insurance_complete enable row level security;

-- Policies for medical_providers_complete
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'medical_providers_complete'
      and policyname = 'mpc_select_auth'
  ) then
    create policy mpc_select_auth
      on public.medical_providers_complete
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'medical_providers_complete'
      and policyname = 'mpc_insert_auth'
  ) then
    create policy mpc_insert_auth
      on public.medical_providers_complete
      for insert
      to authenticated
      with check (true);
  end if;
end $$;

-- Policies for health_insurance
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'health_insurance'
      and policyname = 'hi_select_auth'
  ) then
    create policy hi_select_auth
      on public.health_insurance
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'health_insurance'
      and policyname = 'hi_insert_auth'
  ) then
    create policy hi_insert_auth
      on public.health_insurance
      for insert
      to authenticated
      with check (true);
  end if;
end $$;

-- Policies for auto_insurance_complete
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'auto_insurance_complete'
      and policyname = 'ai_select_auth'
  ) then
    create policy ai_select_auth
      on public.auto_insurance_complete
      for select
      to authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename  = 'auto_insurance_complete'
      and policyname = 'ai_insert_auth'
  ) then
    create policy ai_insert_auth
      on public.auto_insurance_complete
      for insert
      to authenticated
      with check (true);
  end if;
end $$;

-- Realtime: ensure casefiles and catalogs are in publication
-- (Supabase creates "supabase_realtime" by default; add tables if needed)
do $$ begin
  perform 1 from pg_catalog.pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='casefiles';
  if not found then
    alter publication supabase_realtime add table public.casefiles;
  end if;
exception when others then null; end $$;

-- Safely add catalog tables to realtime publication (IF NOT EXISTS isn't supported here)
do $$
begin
  perform 1 from pg_catalog.pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='medical_providers_complete';
  if not found then
    alter publication supabase_realtime add table public.medical_providers_complete;
  end if;

  perform 1 from pg_catalog.pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='health_insurance';
  if not found then
    alter publication supabase_realtime add table public.health_insurance;
  end if;

  perform 1 from pg_catalog.pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='auto_insurance_complete';
  if not found then
    alter publication supabase_realtime add table public.auto_insurance_complete;
  end if;
end $$;


