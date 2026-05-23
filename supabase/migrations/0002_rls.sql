-- BERTI RLS 정책 + handle_new_user 트리거 + audit 트리거
-- PRD v2 §3.1 / §3.7 반영

-- ============================================================
-- helper: 현재 사용자가 admin 인지
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- ============================================================
-- handle_new_user: auth.users insert 시 profiles row 자동 생성
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, department, phone)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'department', ''),
    coalesce(new.raw_user_meta_data->>'phone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- transactions audit 트리거
-- ============================================================
create or replace function public.tg_transactions_audit()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    insert into public.transaction_audits (transaction_id, action, old_row, new_row, actor)
    values (old.id, 'update', to_jsonb(old), to_jsonb(new), auth.uid());
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.transaction_audits (transaction_id, action, old_row, actor)
    values (old.id, 'delete', to_jsonb(old), auth.uid());
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists transactions_audit_trg on public.transactions;
create trigger transactions_audit_trg
  after update or delete on public.transactions
  for each row execute function public.tg_transactions_audit();

-- ============================================================
-- RLS 활성화
-- ============================================================
alter table public.profiles            enable row level security;
alter table public.locations           enable row level security;
alter table public.items               enable row level security;
alter table public.inventory           enable row level security;
alter table public.transactions        enable row level security;
alter table public.transaction_audits  enable row level security;

-- ----------- profiles -----------
drop policy if exists "profiles: self read" on public.profiles;
create policy "profiles: self read"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles: self update" on public.profiles;
create policy "profiles: self update"
  on public.profiles for update
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

drop policy if exists "profiles: admin insert" on public.profiles;
create policy "profiles: admin insert"
  on public.profiles for insert
  with check (public.is_admin());

drop policy if exists "profiles: admin delete" on public.profiles;
create policy "profiles: admin delete"
  on public.profiles for delete
  using (public.is_admin());

-- ----------- locations -----------
drop policy if exists "locations: auth read" on public.locations;
create policy "locations: auth read"
  on public.locations for select
  using (auth.role() = 'authenticated');

drop policy if exists "locations: admin write" on public.locations;
create policy "locations: admin write"
  on public.locations for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------- items -----------
drop policy if exists "items: auth read" on public.items;
create policy "items: auth read"
  on public.items for select
  using (auth.role() = 'authenticated');

drop policy if exists "items: admin write" on public.items;
create policy "items: admin write"
  on public.items for all
  using (public.is_admin())
  with check (public.is_admin());

-- ----------- inventory -----------
-- 읽기만 허용. 모든 변동은 RPC(SECURITY DEFINER) 통해서만 발생.
drop policy if exists "inventory: auth read" on public.inventory;
create policy "inventory: auth read"
  on public.inventory for select
  using (auth.role() = 'authenticated');

-- ----------- transactions -----------
drop policy if exists "transactions: auth read" on public.transactions;
create policy "transactions: auth read"
  on public.transactions for select
  using (auth.role() = 'authenticated');

drop policy if exists "transactions: self insert" on public.transactions;
create policy "transactions: self insert"
  on public.transactions for insert
  with check (auth.uid() = created_by);

drop policy if exists "transactions: self or admin update" on public.transactions;
create policy "transactions: self or admin update"
  on public.transactions for update
  using (auth.uid() = created_by or public.is_admin())
  with check (auth.uid() = created_by or public.is_admin());

drop policy if exists "transactions: self or admin delete" on public.transactions;
create policy "transactions: self or admin delete"
  on public.transactions for delete
  using (auth.uid() = created_by or public.is_admin());

-- ----------- transaction_audits -----------
drop policy if exists "audits: admin read" on public.transaction_audits;
create policy "audits: admin read"
  on public.transaction_audits for select
  using (public.is_admin());
