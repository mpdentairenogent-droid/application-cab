import "server-only";
import { Prisma, StudentStatus, TrainingType, LicenseCategory, GlobalRoleKey } from "@prisma/client";
import { prisma } from "../db";
import { requirePermission, type UserContext } from "../auth/guards";
import { recordAudit } from "../audit";
import { ValidationError } from "../errors";
import { studentSchema, type StudentInput } from "@/lib/validations/student";
import { CONSOLIDATED_VIEW } from "../school-selection";

const PAGE_SIZE = 20;

export type StudentFilters = {
  drivingSchoolId?: string;
  status?: StudentStatus;
  trainingType?: TrainingType;
  licenseCategory?: LicenseCategory;
  referentInstructorId?: string;
  search?: string;
  page?: number;
};

function buildSearchWhere(search: string | undefined): Prisma.StudentWhereInput | undefined {
  const term = search?.trim();
  if (!term) return undefined;

  const words = term.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    const [first, second] = words;
    return {
      OR: [
        { AND: [{ firstName: { contains: first, mode: "insensitive" } }, { lastName: { contains: second, mode: "insensitive" } }] },
        { AND: [{ firstName: { contains: second, mode: "insensitive" } }, { lastName: { contains: first, mode: "insensitive" } }] },
        { phone: { contains: term } },
        { email: { contains: term, mode: "insensitive" } },
        { nephNumber: { contains: term } },
      ],
    };
  }

  return {
    OR: [
      { firstName: { contains: term, mode: "insensitive" } },
      { lastName: { contains: term, mode: "insensitive" } },
      { phone: { contains: term } },
      { email: { contains: term, mode: "insensitive" } },
      { nephNumber: { contains: term } },
      { internalNumber: { contains: term, mode: "insensitive" } },
    ],
  };
}

export async function listStudents(filters: StudentFilters) {
  const ctx = await requirePermission("students.view", {
    drivingSchoolId: filters.drivingSchoolId && filters.drivingSchoolId !== CONSOLIDATED_VIEW ? filters.drivingSchoolId : undefined,
  });

  const schoolFilter =
    filters.drivingSchoolId && filters.drivingSchoolId !== CONSOLIDATED_VIEW
      ? { drivingSchoolId: filters.drivingSchoolId }
      : ctx.isSuperAdmin
        ? {}
        : { drivingSchoolId: { in: Array.from(ctx.schoolIds) } };

  const page = Math.max(1, filters.page ?? 1);

  const where: Prisma.StudentWhereInput = {
    organizationId: ctx.organizationId,
    ...schoolFilter,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.trainingType ? { trainingType: filters.trainingType } : {}),
    ...(filters.licenseCategory ? { licenseCategory: filters.licenseCategory } : {}),
    ...(filters.referentInstructorId ? { referentInstructorId: filters.referentInstructorId } : {}),
    ...(buildSearchWhere(filters.search) ?? {}),
  };

  const [total, students] = await Promise.all([
    prisma.student.count({ where }),
    prisma.student.findMany({
      where,
      include: { drivingSchool: { select: { name: true } }, referentInstructor: { select: { firstName: true, lastName: true } } },
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return { students, total, page, pageSize: PAGE_SIZE, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Pour l'export CSV : mêmes filtres, sans pagination (plafonné pour rester raisonnable). */
export async function listAllStudentsForExport(filters: StudentFilters) {
  const ctx = await requirePermission("students.view", {
    drivingSchoolId: filters.drivingSchoolId && filters.drivingSchoolId !== CONSOLIDATED_VIEW ? filters.drivingSchoolId : undefined,
  });

  const schoolFilter =
    filters.drivingSchoolId && filters.drivingSchoolId !== CONSOLIDATED_VIEW
      ? { drivingSchoolId: filters.drivingSchoolId }
      : ctx.isSuperAdmin
        ? {}
        : { drivingSchoolId: { in: Array.from(ctx.schoolIds) } };

  const where: Prisma.StudentWhereInput = {
    organizationId: ctx.organizationId,
    ...schoolFilter,
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.trainingType ? { trainingType: filters.trainingType } : {}),
    ...(filters.licenseCategory ? { licenseCategory: filters.licenseCategory } : {}),
    ...(buildSearchWhere(filters.search) ?? {}),
  };

  return prisma.student.findMany({
    where,
    include: { drivingSchool: { select: { name: true } } },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
    take: 5000,
  });
}

export async function getStudent(id: string) {
  const student = await prisma.student.findUniqueOrThrow({
    where: { id },
    include: {
      drivingSchool: true,
      referentInstructor: { select: { id: true, firstName: true, lastName: true } },
      enrollments: { include: { trainingPackage: true }, orderBy: { enrolledAt: "desc" } },
    },
  });
  await requirePermission("students.view", { drivingSchoolId: student.drivingSchoolId });
  return student;
}

function normalize(input: StudentInput, ctx: UserContext) {
  return {
    organizationId: ctx.organizationId,
    drivingSchoolId: input.drivingSchoolId,
    civility: input.civility,
    firstName: input.firstName,
    lastName: input.lastName,
    birthDate: input.birthDate ? new Date(input.birthDate) : null,
    birthPlace: input.birthPlace || null,
    address: input.address || null,
    postalCode: input.postalCode || null,
    city: input.city || null,
    phone: input.phone || null,
    email: input.email || null,
    legalGuardianName: input.legalGuardianName || null,
    legalGuardianPhone: input.legalGuardianPhone || null,
    legalGuardianEmail: input.legalGuardianEmail || null,
    registeredAt: new Date(input.registeredAt),
    trainingType: input.trainingType,
    licenseCategory: input.licenseCategory,
    nephNumber: input.nephNumber || null,
    fileStatus: input.fileStatus,
    referentInstructorId: input.referentInstructorId || null,
    hoursBalance: input.hoursBalance,
    internalNotes: input.internalNotes || null,
    gdprConsentAt: input.gdprConsent ? new Date() : null,
    status: input.status,
  };
}

async function assertSchoolInOrg(organizationId: string, drivingSchoolId: string) {
  const school = await prisma.drivingSchool.findFirst({ where: { id: drivingSchoolId, organizationId } });
  if (!school) throw new ValidationError("Établissement invalide.");
}

export async function createStudent(rawInput: StudentInput) {
  const input = studentSchema.parse(rawInput);
  const ctx = await requirePermission("students.manage", { drivingSchoolId: input.drivingSchoolId });
  await assertSchoolInOrg(ctx.organizationId, input.drivingSchoolId);

  const data = normalize(input, ctx);
  const year = new Date().getFullYear();
  const baseCount = await prisma.student.count({
    where: { organizationId: ctx.organizationId, internalNumber: { startsWith: `E-${year}-` } },
  });

  let student = null;
  for (let attempt = 0; attempt < 5 && !student; attempt++) {
    const internalNumber = `E-${year}-${String(baseCount + 1 + attempt).padStart(5, "0")}`;
    try {
      student = await prisma.student.create({ data: { ...data, internalNumber, createdById: ctx.id, updatedById: ctx.id } });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") continue;
      throw error;
    }
  }
  if (!student) throw new ValidationError("Impossible de générer un numéro interne unique, réessayez.");

  if (input.trainingPackageId) {
    const pkg = await prisma.trainingPackage.findFirst({ where: { id: input.trainingPackageId, drivingSchoolId: input.drivingSchoolId } });
    if (pkg) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          trainingPackageId: pkg.id,
          drivingSchoolId: input.drivingSchoolId,
          priceAtEnrollmentCents: pkg.priceCents,
        },
      });
    }
  }

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: student.drivingSchoolId,
    userId: ctx.id,
    action: "CREATE",
    entityType: "Student",
    entityId: student.id,
    newValues: { firstName: student.firstName, lastName: student.lastName, internalNumber: student.internalNumber },
  });

  return student;
}

export async function updateStudent(id: string, rawInput: StudentInput) {
  const input = studentSchema.parse(rawInput);
  const existing = await prisma.student.findUniqueOrThrow({ where: { id } });
  const ctx = await requirePermission("students.manage", { drivingSchoolId: existing.drivingSchoolId });
  await assertSchoolInOrg(ctx.organizationId, input.drivingSchoolId);

  const data = normalize(input, ctx);
  const student = await prisma.student.update({
    where: { id },
    data: { ...data, updatedById: ctx.id },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: student.drivingSchoolId,
    userId: ctx.id,
    action: "UPDATE",
    entityType: "Student",
    entityId: student.id,
    oldValues: { status: existing.status, fileStatus: existing.fileStatus, hoursBalance: existing.hoursBalance.toString() },
    newValues: { status: student.status, fileStatus: student.fileStatus, hoursBalance: student.hoursBalance.toString() },
  });

  return student;
}

export async function archiveStudent(id: string) {
  const existing = await prisma.student.findUniqueOrThrow({ where: { id } });
  const ctx = await requirePermission("students.manage", { drivingSchoolId: existing.drivingSchoolId });
  if (existing.archivedAt) return existing;

  const student = await prisma.student.update({
    where: { id },
    data: { archivedAt: new Date(), status: StudentStatus.ARCHIVE, updatedById: ctx.id },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: student.drivingSchoolId,
    userId: ctx.id,
    action: "ARCHIVE",
    entityType: "Student",
    entityId: student.id,
  });

  return student;
}

export async function unarchiveStudent(id: string) {
  const existing = await prisma.student.findUniqueOrThrow({ where: { id } });
  const ctx = await requirePermission("students.manage", { drivingSchoolId: existing.drivingSchoolId });

  const student = await prisma.student.update({
    where: { id },
    data: { archivedAt: null, status: StudentStatus.ACTIF, updatedById: ctx.id },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: student.drivingSchoolId,
    userId: ctx.id,
    action: "UNARCHIVE",
    entityType: "Student",
    entityId: student.id,
  });

  return student;
}

/** Options pour les formulaires (établissements accessibles, moniteurs, formules). */
/**
 * Options pour le formulaire élève : établissements accessibles, moniteurs et formules de
 * TOUS ces établissements (pas seulement un établissement présélectionné) — le formulaire
 * filtre lui-même côté client selon l'établissement choisi, sans aller-retour serveur.
 */
export async function getStudentFormOptions(ctx: UserContext) {
  const schoolFilter = ctx.isSuperAdmin ? {} : { id: { in: Array.from(ctx.schoolIds) } };

  const schools = await prisma.drivingSchool.findMany({
    where: { organizationId: ctx.organizationId, archivedAt: null, ...schoolFilter },
    orderBy: { name: "asc" },
  });
  const schoolIds = schools.map((s) => s.id);

  const [instructors, packages] = await Promise.all([
    prisma.employee.findMany({
      where: {
        archivedAt: null,
        user: { role: { key: GlobalRoleKey.MONITEUR } },
        OR: [{ primaryDrivingSchoolId: { in: schoolIds } }, { additionalSchools: { some: { drivingSchoolId: { in: schoolIds } } } }],
      },
      include: { additionalSchools: { select: { drivingSchoolId: true } } },
      orderBy: { lastName: "asc" },
    }),
    prisma.trainingPackage.findMany({ where: { drivingSchoolId: { in: schoolIds }, active: true }, orderBy: { name: "asc" } }),
  ]);

  return { schools, instructors, packages };
}

/** Moniteurs des établissements accessibles à l'utilisateur, pour le filtre de la liste élèves. */
export async function listInstructorsForFilters(ctx: UserContext) {
  return prisma.employee.findMany({
    where: {
      organizationId: ctx.organizationId,
      archivedAt: null,
      user: { role: { key: GlobalRoleKey.MONITEUR } },
      ...(ctx.isSuperAdmin
        ? {}
        : {
            OR: [
              { primaryDrivingSchoolId: { in: Array.from(ctx.schoolIds) } },
              { additionalSchools: { some: { drivingSchoolId: { in: Array.from(ctx.schoolIds) } } } },
            ],
          }),
    },
    orderBy: { lastName: "asc" },
  });
}
