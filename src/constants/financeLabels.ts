import type { ExpenseRow, FinancialTargetRow, RevenueEntryDetailRow } from '@/types/database';

export const EXPENSE_CATEGORY_LABEL: Record<ExpenseRow['category'], string> = {
  consumables: 'Consommables',
  equipment: 'Matériel',
  laboratory: 'Laboratoire',
  staff: 'Personnel',
  maintenance: 'Maintenance',
  it: 'Informatique',
  rent: 'Loyer',
  insurance: 'Assurance',
  subscription: 'Abonnement',
  other: 'Autres',
};

export const EXPENSE_CATEGORY_OPTIONS = (Object.keys(EXPENSE_CATEGORY_LABEL) as ExpenseRow['category'][]).map((value) => ({
  value,
  label: EXPENSE_CATEGORY_LABEL[value],
}));

export const PAYMENT_METHOD_OPTIONS = [
  { value: 'card', label: 'Carte' },
  { value: 'transfer', label: 'Virement' },
  { value: 'check', label: 'Chèque' },
  { value: 'cash', label: 'Espèces' },
  { value: 'direct_debit', label: 'Prélèvement' },
];

export const TARGET_PERIOD_LABEL: Record<FinancialTargetRow['period_type'], string> = {
  daily: 'Journalier',
  monthly: 'Mensuel',
  yearly: 'Annuel',
};

export const TARGET_PERIOD_OPTIONS = (Object.keys(TARGET_PERIOD_LABEL) as FinancialTargetRow['period_type'][]).map((value) => ({
  value,
  label: TARGET_PERIOD_LABEL[value],
}));

export const PROCEDURE_TYPE_LABEL: Record<RevenueEntryDetailRow['procedure_type'], string> = {
  soins: 'Soins',
  prosthesis: 'Prothèse',
  implant: 'Implant',
  surgery: 'Chirurgie',
  orthodontics: 'Orthodontie',
  periodontics: 'Parodontologie',
  esthetics: 'Esthétique',
  other: 'Autre',
};

export const PROCEDURE_TYPE_OPTIONS = (Object.keys(PROCEDURE_TYPE_LABEL) as RevenueEntryDetailRow['procedure_type'][]).map((value) => ({
  value,
  label: PROCEDURE_TYPE_LABEL[value],
}));
