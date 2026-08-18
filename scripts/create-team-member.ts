/**
 * Crée un compte réel pour un nouveau membre de l'équipe (§15 "créer
 * utilisateur"). Volontairement un script exécuté à la main (clé
 * service_role) plutôt qu'un écran "Inviter" dans l'app mobile : la clé
 * service_role ne doit jamais être embarquée côté client, et déployer une
 * Edge Function pour porter cette action nécessite Docker (non disponible
 * dans cet environnement). Le compte est actif immédiatement (comme les
 * comptes de démo) puisque seule une personne ayant déjà accès à ce script
 * peut l'exécuter — jamais d'auto-inscription publique dans cette app.
 *
 * Usage : npx tsx scripts/create-team-member.ts <email> <prenom> <nom> <role> [mot_de_passe]
 * Si le mot de passe est omis, un mot de passe temporaire est généré et affiché.
 */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

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

const VALID_ROLES = ['assistant', 'collaborator_dentist', 'owner_dentist', 'admin_staff', 'accountant', 'super_admin'] as const;
type AppRole = (typeof VALID_ROLES)[number];

const [, , email, firstName, lastName, role, providedPassword] = process.argv;

if (!email || !firstName || !lastName || !role) {
  console.error('Usage : npx tsx scripts/create-team-member.ts <email> <prenom> <nom> <role> [mot_de_passe]');
  console.error(`Rôles valides : ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

if (!(VALID_ROLES as readonly string[]).includes(role)) {
  console.error(`Rôle invalide "${role}". Rôles valides : ${VALID_ROLES.join(', ')}`);
  process.exit(1);
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 14; i++) password += chars[Math.floor(Math.random() * chars.length)];
  return password;
}

async function main() {
  const admin = createClient<Database>(url!, serviceKey!, { auth: { autoRefreshToken: false, persistSession: false } });
  const password = providedPassword || generatePassword();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { first_name: firstName, last_name: lastName, role: role as AppRole },
  });

  if (error) {
    console.error(`Échec de la création : ${error.message}`);
    process.exit(1);
  }

  console.log(`Compte créé pour ${firstName} ${lastName} (${email}), rôle ${role}.`);
  console.log(`Mot de passe temporaire : ${password}`);
  console.log(`À communiquer en direct (jamais par email/SMS non chiffré) — à faire changer dès la première connexion via "Mot de passe oublié".`);
  console.log(`ID utilisateur : ${data.user?.id}`);
}

main();
