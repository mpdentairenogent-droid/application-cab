import type { StatusTone } from '@/constants/theme';
import type { OrderRow } from '@/types/database';

export const ORDER_STATUS_LABEL: Record<OrderRow['status'], string> = {
  to_order: 'À commander',
  ordered: 'Commandé',
  pending: 'En attente',
  partially_received: 'Partiellement reçu',
  received: 'Reçu',
  cancelled: 'Annulé',
};

export const ORDER_STATUS_TONE: Record<OrderRow['status'], StatusTone> = {
  to_order: 'neutral',
  ordered: 'info',
  pending: 'info',
  partially_received: 'warning',
  received: 'success',
  cancelled: 'danger',
};

export const ORDER_STATUS_OPTIONS = (Object.keys(ORDER_STATUS_LABEL) as OrderRow['status'][]).map((value) => ({
  value,
  label: ORDER_STATUS_LABEL[value],
}));
