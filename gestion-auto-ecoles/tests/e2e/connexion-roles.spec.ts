import { test, expect } from "@playwright/test";

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Demo1234!";

async function login(page: import("@playwright/test").Page, email: string) {
  await page.goto("/connexion");
  await page.fill("#email", email);
  await page.fill("#password", DEMO_PASSWORD);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/tableau-de-bord");
}

test.describe("Connexion et permissions par rôle", () => {
  test("un utilisateur non authentifié est redirigé vers la page de connexion", async ({ page }) => {
    await page.goto("/tableau-de-bord");
    await page.waitForURL("**/connexion**");
    await expect(page.locator("text=Gestion Auto-Écoles")).toBeVisible();
  });

  test("un e-mail ou mot de passe incorrect affiche un message d'erreur clair", async ({ page }) => {
    await page.goto("/connexion");
    await page.fill("#email", "superadmin@demo.local");
    await page.fill("#password", "MotDePasseIncorrect");
    await page.click('button[type="submit"]');
    await expect(page.locator("text=E-mail ou mot de passe incorrect")).toBeVisible();
  });

  test("le super-administrateur voit toutes les auto-écoles et le journal d'audit", async ({ page }) => {
    await login(page, "superadmin@demo.local");
    await expect(page.getByRole("heading", { name: "Auto-écoles" })).toBeVisible();
    await page.goto("/parametres");
    await expect(page.locator('a[href="/parametres/etablissements"]')).toBeVisible();
    await expect(page.locator('a[href="/parametres/utilisateurs"]')).toBeVisible();
    await expect(page.locator('a[href="/parametres/journal-audit"]')).toBeVisible();
  });

  test("une secrétaire ne voit ni la gestion des utilisateurs ni le journal d'audit", async ({ page }) => {
    await login(page, "secretaire1@demo.local");
    await page.goto("/parametres");
    await expect(page.locator('a[href="/parametres/utilisateurs"]')).toHaveCount(0);
    await expect(page.locator('a[href="/parametres/journal-audit"]')).toHaveCount(0);

    // Accès direct par URL également refusé côté serveur, pas seulement caché côté UI.
    await page.goto("/parametres/utilisateurs");
    await expect(page.locator("text=Accès refusé")).toBeVisible();
  });

  test("une secrétaire limitée à un seul établissement ne voit pas de sélecteur multi-école", async ({ page }) => {
    await login(page, "secretaire1@demo.local");
    await expect(page.locator("#schoolId")).toHaveCount(0);
    await expect(page.locator("text=Auto-École Gambetta")).toBeVisible();
  });

  test("un moniteur n'a accès ni aux salariés ni aux finances", async ({ page }) => {
    await login(page, "moniteur1@demo.local");
    await expect(page.locator('a[href="/salaries"]')).toHaveCount(0);
    await expect(page.locator('a[href="/finances"]')).toHaveCount(0);

    await page.goto("/finances");
    await expect(page.locator("text=Accès refusé")).toBeVisible();
  });

  test("un gérant voit la vue consolidée des trois établissements", async ({ page }) => {
    await login(page, "gerant1@demo.local");
    await expect(page.locator("#schoolId")).toBeVisible();
    const optionsCount = await page.locator("#schoolId option").count();
    expect(optionsCount).toBeGreaterThanOrEqual(4); // "Toutes" + au moins 3 auto-écoles
  });

  test("la déconnexion ramène à la page de connexion et invalide la session", async ({ page }) => {
    await login(page, "moniteur2@demo.local");
    // Ouvre le menu utilisateur (avatar, dernier bouton du header) puis se déconnecte.
    await page.locator("header button").last().click();
    await page.click('button:has-text("Se déconnecter")');
    await page.waitForURL("**/connexion**");

    await page.goto("/tableau-de-bord");
    await page.waitForURL("**/connexion**");
  });
});
