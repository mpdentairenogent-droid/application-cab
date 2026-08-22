import "server-only";
import { prisma } from "../db";
import { requirePermission } from "../auth/guards";
import { recordAudit } from "../audit";
import { ValidationError } from "../errors";
import { buildStorageKey, uploadDocumentBytes, getSignedDocumentUrl, MAX_DOCUMENT_SIZE_BYTES, ALLOWED_DOCUMENT_MIME_TYPES } from "../storage";
import { documentMetadataSchema, STUDENT_REQUIRED_DOCUMENT_CATEGORIES } from "@/lib/validations/document";

export async function listStudentDocuments(studentId: string) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  await requirePermission("documents.view", { drivingSchoolId: student.drivingSchoolId });

  return prisma.document.findMany({
    where: { studentId, archivedAt: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function getMissingStudentDocumentCategories(studentId: string) {
  const documents = await prisma.document.findMany({
    where: { studentId, archivedAt: null },
    select: { category: true },
  });
  const present = new Set(documents.map((d) => d.category));
  return STUDENT_REQUIRED_DOCUMENT_CATEGORIES.filter((category) => !present.has(category));
}

export async function uploadStudentDocument(studentId: string, formData: FormData) {
  const student = await prisma.student.findUniqueOrThrow({ where: { id: studentId } });
  const ctx = await requirePermission("documents.manage", { drivingSchoolId: student.drivingSchoolId });

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new ValidationError("Aucun fichier sélectionné.");
  }
  if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
    throw new ValidationError("Le fichier dépasse la taille maximale autorisée (10 Mo).");
  }
  if (!ALLOWED_DOCUMENT_MIME_TYPES.includes(file.type as (typeof ALLOWED_DOCUMENT_MIME_TYPES)[number])) {
    throw new ValidationError("Type de fichier non autorisé (PDF, JPEG, PNG ou WEBP uniquement).");
  }

  const metadata = documentMetadataSchema.parse({
    category: formData.get("category"),
    expiresAt: formData.get("expiresAt") ?? "",
    notes: formData.get("notes") ?? "",
  });

  const key = buildStorageKey("eleves", file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  await uploadDocumentBytes(key, bytes, file.type);

  const document = await prisma.document.create({
    data: {
      organizationId: ctx.organizationId,
      drivingSchoolId: student.drivingSchoolId,
      studentId,
      category: metadata.category,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      storageKey: key,
      expiresAt: metadata.expiresAt ? new Date(metadata.expiresAt) : null,
      notes: metadata.notes || null,
      uploadedById: ctx.id,
    },
  });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: student.drivingSchoolId,
    userId: ctx.id,
    action: "CREATE",
    entityType: "Document",
    entityId: document.id,
    newValues: { studentId, category: metadata.category, fileName: file.name },
  });

  return document;
}

export async function getStudentDocumentDownloadUrl(documentId: string) {
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  await requirePermission("documents.view", { drivingSchoolId: document.drivingSchoolId ?? undefined });
  return getSignedDocumentUrl(document.storageKey);
}

export async function archiveStudentDocument(documentId: string) {
  const document = await prisma.document.findUniqueOrThrow({ where: { id: documentId } });
  const ctx = await requirePermission("documents.manage", { drivingSchoolId: document.drivingSchoolId ?? undefined });

  const updated = await prisma.document.update({ where: { id: documentId }, data: { archivedAt: new Date() } });

  await recordAudit({
    organizationId: ctx.organizationId,
    drivingSchoolId: document.drivingSchoolId,
    userId: ctx.id,
    action: "ARCHIVE",
    entityType: "Document",
    entityId: documentId,
  });

  return updated;
}
