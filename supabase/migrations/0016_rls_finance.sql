-- RLS : chiffre d'affaires, objectifs, dépenses.
-- La table la plus sensible du projet (§17, §75) : une assistante n'a ici
-- STRICTEMENT AUCUNE policy applicable (aucun has_permission ne lui répond
-- vrai), et un collaborateur est filtré ligne par ligne sur son propre
-- practitioner_id — changer l'id dans la requête ne change rien puisque le
-- filtre est appliqué par Postgres, pas par la valeur envoyée par le client.

alter table public.revenue_entries enable row level security;
alter table public.financial_targets enable row level security;
alter table public.expenses enable row level security;

drop policy if exists "revenue_entries_select" on public.revenue_entries;
create policy "revenue_entries_select" on public.revenue_entries
  for select to authenticated
  using (
    public.has_permission('view_all_revenue')
    or (public.has_permission('view_own_revenue') and practitioner_id = public.my_practitioner_id())
  );

drop policy if exists "revenue_entries_manage" on public.revenue_entries;
create policy "revenue_entries_manage" on public.revenue_entries
  for insert to authenticated
  with check (public.has_permission('manage_revenue'));

drop policy if exists "revenue_entries_update" on public.revenue_entries;
create policy "revenue_entries_update" on public.revenue_entries
  for update to authenticated
  using (public.has_permission('manage_revenue'))
  with check (public.has_permission('manage_revenue'));

drop policy if exists "revenue_entries_delete" on public.revenue_entries;
create policy "revenue_entries_delete" on public.revenue_entries
  for delete to authenticated
  using (public.has_permission('manage_revenue'));

drop policy if exists "financial_targets_select" on public.financial_targets;
create policy "financial_targets_select" on public.financial_targets
  for select to authenticated
  using (
    public.has_permission('view_all_revenue')
    or (public.has_permission('view_own_revenue') and practitioner_id = public.my_practitioner_id())
  );

drop policy if exists "financial_targets_manage" on public.financial_targets;
create policy "financial_targets_manage" on public.financial_targets
  for all to authenticated
  using (public.has_permission('manage_revenue'))
  with check (public.has_permission('manage_revenue'));

drop policy if exists "expenses_select" on public.expenses;
create policy "expenses_select" on public.expenses
  for select to authenticated
  using (public.has_permission('view_expenses'));

drop policy if exists "expenses_manage" on public.expenses;
create policy "expenses_manage" on public.expenses
  for all to authenticated
  using (public.has_permission('manage_expenses'))
  with check (public.has_permission('manage_expenses'));
