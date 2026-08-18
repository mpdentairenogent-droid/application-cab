import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Badge, Button, ChipSelect, Divider, LoadingState, Sheet, TextField } from '@/components/ui';
import { PERMISSION_CATEGORY_LABEL, ROLE_LABELS } from '@/constants/permissions';
import { PRACTITIONER_COLORS } from '@/constants/practitionerColors';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { getErrorMessage } from '@/lib/errors';
import {
  clearUserPermissionOverride,
  getPractitioner,
  listPermissionsCatalog,
  listRolePermissionCodes,
  listUserPermissionOverrides,
  setUserPermissionOverride,
  updatePractitioner,
  updateTeamMember,
} from '@/services/team';
import type { AppRole, ProfileRow } from '@/types/database';

const ROLE_OPTIONS = (Object.keys(ROLE_LABELS) as AppRole[]).map((value) => ({ value, label: ROLE_LABELS[value] }));

interface TeamMemberDetailSheetProps {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  member?: ProfileRow;
}

/** §14-16 : le titulaire change rôle/statut et ajuste les dérogations de permissions individuelles d'un membre. */
export function TeamMemberDetailSheet({ visible, onClose, onSaved, member }: TeamMemberDetailSheetProps) {
  const theme = useAppTheme();
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [color, setColor] = useState<string>(PRACTITIONER_COLORS[0]);
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);

  const practitionerQuery = useQuery({
    queryKey: ['practitioner', member?.practitioner_id],
    queryFn: () => getPractitioner(member!.practitioner_id!),
    enabled: visible && !!member?.practitioner_id,
  });

  // Les champs identité ne sont pas pilotés par react-hook-form (ce fichier
  // ne l'utilise nulle part, cf. le ChipSelect rôle/statut à commit immédiat)
  // — resynchronise l'état local à l'ouverture ou au changement de membre.
  useEffect(() => {
    if (!visible || !member) return;
    setFirstName(member.first_name);
    setLastName(member.last_name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, member?.id, member?.first_name, member?.last_name]);

  useEffect(() => {
    if (practitionerQuery.data) setColor(practitionerQuery.data.color);
  }, [practitionerQuery.data]);

  const permissionsQuery = useQuery({ queryKey: ['permissions-catalog'], queryFn: listPermissionsCatalog, enabled: visible && showPermissions });
  const roleDefaultsQuery = useQuery({
    queryKey: ['role-permission-codes', member?.role],
    queryFn: () => listRolePermissionCodes(member!.role),
    enabled: visible && showPermissions && !!member,
  });
  const overridesQuery = useQuery({
    queryKey: ['user-permission-overrides', member?.id],
    queryFn: () => listUserPermissionOverrides(member!.id),
    enabled: visible && showPermissions && !!member,
  });

  if (!member) return null;

  const isSelf = member.id === profile?.id;

  function handleClose() {
    setError(null);
    setShowPermissions(false);
    onClose();
  }

  async function handleSaveIdentity() {
    if (!member) return;
    setIsSavingIdentity(true);
    setError(null);
    try {
      const trimmedFirst = firstName.trim();
      const trimmedLast = lastName.trim();
      await updateTeamMember(member.id, { first_name: trimmedFirst, last_name: trimmedLast });
      if (member.practitioner_id) {
        await updatePractitioner(member.practitioner_id, { first_name: trimmedFirst, last_name: trimmedLast, color });
        queryClient.invalidateQueries({ queryKey: ['practitioner', member.practitioner_id] });
      }
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSavingIdentity(false);
    }
  }

  async function handleRoleChange(role: AppRole) {
    if (!member) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateTeamMember(member.id, { role });
      queryClient.invalidateQueries({ queryKey: ['role-permission-codes'] });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function applyStatus(status: ProfileRow['status']) {
    if (!member) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await updateTeamMember(member.id, { status });
      onSaved();
    } catch (err) {
      setError(getErrorMessage(err));
      setIsSubmitting(false);
    }
  }

  function handleToggleStatus() {
    if (!member) return;
    if (member.status === 'active') {
      Alert.alert(
        'Désactiver ce compte ?',
        `${member.first_name} ${member.last_name} ne pourra plus se connecter à l'application tant que le compte n'est pas réactivé.`,
        [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Désactiver', style: 'destructive', onPress: () => applyStatus('inactive') },
        ]
      );
    } else {
      applyStatus('active');
    }
  }

  async function handleSetOverride(code: string, granted: boolean) {
    if (!member || !profile) return;
    try {
      await setUserPermissionOverride(member.id, code, granted, profile.id);
      queryClient.invalidateQueries({ queryKey: ['user-permission-overrides', member.id] });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  async function handleClearOverride(code: string) {
    if (!member) return;
    try {
      await clearUserPermissionOverride(member.id, code);
      queryClient.invalidateQueries({ queryKey: ['user-permission-overrides', member.id] });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  const overrideByCode = new Map((overridesQuery.data ?? []).map((o) => [o.permission_code, o]));
  const permissionsByCategory = new Map<string, typeof permissionsQuery.data>();
  for (const p of permissionsQuery.data ?? []) {
    const list = permissionsByCategory.get(p.category) ?? [];
    list.push(p);
    permissionsByCategory.set(p.category, list);
  }

  return (
    <Sheet visible={visible} onClose={handleClose} title={`${member.first_name} ${member.last_name}`}>
      <TextField label="Prénom" required value={firstName} onChangeText={setFirstName} />
      <TextField label="Nom" required value={lastName} onChangeText={setLastName} />

      {member.practitioner_id ? (
        <View style={styles.colorSection}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Couleur (CA, tableaux de bord)</Text>
          <View style={styles.colorRow}>
            {PRACTITIONER_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setColor(c)}
                accessibilityRole="button"
                accessibilityLabel={`Couleur ${c}`}
                style={[styles.swatch, { backgroundColor: c }, color === c ? { borderColor: theme.textPrimary, borderWidth: 3 } : null]}
              />
            ))}
          </View>
        </View>
      ) : null}

      <Button label="Enregistrer" variant="outline" onPress={handleSaveIdentity} loading={isSavingIdentity} />

      <Divider />

      <View style={styles.row}>
        <Text style={[styles.label, { color: theme.textSecondary }]}>Statut</Text>
        <Badge label={member.status === 'active' ? 'Actif' : 'Désactivé'} tone={member.status === 'active' ? 'success' : 'neutral'} />
      </View>

      <ChipSelect label="Rôle" options={ROLE_OPTIONS} value={member.role} onChange={handleRoleChange} />

      {error ? <Text style={[styles.error, { color: theme.danger }]}>{error}</Text> : null}

      <Button
        label={member.status === 'active' ? 'Désactiver ce compte' : 'Réactiver ce compte'}
        variant={member.status === 'active' ? 'danger' : 'primary'}
        onPress={handleToggleStatus}
        loading={isSubmitting}
        disabled={isSelf}
      />
      {isSelf ? <Text style={[styles.hint, { color: theme.textMuted }]}>Tu ne peux pas désactiver ton propre compte.</Text> : null}

      <Divider />

      <Pressable onPress={() => setShowPermissions((v) => !v)} style={styles.permToggle} accessibilityRole="button">
        <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>Permissions individuelles</Text>
        <Ionicons name={showPermissions ? 'chevron-up' : 'chevron-down'} size={20} color={theme.textSecondary} />
      </Pressable>

      {showPermissions ? (
        permissionsQuery.isLoading || roleDefaultsQuery.isLoading || overridesQuery.isLoading ? (
          <LoadingState label="Chargement..." />
        ) : (
          <View style={styles.permList}>
            <Text style={[styles.hint, { color: theme.textMuted }]}>
              Par défaut, un membre a les permissions de son rôle ({ROLE_LABELS[member.role]}). Ici, tu peux en accorder ou en retirer une en particulier.
            </Text>
            {[...permissionsByCategory.entries()].map(([category, perms]) => (
              <View key={category} style={styles.permCategory}>
                <Text style={[styles.permCategoryTitle, { color: theme.textSecondary }]}>{PERMISSION_CATEGORY_LABEL[category] ?? category}</Text>
                {(perms ?? []).map((permission) => {
                  const override = overrideByCode.get(permission.code);
                  const roleDefault = roleDefaultsQuery.data?.includes(permission.code) ?? false;
                  const effectiveGranted = override ? override.granted : roleDefault;
                  const state: 'default' | 'granted' | 'denied' = !override ? 'default' : override.granted ? 'granted' : 'denied';
                  return (
                    <View key={permission.code} style={styles.permRow}>
                      <View style={styles.permInfo}>
                        <Text style={[styles.permLabel, { color: theme.textPrimary }]}>{permission.description}</Text>
                        <Text style={[styles.permStatus, { color: effectiveGranted ? theme.success : theme.textMuted }]}>
                          {effectiveGranted ? 'Autorisé' : 'Non autorisé'}
                          {!override ? ' (rôle)' : ''}
                        </Text>
                      </View>
                      <View style={styles.permActions}>
                        <Pressable
                          onPress={() => handleClearOverride(permission.code)}
                          disabled={state === 'default'}
                          accessibilityRole="button"
                          accessibilityLabel="Revenir au comportement par défaut du rôle"
                          style={[styles.permBtn, { borderColor: state === 'default' ? theme.primary : theme.border, backgroundColor: state === 'default' ? theme.primaryTint : theme.surface }]}>
                          <Text style={[styles.permBtnLabel, { color: state === 'default' ? theme.primary : theme.textMuted }]}>Défaut</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => handleSetOverride(permission.code, true)}
                          accessibilityRole="button"
                          accessibilityLabel="Autoriser explicitement"
                          style={[styles.permIconBtn, { borderColor: state === 'granted' ? theme.success : theme.border, backgroundColor: state === 'granted' ? theme.successTint : theme.surface }]}>
                          <Ionicons name="checkmark" size={18} color={state === 'granted' ? theme.success : theme.textMuted} />
                        </Pressable>
                        <Pressable
                          onPress={() => handleSetOverride(permission.code, false)}
                          accessibilityRole="button"
                          accessibilityLabel="Refuser explicitement"
                          style={[styles.permIconBtn, { borderColor: state === 'denied' ? theme.danger : theme.border, backgroundColor: state === 'denied' ? theme.dangerTint : theme.surface }]}>
                          <Ionicons name="close" size={18} color={state === 'denied' ? theme.danger : theme.textMuted} />
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.xs },
  label: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  colorSection: { gap: spacing.xs },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: { width: 36, height: 36, borderRadius: 18 },
  hint: { fontSize: typography.size.xs },
  error: { fontSize: typography.size.sm, textAlign: 'center' },
  sectionTitle: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  permToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  permList: { gap: spacing.md },
  permCategory: { gap: spacing.xs },
  permCategoryTitle: { fontSize: typography.size.xs, fontWeight: typography.weight.semibold, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.xs },
  permRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs },
  permInfo: { flex: 1 },
  permLabel: { fontSize: typography.size.sm, fontWeight: typography.weight.medium },
  permStatus: { fontSize: typography.size.xs, marginTop: 2 },
  permActions: { flexDirection: 'row', gap: spacing.xs },
  permBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: spacing.sm, minHeight: 32, alignItems: 'center', justifyContent: 'center' },
  permBtnLabel: { fontSize: typography.size.xs, fontWeight: typography.weight.medium },
  permIconBtn: { borderWidth: 1.5, borderRadius: 8, width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
});
