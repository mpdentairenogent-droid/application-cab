/**
 * Données de référence (§sans compte requis) + comptes de démonstration
 * (§74) + données métier liées, sur un projet Supabase de développement.
 * Rejouable sans erreur ni doublon : tout est vérifié-avant-insertion.
 *
 * Usage : npx tsx scripts/seed-demo.ts
 * Prérequis dans .env.local : EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 *
 * Utilise la clé service_role (bypass RLS) volontairement : c'est un script
 * de développement exécuté à la main par un humain qui a déjà accès complet
 * au projet, jamais du code embarqué dans l'app. Ne JAMAIS lancer ce script
 * contre un projet de production (§73).
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

import { toISODate as isoDate } from '../src/lib/format';
import type { Database } from '../src/types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    'EXPO_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env.local ' +
      "(clé service_role : Project Settings > API sur supabase.com — ne jamais la mettre dans l'app)."
  );
  process.exit(1);
}

const admin = createClient<Database>(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMO_PASSWORD = 'Demo1234!';

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function unwrap<T>(result: { data: T | null; error: { message: string } | null }, label: string): T {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  if (result.data === null) throw new Error(`${label}: réponse vide inattendue`);
  return result.data;
}

// insert/update/upsert sans .select() renvoient data: null par défaut côté
// PostgREST même en cas de succès (Prefer: return=minimal) — unwrap() ferait
// une fausse alerte dessus. checkError() sert exactement ces cas où seul le
// succès de l'opération importe, pas la ligne renvoyée.
function checkError(result: { error: { message: string } | null }, label: string): void {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
}

async function createDemoUser(email: string, meta: { first_name: string; last_name: string; role: Database['public']['Enums']['app_role'] }) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: meta,
  });

  if (error) {
    if (error.message.toLowerCase().includes('already been registered') || error.message.toLowerCase().includes('already exists')) {
      const { data: list, error: listError } = await admin.auth.admin.listUsers();
      if (listError) throw listError;
      const existing = list.users.find((u) => u.email === email);
      if (existing) return existing.id;
    }
    throw error;
  }

  return data.user.id;
}

/** Insère les lignes de `rows` dont la valeur de `key` n'existe pas déjà dans la table. */
async function insertMissing<Row extends Record<string, unknown>>(table: string, key: string, rows: Row[]) {
  const { data: existing, error: fetchError } = await admin.from(table as never).select(key);
  if (fetchError) throw new Error(`lecture ${table}: ${fetchError.message}`);

  const existingValues = new Set((existing as Record<string, unknown>[] | null)?.map((r) => r[key]) ?? []);
  const missing = rows.filter((r) => !existingValues.has(r[key]));
  if (missing.length === 0) return;

  const { error } = await admin.from(table as never).insert(missing as never);
  if (error) throw new Error(`insertion ${table}: ${error.message}`);
}

async function seedReferenceData() {
  console.log('Données de référence (fournisseurs, laboratoires, équipements, stock, check-lists)...');

  checkError(
    await admin
      .from('app_settings')
      .update({ cabinet_name: 'Cabinet Dentaire', primary_color: '#7C9885', secondary_color: '#5B7C99' })
      .eq('id', 1),
    'app_settings'
  );

  await insertMissing('suppliers', 'name', [
    { name: 'Henry Schein', category: 'Consommables dentaires', sales_rep_name: 'Amélie Roux', phone: '0140000001', email: 'contact@henryschein-demo.fr', website: 'https://www.henryschein.fr' },
    { name: 'Straumann', category: 'Implantologie', sales_rep_name: 'Nicolas Blanc', phone: '0140000002', email: 'contact@straumann-demo.fr', website: 'https://www.straumann.fr' },
    { name: 'Airnov Médical', category: 'Stérilisation', sales_rep_name: 'Claire Fontaine', phone: '0140000003', email: 'contact@airnov-demo.fr', website: 'https://www.airnov.fr' },
  ]);

  await insertMissing('laboratories', 'name', [
    { name: 'Laboratoire Dentaire du Centre', phone: '0140000010', email: 'contact@labo-centre-demo.fr', contact_name: 'Marc Dupuis', specialties: 'Prothèses céramo-céramiques, gouttières' },
    { name: 'Ortho Lab Prisme', phone: '0140000011', email: 'contact@orthoprisme-demo.fr', contact_name: 'Sarah Nguyen', specialties: 'Orthodontie, aligneurs' },
  ]);

  await insertMissing('document_categories', 'name', [
    { name: 'Protocoles cliniques', sort_order: 1 },
    { name: 'Stérilisation', sort_order: 2 },
    { name: 'Fiches techniques matériel', sort_order: 3 },
    { name: 'Administratif', sort_order: 4 },
    { name: 'Contacts utiles', sort_order: 5 },
  ]);

  await insertMissing('equipment', 'name', [
    { name: 'Autoclave Salle 1', category: 'Stérilisation', brand: 'Melag', model: 'Vacuclave 44 B', serial_number: 'MEL-2023-0451', status: 'functional', qr_code: 'EQ-AUTOCLAVE-1' },
    { name: 'Autoclave Salle 2', category: 'Stérilisation', brand: 'Melag', model: 'Vacuclave 44 B', serial_number: 'MEL-2023-0452', status: 'functional', qr_code: 'EQ-AUTOCLAVE-2' },
    { name: 'Fauteuil Salle 1', category: 'Fauteuil', brand: 'Sirona', model: 'Intego', serial_number: 'SIR-2021-1187', status: 'functional', qr_code: 'EQ-FAUTEUIL-1' },
    { name: 'Fauteuil Salle 2', category: 'Fauteuil', brand: 'Sirona', model: 'Intego', serial_number: 'SIR-2021-1188', status: 'to_monitor', qr_code: 'EQ-FAUTEUIL-2' },
    { name: 'Panoramique', category: 'Radiologie', brand: 'Carestream', model: 'CS 8100', serial_number: 'CAR-2020-0093', status: 'functional', qr_code: 'EQ-PANORAMIQUE-1' },
    { name: 'Compresseur', category: 'Technique', brand: 'Cattani', model: 'AC300', serial_number: 'CAT-2019-0027', status: 'functional', qr_code: 'EQ-COMPRESSEUR-1' },
  ]);

  await insertMissing('stock_items', 'name', [
    { name: 'Gants nitrile taille S', category: 'Consommables', reference: 'GAN-S-100', quantity: 4, unit: 'boîte', minimum_quantity: 5, location: 'Réserve principale', unit_price: 6.9 },
    { name: 'Gants nitrile taille M', category: 'Consommables', reference: 'GAN-M-100', quantity: 12, unit: 'boîte', minimum_quantity: 5, location: 'Réserve principale', unit_price: 6.9 },
    { name: 'Champs stérilisation', category: 'Stérilisation', reference: 'CHP-STE-50', quantity: 20, unit: 'paquet', minimum_quantity: 8, location: 'Salle de stérilisation', unit_price: 14.5, expiry_date: '2026-09-15' },
    { name: 'Anesthésique articaïne', category: 'Consommables', reference: 'ANE-ART-50', quantity: 6, unit: 'boîte', minimum_quantity: 4, location: 'Armoire salle 1', unit_price: 32.0, expiry_date: '2026-08-30' },
    { name: 'Composite universel A2', category: 'Consommables', reference: 'COMP-A2', quantity: 3, unit: 'seringue', minimum_quantity: 2, location: 'Armoire salle 1', unit_price: 18.2, expiry_date: '2027-03-01' },
    { name: 'Sachets de stérilisation', category: 'Stérilisation', reference: 'SACH-STE-200', quantity: 2, unit: 'boîte', minimum_quantity: 3, location: 'Salle de stérilisation', unit_price: 22.0 },
  ]);

  await insertMissing('checklist_templates', 'name', [
    {
      name: 'Ouverture du cabinet',
      category: 'opening',
      items: [
        { id: '1', label: 'Allumer les équipements (fauteuils, compresseur, aspiration)' },
        { id: '2', label: 'Vérifier le stock de gants et champs' },
        { id: '3', label: 'Contrôler les autoclaves (voyants, niveau d\'eau)' },
        { id: '4', label: 'Préparer les salles de soin' },
      ],
    },
    {
      name: 'Fermeture du cabinet',
      category: 'closing',
      items: [
        { id: '1', label: 'Nettoyer et désinfecter les salles' },
        { id: '2', label: 'Lancer le dernier cycle de stérilisation' },
        { id: '3', label: 'Vérifier les rendez-vous du lendemain' },
        { id: '4', label: 'Éteindre les équipements et sécuriser le cabinet' },
      ],
    },
  ]);
}

async function main() {
  await seedReferenceData();

  console.log('Création des comptes de démonstration...');

  const ownerId = await createDemoUser('titulaire@cabinet-demo.fr', { first_name: 'Sophie', last_name: 'Lambert', role: 'owner_dentist' });
  const collab1Id = await createDemoUser('collaborateur@cabinet-demo.fr', { first_name: 'Paul', last_name: 'Martin', role: 'collaborator_dentist' });
  const collab2Id = await createDemoUser('collaborateur2@cabinet-demo.fr', { first_name: 'Julie', last_name: 'Petit', role: 'collaborator_dentist' });
  const assistantId = await createDemoUser('assistante@cabinet-demo.fr', { first_name: 'Marie', last_name: 'Dubois', role: 'assistant' });

  console.log('Création des praticiens et association aux comptes...');

  await insertMissing('practitioners', 'last_name', [
    { first_name: 'Sophie', last_name: 'Lambert', color: '#7C9885' },
    { first_name: 'Paul', last_name: 'Martin', color: '#5B7C99' },
    { first_name: 'Julie', last_name: 'Petit', color: '#C9A66B' },
  ]);

  const practitioners = unwrap(await admin.from('practitioners').select('*'), 'lecture practitioners');

  const ownerPractitioner = practitioners.find((p) => p.last_name === 'Lambert')!;
  const collab1Practitioner = practitioners.find((p) => p.last_name === 'Martin')!;
  const collab2Practitioner = practitioners.find((p) => p.last_name === 'Petit')!;

  checkError(await admin.from('profiles').update({ practitioner_id: ownerPractitioner.id }).eq('id', ownerId), 'lien profil titulaire');
  checkError(await admin.from('profiles').update({ practitioner_id: collab1Practitioner.id }).eq('id', collab1Id), 'lien profil collaborateur 1');
  checkError(await admin.from('profiles').update({ practitioner_id: collab2Practitioner.id }).eq('id', collab2Id), 'lien profil collaborateur 2');

  console.log('Insertion des données métier de démonstration...');

  const monthStart = isoDate(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  checkError(
    await admin.from('revenue_entries').upsert(
      [
        { practitioner_id: ownerPractitioner.id, entry_date: isoDate(daysAgo(0)), amount: 1850, patient_count: 9, created_by: ownerId },
        { practitioner_id: ownerPractitioner.id, entry_date: isoDate(daysAgo(1)), amount: 2100, patient_count: 11, created_by: ownerId },
        { practitioner_id: collab1Practitioner.id, entry_date: isoDate(daysAgo(0)), amount: 980, patient_count: 6, created_by: ownerId },
        { practitioner_id: collab1Practitioner.id, entry_date: isoDate(daysAgo(1)), amount: 1120, patient_count: 7, created_by: ownerId },
        { practitioner_id: collab2Practitioner.id, entry_date: isoDate(daysAgo(0)), amount: 890, patient_count: 5, created_by: ownerId },
      ],
      { onConflict: 'practitioner_id,entry_date' }
    ),
    'revenue_entries'
  );

  checkError(
    await admin.from('financial_targets').upsert(
      [
        { practitioner_id: null, period_type: 'monthly', period_start: monthStart, target_amount: 80000 },
        { practitioner_id: collab1Practitioner.id, period_type: 'monthly', period_start: monthStart, target_amount: 18000 },
        { practitioner_id: collab2Practitioner.id, period_type: 'monthly', period_start: monthStart, target_amount: 15000 },
      ],
      { onConflict: 'practitioner_id,period_type,period_start' }
    ),
    'financial_targets'
  );

  await insertMissing('expenses', 'comment', [
    { expense_date: isoDate(daysAgo(3)), amount: 420, category: 'consumables', comment: 'Commande gants + champs', created_by: ownerId },
    { expense_date: isoDate(daysAgo(10)), amount: 1200, category: 'maintenance', comment: 'Révision autoclave salle 1', created_by: ownerId },
  ]);

  // Un insert groupé doit donner exactement les mêmes clés à chaque ligne :
  // PostgREST envoie un null explicite (pas une omission) pour les clés
  // absentes d'une ligne donnée dès qu'une autre ligne du même lot les
  // fournit, ce qui contourne les valeurs par défaut (DEFAULT false, etc.)
  // et viole les contraintes NOT NULL. D'où assigned_to_all/pinned partout.
  await insertMissing('tasks', 'title', [
    { title: 'Commander gants taille S', description: 'Stock sous le seuil minimum', created_by: assistantId, responsible_id: assistantId, assigned_to_all: false, priority: 'high', status: 'todo', due_date: isoDate(new Date()) },
    { title: 'Réunion équipe', description: 'Point hebdomadaire', created_by: ownerId, responsible_id: null, assigned_to_all: true, priority: 'normal', status: 'todo', due_date: isoDate(daysAgo(-3)) },
    { title: 'Contrôler stock composite', description: null, created_by: assistantId, responsible_id: assistantId, assigned_to_all: false, priority: 'normal', status: 'in_progress', due_date: null },
  ]);

  await insertMissing('post_its', 'body', [
    { body: 'Ne pas utiliser autoclave 2, en cours de vérification', author_id: assistantId, recipient_type: 'team', color: '#F8D7DA', priority: 'high', pinned: true },
    { body: 'Technicien fauteuil prévu mardi 10h', author_id: ownerId, recipient_type: 'team', color: '#FFF3CD', priority: 'normal', pinned: false },
  ]);

  // Idempotence sur "au moins un mouvement existe déjà", pas "un mouvement
  // existe aujourd'hui" : ce script peut être relancé plusieurs jours de
  // suite (démo, tests) et chaque mouvement décrémente réellement le stock
  // via le trigger apply_stock_movement — vérifier seulement "aujourd'hui"
  // laisserait la quantité continuer à baisser à chaque nouveau jour.
  const lowStockItems = unwrap(await admin.from('stock_items').select('id, name, quantity, minimum_quantity'), 'lecture stock_items');
  const todayStr = isoDate(new Date());
  for (const item of lowStockItems) {
    if (item.quantity > item.minimum_quantity) continue;
    const existingMovement = unwrap(
      await admin.from('stock_movements').select('id').eq('stock_item_id', item.id),
      `lecture stock_movements pour ${item.name}`
    );
    if (existingMovement.length > 0) continue;
    checkError(
      await admin.from('stock_movements').insert({ stock_item_id: item.id, movement_type: 'out', quantity: 1, reason: 'Utilisation quotidienne', user_id: assistantId }),
      `stock_movements pour ${item.name}`
    );
  }

  const autoclaves = unwrap(await admin.from('equipment').select('id, name').ilike('name', 'Autoclave%'), 'lecture equipment (autoclaves)');
  for (const eq of autoclaves) {
    const existingCycle = unwrap(
      await admin.from('sterilization_cycles').select('id').eq('equipment_id', eq.id),
      `lecture sterilization_cycles pour ${eq.name}`
    );
    if (existingCycle.length > 0) continue;
    checkError(
      await admin.from('sterilization_cycles').insert({
        equipment_id: eq.id,
        cycle_number: `C-${Math.floor(Math.random() * 9000 + 1000)}`,
        program: '134°C - 18min',
        performed_by: assistantId,
        batch_number: `LOT-${todayStr}`,
        result: 'conforming',
        performed_at: new Date().toISOString(),
      }),
      `sterilization_cycles pour ${eq.name}`
    );
  }

  const { data: fauteuil2, error: fauteuil2Error } = await admin.from('equipment').select('id').eq('name', 'Fauteuil Salle 2').maybeSingle();
  if (fauteuil2Error) throw new Error(`lecture equipment (Fauteuil Salle 2): ${fauteuil2Error.message}`);
  if (fauteuil2) {
    await insertMissing('breakdowns', 'description', [
      { equipment_id: fauteuil2.id, description: 'Bruit anormal au réglage de hauteur', reported_by: assistantId, urgency: 'normal', status: 'reported' },
    ]);
  }

  console.log('\nComptes de démonstration prêts (mot de passe unique : Demo1234!) :');
  console.log('  Titulaire      titulaire@cabinet-demo.fr');
  console.log('  Collaborateur  collaborateur@cabinet-demo.fr');
  console.log('  Collaborateur  collaborateur2@cabinet-demo.fr');
  console.log('  Assistante     assistante@cabinet-demo.fr');
}

main()
  .then(() => {
    console.log('\nSeed terminé.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Échec du seed :', error);
    process.exit(1);
  });
