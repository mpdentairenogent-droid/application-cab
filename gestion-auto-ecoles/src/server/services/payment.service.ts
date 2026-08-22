import "server-only";
import { PaymentType, PaymentStatus } from "@prisma/client";
import { prisma } from "../db";
import { requirePermission } from "../auth/guards";
import { recordAudit } from "../audit";
import { paymentSchema, type PaymentInput } from "@/lib/validations/payment";

export async function listStudentPayments(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  await requirePermission("payments.view", { drivingSchoolId: student.drivingSchoolId });

  return prisma.payment.findMany({
    where: { studentId },
    orderBy: { paidAt: "desc" },
  });
}

/**
 * Échéancier simplifié : total dû (formules souscrites actives), total réglé (paiements
 * validés moins remboursements/avoirs validés), solde restant. Paiements partiels
 * naturellement pris en compte : chaque règlement est une ligne indépendante, la somme
 * fait foi — jamais de champ "montant payé" muté sur une entité, conformément à la règle
 * métier n°7 (historique des opérations financières toujours conservé).
 */
export async function getStudentFinancialSummary(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  await requirePermission("payments.view", { drivingSchoolId: student.drivingSchoolId });

  const [enrollments, payments] = await Promise.all([
    prisma.enrollment.findMany({ where: { studentId, status: "EN_COURS" } }),
    prisma.payment.findMany({ where: { studentId, status: PaymentStatus.VALIDE } }),
  ]);

  const totalDueCents = enrollments.reduce((sum, e) => sum + e.priceAtEnrollmentCents, 0);
  const totalPaidCents = payments.reduce((sum, p) => {
    if (p.type === PaymentType.PAIEMENT) return sum + p.amountCents;
    return sum - p.amountCents;
  }, 0);

  return { totalDueCents, totalPaidCents, balanceCents: totalDueCents - totalPaidCents };
}

export async function addStudentPayment(studentId: string, rawInput: PaymentInput) {
  const input = paymentSchema.parse(rawInput);
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  const ctx = await requirePermission("payments.manage", { drivingSchoolId: student.drivingSchoolId });

  const payment = await prisma.payment.create({
    data: {
      studentId,
      drivingSchoolId: student.drivingSchoolId,
      type: input.type,
      serviceDescription: input.serviceDescription,
      amountCents: Math.round(input.amount * 100),
      method: input.method,
      paidAt: new Date(input.paidAt),
      reference: input.reference || null,
      notes: input.notes || null,
      status: PaymentStatus.VALIDE,
      createdById: ctx.id,
    },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: student.drivingSchoolId,
    userId: ctx.id,
    action: "CREATE",
    entityType: "Payment",
    entityId: payment.id,
    newValues: { type: payment.type, amountCents: payment.amountCents, method: payment.method },
  });

  return payment;
}

export async function cancelStudentPayment(paymentId: string) {
  const existing = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId } });
  const ctx = await requirePermission("payments.manage", { drivingSchoolId: existing.drivingSchoolId });

  const payment = await prisma.payment.update({
    where: { id: paymentId },
    data: { status: PaymentStatus.ANNULE },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: existing.drivingSchoolId,
    userId: ctx.id,
    action: "UPDATE",
    entityType: "Payment",
    entityId: paymentId,
    oldValues: { status: existing.status },
    newValues: { status: PaymentStatus.ANNULE },
  });

  return payment;
}
