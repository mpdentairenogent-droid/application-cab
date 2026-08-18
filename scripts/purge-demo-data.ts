/**
 * Purge toutes les données de démo (tables métier) et remplace les comptes
 * de démo par un compte titulaire réel. Fournisseurs/laboratoires, catalogue
 * de permissions et réglages du cabinet sont volontairement conservés (voir
 * mémoire projet — l'utilisateur a choisi de garder les fournisseurs/labos
 * comme point de départ éditable). IRRÉVERSIBLE — script à usage unique,
 * exécuté à la main sur demande explicite de l'utilisateur, jamais depuis
 * l'app.
 *
 * Usage : npx tsx scripts/purge-demo-data.ts
 * Prérequis dans .env.local : EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
 * Prérequis en variable d'environnement : SUPABASE_DB_PASSWORD.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';
import { Client } from 'pg';

import type { Database } from '../src/types/database';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbPassword = process.env.SUPABASE_DB_PASSWORD;

if (!url || !serviceKey || !dbPassword) {
  console.error('EXPO_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (.env.local) et SUPABASE_DB_PASSWORD (env) sont requis.');
  process.exit(1);
}

// Tout ce qui est donnée métier / de démo. Volontairement absents : laboratories,
// suppliers, app_settings, permissions, role_permissions (conservés), et profiles
// (géré via la suppression des comptes auth, qui cascade dessus).
const PURGE_TABLES = [
  'document_categories',
  'documents',
  'document_favorites',
  'checklist_templates',
  'checklist_entries',
  'internal_events',
  'absences',
  'practitioners',
  'user_permissions',
  'material_requests',
  'material_request_items',
  'orders',
  'order_items',
  'stock_items',
  'stock_movements',
  'tasks',
  'task_assignments',
  'post_its',
  'internal_messages',
  'message_acknowledgements',
  'revenue_entries',
  'revenue_entry_details',
  'financial_targets',
  'expenses',
  'notifications',
  'notification_preferences',
  'device_tokens',
  'audit_logs',
  'equipment',
  'maintenance_records',
  'breakdowns',
  'sterilization_cycles',
  'sterilization_incidents',
  'sterilization_incident_notifications',
  'sterilization_controls',
];

const NEW_OWNER = {
  email: 'dr.moslahkamel@gmail.com',
  first_name: 'Moslah',
  last_name: 'Kamel',
  role: 'owner_dentist' as const,
};

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 14; i++) password += chars[Math.floor(Math.random() * chars.length)];
  return password;
}

async function main() {
  const admin = createClient<Database>(url!, serviceKey!, { auth: { autoRefreshToken: false, persistSession: false } });

  const pgClient = new Client({
    connectionString: `postgresql://postgres.wkallvenuvgtjfubhutz:${dbPassword}@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`,
    ssl: { rejectUnauthorized: false },
  });
  await pgClient.connect();
  try {
    const tableList = PURGE_TABLES.map((t) => `public.${t}`).join(', ');
    console.log(`Purge de ${PURGE_TABLES.length} tables métier...`);
    await pgClient.query(`TRUNCATE TABLE ${tableList} RESTART IDENTITY CASCADE;`);
    console.log('Tables métier vidées.');
  } finally {
    await pgClient.end();
  }

  const { data: existingUsers, error: listError } = await admin.auth.admin.listUsers();
  if (listError) throw listError;
  for (const user of existingUsers.users) {
    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
    if (deleteError) throw deleteError;
    console.log(`Compte de démo supprimé : ${user.email}`);
  }

  const password = generatePassword();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: NEW_OWNER.email,
    password,
    email_confirm: true,
    user_metadata: { first_name: NEW_OWNER.first_name, last_name: NEW_OWNER.last_name, role: NEW_OWNER.role },
  });
  if (createError) throw createError;

  console.log('\n=== Purge terminée ===');
  console.log(`Nouveau compte : ${NEW_OWNER.first_name} ${NEW_OWNER.last_name} <${NEW_OWNER.email}>`);
  console.log(`Mot de passe temporaire : ${password}`);
  console.log(`ID utilisateur : ${created.user?.id}`);
}

main().catch((error) => {
  console.error('Échec de la purge :', error);
  process.exit(1);
});
