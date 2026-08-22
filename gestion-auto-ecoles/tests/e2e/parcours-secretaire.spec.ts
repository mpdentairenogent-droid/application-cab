import { test, expect, type Page } from "@playwright/test";

/**
 * Scénario Playwright requis (cahier des charges §19) :
 *   1. connexion d'une secrétaire
 *   2. création d'un élève
 *   3. ajout d'un paiement
 *   4. réservation d'une leçon
 *   5. affectation à une place d'examen
 *
 * `describe.serial` + un seul onglet partagé entre les étapes : il s'agit d'un vrai parcours
 * utilisateur continu, où chaque étape dépend de l'état laissé par la précédente (ex. la
 * fiche élève créée à l'étape 2 est celle sur laquelle porte le paiement de l'étape 3). Si
 * une étape échoue, les suivantes sont marquées "skipped" plutôt que de s'exécuter sur un
 * état incohérent.
 *
 * Les étapes 4 et 5 dépendent de modules pas encore livrés (Planning : Phase 3 ; Examens :
 * Phase 4). Elles restent explicitement marquées `fixme` avec la phase concernée plutôt que
 * supprimées, pour garder le scénario complet visible et le compléter au fur et à mesure —
 * jamais remplacées par une simulation.
 */

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Demo1234!";

test.describe.serial("Parcours secrétaire — de la connexion à l'examen", () => {
  let page: Page;
  let studentFullName: string;

  test.beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  test.afterAll(async () => {
    await page.close();
  });

  test("1. connexion d'une secrétaire", async () => {
    await page.goto("/connexion");
    await page.fill("#email", "secretaire1@demo.local");
    await page.fill("#password", DEMO_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL("**/tableau-de-bord");
    await expect(page.getByRole("heading", { name: "Auto-écoles" })).toBeVisible();
  });

  test("2. création d'un élève", async () => {
    await page.goto("/eleves/nouveau");
    const lastName = `E2ETest${Date.now()}`;
    studentFullName = `M. Camille ${lastName}`;
    await page.fill("#lastName", lastName);
    await page.fill("#firstName", "Camille");
    await page.click('button[type="submit"]');

    // La création redirige vers la fiche élève créée (route dynamique /eleves/[id]).
    await page.waitForURL(/\/eleves\/[^/]+$/);
    await expect(page.getByRole("heading", { name: studentFullName, level: 1 })).toBeVisible();
  });

  test("3. ajout d'un paiement", async () => {
    await page.getByRole("tab", { name: "Paiements" }).click();
    await page.getByRole("button", { name: "Ajouter un paiement" }).click();
    await page.fill("#serviceDescription", "Acompte formule B (E2E)");
    await page.fill("#amount", "300");
    await page.getByRole("button", { name: "Enregistrer" }).click();

    // ul.divide-y cible la liste interactive (l'onglet actif) et exclut le bloc d'impression
    // caché (hidden print:block, toujours présent dans le DOM) qui reprend le même libellé.
    const paymentRow = page.locator("ul.divide-y li", { hasText: "Acompte formule B (E2E)" });
    await expect(paymentRow).toBeVisible();
    await expect(paymentRow).toContainText("300,00");
  });

  test.fixme("4. réservation d'une leçon", async () => {
    // Implémenté en Phase 3 (module Planning).
  });

  test.fixme("5. affectation à une place d'examen", async () => {
    // Implémenté en Phase 4 (module Examens).
  });
});
