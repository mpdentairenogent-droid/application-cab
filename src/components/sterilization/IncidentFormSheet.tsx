import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Text } from 'react-native';
import { z } from 'zod';

import { useAuth } from '@/auth/AuthProvider';
import { Badge, Button, Sheet, TextField } from '@/components/ui';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { createIncident } from '@/services/sterilization';
import { listActiveTeamMembers } from '@/services/team';

const incidentSchema = z.object({
  description: z.string().min(1, 'La description est obligatoire'),
});

type IncidentFormValues = z.infer<typeof incidentSchema>;

interface IncidentFormSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  cycleId?: string;
}

/** §35 Cycle non conforme : alerte immédiate, description obligatoire, notification des titulaires. */
export function IncidentFormSheet({ visible, onClose, onSaved, cycleId }: IncidentFormSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<IncidentFormValues>({ resolver: zodResolver(incidentSchema), defaultValues: { description: '' }, values: visible ? { description: '' } : undefined });

  function handleClose() {
    setSubmitError(null);
    onClose();
  }

  const onSubmit = handleSubmit(async (values) => {
    if (!profile || !cycleId) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const team = await listActiveTeamMembers();
      const notifyUserIds = team.filter((m) => m.role === 'owner_dentist' || m.role === 'super_admin').map((m) => m.id);
      await createIncident({ cycle_id: cycleId, description: values.description.trim(), reported_by: profile.id }, notifyUserIds);
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      title="Cycle non conforme"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Enregistrer l'incident" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <Badge label="Ce cycle a été déclaré non conforme" tone="danger" />
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <TextField label="Description de l'incident" required multiline value={field.value} onChangeText={field.onChange} error={errors.description?.message} />
        )}
      />
    </Sheet>
  );
}