-- Add DELETE policies for catalog tables
-- This migration adds delete permissions for authenticated users on all catalog tables

-- Delete policy for medical_providers_complete
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='medical_providers_complete') then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename  = 'medical_providers_complete'
        and policyname = 'mpc_delete_auth'
    ) then
      create policy mpc_delete_auth
        on public.medical_providers_complete
        for delete
        to authenticated
        using (true);
    end if;
  end if;
end $$;

-- Delete policy for health_insurance
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='health_insurance') then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename  = 'health_insurance'
        and policyname = 'hi_delete_auth'
    ) then
      create policy hi_delete_auth
        on public.health_insurance
        for delete
        to authenticated
        using (true);
    end if;
  end if;
end $$;

-- Delete policy for auto_insurance_complete
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='auto_insurance_complete') then
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename  = 'auto_insurance_complete'
        and policyname = 'aic_delete_auth'
    ) then
      create policy aic_delete_auth
        on public.auto_insurance_complete
        for delete
        to authenticated
        using (true);
    end if;
  end if;
end $$;

-- Delete policy for auto_insurance (fallback table)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='auto_insurance') then
    alter table if exists public.auto_insurance enable row level security;
    
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename  = 'auto_insurance'
        and policyname = 'ai_delete_auth'
    ) then
      create policy ai_delete_auth
        on public.auto_insurance
        for delete
        to authenticated
        using (true);
    end if;
  end if;
end $$;

-- Delete policy for medical_providers (if exists)
do $$
begin
  if exists (select 1 from information_schema.tables where table_schema='public' and table_name='medical_providers') then
    alter table if exists public.medical_providers enable row level security;
    
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename  = 'medical_providers'
        and policyname = 'mp_delete_auth'
    ) then
      create policy mp_delete_auth
        on public.medical_providers
        for delete
        to authenticated
        using (true);
    end if;
  end if;
end $$;

