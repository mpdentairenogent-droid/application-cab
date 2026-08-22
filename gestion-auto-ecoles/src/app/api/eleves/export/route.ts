import type { NextRequest } from "next/server";
import { listAllStudentsForExport } from "@/server/services/student.service";
import { ForbiddenError, UnauthorizedError } from "@/server/auth/guards";
import { toCsv, csvResponse } from "@/lib/csv";
import { formatDate } from "@/lib/format";
import { LICENSE_CATEGORY_LABELS, TRAINING_TYPE_LABELS, STUDENT_STATUS_LABELS } from "@/lib/validations/student";
import type { StudentStatus, TrainingType, LicenseCategory } from "@prisma/client";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  try {
    const students = await listAllStudentsForExport({
      drivingSchoolId: params.get("drivingSchoolId") ?? undefined,
      status: (params.get("status") as StudentStatus) || undefined,
      trainingType: (params.get("trainingType") as TrainingType) || undefined,
      licenseCategory: (params.get("licenseCategory") as LicenseCategory) || undefined,
      search: params.get("q") ?? undefined,
    });

    const rows = [
      [
        "Numéro interne",
        "Civilité",
        "Nom",
        "Prénom",
        "Établissement",
        "Téléphone",
        "E-mail",
        "Statut",
        "Formation",
        "Permis préparé",
        "NEPH",
        "Solde d'heures",
        "Date d'inscription",
      ],
      ...students.map((s) => [
        s.internalNumber,
        s.civility,
        s.lastName,
        s.firstName,
        s.drivingSchool.name,
        s.phone ?? "",
        s.email ?? "",
        STUDENT_STATUS_LABELS[s.status] ?? s.status,
        TRAINING_TYPE_LABELS[s.trainingType] ?? s.trainingType,
        LICENSE_CATEGORY_LABELS[s.licenseCategory] ?? s.licenseCategory,
        s.nephNumber ?? "",
        s.hoursBalance.toString(),
        formatDate(s.registeredAt),
      ]),
    ];

    return csvResponse(toCsv(rows), `eleves-${new Date().toISOString().slice(0, 10)}.csv`);
  } catch (error) {
    if (error instanceof UnauthorizedError) return new Response("Authentification requise.", { status: 401 });
    if (error instanceof ForbiddenError) return new Response("Accès refusé.", { status: 403 });
    throw error;
  }
}
