-- Règles métier n°1 et n°2 (cahier des charges §18) : un moniteur ou un véhicule
-- ne peut avoir deux leçons dont les créneaux se chevauchent. La vérification
-- applicative (src/server/services/lesson.service.ts) reste la première ligne
-- de défense (message d'erreur clair côté utilisateur), mais la contrainte
-- d'exclusion ci-dessous est la garantie ultime au niveau base de données :
-- même deux requêtes concurrentes ou un accès direct à la base ne peuvent
-- jamais créer un chevauchement. Les statuts d'annulation libèrent le créneau.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "lessons"
  ADD CONSTRAINT lessons_no_overlap_instructor
  EXCLUDE USING gist (
    "instructorId" WITH =,
    tstzrange("scheduledStart", "scheduledEnd") WITH &&
  )
  WHERE ("status" NOT IN ('ANNULEE_ELEVE', 'ANNULEE_ECOLE'));

ALTER TABLE "lessons"
  ADD CONSTRAINT lessons_no_overlap_vehicle
  EXCLUDE USING gist (
    "vehicleId" WITH =,
    tstzrange("scheduledStart", "scheduledEnd") WITH &&
  )
  WHERE ("status" NOT IN ('ANNULEE_ELEVE', 'ANNULEE_ECOLE') AND "vehicleId" IS NOT NULL);
