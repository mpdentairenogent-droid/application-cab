import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ChipSelect, DateField, Sheet, TextField } from '@/components/ui';
import { EVENT_TYPE_OPTIONS } from '@/constants/organizationLabels';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { toISODate } from '@/lib/format';
import { createEvent, deleteEvent, updateEvent } from '@/services/calendar';
import type { InternalEventRow } from '@/types/database';

const eventSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire'),
  eventType: z.enum(['maintenance', 'meeting', 'training', 'control', 'delivery', 'leave', 'other']),
  startsAt: z.string(),
  endsAt: z.string().nullable(),
  notes: z.string(),
});

type EventFormValues = z.infer<typeof eventSchema>;

function defaultsFor(event?: InternalEventRow): EventFormValues {
  if (!event) return { title: '', eventType: 'other', startsAt: toISODate(new Date()), endsAt: null, notes: '' };
  return {
    title: event.title,
    eventType: event.event_type,
    startsAt: toISODate(new Date(event.starts_at)),
    endsAt: event.ends_at ? toISODate(new Date(event.ends_at)) : null,
    notes: event.notes ?? '',
  };
}

function toTimestamp(dateStr: string): string {
  return new Date(`${dateStr}T09:00:00`).toISOString();
}

interface CalendarEventFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  event?: InternalEventRow;
  canDelete?: boolean;
}

/** §49 : calendrier interne — ouvert à tout le personnel actif (RLS is_active_staff), pas seulement titulaire/secrétariat. */
export function CalendarEventFormSheet({ visible, onClose, onSaved, event, canDelete }: CalendarEventFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const isEditing = !!event;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<EventFormValues>({ resolver: zodResolver(eventSchema), defaultValues: defaultsFor(event), values: visible ? defaultsFor(event) : undefined });

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!profile) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload = {
        title: values.title.trim(),
        event_type: values.eventType,
        starts_at: toTimestamp(values.startsAt),
        ends_at: values.endsAt ? toTimestamp(values.endsAt) : null,
        all_day: true,
        notes: values.notes.trim() || null,
      };
      if (isEditing) {
        await updateEvent(event.id, payload);
      } else {
        await createEvent({ ...payload, created_by: profile.id });
      }
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  async function handleDelete() {
    if (!event) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await deleteEvent(event.id);
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
      setIsSubmitting(false);
    }
  }

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title={isEditing ? "Modifier l'événement" : 'Nouvel événement'}
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Enregistrer" onPress={onSubmit} loading={isSubmitting} fullWidth />
          {isEditing && canDelete ? <Button label="Supprimer" variant="ghost" onPress={handleDelete} loading={isSubmitting} /> : null}
        </>
      }>
      <Controller control={control} name="title" render={({ field }) => <TextField label="Titre" required value={field.value} onChangeText={field.onChange} error={errors.title?.message} />} />
      <Controller
        control={control}
        name="eventType"
        render={({ field }) => <ChipSelect label="Type" options={EVENT_TYPE_OPTIONS} value={field.value} onChange={field.onChange} />}
      />
      <Controller control={control} name="startsAt" render={({ field }) => <DateField label="Date" value={field.value} onChange={field.onChange} />} />
      <Controller
        control={control}
        name="endsAt"
        render={({ field }) => <DateField label="Jusqu'au (optionnel, pour un congé par ex.)" value={field.value} onChange={field.onChange} clearable />}
      />
      <Controller control={control} name="notes" render={({ field }) => <TextField label="Notes (optionnel)" multiline value={field.value} onChangeText={field.onChange} />} />
    </Sheet>
  );
}
