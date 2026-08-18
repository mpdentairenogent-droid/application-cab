-- Photo du justificatif (facture/reçu scanné) — même pattern que
-- stock_items.photo_url / sterilization_controls.photo_url. Pas de policy RLS
-- à ajouter : la colonne est couverte par les policies déjà en place sur
-- expenses (0016_rls_finance.sql).
alter table public.expenses add column if not exists photo_url text;
