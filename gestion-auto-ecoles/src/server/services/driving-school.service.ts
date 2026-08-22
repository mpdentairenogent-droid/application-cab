import "server-only";
import { prisma } from "../db";
import { requirePermission, type UserContext } from "../auth/guards";
import { recordAudit } from "../audit";
import { ValidationError } from "../errors";
import { drivingSchoolSchema, type DrivingSchoolInput } from "@/lib/validations/driving-school";

/** Établissements auxquels l'utilisateur a accès (tous pour un super-administrateur). */
export async function listAccessibleSchools(ctx: UserContext) {
  return prisma.drivingSchool.findMany({
    where: {
      organizationId: ctx.organizationId,
      archivedAt: null,
      ...(ctx.isSuperAdmin ? {} : { id: { in: Array.from(ctx.schoolIds) } }),
    },
    orderBy: { name: "asc" },
  });
}

/** Vue de gestion complète (y compris archivés) — réservée à la gestion des établissements. */
export async function listSchoolsForManagement() {
  const ctx = await requirePermission("organization.manage");
  return prisma.drivingSchool.findMany({
    where: { organizationId: ctx.organizationId },
    orderBy: [{ archivedAt: "asc" }, { name: "asc" }],
  });
}

function normalize(input: DrivingSchoolInput) {
  return {
    name: input.name,
    legalName: input.legalName || null,
    siret: input.siret || null,
    address: input.address || null,
    postalCode: input.postalCode || null,
    city: input.city || null,
    phone: input.phone || null,
    email: input.email || null,
  };
}

export async function createSchool(rawInput: DrivingSchoolInput) {
  const ctx = await requirePermission("organization.manage");
  const input = drivingSchoolSchema.parse(rawInput);
  const data = normalize(input);

  const school = await prisma.drivingSchool.create({
    data: { ...data, organizationId: ctx.organizationId },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: school.id,
    userId: ctx.id,
    action: "CREATE",
    entityType: "DrivingSchool",
    entityId: school.id,
    newValues: data,
  });

  return school;
}

export async function updateSchool(id: string, rawInput: DrivingSchoolInput) {
  const ctx = await requirePermission("organization.manage");
  const input = drivingSchoolSchema.parse(rawInput);
  const data = normalize(input);

  const existing = await prisma.drivingSchool.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!existing) throw new ValidationError("Établissement introuvable.");

  const school = await prisma.drivingSchool.update({ where: { id }, data });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: school.id,
    userId: ctx.id,
    action: "UPDATE",
    entityType: "DrivingSchool",
    entityId: school.id,
    oldValues: {
      name: existing.name,
      legalName: existing.legalName,
      siret: existing.siret,
      address: existing.address,
      postalCode: existing.postalCode,
      city: existing.city,
      phone: existing.phone,
      email: existing.email,
    },
    newValues: data,
  });

  return school;
}

export async function archiveSchool(id: string) {
  const ctx = await requirePermission("organization.manage");
  const existing = await prisma.drivingSchool.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!existing) throw new ValidationError("Établissement introuvable.");
  if (existing.archivedAt) return existing;

  const school = await prisma.drivingSchool.update({
    where: { id },
    data: { archivedAt: new Date(), active: false },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: school.id,
    userId: ctx.id,
    action: "ARCHIVE",
    entityType: "DrivingSchool",
    entityId: school.id,
  });

  return school;
}

export async function unarchiveSchool(id: string) {
  const ctx = await requirePermission("organization.manage");
  const existing = await prisma.drivingSchool.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!existing) throw new ValidationError("Établissement introuvable.");

  const school = await prisma.drivingSchool.update({
    where: { id },
    data: { archivedAt: null, active: true },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: school.id,
    userId: ctx.id,
    action: "UNARCHIVE",
    entityType: "DrivingSchool",
    entityId: school.id,
  });

  return school;
}
