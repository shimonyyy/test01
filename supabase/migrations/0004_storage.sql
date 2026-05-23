-- 입출고 사진 첨부용 Storage 버킷 + RLS
-- 객체 경로 규칙: <user_id>/<client_uuid>/<filename>

insert into storage.buckets (id, name, public)
values ('transaction-photos', 'transaction-photos', false)
on conflict (id) do nothing;

-- 본인 폴더에만 업로드/삭제 가능, 인증 사용자는 모두 읽기 가능 (서명 URL은 자동)
drop policy if exists "tx-photos read auth" on storage.objects;
create policy "tx-photos read auth"
  on storage.objects for select
  using (bucket_id = 'transaction-photos' and auth.role() = 'authenticated');

drop policy if exists "tx-photos write own" on storage.objects;
create policy "tx-photos write own"
  on storage.objects for insert
  with check (
    bucket_id = 'transaction-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "tx-photos delete own or admin" on storage.objects;
create policy "tx-photos delete own or admin"
  on storage.objects for delete
  using (
    bucket_id = 'transaction-photos'
    and (
      auth.uid()::text = (storage.foldername(name))[1]
      or public.is_admin()
    )
  );
