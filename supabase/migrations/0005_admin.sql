-- 관리자 전용 일괄 처리 RPC (마이그레이션/Import용)

-- 초기 재고 일괄 upsert (transactions 기록 없이 inventory만)
-- 입력: jsonb 배열 [{location_id, item_id, quantity}]
create or replace function public.bulk_set_inventory(p_rows jsonb)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_row jsonb;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '28000';
  end if;
  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    insert into public.inventory (location_id, item_id, quantity)
    values (
      (v_row->>'location_id')::uuid,
      (v_row->>'item_id')::uuid,
      (v_row->>'quantity')::numeric
    )
    on conflict (location_id, item_id) do update
      set quantity = excluded.quantity, updated_at = now();
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.bulk_set_inventory(jsonb) from public;
grant execute on function public.bulk_set_inventory(jsonb) to authenticated;

-- 자재 마스터 일괄 upsert (code 기준)
-- 입력: jsonb 배열 [{code, name, spec, species, color, unit, qty_per_box, area_per_box, safety_stock, memo}]
create or replace function public.bulk_upsert_items(p_rows jsonb)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare
  v_count integer := 0;
  v_row jsonb;
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '28000';
  end if;
  for v_row in select * from jsonb_array_elements(p_rows)
  loop
    insert into public.items (
      code, name, spec, species, color, unit,
      qty_per_box, area_per_box, safety_stock, memo, qr_payload
    )
    values (
      v_row->>'code',
      coalesce(v_row->>'name',''),
      coalesce(v_row->>'spec',''),
      coalesce(v_row->>'species',''),
      coalesce(v_row->>'color',''),
      coalesce(v_row->>'unit','box'),
      coalesce((v_row->>'qty_per_box')::numeric, 0),
      coalesce((v_row->>'area_per_box')::numeric, 0),
      coalesce((v_row->>'safety_stock')::numeric, 0),
      coalesce(v_row->>'memo',''),
      coalesce(v_row->>'qr_payload', v_row->>'code')
    )
    on conflict (code) do update set
      name = excluded.name,
      spec = excluded.spec,
      species = excluded.species,
      color = excluded.color,
      unit = excluded.unit,
      qty_per_box = excluded.qty_per_box,
      area_per_box = excluded.area_per_box,
      safety_stock = excluded.safety_stock,
      memo = excluded.memo,
      qr_payload = excluded.qr_payload;
    v_count := v_count + 1;
  end loop;
  return v_count;
end;
$$;

revoke all on function public.bulk_upsert_items(jsonb) from public;
grant execute on function public.bulk_upsert_items(jsonb) to authenticated;

-- 사용자 role 변경 (관리자만)
create or replace function public.set_user_role(p_user_id uuid, p_role text)
returns void
language plpgsql security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'ADMIN_REQUIRED' using errcode = '28000';
  end if;
  if p_role not in ('admin','user') then
    raise exception 'INVALID_ROLE' using errcode = '22000';
  end if;
  -- 본인 강등 방지
  if p_user_id = auth.uid() and p_role <> 'admin' then
    raise exception 'CANNOT_DEMOTE_SELF' using errcode = 'P0001';
  end if;
  update public.profiles set role = p_role where id = p_user_id;
end;
$$;

revoke all on function public.set_user_role(uuid, text) from public;
grant execute on function public.set_user_role(uuid, text) to authenticated;
