import { z } from "zod";
import { Civility, LicenseCategory, TrainingType, StudentFileStatus, StudentStatus } from "@prisma/client";

function isMinor(birthDate: string | undefined): boolean {
  if (!birthDate) return false;
  const dob = new Date(birthDate);
  if (Number.isNaN(dob.getTime())) return false;
  const eighteenYearsAgo = new Date();
  eighteenYearsAgo.setFullYear(eighteenYearsAgo.getFullYear() - 18);
  return dob > eighteenYearsAgo;
}

export const studentSchema = z
  .object({
    drivingSchoolId: z.string().min(1, "L'établissement est obligatoire."),
    civility: z.nativeEnum(Civility),
    firstName: z.string().trim().min(1, "Le prénom est obligatoire.").max(80),
    lastName: z.string().trim().min(1, "Le nom est obligatoire.").max(80),
    birthDate: z.string().optional().or(z.literal("")),
    birthPlace: z.string().trim().max(120).optional().or(z.literal("")),
    address: z.string().trim().max(200).optional().or(z.literal("")),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}$/, "Le code postal doit contenir 5 chiffres.")
      .optional()
      .or(z.literal("")),
    city: z.string().trim().max(100).optional().or(z.literal("")),
    phone: z.string().trim().max(30).optional().or(z.literal("")),
    email: z.string().trim().email("Adresse e-mail invalide.").optional().or(z.literal("")),
    legalGuardianName: z.string().trim().max(160).optional().or(z.literal("")),
    legalGuardianPhone: z.string().trim().max(30).optional().or(z.literal("")),
    legalGuardianEmail: z.string().trim().email("Adresse e-mail invalide.").optional().or(z.literal("")),
    registeredAt: z.string().min(1, "La date d'inscription est obligatoire."),
    trainingType: z.nativeEnum(TrainingType),
    licenseCategory: z.nativeEnum(LicenseCategory),
    trainingPackageId: z.string().optional().or(z.literal("")),
    nephNumber: z
      .string()
      .trim()
      .regex(/^\d{12}$/, "Le NEPH doit contenir 12 chiffres.")
      .optional()
      .or(z.literal("")),
    fileStatus: z.nativeEnum(StudentFileStatus),
    referentInstructorId: z.string().optional().or(z.literal("")),
    hoursBalance: z.number().min(0, "Le solde d'heures ne peut pas être négatif.").max(999),
    internalNotes: z.string().trim().max(2000).optional().or(z.literal("")),
    gdprConsent: z.boolean(),
    status: z.nativeEnum(StudentStatus),
  })
  .superRefine((data, ctx) => {
    if (isMinor(data.birthDate) && !data.legalGuardianName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["legalGuardianName"],
        message: "Obligatoire pour un élève mineur (nom du représentant légal).",
      });
    }
  });

export type StudentInput = z.infer<typeof studentSchema>;

export const LICENSE_CATEGORY_LABELS: Record<string, string> = {
  AM: "AM (cyclomoteur)",
  A1: "A1",
  A2: "A2",
  A: "A",
  B1: "B1 (quadricycle)",
  B: "B",
  BE: "BE",
  C1: "C1",
  C1E: "C1E",
  C: "C",
  CE: "CE",
  D1: "D1",
  D1E: "D1E",
  D: "D",
  DE: "DE",
};

export const TRAINING_TYPE_LABELS: Record<string, string> = {
  TRADITIONNELLE: "Traditionnelle",
  CONDUITE_ACCOMPAGNEE: "Conduite accompagnée",
  CONDUITE_SUPERVISEE: "Conduite supervisée",
  ACCELEREE: "Accélérée",
};

export const STUDENT_FILE_STATUS_LABELS: Record<string, string> = {
  INCOMPLET: "Incomplet",
  COMPLET: "Complet",
  EN_VALIDATION: "En validation",
  VALIDE: "Validé",
};

export const STUDENT_STATUS_LABELS: Record<string, string> = {
  ACTIF: "Actif",
  SUSPENDU: "Suspendu",
  TERMINE: "Terminé",
  ARCHIVE: "Archivé",
};
