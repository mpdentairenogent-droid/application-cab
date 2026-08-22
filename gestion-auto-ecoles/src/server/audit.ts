import "server-only";
import { headers } from "next/headers";
import { Prisma, type AuditAction } from "@prisma/client";
import { prisma } from "./db";

// Journal d'audit — append-only. Aucune fonction d'update/delete n'est exposée
// volontairement : une entrée, une fois écrite, ne peut plus être modifiée que
// par un accès direct à la base (hors périmètre applicatif standard).
//
// Ne jamais passer de champ sensible brut (mot de passe, jeton...) dans
// oldValues/newValues : les appelants doivent filtrer avant d'appeler cette fonction.

type RecordAuditParams = {
  organizationId?: string | null;
  drivingSchoolId?: string | null;
  userId?: string | null;
  action: AuditAction;
  entityType: string;
  entityId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
};

async function getRequestMetadata() {
  try {
    const hdrs = await headers();
    const forwardedFor = hdrs.get("x-forwarded-for");
    const ipAddress = forwardedFor?.split(",")[0]?.trim() || hdrs.get("x-real-ip") || null;
    const userAgent = hdrs.get("user-agent");
    return { ipAddress, userAgent };
  } catch {
    // headers() n'est disponible que dans le contexte d'une requête (pas depuis le seed
    // ou une tâche de fond) : on journalise alors sans métadonnées réseau.
    return { ipAddress: null, userAgent: null };
  }
}

export async function recordAudit(params: RecordAuditParams) {
  const { ipAddress, userAgent } = await getRequestMetadata();
  const data: Prisma.AuditLogUncheckedCreateInput = {
    organizationId: params.organizationId ?? null,
    drivingSchoolId: params.drivingSchoolId ?? null,
    userId: params.userId ?? null,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId ?? null,
    oldValues: (params.oldValues ?? undefined) as Prisma.InputJsonValue | undefined,
    newValues: (params.newValues ?? undefined) as Prisma.InputJsonValue | undefined,
    ipAddress,
    userAgent,
  };
  await prisma.auditLog.create({ data });
}
