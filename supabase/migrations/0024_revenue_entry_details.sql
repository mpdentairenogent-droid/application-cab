-- §46 : détail optionnel du CA d'une journée par type d'acte (soins,
-- prothèse, implant, chirurgie, orthodontie, parodontologie, esthétique,
-- autre). revenue_entries.amount reste la source de vérité pour tous les
-- calculs déjà en place (objectifs, comparaisons, séries mensuelles) — cette
-- table est une décomposition facultative pour la lecture/l'analyse, jamais
-- recalculée automatiquement à partir d'elle (pas de trigger de somme).
create table if not exists public.revenue_entry_details (
  id uuid primary key default gen_random_uuid(),
  revenue_entry_id uuid not null references public.revenue_entries (id) on delete cascade,
  procedure_type text not null check (
    procedure_type in ('soins', 'prosthesis', 'implant', 'surgery', 'orthodontics', 'periodontics', 'esthetics', 'other')
  ),
  amount numeric(10, 2) not null check (amount >= 0),
  created_at timestamptz not null default now()
);

create index if not exists revenue_entry_details_entry_idx on public.revenue_entry_details (revenue_entry_id);

alter table public.revenue_entry_details enable row level security;

-- Même visibilité que la ligne de CA parente (0016) : la sous-requête est
-- elle-même filtrée par revenue_entries_select pour l'utilisateur courant
-- (RLS s'applique récursivement), donc pas de duplication de sa condition ici.
drop policy if exists "revenue_entry_details_select" on public.revenue_entry_details;
create policy "revenue_entry_details_select" on public.revenue_entry_details for select to authenticated
  using (exists (select 1 from public.revenue_entries r where r.id = revenue_entry_id));

drop policy if exists "revenue_entry_details_manage" on public.revenue_entry_details;
create policy "revenue_entry_details_manage" on public.revenue_entry_details for all to authenticated
  using (public.has_permission('manage_revenue'))
  with check (public.has_permission('manage_revenue'));
