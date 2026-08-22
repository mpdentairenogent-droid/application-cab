/**
 * Script de données de démonstration.
 * Usage : npm run db:seed (voir package.json).
 *
 * Phase 1 : organisation, 3 auto-écoles, catalogue de permissions, rôles, comptes de
 * démonstration pour chaque rôle. Les phases suivantes enrichiront ce script (élèves,
 * véhicules, planning, examens, paiements, congés...) au fur et à mesure que chaque
 * module est réellement implémenté — voir docs/CONTEXTE_PROJET.md.
 *
 * Bloqué par défaut en production : ce script ne doit normalement jamais tourner sur un
 * vrai déploiement destiné à un usage réel. Exception explicite et volontaire :
 * ALLOW_DEMO_SEED_IN_PRODUCTION=true, réservée à un déploiement de démonstration/test
 * (voir "Déploiement de démonstration" dans le README) — jamais à activer sur un
 * environnement contenant de vraies données.
 */
import "dotenv/config";
import { PrismaClient, GlobalRoleKey } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { PERMISSIONS, DEFAULT_ROLE_PERMISSIONS, ROLE_LABELS } from "../src/lib/permissions";

if (process.env.NODE_ENV === "production" && process.env.ALLOW_DEMO_SEED_IN_PRODUCTION !== "true") {
  console.error(
    "Seed ignoré : environnement de production sans ALLOW_DEMO_SEED_IN_PRODUCTION=true (voir prisma/seed.ts).",
  );
  process.exit(1);
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_PASSWORD = process.env.SEED_DEMO_PASSWORD ?? "Demo1234!";

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seed — création de l'organisation et des auto-écoles...");

  let organization = await prisma.organization.findFirst({ where: { name: "Groupe Gambetta Formation" } });
  if (!organization) {
    organization = await prisma.organization.create({ data: { name: "Groupe Gambetta Formation" } });
  }

  const schoolDefs = [
    {
      name: "Auto-École Gambetta",
      legalName: "Gambetta Formation SARL",
      address: "62 Rue Martre",
      postalCode: "92110",
      city: "Clichy",
      phone: "01 80 46 98 35",
      email: "autoecole.gambetta92@gmail.com",
    },
    {
      name: "Auto-École Nogent Centre",
      legalName: "Nogent Conduite SARL",
      address: "14 Rue de Paris",
      postalCode: "94130",
      city: "Nogent-sur-Marne",
      phone: "01 45 00 00 00",
      email: "contact@nogent-conduite.example",
    },
    {
      name: "Auto-École République",
      legalName: "République Conduite SARL",
      address: "8 Boulevard Voltaire",
      postalCode: "75011",
      city: "Paris",
      phone: "01 43 00 00 00",
      email: "contact@republique-conduite.example",
    },
  ];

  const schools = [];
  for (const def of schoolDefs) {
    let school = await prisma.drivingSchool.findFirst({ where: { organizationId: organization.id, name: def.name } });
    if (!school) {
      school = await prisma.drivingSchool.create({ data: { ...def, organizationId: organization.id } });
    }
    schools.push(school);
  }
  const gambetta = schools.find((s) => s.name === "Auto-École Gambetta");
  const nogent = schools.find((s) => s.name === "Auto-École Nogent Centre");
  const republique = schools.find((s) => s.name === "Auto-École République");
  if (!gambetta || !nogent || !republique) {
    throw new Error("Erreur interne du seed : les 3 auto-écoles n'ont pas pu être créées.");
  }

  console.log("Seed — catalogue des permissions...");
  const permissionByKey = new Map<string, string>();
  for (const perm of Object.values(PERMISSIONS)) {
    const row = await prisma.permission.upsert({
      where: { key: perm.key },
      update: { label: perm.label, category: perm.category },
      create: { key: perm.key, label: perm.label, category: perm.category },
    });
    permissionByKey.set(perm.key, row.id);
  }

  console.log("Seed — rôles et matrice de permissions par défaut...");
  const roleByKey = new Map<GlobalRoleKey, string>();
  for (const key of Object.values(GlobalRoleKey)) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId: organization.id, key } },
      update: { label: ROLE_LABELS[key] },
      create: { organizationId: organization.id, key, label: ROLE_LABELS[key], isSystem: true },
    });
    roleByKey.set(key, role.id);

    for (const permissionKey of DEFAULT_ROLE_PERMISSIONS[key]) {
      const permissionId = permissionByKey.get(permissionKey);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId },
      });
    }
  }

  console.log("Seed — comptes de démonstration...");
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  async function upsertUser(opts: {
    email: string;
    firstName: string;
    lastName: string;
    role: GlobalRoleKey;
    schoolIds: string[];
  }) {
    const user = await prisma.user.upsert({
      where: { email: opts.email },
      update: {
        firstName: opts.firstName,
        lastName: opts.lastName,
        roleId: roleByKey.get(opts.role)!,
      },
      create: {
        organizationId: organization!.id,
        email: opts.email,
        passwordHash,
        firstName: opts.firstName,
        lastName: opts.lastName,
        roleId: roleByKey.get(opts.role)!,
      },
    });

    for (const drivingSchoolId of opts.schoolIds) {
      await prisma.userDrivingSchool.upsert({
        where: { userId_drivingSchoolId: { userId: user.id, drivingSchoolId } },
        update: {},
        create: { userId: user.id, drivingSchoolId },
      });
    }
    return user;
  }

  const allSchoolIds = schools.map((s) => s.id);

  await upsertUser({
    email: "superadmin@demo.local",
    firstName: "Sophie",
    lastName: "Lambert",
    role: "SUPER_ADMIN",
    schoolIds: allSchoolIds,
  });

  await upsertUser({
    email: "gerant1@demo.local",
    firstName: "Karim",
    lastName: "Haddad",
    role: "GERANT",
    schoolIds: allSchoolIds,
  });
  await upsertUser({
    email: "gerant2@demo.local",
    firstName: "Nathalie",
    lastName: "Petit",
    role: "GERANT",
    schoolIds: allSchoolIds,
  });
  await upsertUser({
    email: "gerant3@demo.local",
    firstName: "Julien",
    lastName: "Faure",
    role: "GERANT",
    schoolIds: allSchoolIds,
  });

  const secretaire1 = await upsertUser({
    email: "secretaire1@demo.local",
    firstName: "Émilie",
    lastName: "Rousseau",
    role: "SECRETAIRE",
    schoolIds: [gambetta.id],
  });
  const secretaire2 = await upsertUser({
    email: "secretaire2@demo.local",
    firstName: "Camille",
    lastName: "Dubreuil",
    role: "SECRETAIRE",
    schoolIds: [nogent.id, republique.id],
  });

  const moniteur1 = await upsertUser({
    email: "moniteur1@demo.local",
    firstName: "Marc",
    lastName: "Lefebvre",
    role: "MONITEUR",
    schoolIds: [gambetta.id],
  });
  const moniteur2 = await upsertUser({
    email: "moniteur2@demo.local",
    firstName: "Sarah",
    lastName: "Benali",
    role: "MONITEUR",
    schoolIds: [gambetta.id, nogent.id],
  });
  const moniteur3 = await upsertUser({
    email: "moniteur3@demo.local",
    firstName: "Thomas",
    lastName: "Girard",
    role: "MONITEUR",
    schoolIds: [nogent.id],
  });
  const moniteur4 = await upsertUser({
    email: "moniteur4@demo.local",
    firstName: "Laëtitia",
    lastName: "Morel",
    role: "MONITEUR",
    schoolIds: [republique.id],
  });

  console.log("Seed — fiches salariés (secrétaires et moniteurs)...");
  async function upsertEmployee(opts: {
    userId: string;
    civility: "M" | "MME";
    firstName: string;
    lastName: string;
    email: string;
    primaryDrivingSchoolId: string;
    secondarySchoolIds?: string[];
    position: string;
  }) {
    const employee = await prisma.employee.upsert({
      where: { userId: opts.userId },
      update: {},
      create: {
        organizationId: organization!.id,
        primaryDrivingSchoolId: opts.primaryDrivingSchoolId,
        userId: opts.userId,
        civility: opts.civility,
        firstName: opts.firstName,
        lastName: opts.lastName,
        email: opts.email,
        position: opts.position,
      },
    });
    for (const drivingSchoolId of opts.secondarySchoolIds ?? []) {
      await prisma.employeeDrivingSchool.upsert({
        where: { employeeId_drivingSchoolId: { employeeId: employee.id, drivingSchoolId } },
        update: {},
        create: { employeeId: employee.id, drivingSchoolId },
      });
    }
    await prisma.employmentContract.upsert({
      where: { id: `${employee.id}-contrat-initial` },
      update: {},
      create: {
        id: `${employee.id}-contrat-initial`,
        employeeId: employee.id,
        contractType: "CDI",
        startDate: new Date("2023-09-01T00:00:00Z"),
        weeklyHours: 35,
        payBasis: "MENSUEL",
        payRateCents: 220000,
      },
    });
    return employee;
  }

  await upsertEmployee({
    userId: secretaire1.id,
    civility: "MME",
    firstName: "Émilie",
    lastName: "Rousseau",
    email: "secretaire1@demo.local",
    primaryDrivingSchoolId: gambetta.id,
    position: "Secrétaire",
  });
  await upsertEmployee({
    userId: secretaire2.id,
    civility: "MME",
    firstName: "Camille",
    lastName: "Dubreuil",
    email: "secretaire2@demo.local",
    primaryDrivingSchoolId: nogent.id,
    secondarySchoolIds: [republique.id],
    position: "Secrétaire",
  });
  const employeeMoniteur1 = await upsertEmployee({
    userId: moniteur1.id,
    civility: "M",
    firstName: "Marc",
    lastName: "Lefebvre",
    email: "moniteur1@demo.local",
    primaryDrivingSchoolId: gambetta.id,
    position: "Moniteur",
  });
  const employeeMoniteur2 = await upsertEmployee({
    userId: moniteur2.id,
    civility: "MME",
    firstName: "Sarah",
    lastName: "Benali",
    email: "moniteur2@demo.local",
    primaryDrivingSchoolId: gambetta.id,
    secondarySchoolIds: [nogent.id],
    position: "Monitrice",
  });
  const employeeMoniteur3 = await upsertEmployee({
    userId: moniteur3.id,
    civility: "M",
    firstName: "Thomas",
    lastName: "Girard",
    email: "moniteur3@demo.local",
    primaryDrivingSchoolId: nogent.id,
    position: "Moniteur",
  });
  const employeeMoniteur4 = await upsertEmployee({
    userId: moniteur4.id,
    civility: "MME",
    firstName: "Laëtitia",
    lastName: "Morel",
    email: "moniteur4@demo.local",
    primaryDrivingSchoolId: republique.id,
    position: "Monitrice",
  });

  console.log("Seed — formules de formation...");
  async function upsertPackage(drivingSchoolId: string, name: string, licenseCategory: "B" | "A2" | "AM", includedHours: number, priceCents: number) {
    const existing = await prisma.trainingPackage.findFirst({ where: { drivingSchoolId, name } });
    if (existing) return existing;
    return prisma.trainingPackage.create({ data: { drivingSchoolId, name, licenseCategory, includedHours, priceCents } });
  }

  const packagesBySchool: Record<string, Awaited<ReturnType<typeof upsertPackage>>[]> = {};
  for (const school of [gambetta, nogent, republique]) {
    packagesBySchool[school.id] = [
      await upsertPackage(school.id, "Formule Permis B — 20h", "B", 20, 129000),
      await upsertPackage(school.id, "Formule Permis B — 30h", "B", 30, 169000),
      await upsertPackage(school.id, "Formule A2 — 20h", "A2", 20, 99000),
    ];
  }

  console.log("Seed — élèves de démonstration...");
  let studentSeq = 1;
  async function upsertStudent(opts: {
    drivingSchoolId: string;
    civility: "M" | "MME";
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
    licenseCategory: "B" | "A2" | "AM";
    trainingType: "TRADITIONNELLE" | "CONDUITE_ACCOMPAGNEE" | "ACCELEREE";
    fileStatus: "INCOMPLET" | "COMPLET" | "EN_VALIDATION" | "VALIDE";
    status: "ACTIF" | "SUSPENDU" | "TERMINE";
    referentInstructorId?: string;
    hoursBalance: number;
    packageIndex: number;
  }) {
    const existing = await prisma.student.findFirst({ where: { drivingSchoolId: opts.drivingSchoolId, firstName: opts.firstName, lastName: opts.lastName } });
    if (existing) return existing;

    const year = new Date().getFullYear();
    const internalNumber = `E-${year}-${String(studentSeq++).padStart(5, "0")}`;
    const student = await prisma.student.create({
      data: {
        organizationId: organization!.id,
        drivingSchoolId: opts.drivingSchoolId,
        internalNumber,
        civility: opts.civility,
        firstName: opts.firstName,
        lastName: opts.lastName,
        phone: opts.phone,
        email: opts.email,
        registeredAt: new Date(Date.now() - Math.floor(Math.random() * 200) * 24 * 60 * 60 * 1000),
        trainingType: opts.trainingType,
        licenseCategory: opts.licenseCategory,
        fileStatus: opts.fileStatus,
        status: opts.status,
        referentInstructorId: opts.referentInstructorId,
        hoursBalance: opts.hoursBalance,
        gdprConsentAt: new Date(),
      },
    });

    const pkg = packagesBySchool[opts.drivingSchoolId]?.[opts.packageIndex];
    if (pkg) {
      await prisma.enrollment.create({
        data: { studentId: student.id, trainingPackageId: pkg.id, drivingSchoolId: opts.drivingSchoolId, priceAtEnrollmentCents: pkg.priceCents },
      });
      await prisma.payment.create({
        data: {
          studentId: student.id,
          drivingSchoolId: opts.drivingSchoolId,
          type: "PAIEMENT",
          serviceDescription: `Acompte — ${pkg.name}`,
          amountCents: Math.round(pkg.priceCents * 0.3),
          method: "CB",
          paidAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000),
          status: "VALIDE",
        },
      });
    }

    return student;
  }

  await upsertStudent({
    drivingSchoolId: gambetta.id, civility: "M", firstName: "Lucas", lastName: "Bernard", phone: "0612345601", email: "lucas.bernard@example.com",
    licenseCategory: "B", trainingType: "TRADITIONNELLE", fileStatus: "COMPLET", status: "ACTIF", referentInstructorId: employeeMoniteur1.id, hoursBalance: 12, packageIndex: 0,
  });
  await upsertStudent({
    drivingSchoolId: gambetta.id, civility: "MME", firstName: "Emma", lastName: "Petit", phone: "0612345602", email: "emma.petit@example.com",
    licenseCategory: "B", trainingType: "CONDUITE_ACCOMPAGNEE", fileStatus: "VALIDE", status: "ACTIF", referentInstructorId: employeeMoniteur1.id, hoursBalance: 18, packageIndex: 1,
  });
  await upsertStudent({
    drivingSchoolId: gambetta.id, civility: "M", firstName: "Nathan", lastName: "Roux", phone: "0612345603", email: "nathan.roux@example.com",
    licenseCategory: "A2", trainingType: "TRADITIONNELLE", fileStatus: "INCOMPLET", status: "ACTIF", referentInstructorId: employeeMoniteur2.id, hoursBalance: 4, packageIndex: 2,
  });
  await upsertStudent({
    drivingSchoolId: gambetta.id, civility: "MME", firstName: "Chloé", lastName: "Fontaine", phone: "0612345604", email: "chloe.fontaine@example.com",
    licenseCategory: "B", trainingType: "ACCELEREE", fileStatus: "EN_VALIDATION", status: "ACTIF", referentInstructorId: employeeMoniteur2.id, hoursBalance: 8, packageIndex: 0,
  });
  await upsertStudent({
    drivingSchoolId: gambetta.id, civility: "M", firstName: "Hugo", lastName: "Girard", phone: "0612345605", email: "hugo.girard@example.com",
    licenseCategory: "B", trainingType: "TRADITIONNELLE", fileStatus: "VALIDE", status: "TERMINE", referentInstructorId: employeeMoniteur1.id, hoursBalance: 0, packageIndex: 1,
  });
  await upsertStudent({
    drivingSchoolId: nogent.id, civility: "MME", firstName: "Léa", lastName: "Moreau", phone: "0612345606", email: "lea.moreau@example.com",
    licenseCategory: "B", trainingType: "TRADITIONNELLE", fileStatus: "COMPLET", status: "ACTIF", referentInstructorId: employeeMoniteur3.id, hoursBalance: 15, packageIndex: 0,
  });
  await upsertStudent({
    drivingSchoolId: nogent.id, civility: "M", firstName: "Louis", lastName: "Simon", phone: "0612345607", email: "louis.simon@example.com",
    licenseCategory: "B", trainingType: "CONDUITE_ACCOMPAGNEE", fileStatus: "VALIDE", status: "ACTIF", referentInstructorId: employeeMoniteur3.id, hoursBalance: 22, packageIndex: 1,
  });
  await upsertStudent({
    drivingSchoolId: nogent.id, civility: "MME", firstName: "Manon", lastName: "Michel", phone: "0612345608", email: "manon.michel@example.com",
    licenseCategory: "AM", trainingType: "TRADITIONNELLE", fileStatus: "INCOMPLET", status: "SUSPENDU", hoursBalance: 2, packageIndex: 2,
  });
  await upsertStudent({
    drivingSchoolId: republique.id, civility: "M", firstName: "Adam", lastName: "Lefevre", phone: "0612345609", email: "adam.lefevre@example.com",
    licenseCategory: "B", trainingType: "TRADITIONNELLE", fileStatus: "COMPLET", status: "ACTIF", referentInstructorId: employeeMoniteur4.id, hoursBalance: 10, packageIndex: 0,
  });
  await upsertStudent({
    drivingSchoolId: republique.id, civility: "MME", firstName: "Jade", lastName: "Garcia", phone: "0612345610", email: "jade.garcia@example.com",
    licenseCategory: "B", trainingType: "ACCELEREE", fileStatus: "VALIDE", status: "ACTIF", referentInstructorId: employeeMoniteur4.id, hoursBalance: 25, packageIndex: 1,
  });

  console.log("\nSeed terminé.");
  console.log("10 élèves de démonstration créés (répartis sur les 3 auto-écoles, avec formule, acompte et statuts variés).");
  console.log(`Mot de passe commun à tous les comptes de démonstration : ${DEMO_PASSWORD}`);
  console.log(
    [
      "Comptes créés :",
      "  superadmin@demo.local   (Super-administrateur, toutes les auto-écoles)",
      "  gerant1@demo.local      (Gérant / associé — Karim Haddad)",
      "  gerant2@demo.local      (Gérant / associé — Nathalie Petit)",
      "  gerant3@demo.local      (Gérant / associé — Julien Faure)",
      "  secretaire1@demo.local  (Secrétaire — Auto-École Gambetta)",
      "  secretaire2@demo.local  (Secrétaire — Nogent Centre + République)",
      "  moniteur1@demo.local    (Moniteur — Auto-École Gambetta)",
      "  moniteur2@demo.local    (Monitrice — Gambetta + Nogent Centre)",
      "  moniteur3@demo.local    (Moniteur — Nogent Centre)",
      "  moniteur4@demo.local    (Monitrice — République)",
    ].join("\n"),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
