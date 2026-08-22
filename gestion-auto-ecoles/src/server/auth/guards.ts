import "server-only";
import { cache } from "react";
import { auth } from "./index";
import { prisma } from "../db";
import type { GlobalRoleKey } from "@prisma/client";
import type { PermissionKey } from "@/lib/permissions";

export class UnauthorizedError extends Error {
  constructor(message = "Authentification requise.") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Accès refusé.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export type UserContext = {
  id: string;
  organizationId: string;
  email: string;
  fullName: string;
  roleKey: GlobalRoleKey;
  isSuperAdmin: boolean;
  /** Clés de permission effectives (rôle + dérogations individuelles). Comparer avec des valeurs PermissionKey. */
  permissions: ReadonlySet<string>;
  /** Établissements auxquels l'utilisateur a explicitement accès (vide et non pertinent pour un super-administrateur, qui a accès à tous). */
  schoolIds: ReadonlySet<string>;
};

/**
 * Résout le contexte utilisateur complet (rôle, permissions effectives, établissements
 * autorisés) à partir de la session. Mémoïsé par requête (React cache) pour éviter de
 * relire la base à chaque appel de requirePermission/requireUser dans une même requête.
 * Ne renvoie jamais un utilisateur suspendu ou archivé.
 */
export const getCurrentUserContext = cache(async (): Promise<UserContext | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      role: {
        include: { rolePermissions: { include: { permission: true } } },
      },
      userPermissions: { include: { permission: true } },
      drivingSchoolAccess: { select: { drivingSchoolId: true } },
    },
  });

  if (!user || user.archivedAt || user.status !== "ACTIF") return null;

  const permissions = new Set<string>(user.role.rolePermissions.map((rp) => rp.permission.key));
  for (const override of user.userPermissions) {
    if (override.granted) permissions.add(override.permission.key);
    else permissions.delete(override.permission.key);
  }

  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    fullName: `${user.firstName} ${user.lastName}`,
    roleKey: user.role.key,
    isSuperAdmin: user.role.key === "SUPER_ADMIN",
    permissions,
    schoolIds: new Set(user.drivingSchoolAccess.map((a) => a.drivingSchoolId)),
  };
});

export async function requireUser(): Promise<UserContext> {
  const ctx = await getCurrentUserContext();
  if (!ctx) throw new UnauthorizedError();
  return ctx;
}

/**
 * Point de passage obligé avant toute opération métier. Vérifie la permission, puis
 * si drivingSchoolId est fourni, vérifie que l'utilisateur a bien accès à cet
 * établissement (sauf super-administrateur, qui a accès à tous par construction).
 * Ne fait JAMAIS confiance à un contrôle déjà fait côté interface : chaque service
 * doit rappeler cette fonction lui-même.
 */
export async function requirePermission(
  permission: PermissionKey,
  options?: { drivingSchoolId?: string | null },
): Promise<UserContext> {
  const ctx = await requireUser();

  if (!ctx.permissions.has(permission)) {
    throw new ForbiddenError(`Permission manquante : ${permission}`);
  }

  if (options?.drivingSchoolId && !ctx.isSuperAdmin && !ctx.schoolIds.has(options.drivingSchoolId)) {
    throw new ForbiddenError("Vous n'avez pas accès à cet établissement.");
  }

  return ctx;
}

/** Variante sans exigence de permission précise : vérifie uniquement l'accès à l'établissement. */
export async function requireSchoolAccess(drivingSchoolId: string): Promise<UserContext> {
  const ctx = await requireUser();
  if (!ctx.isSuperAdmin && !ctx.schoolIds.has(drivingSchoolId)) {
    throw new ForbiddenError("Vous n'avez pas accès à cet établissement.");
  }
  return ctx;
}
