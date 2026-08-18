import type { StatusTone } from '@/constants/theme';
import type { BreakdownRow, EquipmentRow } from '@/types/database';

export const EQUIPMENT_STATUS_LABEL: Record<EquipmentRow['status'], string> = {
  functional: 'Fonctionnel',
  to_monitor: 'À surveiller',
  broken: 'En panne',
  maintenance_in_progress: 'Maintenance en cours',
  out_of_service: 'Hors service',
};

export const EQUIPMENT_STATUS_TONE: Record<EquipmentRow['status'], StatusTone> = {
  functional: 'success',
  to_monitor: 'warning',
  broken: 'danger',
  maintenance_in_progress: 'info',
  out_of_service: 'neutral',
};

export const EQUIPMENT_STATUS_OPTIONS = (Object.keys(EQUIPMENT_STATUS_LABEL) as EquipmentRow['status'][]).map((value) => ({
  value,
  label: EQUIPMENT_STATUS_LABEL[value],
}));

export const URGENCY_LABEL: Record<BreakdownRow['urgency'], string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Prioritaire',
  urgent: 'Urgente',
};

export const URGENCY_TONE: Record<BreakdownRow['urgency'], StatusTone> = {
  low: 'neutral',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

export const URGENCY_OPTIONS = (Object.keys(URGENCY_LABEL) as BreakdownRow['urgency'][]).map((value) => ({ value, label: URGENCY_LABEL[value] }));

export const BREAKDOWN_STATUS_LABEL: Record<BreakdownRow['status'], string> = {
  reported: 'Signalée',
  technician_to_contact: 'Technicien à contacter',
  technician_contacted: 'Technicien contacté',
  intervention_scheduled: 'Intervention programmée',
  in_repair: 'En réparation',
  resolved: 'Résolue',
};

export const BREAKDOWN_STATUS_TONE: Record<BreakdownRow['status'], StatusTone> = {
  reported: 'danger',
  technician_to_contact: 'warning',
  technician_contacted: 'warning',
  intervention_scheduled: 'info',
  in_repair: 'info',
  resolved: 'success',
};

export const BREAKDOWN_STATUS_OPTIONS = (Object.keys(BREAKDOWN_STATUS_LABEL) as BreakdownRow['status'][]).map((value) => ({
  value,
  label: BREAKDOWN_STATUS_LABEL[value],
}));
