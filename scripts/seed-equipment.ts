/**
 * Insère la liste d'équipements réels du cabinet (demandée après la purge des
 * données de démo, la table `equipment` est vide). Script à usage unique,
 * exécuté à la main — pas de dépendance sur un compte particulier (la table
 * equipment n'a pas de colonne created_by).
 *
 * Usage : npx tsx scripts/seed-equipment.ts
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

import type { Database } from '../src/types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('EXPO_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY sont requis dans .env.local.');
  process.exit(1);
}

const EQUIPMENT = [
  { name: 'Autoclave', category: 'Stérilisation' },
  { name: 'Thermosoudeuse', category: 'Stérilisation' },
  { name: 'Icare', category: 'Stérilisation' },
  { name: 'Thermolaveur', category: 'Stérilisation' },
  { name: 'Aspiration', category: 'Technique' },
  { name: 'Compresseur', category: 'Technique' },
  { name: 'Panoramique', category: 'Radiologie' },
  { name: 'Développeur radio', category: 'Radiologie' },
  { name: 'Fauteuil 1', category: 'Fauteuil' },
  { name: 'Fauteuil 2', category: 'Fauteuil' },
  { name: 'Fauteuil 3', category: 'Fauteuil' },
  { name: 'Tube radio 1', category: 'Radiologie' },
  { name: 'Tube radio 2', category: 'Radiologie' },
  { name: 'Tube radio 3', category: 'Radiologie' },
] as const;

async function main() {
  const admin = createClient<Database>(url!, serviceKey!, { auth: { autoRefreshToken: false, persistSession: false } });

  const rows = EQUIPMENT.map((item) => ({ name: item.name, category: item.category, status: 'functional' as const }));
  const { data, error } = await admin.from('equipment').insert(rows).select('id, name, category');

  if (error) {
    console.error("Échec de l'insertion :", error.message);
    process.exit(1);
  }

  console.log(`${data.length} équipements créés :`);
  for (const row of data) console.log(`  - ${row.name} (${row.category})`);
}

main();
