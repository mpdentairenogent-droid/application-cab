-- Bug trouvé le 2026-08-10 : aucun chemin de création de compte (Edge
-- Function create-team-member, script create-team-member.ts, purge-demo-data.ts)
-- n'a jamais créé de fiche public.practitioners ni renseigné
-- profiles.practitioner_id — alors que revenue_entries.practitioner_id est
-- NOT NULL et que RevenueEntryFormSheet exige un practitionerId non vide.
-- Conséquence vérifiée en direct : practitioners était vide (0 ligne) et les
-- deux comptes owner_dentist existants (Camille Pilot, Moslah Kamel) avaient
-- practitioner_id = null — personne ne pouvait saisir de chiffre d'affaires.
--
-- Fix à la source : handle_new_user (0003_auth_trigger.sql) est le seul
-- point de passage commun à tous les chemins de création de compte (tout
-- insert dans auth.users le déclenche) — corriger ici couvre aussi bien les
-- comptes déjà existants dans le code que tout futur appel à
-- auth.admin.createUser, sans avoir à patcher chaque appelant.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_role public.app_role;
  new_practitioner_id uuid;
  -- Même palette fonctionnelle que src/constants/theme.ts (sage, slateBlue,
  -- orange, red, blue, gray) — pour que les nouveaux praticiens restent
  -- visuellement cohérents avec le reste de l'app plutôt que d'inventer une
  -- teinte hors design system.
  practitioner_colors constant text[] := array['#7C9885', '#5B7C99', '#C97B3D', '#BC5449', '#5B84A3', '#8B8680'];
begin
  new_role := coalesce((new.raw_user_meta_data ->> 'role')::app_role, 'assistant');

  if new_role in ('owner_dentist', 'collaborator_dentist') then
    insert into public.practitioners (first_name, last_name, color)
    values (
      coalesce(new.raw_user_meta_data ->> 'first_name', ''),
      coalesce(new.raw_user_meta_data ->> 'last_name', ''),
      practitioner_colors[(select count(*) from public.practitioners)::int % array_length(practitioner_colors, 1) + 1]
    )
    returning id into new_practitioner_id;
  end if;

  insert into public.profiles (id, first_name, last_name, role, practitioner_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new_role,
    new_practitioner_id
  );
  return new;
end;
$$;

-- Réparation des comptes déjà créés avant ce correctif (idempotent : ne
-- touche que les profils encore sans fiche liée, donc sans effet si rejoué).
do $$
declare
  r record;
  new_id uuid;
  practitioner_colors constant text[] := array['#7C9885', '#5B7C99', '#C97B3D', '#BC5449', '#5B84A3', '#8B8680'];
begin
  for r in
    select id, first_name, last_name from public.profiles
    where role in ('owner_dentist', 'collaborator_dentist') and practitioner_id is null
    order by created_at
  loop
    insert into public.practitioners (first_name, last_name, color)
    values (r.first_name, r.last_name, practitioner_colors[(select count(*) from public.practitioners)::int % array_length(practitioner_colors, 1) + 1])
    returning id into new_id;
    update public.profiles set practitioner_id = new_id where id = r.id;
  end loop;
end $$;
