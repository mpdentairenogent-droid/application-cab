-- Photo de l'étiquette/ticket du cycle — même pattern que
-- sterilization_controls.photo_url (migration 0021). Pas de policy RLS à
-- ajouter : la colonne est couverte par les policies déjà en place sur
-- sterilization_cycles (0017_rls_operational.sql).
alter table public.sterilization_cycles add column if not exists photo_url text;
