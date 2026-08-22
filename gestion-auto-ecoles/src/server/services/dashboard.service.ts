import "server-only";
import { prisma } from "../db";
import type { UserContext } from "../auth/guards";
import { CONSOLIDATED_VIEW } from "../school-selection";

/**
 * Aperçu Phase 1 : uniquement des données réellement disponibles à ce stade
 * (établissements, utilisateurs, activité d'audit). Les indicateurs métier
 * (élèves, paiements, examens, véhicules...) rejoignent ce tableau de bord au
 * fur et à mesure que chaque module est livré (voir section 4 du cahier des charges).
 */
export async function getDashboardOverview(ctx: UserContext, selectedSchoolId: string) {
  const schoolFilter =
    selectedSchoolId === CONSOLIDATED_VIEW
      ? { organizationId: ctx.organizationId, archivedAt: null, ...(ctx.isSuperAdmin ? {} : { id: { in: Array.from(ctx.schoolIds) } }) }
      : { id: selectedSchoolId };

  const schools = await prisma.drivingSchool.findMany({ where: schoolFilter, orderBy: { name: "asc" } });
  const schoolIds = schools.map((s) => s.id);

  const userWhere =
    selectedSchoolId === CONSOLIDATED_VIEW
      ? { organizationId: ctx.organizationId, archivedAt: null }
      : { organizationId: ctx.organizationId, archivedAt: null, drivingSchoolAccess: { some: { drivingSchoolId: selectedSchoolId } } };

  const usersByRole = await prisma.user.groupBy({
    by: ["roleId"],
    where: userWhere,
    _count: { _all: true },
  });

  const roles = await prisma.role.findMany({ where: { organizationId: ctx.organizationId } });
  const roleCountByKey = new Map<string, number>();
  for (const row of usersByRole) {
    const role = roles.find((r) => r.id === row.roleId);
    if (role) roleCountByKey.set(role.key, row._count._all);
  }

  const recentAuditEntries = ctx.permissions.has("audit.view")
    ? await prisma.auditLog.findMany({
        where: {
          organizationId: ctx.organizationId,
          ...(selectedSchoolId !== CONSOLIDATED_VIEW ? { drivingSchoolId: selectedSchoolId } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { drivingSchool: { select: { name: true } } },
      })
    : [];

  return {
    schools,
    schoolCount: schools.length,
    userCounts: {
      SUPER_ADMIN: roleCountByKey.get("SUPER_ADMIN") ?? 0,
      GERANT: roleCountByKey.get("GERANT") ?? 0,
      SECRETAIRE: roleCountByKey.get("SECRETAIRE") ?? 0,
      MONITEUR: roleCountByKey.get("MONITEUR") ?? 0,
    },
    totalUsers: usersByRole.reduce((sum, row) => sum + row._count._all, 0),
    recentAuditEntries,
    schoolIds,
  };
}
