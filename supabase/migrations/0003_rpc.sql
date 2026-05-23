-- BERTI 입출고 트랜잭션 RPC
-- transactions insert + inventory upsert/감소 를 원자적으로 처리한다.
-- 모든 함수는 SECURITY DEFINER 로 RLS를 우회하되, 내부에서 auth.uid() 검증을 수행.

-- ============================================================
-- record_inbound: 입고
-- ============================================================
create or replace function public.record_inbound(
  p_location_id uuid,
  p_item_id uuid,
  p_quantity numeric,
  p_transaction_date date default current_date,
  p_partner text default '',
  p_memo text default '',
  p_photo_urls jsonb default '[]'::jsonb,
  p_client_uuid uuid default null
)
returns public.transactions
language plpgsql security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_tx public.transactions;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY' using errcode = '22000';
  end if;

  -- 중복 방지(idempotency)
  if p_client_uuid is not null then
    select * into v_tx from public.transactions where client_uuid = p_client_uuid;
    if found then return v_tx; end if;
  end if;

  insert into public.transactions
    (type, location_id, item_id, quantity, transaction_date,
     partner, memo, photo_urls, client_uuid, created_by)
  values
    ('in', p_location_id, p_item_id, p_quantity, p_transaction_date,
     p_partner, p_memo, p_photo_urls, p_client_uuid, v_user)
  returning * into v_tx;

  insert into public.inventory (location_id, item_id, quantity)
  values (p_location_id, p_item_id, p_quantity)
  on conflict (location_id, item_id)
  do update set quantity = public.inventory.quantity + excluded.quantity,
                updated_at = now();

  return v_tx;
end;
$$;

-- ============================================================
-- record_outbound: 출고
-- ============================================================
create or replace function public.record_outbound(
  p_location_id uuid,
  p_item_id uuid,
  p_quantity numeric,
  p_transaction_date date default current_date,
  p_partner text default '',
  p_memo text default '',
  p_photo_urls jsonb default '[]'::jsonb,
  p_client_uuid uuid default null
)
returns public.transactions
language plpgsql security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_tx public.transactions;
  v_current numeric;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY' using errcode = '22000';
  end if;

  if p_client_uuid is not null then
    select * into v_tx from public.transactions where client_uuid = p_client_uuid;
    if found then return v_tx; end if;
  end if;

  select quantity into v_current
    from public.inventory
    where location_id = p_location_id and item_id = p_item_id
    for update;

  if v_current is null or v_current < p_quantity then
    raise exception 'INSUFFICIENT_STOCK: current=%, requested=%',
      coalesce(v_current, 0), p_quantity using errcode = 'P0001';
  end if;

  update public.inventory
    set quantity = quantity - p_quantity, updated_at = now()
    where location_id = p_location_id and item_id = p_item_id;

  insert into public.transactions
    (type, location_id, item_id, quantity, transaction_date,
     partner, memo, photo_urls, client_uuid, created_by)
  values
    ('out', p_location_id, p_item_id, p_quantity, p_transaction_date,
     p_partner, p_memo, p_photo_urls, p_client_uuid, v_user)
  returning * into v_tx;

  return v_tx;
end;
$$;

-- ============================================================
-- record_transfer: 창고 간 이동
-- ============================================================
create or replace function public.record_transfer(
  p_from_location_id uuid,
  p_to_location_id uuid,
  p_item_id uuid,
  p_quantity numeric,
  p_transaction_date date default current_date,
  p_memo text default '',
  p_client_uuid uuid default null
)
returns public.transactions
language plpgsql security definer
set search_path = public
as $$
declare
  v_user uuid := auth.uid();
  v_tx public.transactions;
  v_current numeric;
begin
  if v_user is null then
    raise exception 'AUTH_REQUIRED' using errcode = '28000';
  end if;
  if p_from_location_id = p_to_location_id then
    raise exception 'SAME_LOCATION' using errcode = '22000';
  end if;
  if p_quantity is null or p_quantity <= 0 then
    raise exception 'INVALID_QUANTITY' using errcode = '22000';
  end if;

  if p_client_uuid is not null then
    select * into v_tx from public.transactions where client_uuid = p_client_uuid;
    if found then return v_tx; end if;
  end if;

  select quantity into v_current
    from public.inventory
    where location_id = p_from_location_id and item_id = p_item_id
    for update;

  if v_current is null or v_current < p_quantity then
    raise exception 'INSUFFICIENT_STOCK: current=%, requested=%',
      coalesce(v_current, 0), p_quantity using errcode = 'P0001';
  end if;

  update public.inventory
    set quantity = quantity - p_quantity, updated_at = now()
    where location_id = p_from_location_id and item_id = p_item_id;

  insert into public.inventory (location_id, item_id, quantity)
  values (p_to_location_id, p_item_id, p_quantity)
  on conflict (location_id, item_id)
  do update set quantity = public.inventory.quantity + excluded.quantity,
                updated_at = now();

  insert into public.transactions
    (type, location_id, dest_location_id, item_id, quantity,
     transaction_date, memo, client_uuid, created_by)
  values
    ('transfer', p_from_location_id, p_to_location_id, p_item_id, p_quantity,
     p_transaction_date, p_memo, p_client_uuid, v_user)
  returning * into v_tx;

  return v_tx;
end;
$$;

-- 권한: authenticated 만 호출
revoke all on function public.record_inbound(uuid,uuid,numeric,date,text,text,jsonb,uuid) from public;
revoke all on function public.record_outbound(uuid,uuid,numeric,date,text,text,jsonb,uuid) from public;
revoke all on function public.record_transfer(uuid,uuid,uuid,numeric,date,text,uuid) from public;

grant execute on function public.record_inbound(uuid,uuid,numeric,date,text,text,jsonb,uuid) to authenticated;
grant execute on function public.record_outbound(uuid,uuid,numeric,date,text,text,jsonb,uuid) to authenticated;
grant execute on function public.record_transfer(uuid,uuid,uuid,numeric,date,text,uuid) to authenticated;
