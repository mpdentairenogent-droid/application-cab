-- Catégories de stock avec couleur modifiable (§65-68 : "catégories" fait
-- partie des listes configurables de Paramètres). Remplace le champ texte
-- libre stock_items.category — jamais exploité par l'UI jusqu'ici (aucun
-- filtre, aucun affichage) — par de vraies entités réutilisables entre le
-- catalogue Stock et la sélection rapide d'articles dans une Commande.

create table if not exists public.stock_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default '#8B8680',
  created_at timestamptz not null default now()
);

alter table public.stock_items add column if not exists category_id uuid references public.stock_categories (id) on delete set null;

-- Bascule les valeurs texte déjà saisies (le champ était libre avant ce
-- round) vers de vraies catégories, sans perte si des articles existent déjà.
insert into public.stock_categories (name)
select distinct trim(category) from public.stock_items
where category is not null and trim(category) <> ''
on conflict (name) do nothing;

update public.stock_items si
set category_id = sc.id
from public.stock_categories sc
where si.category_id is null and si.category is not null and trim(si.category) = sc.name;

-- La vue doit être supprimée AVANT de toucher à la colonne dont elle
-- dépend (stock_items.category), sinon Postgres refuse le drop column.
-- create or replace view exige aussi les mêmes colonnes en sortie :
-- category_id remplace category (renommée, pas juste retirée), donc
-- drop+create plutôt que or replace.
drop view if exists public.stock_expiry_overview;

alter table public.stock_items drop column if exists category;

create view public.stock_expiry_overview
with (security_invoker = true) as
select
  id,
  name,
  category_id,
  quantity,
  unit,
  location,
  expiry_date,
  case
    when expiry_date < current_date then 'expired'
    when expiry_date < current_date + interval '30 days' then 'under_30'
    when expiry_date < current_date + interval '60 days' then '30_to_60'
    when expiry_date < current_date + interval '90 days' then '60_to_90'
    else 'beyond_90'
  end as expiry_bucket
from public.stock_items
where expiry_date is not null
order by expiry_date asc;

alter table public.stock_categories enable row level security;

drop policy if exists "stock_categories_select" on public.stock_categories;
create policy "stock_categories_select" on public.stock_categories for select to authenticated using (public.has_permission('view_stock'));
drop policy if exists "stock_categories_manage" on public.stock_categories;
create policy "stock_categories_manage" on public.stock_categories for all to authenticated using (public.has_permission('manage_stock')) with check (public.has_permission('manage_stock'));
