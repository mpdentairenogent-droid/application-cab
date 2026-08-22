import { describe, it, expect } from "vitest";
import { DEFAULT_ROLE_PERMISSIONS, ALL_PERMISSION_KEYS, PERMISSIONS } from "@/lib/permissions";

describe("Matrice de permissions par défaut", () => {
  it("le super-administrateur a toutes les permissions", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.SUPER_ADMIN.sort()).toEqual([...ALL_PERMISSION_KEYS].sort());
  });

  it("seul le super-administrateur gère l'organisation et les utilisateurs", () => {
    for (const role of ["GERANT", "SECRETAIRE", "MONITEUR"] as const) {
      expect(DEFAULT_ROLE_PERMISSIONS[role]).not.toContain(PERMISSIONS.ORGANIZATION_MANAGE.key);
      expect(DEFAULT_ROLE_PERMISSIONS[role]).not.toContain(PERMISSIONS.USERS_MANAGE.key);
    }
  });

  it("seul le super-administrateur accède au journal d'audit", () => {
    for (const role of ["GERANT", "SECRETAIRE", "MONITEUR"] as const) {
      expect(DEFAULT_ROLE_PERMISSIONS[role]).not.toContain(PERMISSIONS.AUDIT_VIEW.key);
    }
  });

  it("la secrétaire n'a jamais accès aux salaires (données sociales sensibles)", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.SECRETAIRE).not.toContain(PERMISSIONS.EMPLOYEES_VIEW_SALARY.key);
    expect(DEFAULT_ROLE_PERMISSIONS.SECRETAIRE).not.toContain(PERMISSIONS.EMPLOYEES_MANAGE_SALARY.key);
  });

  it("le moniteur n'a aucun accès aux salaires, aux finances ni à la gestion RH", () => {
    const moniteur = DEFAULT_ROLE_PERMISSIONS.MONITEUR;
    expect(moniteur).not.toContain(PERMISSIONS.EMPLOYEES_VIEW_SALARY.key);
    expect(moniteur).not.toContain(PERMISSIONS.EMPLOYEES_MANAGE_SALARY.key);
    expect(moniteur).not.toContain(PERMISSIONS.EMPLOYEES_MANAGE.key);
    expect(moniteur).not.toContain(PERMISSIONS.FINANCE_VIEW.key);
    expect(moniteur).not.toContain(PERMISSIONS.FINANCE_MANAGE.key);
  });

  it("le moniteur peut déclarer une absence/congé mais pas le valider", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.MONITEUR).toContain(PERMISSIONS.LEAVES_REQUEST.key);
    expect(DEFAULT_ROLE_PERMISSIONS.MONITEUR).not.toContain(PERMISSIONS.LEAVES_VALIDATE.key);
  });

  it("le gérant a accès aux finances et aux salaires dans ses établissements", () => {
    expect(DEFAULT_ROLE_PERMISSIONS.GERANT).toContain(PERMISSIONS.FINANCE_VIEW.key);
    expect(DEFAULT_ROLE_PERMISSIONS.GERANT).toContain(PERMISSIONS.EMPLOYEES_VIEW_SALARY.key);
  });

  it("chaque clé de la matrice correspond à une permission existante du catalogue", () => {
    const validKeys = new Set(ALL_PERMISSION_KEYS);
    for (const keys of Object.values(DEFAULT_ROLE_PERMISSIONS)) {
      for (const key of keys) {
        expect(validKeys.has(key)).toBe(true);
      }
    }
  });
});
