-- Données de référence pour le développement local (exécuté automatiquement
-- par `supabase db reset`). Ne dépend d'aucun compte utilisateur : les
-- comptes de démonstration et les données qui leur sont liées (tâches,
-- CA, stock initial...) sont créés séparément par scripts/seed-demo.ts, qui
-- doit passer par l'API Admin Supabase pour créer de vrais comptes Auth.
--
-- Ce fichier ne doit JAMAIS être exécuté contre un projet de production.

update public.app_settings
set cabinet_name = 'Cabinet Dentaire', -- à personnaliser dans Paramètres après la première connexion
    primary_color = '#7C9885',
    secondary_color = '#5B7C99'
where id = 1;

insert into public.suppliers (name, category, sales_rep_name, phone, email, website) values
  ('Henry Schein', 'Consommables dentaires', 'Amélie Roux', '0140000001', 'contact@henryschein-demo.fr', 'https://www.henryschein.fr'),
  ('Straumann', 'Implantologie', 'Nicolas Blanc', '0140000002', 'contact@straumann-demo.fr', 'https://www.straumann.fr'),
  ('Airnov Médical', 'Stérilisation', 'Claire Fontaine', '0140000003', 'contact@airnov-demo.fr', 'https://www.airnov.fr');

insert into public.laboratories (name, phone, email, contact_name, specialties) values
  ('Laboratoire Dentaire du Centre', '0140000010', 'contact@labo-centre-demo.fr', 'Marc Dupuis', 'Prothèses céramo-céramiques, gouttières'),
  ('Ortho Lab Prisme', '0140000011', 'contact@orthoprisme-demo.fr', 'Sarah Nguyen', 'Orthodontie, aligneurs');

insert into public.document_categories (name, sort_order) values
  ('Protocoles cliniques', 1),
  ('Stérilisation', 2),
  ('Fiches techniques matériel', 3),
  ('Administratif', 4),
  ('Contacts utiles', 5);

insert into public.equipment (name, category, brand, model, serial_number, status, qr_code) values
  ('Autoclave Salle 1', 'Stérilisation', 'Melag', 'Vacuclave 44 B', 'MEL-2023-0451', 'functional', 'EQ-AUTOCLAVE-1'),
  ('Autoclave Salle 2', 'Stérilisation', 'Melag', 'Vacuclave 44 B', 'MEL-2023-0452', 'functional', 'EQ-AUTOCLAVE-2'),
  ('Fauteuil Salle 1', 'Fauteuil', 'Sirona', 'Intego', 'SIR-2021-1187', 'functional', 'EQ-FAUTEUIL-1'),
  ('Fauteuil Salle 2', 'Fauteuil', 'Sirona', 'Intego', 'SIR-2021-1188', 'to_monitor', 'EQ-FAUTEUIL-2'),
  ('Panoramique', 'Radiologie', 'Carestream', 'CS 8100', 'CAR-2020-0093', 'functional', 'EQ-PANORAMIQUE-1'),
  ('Compresseur', 'Technique', 'Cattani', 'AC300', 'CAT-2019-0027', 'functional', 'EQ-COMPRESSEUR-1');

insert into public.stock_items (name, category, reference, quantity, unit, minimum_quantity, location, unit_price, expiry_date) values
  ('Gants nitrile taille S', 'Consommables', 'GAN-S-100', 4, 'boîte', 5, 'Réserve principale', 6.90, null),
  ('Gants nitrile taille M', 'Consommables', 'GAN-M-100', 12, 'boîte', 5, 'Réserve principale', 6.90, null),
  ('Champs stérilisation', 'Stérilisation', 'CHP-STE-50', 20, 'paquet', 8, 'Salle de stérilisation', 14.50, '2026-09-15'),
  ('Anesthésique articaïne', 'Consommables', 'ANE-ART-50', 6, 'boîte', 4, 'Armoire salle 1', 32.00, '2026-08-30'),
  ('Composite universel A2', 'Consommables', 'COMP-A2', 3, 'seringue', 2, 'Armoire salle 1', 18.20, '2027-03-01'),
  ('Sachets de stérilisation', 'Stérilisation', 'SACH-STE-200', 2, 'boîte', 3, 'Salle de stérilisation', 22.00, null);

insert into public.checklist_templates (name, category, items) values
  ('Ouverture du cabinet', 'opening', '[
    {"id":"1","label":"Allumer les équipements (fauteuils, compresseur, aspiration)"},
    {"id":"2","label":"Vérifier le stock de gants et champs"},
    {"id":"3","label":"Contrôler les autoclaves (voyants, niveau d''eau)"},
    {"id":"4","label":"Préparer les salles de soin"}
  ]'::jsonb),
  ('Fermeture du cabinet', 'closing', '[
    {"id":"1","label":"Nettoyer et désinfecter les salles"},
    {"id":"2","label":"Lancer le dernier cycle de stérilisation"},
    {"id":"3","label":"Vérifier les rendez-vous du lendemain"},
    {"id":"4","label":"Éteindre les équipements et sécuriser le cabinet"}
  ]'::jsonb);
