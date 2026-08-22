import type { AuditAction } from "@prisma/client";

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  CREATE: "Création",
  UPDATE: "Modification",
  ARCHIVE: "Archivage",
  UNARCHIVE: "Désarchivage",
  DELETE: "Suppression",
  LOGIN: "Connexion",
  LOGIN_FAILED: "Échec de connexion",
  LOGOUT: "Déconnexion",
  VALIDATE: "Validation",
  REFUSE: "Refus",
  ASSIGN: "Affectation",
  UNASSIGN: "Désaffectation",
  TRANSFER: "Transfert",
  EXPORT: "Export",
};

export const ENTITY_TYPE_LABELS: Record<string, string> = {
  User: "Utilisateur",
  DrivingSchool: "Établissement",
  Student: "Élève",
  Employee: "Salarié",
  Vehicle: "Véhicule",
  Lesson: "Leçon",
  Payment: "Paiement",
  ExamAllocation: "Attribution d'examen",
  ExamCandidate: "Candidat à l'examen",
  LeaveRequest: "Demande de congé",
  Document: "Document",
};

export function entityTypeLabel(entityType: string): string {
  return ENTITY_TYPE_LABELS[entityType] ?? entityType;
}
