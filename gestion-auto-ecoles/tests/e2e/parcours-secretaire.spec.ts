import { test, expect } from "@playwright/test";

/**
 * Scénario Playwright requis (cahier des charges §19) :
 *   1. connexion d'une secrétaire
 *   2. création d'un élève
 *   3. ajout d'un paiement
 *   4. réservation d'une leçon
 *   5. affectation à une place d'examen
 *
 * Les étapes 2 à 5 dépendent de modules pas encore livrés (Élèves/Paiements : Phase 2 ;
 * Planning : Phase 3 ; Examens : Phase 4). Elles sont explicitement marquées `fixme` avec
 * la phase concernée plutôt que supprimées, pour garder le scénario complet visible et le
 * compléter au fur et à mesure — jamais remplacées par une simulation.
 */

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Demo1234!";

test.describe("Parcours secrétaire — de la connexion à l'examen", () => {
  test("1. connexion d'une secrétaire", async ({ page }) => {
    await page.goto("/connexion");
    await page.fill("#email", "secretaire1@demo.local");
    await page.fill("#password", DEMO_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/tableau-de-bord");
    await expect(page.getByRole("heading", { name: "Auto-écoles" })).toBeVisible();
  });

  test.fixme("2. création d'un élève", async () => {
    // Implémenté en Phase 2 (module Élèves) — voir docs/CONTEXTE_PROJET.md.
  });

  test.fixme("3. ajout d'un paiement", async () => {
    // Implémenté en Phase 2 (module Paiements).
  });

  test.fixme("4. réservation d'une leçon", async () => {
    // Implémenté en Phase 3 (module Planning).
  });

  test.fixme("5. affectation à une place d'examen", async () => {
    // Implémenté en Phase 4 (module Examens).
  });
});
