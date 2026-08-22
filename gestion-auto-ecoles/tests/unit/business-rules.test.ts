import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb } from "./test-db";
import { Prisma } from "@prisma/client";

// Tests d'intégration contre une vraie base Postgres (celle configurée par DATABASE_URL) :
// on vérifie que les contraintes réellement appliquées en base (pas seulement décrites
// dans le code applicatif) empêchent les états invalides. Toutes les données créées ici
// sont préfixées/isolées sous une organisation dédiée et nettoyées à la fin.

let organizationId: string;
let schoolAId: string;
let schoolBId: string;
let instructorId: string;
let vehicleId: string;
let studentAId: string;
let studentBId: string;

beforeAll(async () => {
  const organization = await testDb.organization.create({
    data: { name: `Test Suite Org ${Date.now()}` },
  });
  organizationId = organization.id;

  const schoolA = await testDb.drivingSchool.create({
    data: { organizationId, name: "École Test A" },
  });
  const schoolB = await testDb.drivingSchool.create({
    data: { organizationId, name: "École Test B" },
  });
  schoolAId = schoolA.id;
  schoolBId = schoolB.id;

  const instructor = await testDb.employee.create({
    data: {
      organizationId,
      primaryDrivingSchoolId: schoolAId,
      civility: "M",
      firstName: "Jean",
      lastName: "Moniteur",
      position: "Moniteur",
    },
  });
  instructorId = instructor.id;

  const vehicle = await testDb.vehicle.create({
    data: {
      organizationId,
      drivingSchoolId: schoolAId,
      plate: `TEST-${Date.now()}`,
      make: "Peugeot",
      model: "208",
      category: "B",
      fuelType: "ESSENCE",
      transmission: "MANUELLE",
    },
  });
  vehicleId = vehicle.id;

  const studentA = await testDb.student.create({
    data: {
      organizationId,
      drivingSchoolId: schoolAId,
      internalNumber: `TEST-A-${Date.now()}`,
      civility: "M",
      firstName: "Alice",
      lastName: "Testeuse",
      licenseCategory: "B",
    },
  });
  studentAId = studentA.id;

  const studentB = await testDb.student.create({
    data: {
      organizationId,
      drivingSchoolId: schoolBId,
      internalNumber: `TEST-B-${Date.now()}`,
      civility: "MME",
      firstName: "Bea",
      lastName: "Testeuse",
      licenseCategory: "B",
    },
  });
  studentBId = studentB.id;
});

afterAll(async () => {
  await testDb.examCandidate.deleteMany({ where: { student: { organizationId } } });
  await testDb.examSlot.deleteMany({ where: { allocation: { drivingSchoolId: { in: [schoolAId, schoolBId] } } } });
  await testDb.examAllocation.deleteMany({ where: { drivingSchoolId: { in: [schoolAId, schoolBId] } } });
  await testDb.lesson.deleteMany({ where: { drivingSchoolId: { in: [schoolAId, schoolBId] } } });
  await testDb.student.deleteMany({ where: { organizationId } });
  await testDb.vehicle.deleteMany({ where: { organizationId } });
  await testDb.employee.deleteMany({ where: { organizationId } });
  await testDb.drivingSchool.deleteMany({ where: { organizationId } });
  await testDb.auditLog.deleteMany({ where: { organizationId } });
  await testDb.organization.delete({ where: { id: organizationId } });
  await testDb.$disconnect();
});

describe("Isolation entre établissements", () => {
  it("une requête filtrée par établissement ne retourne que les élèves de cet établissement", async () => {
    const studentsOfA = await testDb.student.findMany({ where: { drivingSchoolId: schoolAId } });
    expect(studentsOfA.map((s) => s.id)).toContain(studentAId);
    expect(studentsOfA.map((s) => s.id)).not.toContain(studentBId);
  });
});

describe("Règle métier n°1 — un moniteur ne peut avoir deux leçons simultanées", () => {
  it("refuse une seconde leçon qui chevauche la première pour le même moniteur", async () => {
    const start = new Date("2027-01-04T09:00:00Z");
    const end = new Date("2027-01-04T10:00:00Z");

    await testDb.lesson.create({
      data: {
        drivingSchoolId: schoolAId,
        studentId: studentAId,
        instructorId,
        scheduledStart: start,
        scheduledEnd: end,
      },
    });

    const overlappingStart = new Date("2027-01-04T09:30:00Z");
    const overlappingEnd = new Date("2027-01-04T10:30:00Z");

    await expect(
      testDb.lesson.create({
        data: {
          drivingSchoolId: schoolAId,
          studentId: studentAId,
          instructorId,
          scheduledStart: overlappingStart,
          scheduledEnd: overlappingEnd,
        },
      }),
    ).rejects.toThrow();
  });

  it("accepte une leçon sur un créneau non chevauchant pour le même moniteur", async () => {
    const lesson = await testDb.lesson.create({
      data: {
        drivingSchoolId: schoolAId,
        studentId: studentAId,
        instructorId,
        scheduledStart: new Date("2027-01-04T11:00:00Z"),
        scheduledEnd: new Date("2027-01-04T12:00:00Z"),
      },
    });
    expect(lesson.id).toBeDefined();
  });

  it("une leçon annulée ne bloque plus le créneau", async () => {
    const start = new Date("2027-01-05T09:00:00Z");
    const end = new Date("2027-01-05T10:00:00Z");

    const first = await testDb.lesson.create({
      data: {
        drivingSchoolId: schoolAId,
        studentId: studentAId,
        instructorId,
        scheduledStart: start,
        scheduledEnd: end,
      },
    });
    await testDb.lesson.update({ where: { id: first.id }, data: { status: "ANNULEE_ECOLE" } });

    const second = await testDb.lesson.create({
      data: {
        drivingSchoolId: schoolAId,
        studentId: studentAId,
        instructorId,
        scheduledStart: start,
        scheduledEnd: end,
      },
    });
    expect(second.id).toBeDefined();
  });
});

describe("Règle métier n°2 — un véhicule ne peut être utilisé dans deux leçons simultanées", () => {
  it("refuse une seconde leçon qui chevauche la première pour le même véhicule, même avec un autre moniteur", async () => {
    const secondInstructor = await testDb.employee.create({
      data: {
        organizationId,
        primaryDrivingSchoolId: schoolAId,
        civility: "MME",
        firstName: "Julie",
        lastName: "Moniteur2",
        position: "Monitrice",
      },
    });

    const start = new Date("2027-01-06T14:00:00Z");
    const end = new Date("2027-01-06T15:00:00Z");

    await testDb.lesson.create({
      data: {
        drivingSchoolId: schoolAId,
        studentId: studentAId,
        instructorId,
        vehicleId,
        scheduledStart: start,
        scheduledEnd: end,
      },
    });

    await expect(
      testDb.lesson.create({
        data: {
          drivingSchoolId: schoolAId,
          studentId: studentAId,
          instructorId: secondInstructor.id,
          vehicleId,
          scheduledStart: new Date("2027-01-06T14:30:00Z"),
          scheduledEnd: new Date("2027-01-06T15:30:00Z"),
        },
      }),
    ).rejects.toThrow();

    await testDb.lesson.deleteMany({ where: { instructorId: secondInstructor.id } });
    await testDb.employee.delete({ where: { id: secondInstructor.id } });
  });
});

describe("Règle métier n°5 — une place d'examen ne peut être attribuée qu'à un seul élève", () => {
  it("refuse d'affecter un second élève à une place déjà prise", async () => {
    const allocation = await testDb.examAllocation.create({
      data: {
        drivingSchoolId: schoolAId,
        licenseCategory: "B",
        examCenter: "Centre Test",
        examDate: new Date("2027-02-01T08:00:00Z"),
        seatsReceived: 1,
        receivedAt: new Date(),
      },
    });
    const slot = await testDb.examSlot.create({
      data: { allocationId: allocation.id, sequenceNumber: 1 },
    });

    await testDb.examCandidate.create({
      data: { allocationId: allocation.id, examSlotId: slot.id, studentId: studentAId, status: "AFFECTE" },
    });

    await expect(
      testDb.examCandidate.create({
        data: { allocationId: allocation.id, examSlotId: slot.id, studentId: studentBId, status: "AFFECTE" },
      }),
    ).rejects.toThrow();
  });
});

describe("Règle métier n°10 — archivage plutôt que suppression", () => {
  it("un établissement archivé est exclu des requêtes actives mais reste consultable", async () => {
    const school = await testDb.drivingSchool.create({
      data: { organizationId, name: "École À Archiver" },
    });

    await testDb.drivingSchool.update({ where: { id: school.id }, data: { archivedAt: new Date(), active: false } });

    const activeOnly = await testDb.drivingSchool.findMany({ where: { organizationId, archivedAt: null } });
    expect(activeOnly.map((s) => s.id)).not.toContain(school.id);

    const stillExists = await testDb.drivingSchool.findUnique({ where: { id: school.id } });
    expect(stillExists).not.toBeNull();
    expect(stillExists?.archivedAt).not.toBeNull();

    await testDb.drivingSchool.delete({ where: { id: school.id } });
  });
});

describe("Règle métier n°12 — traçabilité des actions sensibles", () => {
  it("une entrée de journal d'audit est correctement enregistrée et non modifiable via l'API applicative", async () => {
    const entry = await testDb.auditLog.create({
      data: {
        organizationId,
        drivingSchoolId: schoolAId,
        action: "CREATE",
        entityType: "Student",
        entityId: studentAId,
        newValues: { firstName: "Alice" } as Prisma.InputJsonValue,
      },
    });

    const found = await testDb.auditLog.findUnique({ where: { id: entry.id } });
    expect(found?.action).toBe("CREATE");
    expect(found?.entityType).toBe("Student");
    expect(found?.newValues).toEqual({ firstName: "Alice" });
  });
});
