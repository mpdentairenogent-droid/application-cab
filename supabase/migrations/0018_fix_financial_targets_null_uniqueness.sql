-- En SQL standard, NULL n'est jamais égal à NULL : une contrainte UNIQUE
-- classique sur (practitioner_id, period_type, period_start) ne déduplique
-- donc PAS les objectifs "cabinet entier" (practitioner_id IS NULL) — chaque
-- upsert avec practitioner_id=null insérait une nouvelle ligne au lieu de
-- mettre à jour l'existante. NULLS NOT DISTINCT (Postgres 15+) traite les
-- NULL comme égaux entre eux pour cette contrainte, ce qui correspond à
-- l'intention réelle : un seul objectif cabinet par période.
alter table public.financial_targets drop constraint if exists financial_targets_practitioner_id_period_type_period_start_key;

-- Nettoie les doublons que l'ancienne contrainte laissait passer pour
-- practitioner_id NULL, avant de pouvoir poser la nouvelle contrainte
-- (garde la ligne la plus ancienne de chaque groupe).
delete from public.financial_targets
where id in (
  select id from (
    select id, row_number() over (partition by practitioner_id, period_type, period_start order by created_at) as rn
    from public.financial_targets
  ) ranked
  where rn > 1
);

alter table public.financial_targets
  add constraint financial_targets_unique_period unique nulls not distinct (practitioner_id, period_type, period_start);
