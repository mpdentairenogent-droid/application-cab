import { z } from "zod";
import { PaymentType, PaymentMethod } from "@prisma/client";

export const paymentSchema = z.object({
  type: z.nativeEnum(PaymentType),
  serviceDescription: z.string().trim().min(1, "La prestation est obligatoire.").max(200),
  amount: z.number().positive("Le montant doit être supérieur à 0."),
  method: z.nativeEnum(PaymentMethod),
  paidAt: z.string().min(1, "La date est obligatoire."),
  reference: z.string().trim().max(100).optional().or(z.literal("")),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type PaymentInput = z.infer<typeof paymentSchema>;

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  PAIEMENT: "Paiement",
  REMBOURSEMENT: "Remboursement",
  AVOIR: "Avoir",
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  ESPECES: "Espèces",
  CB: "Carte bancaire",
  VIREMENT: "Virement",
  CHEQUE: "Chèque",
  PRELEVEMENT: "Prélèvement",
  FINANCEMENT_CPF: "Financement CPF",
  AUTRE: "Autre",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  EN_ATTENTE: "En attente",
  VALIDE: "Validé",
  REJETE: "Rejeté",
  ANNULE: "Annulé",
};
