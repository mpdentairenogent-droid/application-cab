import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import { StyleSheet, Text, View } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipSelect, DateField, MultiPickerField, PickerField, Sheet, TextField } from '@/components/ui';
import { ROLE_LABELS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '@/constants/taskLabels';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createTask, deleteTask, updateTask } from '@/services/tasks';
import { listActiveTeamMembers } from '@/services/team';
import type { AppRole, TaskRow } from '@/types/database';

const assignmentModeOptions = [
  { value: 'person' as const, label: 'Une personne' },
  { value: 'people' as const, label: 'Plusieurs personnes' },
  { value: 'role' as const, label: 'Un rôle' },
  { value: 'everyone' as const, label: 'Toute l\'équipe' },
];

const roleOptions = (Object.keys(ROLE_LABELS) as AppRole[]).map((value) => ({ value, label: ROLE_LABELS[value] }));

const taskSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire'),
  description: z.string(),
  priority: z.enum(['low', 'normal', 'high', 'urgent']),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']),
  dueDate: z.string().nullable(),
  assignmentMode: z.enum(['person', 'people', 'role', 'everyone']),
  responsibleId: z.string().nullable(),
  assigneeIds: z.array(z.string()),
  assignedRole: z.string().nullable(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

interface TaskFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  task?: TaskRow;
  existingAssigneeIds?: string[];
}

function defaultsFor(task?: TaskRow, existingAssigneeIds?: string[]): TaskFormValues {
  if (!task) {
    return {
      title: '',
      description: '',
      priority: 'normal',
      status: 'todo',
      dueDate: null,
      assignmentMode: 'person',
      responsibleId: null,
      assigneeIds: [],
      assignedRole: null,
    };
  }
  const assignmentMode = task.assigned_to_all ? 'everyone' : task.assigned_role ? 'role' : (existingAssigneeIds?.length ?? 0) > 0 ? 'people' : 'person';
  return {
    title: task.title,
    description: task.description ?? '',
    priority: task.priority,
    status: task.status,
    dueDate: task.due_date,
    assignmentMode,
    responsibleId: task.responsible_id,
    assigneeIds: existingAssigneeIds ?? [],
    assignedRole: task.assigned_role,
  };
}

export function TaskFormSheet({ visible, onClose, onSaved, task, existingAssigneeIds }: TaskFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const isEditing = !!task;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const teamQuery = useQuery({ queryKey: ['team-members'], queryFn: listActiveTeamMembers, enabled: visible });
  const teamOptions = (teamQuery.data ?? []).map((member) => ({ value: member.id, label: `${member.first_name} ${member.last_name}` }));

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormValues>({ resolver: zodResolver(taskSchema), defaultValues: defaultsFor(task, existingAssigneeIds) });

  useEffect(() => {
    if (visible) {
      reset(defaultsFor(task, existingAssigneeIds));
      setConfirmingDelete(false);
      setSubmitError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, task?.id]);

  const assignmentMode = watch('assignmentMode');

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const input = {
        title: values.title.trim(),
        description: values.description.trim() || null,
        priority: values.priority,
        dueDate: values.dueDate,
        createdBy: profile.id,
        assignmentMode: values.assignmentMode,
        responsibleId: values.responsibleId,
        assigneeIds: values.assigneeIds,
        assignedRole: values.assignedRole as AppRole | null,
      };
      if (isEditing) {
        await updateTask(task.id, { ...input, status: values.status });
      } else {
        await createTask(input);
      }
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleDelete() {
    if (!task) return;
    setIsSubmitting(true);
    try {
      await deleteTask(task.id);
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title={isEditing ? 'Modifier la tâche' : 'Nouvelle tâche'}
      footer={
        confirmingDelete ? (
          <View style={styles.confirmRow}>
            <Button label="Annuler" variant="outline" onPress={() => setConfirmingDelete(false)} />
            <Button label="Supprimer" variant="danger" onPress={handleDelete} loading={isSubmitting} />
          </View>
        ) : (
          <View style={styles.footerColumn}>
            {submitError ? <Text style={[styles.error, { color: theme.danger }]}>{submitError}</Text> : null}
            <Button label={isEditing ? 'Enregistrer' : 'Créer la tâche'} onPress={onSubmit} loading={isSubmitting} fullWidth />
            {isEditing ? <Button label="Supprimer la tâche" variant="ghost" onPress={() => setConfirmingDelete(true)} /> : null}
          </View>
        )
      }>
      <Controller
        control={control}
        name="title"
        render={({ field }) => (
          <TextField label="Titre" required value={field.value} onChangeText={field.onChange} error={errors.title?.message} placeholder="Ex. Commander gants taille S" />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field }) => <TextField label="Description" multiline value={field.value} onChangeText={field.onChange} placeholder="Détails optionnels" />}
      />

      <Controller
        control={control}
        name="priority"
        render={({ field }) => <ChipSelect label="Priorité" options={TASK_PRIORITY_OPTIONS} value={field.value} onChange={field.onChange} />}
      />

      {isEditing ? (
        <Controller
          control={control}
          name="status"
          render={({ field }) => <ChipSelect label="Statut" options={TASK_STATUS_OPTIONS} value={field.value} onChange={field.onChange} />}
        />
      ) : null}

      <Controller control={control} name="dueDate" render={({ field }) => <DateField label="Échéance" value={field.value} onChange={field.onChange} clearable />} />

      <Controller
        control={control}
        name="assignmentMode"
        render={({ field }) => <ChipSelect label="Assigner à" options={assignmentModeOptions} value={field.value} onChange={field.onChange} />}
      />

      {assignmentMode === 'person' ? (
        <Controller
          control={control}
          name="responsibleId"
          render={({ field }) => (
            <PickerField label="Personne responsable" options={teamOptions} value={field.value} onChange={field.onChange} clearable placeholder="Choisir une personne" />
          )}
        />
      ) : null}

      {assignmentMode === 'people' ? (
        <Controller
          control={control}
          name="assigneeIds"
          render={({ field }) => <MultiPickerField label="Personnes assignées" options={teamOptions} value={field.value} onChange={field.onChange} />}
        />
      ) : null}

      {assignmentMode === 'role' ? (
        <Controller
          control={control}
          name="assignedRole"
          render={({ field }) => <PickerField label="Rôle concerné" options={roleOptions} value={field.value} onChange={field.onChange} placeholder="Choisir un rôle" />}
        />
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  footerColumn: { gap: spacing.sm },
  confirmRow: { flexDirection: 'row', gap: spacing.sm },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
});