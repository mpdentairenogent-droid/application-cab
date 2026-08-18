import type { StatusTone } from '@/constants/theme';
import type { TaskRow } from '@/types/database';

export const TASK_PRIORITY_TONE: Record<TaskRow['priority'], StatusTone> = {
  low: 'neutral',
  normal: 'info',
  high: 'warning',
  urgent: 'danger',
};

export const TASK_PRIORITY_LABEL: Record<TaskRow['priority'], string> = {
  low: 'Basse',
  normal: 'Normale',
  high: 'Haute',
  urgent: 'Urgente',
};

export const TASK_PRIORITY_OPTIONS = (Object.keys(TASK_PRIORITY_LABEL) as TaskRow['priority'][]).map((value) => ({
  value,
  label: TASK_PRIORITY_LABEL[value],
}));

export const TASK_STATUS_TONE: Record<TaskRow['status'], StatusTone> = {
  todo: 'neutral',
  in_progress: 'info',
  blocked: 'danger',
  done: 'success',
};

export const TASK_STATUS_LABEL: Record<TaskRow['status'], string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  blocked: 'Bloqué',
  done: 'Terminé',
};

export const TASK_STATUS_OPTIONS = (Object.keys(TASK_STATUS_LABEL) as TaskRow['status'][]).map((value) => ({
  value,
  label: TASK_STATUS_LABEL[value],
}));
