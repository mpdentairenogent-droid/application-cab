import { GlobalRoleKey, PermissionCategory } from "@prisma/client";

// Catalogue central des permissions. Source de vérité unique, utilisée à la fois par
// le script de seed (pour peupler les tables Permission/RolePermission) et par le code
// serveur (src/server/auth/guards.ts) pour typer les vérifications d'autorisation.
// Ajouter une permission ici ne suffit pas à la rendre active : il faut aussi l'ajouter
// à la matrice DEFAULT_ROLE_PERMISSIONS ci-dessous et re-lancer le seed.

export const PERMISSIONS = {
  ORGANIZATION_MANAGE: {
    key: "organization.manage",
    label: "Gérer les établissements et l'organisation",
    category: PermissionCategory.ORGANISATION,
  },
  USERS_MANAGE: {
    key: "users.manage",
    label: "Gérer les utilisateurs, rôles et accès",
    category: PermissionCategory.ORGANISATION,
  },
  AUDIT_VIEW: {
    key: "audit.view",
    label: "Consulter le journal d'audit",
    category: PermissionCategory.ORGANISATION,
  },
  STUDENTS_VIEW: {
    key: "students.view",
    label: "Consulter les élèves",
    category: PermissionCategory.ELEVES,
  },
  STUDENTS_MANAGE: {
    key: "students.manage",
    label: "Créer, modifier, archiver les élèves",
    category: PermissionCategory.ELEVES,
  },
  DOCUMENTS_VIEW: {
    key: "documents.view",
    label: "Consulter les documents",
    category: PermissionCategory.DOCUMENTS,
  },
  DOCUMENTS_MANAGE: {
    key: "documents.manage",
    label: "Ajouter, remplacer, archiver des documents",
    category: PermissionCategory.DOCUMENTS,
  },
  PAYMENTS_VIEW: {
    key: "payments.view",
    label: "Consulter les paiements élèves",
    category: PermissionCategory.PAIEMENTS,
  },
  PAYMENTS_MANAGE: {
    key: "payments.manage",
    label: "Saisir des paiements, remboursements, avoirs",
    category: PermissionCategory.PAIEMENTS,
  },
  PLANNING_VIEW: {
    key: "planning.view",
    label: "Consulter le planning",
    category: PermissionCategory.PLANNING,
  },
  PLANNING_MANAGE: {
    key: "planning.manage",
    label: "Créer, modifier, annuler des leçons",
    category: PermissionCategory.PLANNING,
  },
  EXAMS_VIEW: {
    key: "exams.view",
    label: "Consulter les places et sessions d'examen",
    category: PermissionCategory.EXAMENS,
  },
  EXAMS_MANAGE: {
    key: "exams.manage",
    label: "Saisir des attributions, affecter des élèves",
    category: PermissionCategory.EXAMENS,
  },
  EMPLOYEES_VIEW: {
    key: "employees.view",
    label: "Consulter les fiches salariés",
    category: PermissionCategory.SALARIES,
  },
  EMPLOYEES_MANAGE: {
    key: "employees.manage",
    label: "Créer, modifier, archiver les salariés",
    category: PermissionCategory.SALARIES,
  },
  EMPLOYEES_VIEW_SALARY: {
    key: "employees.viewSalary",
    label: "Consulter les informations de salaire",
    category: PermissionCategory.SALARIES,
  },
  EMPLOYEES_MANAGE_SALARY: {
    key: "employees.manageSalary",
    label: "Gérer les variables de paie",
    category: PermissionCategory.SALARIES,
  },
  LEAVES_VIEW: {
    key: "leaves.view",
    label: "Consulter les congés et absences",
    category: PermissionCategory.CONGES,
  },
  LEAVES_REQUEST: {
    key: "leaves.request",
    label: "Déclarer une absence ou demander un congé",
    category: PermissionCategory.CONGES,
  },
  LEAVES_VALIDATE: {
    key: "leaves.validate",
    label: "Valider ou refuser une demande de congé",
    category: PermissionCategory.CONGES,
  },
  VEHICLES_VIEW: {
    key: "vehicles.view",
    label: "Consulter les véhicules",
    category: PermissionCategory.VEHICULES,
  },
  VEHICLES_MANAGE: {
    key: "vehicles.manage",
    label: "Gérer véhicules, contrats, entretiens, assurances",
    category: PermissionCategory.VEHICULES,
  },
  FINANCE_VIEW: {
    key: "finance.view",
    label: "Consulter les finances (recettes, dépenses)",
    category: PermissionCategory.FINANCES,
  },
  FINANCE_MANAGE: {
    key: "finance.manage",
    label: "Saisir des recettes et dépenses",
    category: PermissionCategory.FINANCES,
  },
  REPORTS_VIEW: {
    key: "reports.view",
    label: "Consulter les rapports et statistiques",
    category: PermissionCategory.RAPPORTS,
  },
  SETTINGS_MANAGE: {
    key: "settings.manage",
    label: "Gérer les paramètres (formules, catégories...)",
    category: PermissionCategory.PARAMETRES,
  },
} as const;

export type PermissionKey = (typeof PERMISSIONS)[keyof typeof PERMISSIONS]["key"];

export const ALL_PERMISSION_KEYS: PermissionKey[] = Object.values(PERMISSIONS).map((p) => p.key);

const {
  ORGANIZATION_MANAGE,
  USERS_MANAGE,
  AUDIT_VIEW,
  STUDENTS_VIEW,
  STUDENTS_MANAGE,
  DOCUMENTS_VIEW,
  DOCUMENTS_MANAGE,
  PAYMENTS_VIEW,
  PAYMENTS_MANAGE,
  PLANNING_VIEW,
  PLANNING_MANAGE,
  EXAMS_VIEW,
  EXAMS_MANAGE,
  EMPLOYEES_VIEW,
  EMPLOYEES_MANAGE,
  EMPLOYEES_VIEW_SALARY,
  EMPLOYEES_MANAGE_SALARY,
  LEAVES_VIEW,
  LEAVES_REQUEST,
  LEAVES_VALIDATE,
  VEHICLES_VIEW,
  VEHICLES_MANAGE,
  FINANCE_VIEW,
  FINANCE_MANAGE,
  REPORTS_VIEW,
  SETTINGS_MANAGE,
} = PERMISSIONS;

// Matrice par défaut appliquée par le seed. Super-administrateur : toutes les
// permissions, tous les établissements (contournement dédié côté code, pas de
// ligne UserDrivingSchool nécessaire — voir src/server/auth/guards.ts).
export const DEFAULT_ROLE_PERMISSIONS: Record<GlobalRoleKey, PermissionKey[]> = {
  SUPER_ADMIN: ALL_PERMISSION_KEYS,
  GERANT: [
    STUDENTS_VIEW,
    STUDENTS_MANAGE,
    DOCUMENTS_VIEW,
    DOCUMENTS_MANAGE,
    PAYMENTS_VIEW,
    PAYMENTS_MANAGE,
    PLANNING_VIEW,
    PLANNING_MANAGE,
    EXAMS_VIEW,
    EXAMS_MANAGE,
    EMPLOYEES_VIEW,
    EMPLOYEES_MANAGE,
    EMPLOYEES_VIEW_SALARY,
    EMPLOYEES_MANAGE_SALARY,
    LEAVES_VIEW,
    LEAVES_REQUEST,
    LEAVES_VALIDATE,
    VEHICLES_VIEW,
    VEHICLES_MANAGE,
    FINANCE_VIEW,
    FINANCE_MANAGE,
    REPORTS_VIEW,
  ].map((p) => p.key),
  SECRETAIRE: [
    STUDENTS_VIEW,
    STUDENTS_MANAGE,
    DOCUMENTS_VIEW,
    DOCUMENTS_MANAGE,
    PAYMENTS_VIEW,
    PAYMENTS_MANAGE,
    PLANNING_VIEW,
    PLANNING_MANAGE,
    EXAMS_VIEW,
    EXAMS_MANAGE,
    EMPLOYEES_VIEW,
    LEAVES_VIEW,
    VEHICLES_VIEW,
  ].map((p) => p.key),
  MONITEUR: [
    PLANNING_VIEW,
    STUDENTS_VIEW,
    EXAMS_VIEW,
    LEAVES_VIEW,
    LEAVES_REQUEST,
    VEHICLES_VIEW,
    DOCUMENTS_VIEW,
  ].map((p) => p.key),
};

export const ROLE_LABELS: Record<GlobalRoleKey, string> = {
  SUPER_ADMIN: "Super-administrateur",
  GERANT: "Gérant / associé",
  SECRETAIRE: "Secrétaire",
  MONITEUR: "Moniteur",
};
