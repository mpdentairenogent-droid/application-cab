-- Bucket Storage partagé pour les photos opérationnelles (articles de
-- stock, étiquettes de contrôle de stérilisation...) — aucune donnée
-- patient. Public en lecture (simple affichage d'image dans l'app, pas
-- besoin d'URL signée), écriture réservée au personnel actif.
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', true)
on conflict (id) do nothing;

drop policy if exists "attachments_read" on storage.objects;
create policy "attachments_read" on storage.objects for select
  using (bucket_id = 'attachments');

drop policy if exists "attachments_write" on storage.objects;
create policy "attachments_write" on storage.objects for insert to authenticated
  with check (bucket_id = 'attachments' and public.is_active_staff());

drop policy if exists "attachments_update" on storage.objects;
create policy "attachments_update" on storage.objects for update to authenticated
  using (bucket_id = 'attachments' and public.is_active_staff())
  with check (bucket_id = 'attachments' and public.is_active_staff());

drop policy if exists "attachments_delete" on storage.objects;
create policy "attachments_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'attachments' and public.is_active_staff());
