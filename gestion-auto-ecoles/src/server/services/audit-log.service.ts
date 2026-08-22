import "server-only";
import type { AuditAction, Prisma } from "@prisma/client";
import { prisma } from "../db";
import { requirePermission } from "../auth/guards";

const PAGE_SIZE = 25;

export async function listAuditLogs(filters: {
  drivingSchoolId?: string;
  action?: AuditAction;
  from?: Date;
  to?: Date;
  page?: number;
}) {
  const ctx = await requirePermission("audit.view");
  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.AuditLogWhereInput = {
    organizationId: ctx.organizationId,
    ...(filters.drivingSchoolId ? { drivingSchoolId: filters.drivingSchoolId } : {}),
    ...(filters.action ? { action: filters.action } : {}),
    ...(filters.from || filters.to
      ? {
          createdAt: {
            ...(filters.from ? { gte: filters.from } : {}),
            ...(filters.to ? { lte: filters.to } : {}),
          },
        }
      : {}),
  };

  const [total, entries] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        drivingSchool: { select: { name: true } },
        user: { select: { firstName: true, lastName: true, email: true } },
      },
    }),
  ]);

  return { entries, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}
