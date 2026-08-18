-- Types de base.
-- (gen_random_uuid() est disponible nativement depuis PostgreSQL 13, aucune
-- extension pgcrypto/uuid-ossp n'est nécessaire.)

do $$ begin
  create type app_role as enum (
  'assistant',            -- Assistante dentaire
  'collaborator_dentist',  -- Dentiste collaborateur
  'owner_dentist',         -- Dentiste titulaire
  'admin_staff',           -- Secrétariat / administratif
  'accountant',            -- Comptable
  'super_admin'            -- Super administrateur
);
exception when duplicate_object then null;
end $$;

do $$ begin
  create type profile_status as enum ('active', 'inactive');
exception when duplicate_object then null;
end $$;
