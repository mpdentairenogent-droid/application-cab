import { z } from "zod";
import { DocumentCategory } from "@prisma/client";

export const documentMetadataSchema = z.object({
  category: z.nativeEnum(DocumentCategory),
  expiresAt: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type DocumentMetadataInput = z.infer<typeof documentMetadataSchema>;

/**
 * Catégories systématiquement attendues pour un dossier élève. Liste volontairement
 * minimale (le cahier des charges en prévoit davantage, certaines conditionnelles — ex.
 * ASSR/recensement/JDC pour un mineur uniquement) : point d'extension pour une règle plus
 * fine par la suite, sans changer la mécanique de contrôle elle-même.
 */
export const STUDENT_REQUIRED_DOCUMENT_CATEGORIES: (typeof DocumentCategory)[keyof typeof DocumentCategory][] = [
  DocumentCategory.PIECE_IDENTITE,
  DocumentCategory.JUSTIFICATIF_DOMICILE,
  DocumentCategory.PHOTO,
];

export const DOCUMENT_CATEGORY_LABELS: Record<string, string> = {
  PIECE_IDENTITE: "Pièce d'identité",
  JUSTIFICATIF_DOMICILE: "Justificatif de domicile",
  PHOTO: "Photo",
  ASSR: "ASSR",
  RECENSEMENT: "Attestation de recensement",
  JDC: "JDC",
  PERMIS_EXISTANT: "Permis existant",
  MANDAT_CONTRAT: "Mandat ou contrat",
  CONTRAT_TRAVAIL: "Contrat de travail",
  DIPLOME_QUALIFICATION: "Diplôme ou qualification",
  CONTRAT_VEHICULE: "Contrat véhicule",
  ASSURANCE_VEHICULE: "Assurance véhicule",
  FACTURE_ENTRETIEN: "Facture d'entretien",
  BULLETIN_PAIE: "Bulletin de paie",
  JUSTIFICATIF_CONGE: "Justificatif de congé",
  PIECE_EXAMEN: "Pièce d'examen",
  RECU_PAIEMENT: "Reçu de paiement",
  AUTRE: "Autre",
};
