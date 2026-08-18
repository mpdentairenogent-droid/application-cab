import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

import { PGlite } from '@electric-sql/pglite';

const MIGRATIONS_DIR = join(__dirname, '../../supabase/migrations');

/**
 * Migrations qui dépendent d'extensions propres à l'hébergement Supabase
 * (pg_net, etc.) et absentes de PGlite (build Postgres minimal pour les
 * tests). Elles n'ajoutent aucune table/policy RLS à vérifier ici — seulement
 * un trigger de livraison HTTP — donc les exclure ne réduit pas la couverture
 * des tests de permissions (§75). Ajouter ici toute future migration dans le
 * même cas plutôt que de casser toute la suite.
 */
const SKIP_ON_PGLITE = new Set(['0020_push_notification_delivery.sql', '0022_attachments_storage.sql']);

/**
 * Stand-in minimal pour le schéma "auth" de Supabase (GoTrue), suffisant pour
 * exécuter nos migrations et policies RLS : une table auth.users assez large
 * pour le trigger handle_new_user, et une fonction auth.uid() qui lit le
 * même paramètre de session ("request.jwt.claims") que le vrai auth.uid()
 * en production — donc les policies testées ici sont EXACTEMENT celles qui
 * tournent contre un vrai projet Supabase, pas une réimplémentation.
 */
const AUTH_SHIM = `
  create schema if not exists auth;

  create table auth.users (
    id uuid primary key default gen_random_uuid(),
    raw_user_meta_data jsonb not null default '{}'::jsonb
  );

  create or replace function auth.uid() returns uuid
  language sql stable
  as $$
    select (nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub')::uuid;
  $$;

  create role authenticated;
  create role anon;
`;

export async function createTestDb() {
  const db = new PGlite();

  await db.exec(AUTH_SHIM);

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql') && !SKIP_ON_PGLITE.has(f))
    .sort();

  for (const file of files) {
    const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');
    try {
      await db.exec(sql);
    } catch (error) {
      throw new Error(`Migration ${file} a échoué : ${(error as Error).message}`);
    }
  }

  // Les policies RLS "to authenticated" ne s'appliquent qu'aux requêtes
  // exécutées par PostgREST sous ce rôle — nos requêtes de test doivent donc
  // GRANT les mêmes privilèges de table que Supabase accorde par défaut.
  // Comme dans un vrai projet Supabase : les GRANT globaux sont larges, c'est
  // RLS qui porte réellement la restriction (voir §17). On accorde donc les
  // mêmes droits à "anon" pour que le test anonyme échoue à cause de RLS
  // (0 ligne), pas d'une erreur de droits qui masquerait la vraie policy.
  await db.exec(`
    grant usage on schema public to authenticated, anon;
    grant all on all tables in schema public to authenticated, anon;
    grant all on all sequences in schema public to authenticated, anon;
    grant execute on all functions in schema public to authenticated, anon;
  `);

  return db;
}

/** Simule une requête authentifiée comme le ferait PostgREST pour un JWT donné. */
export async function asUser<T>(db: PGlite, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec('begin');
  try {
    if (userId) {
      await db.exec(`set local role authenticated;`);
      await db.query(`select set_config('request.jwt.claims', $1, true);`, [JSON.stringify({ sub: userId, role: 'authenticated' })]);
    } else {
      await db.exec(`set local role anon;`);
    }
    const result = await fn();
    await db.exec('rollback');
    return result;
  } catch (error) {
    await db.exec('rollback');
    throw error;
  }
}

/** Comme asUser, mais conserve les écritures (commit) — pour préparer des fixtures. */
export async function asUserCommit<T>(db: PGlite, userId: string | null, fn: () => Promise<T>): Promise<T> {
  await db.exec('begin');
  if (userId) {
    await db.exec(`set local role authenticated;`);
    await db.query(`select set_config('request.jwt.claims', $1, true);`, [JSON.stringify({ sub: userId, role: 'authenticated' })]);
  } else {
    await db.exec(`set local role anon;`);
  }
  const result = await fn();
  await db.exec('commit');
  return result;
}
