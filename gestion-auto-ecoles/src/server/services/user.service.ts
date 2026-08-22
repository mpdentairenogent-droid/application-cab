import "server-only";
import bcrypt from "bcryptjs";
import { Prisma, GlobalRoleKey } from "@prisma/client";
import { prisma } from "../db";
import { requirePermission, type UserContext } from "../auth/guards";
import { recordAudit } from "../audit";
import { ValidationError } from "../errors";
import {
  createUserSchema,
  updateUserSchema,
  changePasswordSchema,
  type CreateUserInput,
  type UpdateUserInput,
  type ChangePasswordInput,
} from "@/lib/validations/user";

export async function listUsers() {
  const ctx = await requirePermission("users.manage");
  return prisma.user.findMany({
    where: { organizationId: ctx.organizationId },
    include: { role: true, drivingSchoolAccess: { include: { drivingSchool: { select: { id: true, name: true } } } } },
    orderBy: [{ archivedAt: "asc" }, { lastName: "asc" }],
  });
}

export async function listRolesForOrg(ctx: UserContext) {
  return prisma.role.findMany({ where: { organizationId: ctx.organizationId }, orderBy: { label: "asc" } });
}

async function assertSchoolsBelongToOrg(organizationId: string, schoolIds: string[]) {
  if (schoolIds.length === 0) return;
  const count = await prisma.drivingSchool.count({ where: { id: { in: schoolIds }, organizationId } });
  if (count !== schoolIds.length) {
    throw new ValidationError("Un ou plusieurs établissements sélectionnés sont invalides.");
  }
}

export async function createUser(rawInput: CreateUserInput) {
  const ctx = await requirePermission("users.manage");
  const input = createUserSchema.parse(rawInput);

  const role = await prisma.role.findFirst({ where: { id: input.roleId, organizationId: ctx.organizationId } });
  if (!role) throw new ValidationError("Rôle invalide.");
  if (role.key !== GlobalRoleKey.SUPER_ADMIN && input.drivingSchoolIds.length === 0) {
    throw new ValidationError("Sélectionnez au moins un établissement pour ce rôle.");
  }
  await assertSchoolsBelongToOrg(ctx.organizationId, input.drivingSchoolIds);

  const passwordHash = await bcrypt.hash(input.password, 10);

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          organizationId: ctx.organizationId,
          email: input.email,
          passwordHash,
          firstName: input.firstName,
          lastName: input.lastName,
          phone: input.phone || null,
          roleId: input.roleId,
          mustChangePassword: true,
        },
      });
      if (input.drivingSchoolIds.length > 0) {
        await tx.userDrivingSchool.createMany({
          data: input.drivingSchoolIds.map((drivingSchoolId) => ({ userId: created.id, drivingSchoolId })),
        });
      }
      return created;
    });

    await recordAudit({
      organizationId: ctx.organizationId,
      userId: ctx.id,
      action: "CREATE",
      entityType: "User",
      entityId: user.id,
      newValues: { email: user.email, firstName: user.firstName, lastName: user.lastName, roleKey: role.key },
    });

    return user;
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new ValidationError("Un utilisateur avec cet e-mail existe déjà.");
    }
    throw error;
  }
}

export async function updateUser(id: string, rawInput: UpdateUserInput) {
  const ctx = await requirePermission("users.manage");
  const input = updateUserSchema.parse(rawInput);

  const existing = await prisma.user.findFirst({
    where: { id, organizationId: ctx.organizationId },
    include: { role: true, drivingSchoolAccess: true },
  });
  if (!existing) throw new ValidationError("Utilisateur introuvable.");

  const role = await prisma.role.findFirst({ where: { id: input.roleId, organizationId: ctx.organizationId } });
  if (!role) throw new ValidationError("Rôle invalide.");
  if (role.key !== GlobalRoleKey.SUPER_ADMIN && input.drivingSchoolIds.length === 0) {
    throw new ValidationError("Sélectionnez au moins un établissement pour ce rôle.");
  }
  await assertSchoolsBelongToOrg(ctx.organizationId, input.drivingSchoolIds);

  const user = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id },
      data: {
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone || null,
        roleId: input.roleId,
      },
    });
    await tx.userDrivingSchool.deleteMany({ where: { userId: id } });
    if (input.drivingSchoolIds.length > 0) {
      await tx.userDrivingSchool.createMany({
        data: input.drivingSchoolIds.map((drivingSchoolId) => ({ userId: id, drivingSchoolId })),
      });
    }
    return updated;
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.id,
    action: "UPDATE",
    entityType: "User",
    entityId: user.id,
    oldValues: {
      firstName: existing.firstName,
      lastName: existing.lastName,
      roleKey: existing.role.key,
      schoolIds: existing.drivingSchoolAccess.map((a) => a.drivingSchoolId),
    },
    newValues: { firstName: user.firstName, lastName: user.lastName, roleKey: role.key, schoolIds: input.drivingSchoolIds },
  });

  return user;
}

export async function archiveUser(id: string) {
  const ctx = await requirePermission("users.manage");
  if (id === ctx.id) throw new ValidationError("Vous ne pouvez pas archiver votre propre compte.");

  const existing = await prisma.user.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!existing) throw new ValidationError("Utilisateur introuvable.");
  if (existing.archivedAt) return existing;

  const user = await prisma.user.update({
    where: { id },
    data: { archivedAt: new Date(), status: "ARCHIVE" },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.id,
    action: "ARCHIVE",
    entityType: "User",
    entityId: user.id,
  });

  return user;
}

export async function unarchiveUser(id: string) {
  const ctx = await requirePermission("users.manage");
  const existing = await prisma.user.findFirst({ where: { id, organizationId: ctx.organizationId } });
  if (!existing) throw new ValidationError("Utilisateur introuvable.");

  const user = await prisma.user.update({
    where: { id },
    data: { archivedAt: null, status: "ACTIF" },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.id,
    action: "UNARCHIVE",
    entityType: "User",
    entityId: user.id,
  });

  return user;
}

export async function changeOwnPassword(ctx: UserContext, rawInput: ChangePasswordInput) {
  const input = changePasswordSchema.parse(rawInput);

  const user = await prisma.user.findUniqueOrThrow({ where: { id: ctx.id } });
  const valid = await bcrypt.compare(input.currentPassword, user.passwordHash);
  if (!valid) throw new ValidationError("Mot de passe actuel incorrect.");

  const passwordHash = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({
    where: { id: ctx.id },
    data: { passwordHash, mustChangePassword: false },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    userId: ctx.id,
    action: "UPDATE",
    entityType: "User",
    entityId: ctx.id,
    newValues: { passwordChanged: true },
  });
}
