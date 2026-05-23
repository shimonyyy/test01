-- BERTI 재고관리 시스템 초기 스키마
-- PRD v2 §5 데이터베이스 스키마 반영

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. profiles  (auth.users 1:1)
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null default '',
  department text default '',
  phone text default '',
  role text not null default 'user' check (role in ('admin','user')),
  is_approved boolean not null default true,
  default_location_id uuid,
  push_subscription jsonb,
  created_at timestamptz not null default now()
);

-- ============================================================
-- 2. locations
-- ============================================================
create table if not exists public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null default 'warehouse' check (type in ('warehouse','site')),
  address text default '',
  memo text default '',
  created_at timestamptz not null default now()
);

-- ============================================================
-- 3. items  (자재 마스터)
-- ============================================================
create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  spec text default '',
  species text default '',
  color text default '',
  unit text not null default 'box',
  qty_per_box numeric not null default 0,
  area_per_box numeric not null default 0,
  safety_stock numeric not null default 0,
  qr_payload text,
  memo text default '',
  created_at timestamptz not null default now()
);

create index if not exists items_code_idx on public.items (code);
create index if not exists items_name_idx on public.items (name);

-- ============================================================
-- 4. inventory  (위치 × 자재 현재고)
-- ============================================================
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete restrict,
  item_id uuid not null references public.items (id) on delete restrict,
  quantity numeric not null default 0 check (quantity >= 0),
  updated_at timestamptz not null default now(),
  unique (location_id, item_id)
);

create index if not exists inventory_location_idx on public.inventory (location_id);
create index if not exists inventory_item_idx on public.inventory (item_id);

-- ============================================================
-- 5. transactions  (입출고 이력)
-- ============================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('in','out','transfer')),
  location_id uuid not null references public.locations (id) on delete restrict,
  dest_location_id uuid references public.locations (id) on delete restrict,
  item_id uuid not null references public.items (id) on delete restrict,
  quantity numeric not null check (quantity > 0),
  transaction_date date not null default current_date,
  partner text default '',
  memo text default '',
  photo_urls jsonb not null default '[]'::jsonb,
  client_uuid uuid unique,
  gps point,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create index if not exists transactions_date_idx on public.transactions (transaction_date desc);
create index if not exists transactions_location_idx on public.transactions (location_id);
create index if not exists transactions_item_idx on public.transactions (item_id);
create index if not exists transactions_created_by_idx on public.transactions (created_by);

-- profiles.default_location_id FK (locations 생성 이후에 부여)
alter table public.profiles
  drop constraint if exists profiles_default_location_id_fkey;
alter table public.profiles
  add constraint profiles_default_location_id_fkey
  foreign key (default_location_id) references public.locations (id) on delete set null;

-- ============================================================
-- 6. transaction_audits  (수정/삭제 추적)
-- ============================================================
create table if not exists public.transaction_audits (
  id bigserial primary key,
  transaction_id uuid not null,
  action text not null check (action in ('update','delete')),
  old_row jsonb,
  new_row jsonb,
  actor uuid references public.profiles (id),
  at timestamptz not null default now()
);

-- ============================================================
-- 7. 초기 시드: 하남창고, 용인창고
-- ============================================================
insert into public.locations (name, type)
  values ('하남창고', 'warehouse'), ('용인창고', 'warehouse')
  on conflict do nothing;
