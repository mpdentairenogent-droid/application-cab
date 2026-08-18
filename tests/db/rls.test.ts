import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { asUser, asUserCommit, createTestDb } from './setupDb';

type AppRole = 'assistant' | 'collaborator_dentist' | 'owner_dentist' | 'admin_staff' | 'accountant' | 'super_admin';

// L'insertion dans auth.users déclenche handle_new_user (0003_auth_trigger.sql),
// qui crée la ligne profiles à partir des métadonnées — exactement le chemin
// emprunté par un vrai signup, plutôt qu'un insert manuel dans profiles qui
// entrerait en conflit avec ce que le trigger vient de créer.
async function insertPerson(db: PGlite, role: AppRole, firstName: string, lastName: string) {
  const result = await db.query<{ id: string }>(
    'insert into auth.users (raw_user_meta_data) values ($1) returning id',
    [JSON.stringify({ first_name: firstName, last_name: lastName, role })]
  );
  return result.rows[0].id;
}

async function insertPractitioner(db: PGlite, firstName: string, lastName: string) {
  const result = await db.query<{ id: string }>('insert into public.practitioners (first_name, last_name) values ($1, $2) returning id', [firstName, lastName]);
  return result.rows[0].id;
}

describe('Séparation des permissions (§75)', () => {
  let db: PGlite;

  let ownerId: string;
  let collab1Id: string;
  let collab2Id: string;
  let assistantId: string;
  let accountantId: string;

  let ownerPractitionerId: string;
  let collab1PractitionerId: string;
  let collab2PractitionerId: string;

  beforeAll(async () => {
    db = await createTestDb();

    ownerId = await insertPerson(db, 'owner_dentist', 'Sophie', 'Lambert');
    collab1Id = await insertPerson(db, 'collaborator_dentist', 'Paul', 'Martin');
    collab2Id = await insertPerson(db, 'collaborator_dentist', 'Julie', 'Petit');
    assistantId = await insertPerson(db, 'assistant', 'Marie', 'Dubois');
    accountantId = await insertPerson(db, 'accountant', 'Claire', 'Verdier');

    ownerPractitionerId = await insertPractitioner(db, 'Sophie', 'Lambert');
    collab1PractitionerId = await insertPractitioner(db, 'Paul', 'Martin');
    collab2PractitionerId = await insertPractitioner(db, 'Julie', 'Petit');

    await db.query('update public.profiles set practitioner_id = $1 where id = $2', [ownerPractitionerId, ownerId]);
    await db.query('update public.profiles set practitioner_id = $1 where id = $2', [collab1PractitionerId, collab1Id]);
    await db.query('update public.profiles set practitioner_id = $1 where id = $2', [collab2PractitionerId, collab2Id]);

    await db.query(
      `insert into public.revenue_entries (practitioner_id, entry_date, amount, created_by) values
        ($1, current_date, 2500, $4),
        ($2, current_date, 1000, $4),
        ($3, current_date, 800, $4)`,
      [ownerPractitionerId, collab1PractitionerId, collab2PractitionerId, ownerId]
    );

    await db.query(
      `insert into public.financial_targets (practitioner_id, period_type, period_start, target_amount) values
        (null, 'monthly', date_trunc('month', current_date), 80000),
        ($1, 'monthly', date_trunc('month', current_date), 18000)`,
      [collab1PractitionerId]
    );

    await db.query(`insert into public.expenses (amount, category, created_by) values (420, 'consumables', $1)`, [ownerId]);

    await db.query(`insert into public.stock_items (name, quantity, minimum_quantity) values ('Gants M', 10, 5)`);
    await db.query(`insert into public.stock_categories (name, color) values ('Consommables', '#5FA777')`);
  });

  afterAll(async () => {
    await db.close();
  });

  describe('Assistante dentaire', () => {
    it("n'obtient aucune ligne de chiffre d'affaires", async () => {
      const rows = await asUser(db, assistantId, async () => (await db.query('select * from public.revenue_entries')).rows);
      expect(rows).toHaveLength(0);
    });

    it("n'obtient aucune dépense", async () => {
      const rows = await asUser(db, assistantId, async () => (await db.query('select * from public.expenses')).rows);
      expect(rows).toHaveLength(0);
    });

    it('ne peut pas insérer de chiffre d\'affaires même en appelant directement l\'API', async () => {
      await asUser(db, assistantId, async () => {
        await expect(
          db.query('insert into public.revenue_entries (practitioner_id, entry_date, amount) values ($1, current_date, 5000)', [collab1PractitionerId])
        ).rejects.toThrow();
      });
    });

    it("n'a aucune permission financière dans my_permissions()", async () => {
      const rows = await asUser(db, assistantId, async () => (await db.query('select permission_code from public.my_permissions()')).rows as { permission_code: string }[]);
      const codes = rows.map((r) => r.permission_code);
      expect(codes).not.toContain('view_own_revenue');
      expect(codes).not.toContain('view_all_revenue');
      expect(codes).not.toContain('view_accounting');
      expect(codes).not.toContain('view_expenses');
    });

    it('conserve son accès opérationnel (stock)', async () => {
      const rows = await asUser(db, assistantId, async () => (await db.query('select * from public.stock_items')).rows);
      expect(rows.length).toBeGreaterThan(0);
    });

    it('voit les catégories de stock (view_stock)', async () => {
      const rows = await asUser(db, assistantId, async () => (await db.query('select * from public.stock_categories')).rows);
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe('Dentiste collaborateur', () => {
    it('ne voit que sa propre ligne de chiffre d\'affaires', async () => {
      const rows = await asUser(db, collab1Id, async () => (await db.query('select * from public.revenue_entries')).rows as { practitioner_id: string }[]);
      expect(rows).toHaveLength(1);
      expect(rows[0].practitioner_id).toBe(collab1PractitionerId);
    });

    it("changer l'identifiant de praticien dans la requête ne renvoie pas les données d'un autre", async () => {
      const rows = await asUser(db, collab1Id, async () =>
        (await db.query('select * from public.revenue_entries where practitioner_id = $1', [collab2PractitionerId])).rows
      );
      expect(rows).toHaveLength(0);
    });

    it('ne peut pas modifier son propre chiffre d\'affaires (manage_revenue non accordé par défaut)', async () => {
      await asUser(db, collab1Id, async () => {
        const before = await db.query('update public.revenue_entries set amount = 99999 where practitioner_id = $1', [collab1PractitionerId]);
        expect(before.affectedRows ?? 0).toBe(0);
      });
    });

    it("ne voit que son propre objectif, pas l'objectif global du cabinet ni celui d'un autre praticien", async () => {
      const rows = await asUser(db, collab1Id, async () => (await db.query('select * from public.financial_targets')).rows as { practitioner_id: string }[]);
      expect(rows).toHaveLength(1);
      expect(rows[0].practitioner_id).toBe(collab1PractitionerId);
    });

    it('voit les catégories de stock (view_stock) mais ne peut pas en créer (manage_stock non accordé par défaut)', async () => {
      await asUser(db, collab1Id, async () => {
        const rows = (await db.query('select * from public.stock_categories')).rows;
        expect(rows.length).toBeGreaterThan(0);
        await expect(db.query(`insert into public.stock_categories (name) values ('Radiologie')`)).rejects.toThrow();
      });
    });
  });

  describe('Dentiste titulaire', () => {
    it("voit le chiffre d'affaires de tous les praticiens", async () => {
      const rows = await asUser(db, ownerId, async () => (await db.query('select * from public.revenue_entries')).rows);
      expect(rows).toHaveLength(3);
    });

    it('peut saisir du chiffre d\'affaires', async () => {
      await asUser(db, ownerId, async () => {
        const result = await db.query('insert into public.revenue_entries (practitioner_id, entry_date, amount) values ($1, current_date - 1, 1500)', [ownerPractitionerId]);
        expect(result.affectedRows).toBe(1);
      });
    });

    it('voit les dépenses et la comptabilité', async () => {
      const rows = await asUser(db, ownerId, async () => (await db.query('select * from public.expenses')).rows);
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe('Comptable (aucune permission par défaut)', () => {
    it("n'a par défaut aucune permission financière ni opérationnelle", async () => {
      const rows = await asUser(db, accountantId, async () => (await db.query('select permission_code from public.my_permissions()')).rows);
      expect(rows).toHaveLength(0);
    });

    it("n'obtient aucune ligne de dépenses avant autorisation explicite", async () => {
      const rows = await asUser(db, accountantId, async () => (await db.query('select * from public.expenses')).rows);
      expect(rows).toHaveLength(0);
    });

    it('obtient les dépenses une fois view_expenses accordé explicitement par le titulaire', async () => {
      await asUserCommit(db, ownerId, async () => {
        await db.query(
          `insert into public.user_permissions (user_id, permission_code, granted, updated_by) values ($1, 'view_expenses', true, $2)`,
          [accountantId, ownerId]
        );
      });

      const rows = await asUser(db, accountantId, async () => (await db.query('select * from public.expenses')).rows);
      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe('Élévation de privilège', () => {
    it('une assistante ne peut pas se promouvoir titulaire elle-même', async () => {
      await asUser(db, assistantId, async () => {
        await expect(db.query(`update public.profiles set role = 'owner_dentist' where id = $1`, [assistantId])).rejects.toThrow();
      });
    });

    it('une assistante peut modifier un champ non sensible de son propre profil', async () => {
      await asUser(db, assistantId, async () => {
        const result = await db.query(`update public.profiles set phone = '0600000000' where id = $1`, [assistantId]);
        expect(result.affectedRows).toBe(1);
      });
    });
  });

  describe('Compte désactivé', () => {
    it('perd tout accès, y compris opérationnel, une fois désactivé', async () => {
      await db.query(`update public.profiles set status = 'inactive' where id = $1`, [assistantId]);

      const rows = await asUser(db, assistantId, async () => (await db.query('select * from public.stock_items')).rows);
      expect(rows).toHaveLength(0);

      await db.query(`update public.profiles set status = 'active' where id = $1`, [assistantId]);
    });
  });

  describe('Journal d\'audit', () => {
    it('enregistre le changement de rôle et reste invisible sans permission view_audit_logs', async () => {
      await asUserCommit(db, ownerId, async () => {
        await db.query(`update public.profiles set role = 'admin_staff' where id = $1`, [collab2Id]);
        await db.query(`update public.profiles set role = 'collaborator_dentist' where id = $1`, [collab2Id]);
      });

      const asAssistant = await asUser(db, assistantId, async () => (await db.query('select * from public.audit_logs')).rows);
      expect(asAssistant).toHaveLength(0);

      const asOwner = await asUser(db, ownerId, async () =>
        (await db.query(`select * from public.audit_logs where entity_type = 'profiles' and entity_id = $1`, [collab2Id])).rows
      );
      expect(asOwner.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Trigger de création de profil', () => {
    it('crée automatiquement un profil à l\'insertion dans auth.users', async () => {
      const result = await db.query<{ id: string }>(
        `insert into auth.users (raw_user_meta_data) values ($1) returning id`,
        [JSON.stringify({ first_name: 'Nouvel', last_name: 'Utilisateur', role: 'assistant' })]
      );
      const newId = result.rows[0].id;

      const profile = await db.query('select * from public.profiles where id = $1', [newId]);
      expect(profile.rows).toHaveLength(1);
      expect((profile.rows[0] as { role: string }).role).toBe('assistant');
    });

    it("ne crée pas de fiche praticien pour un rôle non-dentiste (assistant)", async () => {
      const result = await db.query<{ id: string }>(
        `insert into auth.users (raw_user_meta_data) values ($1) returning id`,
        [JSON.stringify({ first_name: 'Sans', last_name: 'Praticien', role: 'assistant' })]
      );
      const profile = await db.query<{ practitioner_id: string | null }>('select practitioner_id from public.profiles where id = $1', [result.rows[0].id]);
      expect(profile.rows[0].practitioner_id).toBeNull();
    });

    it('crée et relie automatiquement une fiche praticien pour un dentiste (bug du 2026-08-10 : practitioners restait vide, personne ne pouvait saisir de CA)', async () => {
      const result = await db.query<{ id: string }>(
        `insert into auth.users (raw_user_meta_data) values ($1) returning id`,
        [JSON.stringify({ first_name: 'Nouveau', last_name: 'Collaborateur', role: 'collaborator_dentist' })]
      );
      const newId = result.rows[0].id;

      const profile = await db.query<{ practitioner_id: string | null }>('select practitioner_id from public.profiles where id = $1', [newId]);
      expect(profile.rows[0].practitioner_id).not.toBeNull();

      const practitioner = await db.query(
        'select first_name, last_name from public.practitioners where id = $1',
        [profile.rows[0].practitioner_id]
      );
      expect(practitioner.rows).toHaveLength(1);
      expect(practitioner.rows[0]).toMatchObject({ first_name: 'Nouveau', last_name: 'Collaborateur' });
    });
  });
});
