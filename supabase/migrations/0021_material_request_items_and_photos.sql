-- Retours de test terrain (§28, §37, §40) : une demande de matériel peut
-- contenir plusieurs articles, et un contrôle de stérilisation peut porter
-- la photo de son étiquette/indicateur.

-- Une demande devient un en-tête + plusieurs lignes d'articles, sur le même
-- modèle que orders/order_items (0006) plutôt qu'un product_name/quantity
-- unique par demande.
create table if not exists public.material_request_items (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.material_requests (id) on delete cascade,
  product_name text not null,
  quantity integer not null default 1 check (quantity > 0),
  category text,
  created_at timestamptz not null default now()
);

create index if not exists material_request_items_request_idx on public.material_request_items (request_id);

-- Reprend les demandes existantes (une ligne par demande) avant de retirer
-- les colonnes désormais portées par material_request_items — idempotent :
-- ne réinsère pas si une demande a déjà ses lignes (ré-exécution du script).
insert into public.material_request_items (request_id, product_name, quantity, category)
select mr.id, mr.product_name, mr.quantity, mr.category
from public.material_requests mr
where mr.product_name is not null
  and not exists (select 1 from public.material_request_items i where i.request_id = mr.id);

alter table public.material_requests drop column if exists product_name;
alter table public.material_requests drop column if exists quantity;
alter table public.material_requests drop column if exists category;

alter table public.material_request_items enable row level security;

-- Même base que material_requests (0017) : tout le personnel actif voit et
-- crée des lignes ; seule la demande entière est supprimée (cascade), pas
-- une ligne isolée — pas de policy update/delete par ligne nécessaire.
drop policy if exists "material_request_items_select" on public.material_request_items;
create policy "material_request_items_select" on public.material_request_items for select to authenticated using (public.is_active_staff());
drop policy if exists "material_request_items_insert" on public.material_request_items;
create policy "material_request_items_insert" on public.material_request_items for insert to authenticated with check (public.is_active_staff());

-- §37 : photo de l'étiquette/indicateur jointe à un contrôle de stérilisation.
alter table public.sterilization_controls add column if not exists photo_url text;
