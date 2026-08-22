import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { testDb } from "./test-db";
import { Prisma, PaymentType, PaymentStatus } from "@prisma/client";

let organizationId: string;
let schoolId: string;

beforeAll(async () => {
  const organization = await testDb.organization.create({ data: { name: `Test Suite Students ${Date.now()}` } });
  organizationId = organization.id;
  const school = await testDb.drivingSchool.create({ data: { organizationId, name: "École Test Élèves" } });
  schoolId = school.id;
});

afterAll(async () => {
  await testDb.payment.deleteMany({ where: { drivingSchoolId: schoolId } });
  await testDb.enrollment.deleteMany({ where: { drivingSchoolId: schoolId } });
  await testDb.student.deleteMany({ where: { organizationId } });
  await testDb.trainingPackage.deleteMany({ where: { drivingSchoolId: schoolId } });
  await testDb.drivingSchool.deleteMany({ where: { organizationId } });
  await testDb.organization.delete({ where: { id: organizationId } });
  await testDb.$disconnect();
});

function makeStudentData(internalNumber: string) {
  return {
    organizationId,
    drivingSchoolId: schoolId,
    internalNumber,
    civility: "M" as const,
    firstName: "Test",
    lastName: "Élève",
    licenseCategory: "B" as const,
    registeredAt: new Date(),
  };
}

describe("Élèves — création et modification", () => {
  it("crée un élève avec les champs obligatoires", async () => {
    const student = await testDb.student.create({ data: makeStudentData(`TEST-CREATE-${Date.now()}`) });
    expect(student.id).toBeDefined();
    expect(student.status).toBe("ACTIF");
    expect(student.fileStatus).toBe("INCOMPLET");
  });

  it("refuse deux élèves avec le même numéro interne (contrainte d'unicité)", async () => {
    const number = `TEST-DUP-${Date.now()}`;
    await testDb.student.create({ data: makeStudentData(number) });
    await expect(testDb.student.create({ data: makeStudentData(number) })).rejects.toThrow();
  });

  it("modifie un élève existant et conserve les autres champs", async () => {
    const student = await testDb.student.create({ data: makeStudentData(`TEST-UPDATE-${Date.now()}`) });
    const updated = await testDb.student.update({ where: { id: student.id }, data: { hoursBalance: 15, fileStatus: "COMPLET" } });
    expect(Number(updated.hoursBalance)).toBe(15);
    expect(updated.fileStatus).toBe("COMPLET");
    expect(updated.firstName).toBe("Test");
  });

  it("archive un élève : exclu des requêtes actives, conservé et récupérable", async () => {
    const student = await testDb.student.create({ data: makeStudentData(`TEST-ARCHIVE-${Date.now()}`) });
    await testDb.student.update({ where: { id: student.id }, data: { archivedAt: new Date(), status: "ARCHIVE" } });

    const activeOnly = await testDb.student.findMany({ where: { organizationId, archivedAt: null } });
    expect(activeOnly.map((s) => s.id)).not.toContain(student.id);

    const stillExists = await testDb.student.findUnique({ where: { id: student.id } });
    expect(stillExists?.status).toBe("ARCHIVE");

    const reactivated = await testDb.student.update({ where: { id: student.id }, data: { archivedAt: null, status: "ACTIF" } });
    expect(reactivated.archivedAt).toBeNull();
  });
});

describe("Paiements — partiels, remboursements, historique conservé", () => {
  it("un paiement partiel laisse un solde restant dû, cohérent avec le montant réglé", async () => {
    const student = await testDb.student.create({ data: makeStudentData(`TEST-PAY-${Date.now()}`) });
    const pkg = await testDb.trainingPackage.create({
      data: { drivingSchoolId: schoolId, name: "Formule Test", licenseCategory: "B", includedHours: 20, priceCents: 100000 },
    });
    await testDb.enrollment.create({
      data: { studentId: student.id, trainingPackageId: pkg.id, drivingSchoolId: schoolId, priceAtEnrollmentCents: pkg.priceCents },
    });

    // Deux règlements partiels de 300€ chacun sur une formule à 1000€.
    await testDb.payment.create({
      data: {
        studentId: student.id, drivingSchoolId: schoolId, type: PaymentType.PAIEMENT, serviceDescription: "Acompte 1",
        amountCents: 30000, method: "CB", paidAt: new Date(), status: PaymentStatus.VALIDE,
      },
    });
    await testDb.payment.create({
      data: {
        studentId: student.id, drivingSchoolId: schoolId, type: PaymentType.PAIEMENT, serviceDescription: "Acompte 2",
        amountCents: 30000, method: "ESPECES", paidAt: new Date(), status: PaymentStatus.VALIDE,
      },
    });

    const [enrollments, payments] = await Promise.all([
      testDb.enrollment.findMany({ where: { studentId: student.id, status: "EN_COURS" } }),
      testDb.payment.findMany({ where: { studentId: student.id, status: PaymentStatus.VALIDE } }),
    ]);
    const totalDueCents = enrollments.reduce((sum, e) => sum + e.priceAtEnrollmentCents, 0);
    const totalPaidCents = payments.reduce((sum, p) => (p.type === PaymentType.PAIEMENT ? sum + p.amountCents : sum - p.amountCents), 0);

    expect(totalDueCents).toBe(100000);
    expect(totalPaidCents).toBe(60000);
    expect(totalDueCents - totalPaidCents).toBe(40000); // 400 € restant dû
  });

  it("un paiement annulé n'est plus compté mais reste dans l'historique (jamais supprimé)", async () => {
    const student = await testDb.student.create({ data: makeStudentData(`TEST-CANCEL-${Date.now()}`) });
    const payment = await testDb.payment.create({
      data: {
        studentId: student.id, drivingSchoolId: schoolId, type: PaymentType.PAIEMENT, serviceDescription: "À annuler",
        amountCents: 5000, method: "CB", paidAt: new Date(), status: PaymentStatus.VALIDE,
      },
    });

    await testDb.payment.update({ where: { id: payment.id }, data: { status: PaymentStatus.ANNULE } });

    const validPayments = await testDb.payment.findMany({ where: { studentId: student.id, status: PaymentStatus.VALIDE } });
    expect(validPayments).toHaveLength(0);

    const allPayments = await testDb.payment.findMany({ where: { studentId: student.id } });
    expect(allPayments).toHaveLength(1);
    expect(allPayments[0]?.status).toBe(PaymentStatus.ANNULE);
  });

  it("un remboursement/avoir vient en déduction du total réglé (jamais une mutation du paiement d'origine)", async () => {
    const student = await testDb.student.create({ data: makeStudentData(`TEST-REFUND-${Date.now()}`) });
    const original = await testDb.payment.create({
      data: {
        studentId: student.id, drivingSchoolId: schoolId, type: PaymentType.PAIEMENT, serviceDescription: "Paiement initial",
        amountCents: 20000, method: "CB", paidAt: new Date(), status: PaymentStatus.VALIDE,
      },
    });
    await testDb.payment.create({
      data: {
        studentId: student.id, drivingSchoolId: schoolId, type: PaymentType.REMBOURSEMENT, serviceDescription: "Remboursement partiel",
        amountCents: 5000, method: "VIREMENT", paidAt: new Date(), status: PaymentStatus.VALIDE, correctsPaymentId: original.id,
      },
    });

    const payments = await testDb.payment.findMany({ where: { studentId: student.id, status: PaymentStatus.VALIDE } });
    const net = payments.reduce((sum, p) => (p.type === PaymentType.PAIEMENT ? sum + p.amountCents : sum - p.amountCents), 0);
    expect(net).toBe(15000);

    const untouchedOriginal = await testDb.payment.findUnique({ where: { id: original.id } });
    expect(untouchedOriginal?.amountCents).toBe(20000); // jamais modifié, seule une nouvelle ligne existe
  });
});
