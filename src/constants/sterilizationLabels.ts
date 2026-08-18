import type { StatusTone } from '@/constants/theme';
import type { SterilizationControlRow, SterilizationCycleRow, SterilizationIncidentRow } from '@/types/database';

export const CYCLE_RESULT_LABEL: Record<SterilizationCycleRow['result'], string> = {
  conforming: 'Conforme',
  non_conforming: 'Non conforme',
};

export const CYCLE_RESULT_TONE: Record<SterilizationCycleRow['result'], StatusTone> = {
  conforming: 'success',
  non_conforming: 'danger',
};

export const CYCLE_RESULT_OPTIONS = (Object.keys(CYCLE_RESULT_LABEL) as SterilizationCycleRow['result'][]).map((value) => ({
  value,
  label: CYCLE_RESULT_LABEL[value],
}));

export const INCIDENT_STATUS_LABEL: Record<SterilizationIncidentRow['status'], string> = {
  open: 'Ouvert',
  resolved: 'Résolu',
};

export const INCIDENT_STATUS_TONE: Record<SterilizationIncidentRow['status'], StatusTone> = {
  open: 'danger',
  resolved: 'success',
};

export const CONTROL_TYPE_LABEL: Record<SterilizationControlRow['control_type'], string> = {
  bowie_dick: 'Bowie-Dick',
  helix: 'Helix',
  penetration_test: 'Test de pénétration',
  quality_control: 'Contrôle qualité',
  filter_change: 'Changement de filtre',
  maintenance: 'Maintenance',
  periodic: 'Contrôle périodique',
};

export const CONTROL_TYPE_OPTIONS = (Object.keys(CONTROL_TYPE_LABEL) as SterilizationControlRow['control_type'][]).map((value) => ({
  value,
  label: CONTROL_TYPE_LABEL[value],
}));

export const CONTROL_RESULT_LABEL: Record<'pass' | 'fail', string> = {
  pass: 'Réussi',
  fail: 'Échoué',
};

export const CONTROL_RESULT_TONE: Record<'pass' | 'fail', StatusTone> = {
  pass: 'success',
  fail: 'danger',
};
