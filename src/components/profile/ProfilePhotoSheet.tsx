import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Avatar, Button, PhotoPickerField, Sheet } from '@/components/ui';
import { typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import { resolvePhotoUrl } from '@/lib/storage';
import { updateTeamMember } from '@/services/team';
import type { ProfileRow } from '@/types/database';

interface ProfilePhotoSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  profile: ProfileRow;
}

export function ProfilePhotoSheet({ visible, onClose, onSaved, profile }: ProfilePhotoSheetProps) {
  const theme = useAppTheme();
  const [photoUri, setPhotoUri] = useState<string | null>(profile.avatar_url);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const onSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const avatarUrl = await resolvePhotoUrl('avatars', photoUri);
      await updateTeamMember(profile.id, { avatar_url: avatarUrl });
      onSaved();
    } catch (error) {
      setSubmitError(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="Photo de profil"
      footer={
        <>
          {submitError ? <Text style={{ fontSize: typography.size.sm, textAlign: 'center', color: theme.danger }}>{submitError}</Text> : null}
          <Button label="Enregistrer" onPress={onSubmit} loading={isSubmitting} fullWidth />
        </>
      }>
      <View style={styles.preview}>
        <Avatar firstName={profile.first_name} lastName={profile.last_name} imageUrl={photoUri} size={96} />
      </View>
      <PhotoPickerField label="Photo" value={photoUri} onChange={setPhotoUri} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  preview: { alignItems: 'center' },
});
