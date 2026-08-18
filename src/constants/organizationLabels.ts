import type { StatusTone } from '@/constants/theme';
import type { AbsenceRow, ChecklistTemplateRow, InternalEventRow } from '@/types/database';

export const CHECKLIST_CATEGORY_LABEL: Record<NonNullable<ChecklistTemplateRow['category']>, string> = {
  opening: 'Ouverture cabinet',
  closing: 'Fermeture cabinet',
  sterilization: 'Stérilisation',
  room_check: 'Contrôle salles',
  cleaning: 'Nettoyage',
  end_of_day: 'Fin de journée',
  weekly_check: 'Contrôle hebdomadaire',
  other: 'Autre',
};

export const CHECKLIST_CATEGORY_OPTIONS = (Object.keys(CHECKLIST_CATEGORY_LABEL) as NonNullable<ChecklistTemplateRow['category']>[]).map((value) => ({
  value,
  label: CHECKLIST_CATEGORY_LABEL[value],
}));

export const EVENT_TYPE_LABEL: Record<InternalEventRow['event_type'], string> = {
  maintenance: 'Maintenance',
  meeting: 'Réunion',
  training: 'Formation',
  control: 'Contrôle',
  delivery: 'Livraison',
  leave: 'Congé',
  other: 'Autre',
};

export const EVENT_TYPE_OPTIONS = (Object.keys(EVENT_TYPE_LABEL) as InternalEventRow['event_type'][]).map((value) => ({ value, label: EVENT_TYPE_LABEL[value] }));

export const EVENT_TYPE_TONE: Record<InternalEventRow['event_type'], StatusTone> = {
  maintenance: 'warning',
  meeting: 'info',
  training: 'info',
  control: 'warning',
  delivery: 'neutral',
  leave: 'success',
  other: 'neutral',
};

export const ABSENCE_TYPE_LABEL: Record<AbsenceRow['absence_type'], string> = {
  leave: 'Congé',
  training: 'Formation',
  sick: 'Arrêt maladie',
  recovery: 'Récupération',
  other: 'Autre',
};

export const ABSENCE_TYPE_OPTIONS = (Object.keys(ABSENCE_TYPE_LABEL) as AbsenceRow['absence_type'][]).map((value) => ({ value, label: ABSENCE_TYPE_LABEL[value] }));

export const ABSENCE_STATUS_LABEL: Record<AbsenceRow['status'], string> = {
  requested: 'Demandée',
  approved: 'Approuvée',
  rejected: 'Refusée',
};

export const ABSENCE_STATUS_TONE: Record<AbsenceRow['status'], StatusTone> = {
  requested: 'warning',
  approved: 'success',
  rejected: 'danger',
};
