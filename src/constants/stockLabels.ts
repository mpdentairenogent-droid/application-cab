import type { StatusTone } from '@/constants/theme';
import type { MaterialRequestRow, StockMovementRow } from '@/types/database';

export const URGENCY_LABEL: Record<MaterialRequestRow['urgency'], string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Prioritaire',
  urgent: 'Urgent',
};

export const URGENCY_TONE: Record<MaterialRequestRow['urgency'], StatusTone> = {
  low: 'neutral',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

export const URGENCY_OPTIONS = (Object.keys(URGENCY_LABEL) as MaterialRequestRow['urgency'][]).map((value) => ({
  value,
  label: URGENCY_LABEL[value],
}));

export const MATERIAL_REQUEST_STATUS_LABEL: Record<MaterialRequestRow['status'], string> = {
  pending_approval: 'À valider',
  to_order: 'À commander',
  ordered: 'Commandé',
  partially_received: 'Partiellement reçu',
  received: 'Reçu',
  rejected: 'Refusé',
};

export const MATERIAL_REQUEST_STATUS_TONE: Record<MaterialRequestRow['status'], StatusTone> = {
  pending_approval: 'neutral',
  to_order: 'info',
  ordered: 'info',
  partially_received: 'warning',
  received: 'success',
  rejected: 'danger',
};

export const MATERIAL_REQUEST_STATUS_OPTIONS = (Object.keys(MATERIAL_REQUEST_STATUS_LABEL) as MaterialRequestRow['status'][]).map((value) => ({
  value,
  label: MATERIAL_REQUEST_STATUS_LABEL[value],
}));

export const MOVEMENT_TYPE_LABEL: Record<StockMovementRow['movement_type'], string> = {
  in: 'Entrée',
  out: 'Sortie',
  correction: 'Correction',
  order_reception: 'Réception commande',
  loss: 'Perte',
  expired: 'Périmé',
};

export const MOVEMENT_TYPE_OPTIONS = (Object.keys(MOVEMENT_TYPE_LABEL) as StockMovementRow['movement_type'][]).map((value) => ({
  value,
  label: MOVEMENT_TYPE_LABEL[value],
}));
