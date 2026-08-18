import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Constants from 'expo-constants';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { useBiometricLock } from '@/auth/useBiometricLock';
import { ProfilePhotoSheet } from '@/components/profile/ProfilePhotoSheet';
import { Avatar, Badge, Button, Card, Divider, LoadingState, ScreenContainer } from '@/components/ui';
import { PERMISSIONS, ROLE_LABELS } from '@/constants/permissions';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { usePermissions } from '@/permissions/usePermissions';
import { getAppSettings } from '@/services/appSettings';
import { countUnreadNotifications } from '@/services/notifications';

type MenuHref =
  | '/post-its'
  | '/messages'
  | '/stock'
  | '/suppliers'
  | '/orders'
  | '/sterilization'
  | '/equipment'
  | '/finances'
  | '/documents'
  | '/checklists'
  | '/calendar'
  | '/absences'
  | '/notifications';

function MenuRow({ href, icon, label, badgeCount }: { href: MenuHref; icon: keyof typeof Ionicons.glyphMap; label: string; badgeCount?: number }) {
  const theme = useAppTheme();
  return (
    <Link href={href} asChild>
      <Pressable style={styles.menuRow}>
        <Ionicons name={icon} size={20} color={theme.textSecondary} />
        <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>{label}</Text>
        {badgeCount ? <Badge label={String(badgeCount)} tone="danger" /> : null}
        <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
      </Pressable>
    </Link>
  );
}

export default function MoreScreen() {
  const theme = useAppTheme();
  const { profile, signOut } = useAuth();
  const { can } = usePermissions();
  const biometricLock = useBiometricLock();
  const queryClient = useQueryClient();
  const [isPhotoSheetVisible, setIsPhotoSheetVisible] = useState(false);
  const settingsQuery = useQuery({ queryKey: ['app-settings'], queryFn: getAppSettings });
  const unreadQuery = useQuery({ queryKey: ['notifications-unread-count'], queryFn: countUnreadNotifications, enabled: !!profile });

  if (!profile) return null;

  const canViewOrders = can(PERMISSIONS.VIEW_ORDERS);
  // L'assistante a déjà un onglet Stock dédié — inutile de dupliquer le lien ici.
  const showStockLink = profile.role !== 'assistant' && can(PERMISSIONS.VIEW_STOCK);
  const canViewEquipment = can(PERMISSIONS.VIEW_EQUIPMENT);
  const canViewDocuments = can(PERMISSIONS.VIEW_DOCUMENTS);
  const showSterilizationLink = profile.role !== 'assistant' && can(PERMISSIONS.VIEW_STERILIZATION);
  const isOwnerLike = profile.role === 'owner_dentist' || profile.role === 'super_admin';
  const showFinancesLink =
    !isOwnerLike &&
    (can(PERMISSIONS.VIEW_ACCOUNTING) || can(PERMISSIONS.VIEW_ALL_REVENUE) || can(PERMISSIONS.VIEW_OWN_REVENUE) || can(PERMISSIONS.VIEW_EXPENSES));

  return (
    <ScreenContainer>
      <View style={styles.profileHeader}>
        <Pressable onPress={() => setIsPhotoSheetVisible(true)} accessibilityRole="button" accessibilityLabel="Changer la photo de profil">
          <Avatar firstName={profile.first_name} lastName={profile.last_name} imageUrl={profile.avatar_url} size={56} />
          <View style={[styles.editBadge, { backgroundColor: theme.primary, borderColor: theme.background }]}>
            <Ionicons name="camera" size={12} color={theme.textOnPrimary} />
          </View>
        </Pressable>
        <View>
          <Text style={[styles.name, { color: theme.textPrimary }]}>
            {profile.first_name} {profile.last_name}
          </Text>
          <Text style={[styles.role, { color: theme.textSecondary }]}>{ROLE_LABELS[profile.role]}</Text>
        </View>
      </View>

      <ProfilePhotoSheet
        visible={isPhotoSheetVisible}
        onClose={() => setIsPhotoSheetVisible(false)}
        profile={profile}
        onSaved={() => {
          setIsPhotoSheetVisible(false);
          queryClient.invalidateQueries({ queryKey: ['auth-profile', profile.id] });
        }}
      />

      <Card>
        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Cabinet</Text>
        {settingsQuery.isLoading ? (
          <LoadingState label="Chargement..." />
        ) : (
          <>
            <Text style={[styles.cabinetName, { color: theme.textPrimary }]}>{settingsQuery.data?.cabinet_name}</Text>
            {settingsQuery.data?.address ? (
              <Text style={[styles.cabinetDetail, { color: theme.textSecondary }]}>{settingsQuery.data.address}</Text>
            ) : null}
            {settingsQuery.data?.phone ? (
              <Text style={[styles.cabinetDetail, { color: theme.textSecondary }]}>{settingsQuery.data.phone}</Text>
            ) : null}
            {settingsQuery.data?.email ? (
              <Text style={[styles.cabinetDetail, { color: theme.textSecondary }]}>{settingsQuery.data.email}</Text>
            ) : null}
          </>
        )}
      </Card>

      <Card padded={false}>
        <MenuRow href="/notifications" icon="notifications-outline" label="Notifications" badgeCount={unreadQuery.data} />
        <Divider spacing={0} />
        <MenuRow href="/post-its" icon="bookmark-outline" label="Post-it" />
        {profile.role === 'owner_dentist' || profile.role === 'admin_staff' || profile.role === 'super_admin' ? (
          <>
            <Divider spacing={0} />
            <MenuRow href="/messages" icon="chatbubbles-outline" label="Communication interne" />
          </>
        ) : null}
        {showStockLink ? (
          <>
            <Divider spacing={0} />
            <MenuRow href="/stock" icon="cube-outline" label="Stock" />
          </>
        ) : null}
        {canViewOrders ? (
          <>
            <Divider spacing={0} />
            <MenuRow href="/suppliers" icon="business-outline" label="Fournisseurs" />
            <Divider spacing={0} />
            <MenuRow href="/orders" icon="cart-outline" label="Commandes" />
          </>
        ) : null}
        {showSterilizationLink ? (
          <>
            <Divider spacing={0} />
            <MenuRow href="/sterilization" icon="water-outline" label="Stérilisation" />
          </>
        ) : null}
        {canViewEquipment ? (
          <>
            <Divider spacing={0} />
            <MenuRow href="/equipment" icon="hardware-chip-outline" label="Équipements" />
          </>
        ) : null}
        {showFinancesLink ? (
          <>
            <Divider spacing={0} />
            <MenuRow href="/finances" icon="cash-outline" label="Finances" />
          </>
        ) : null}
      </Card>

      <Card padded={false}>
        {canViewDocuments ? (
          <>
            <MenuRow href="/documents" icon="document-text-outline" label="Documents" />
            <Divider spacing={0} />
          </>
        ) : null}
        <MenuRow href="/checklists" icon="checkbox-outline" label="Check-lists" />
        <Divider spacing={0} />
        <MenuRow href="/calendar" icon="calendar-outline" label="Calendrier" />
        <Divider spacing={0} />
        <MenuRow href="/absences" icon="airplane-outline" label="Absences" />
      </Card>

      {biometricLock.isSupported ? (
        <Card padded={false}>
          <Pressable style={styles.menuRow} onPress={() => biometricLock.setEnabled(!biometricLock.isEnabled)} accessibilityRole="switch" accessibilityState={{ checked: biometricLock.isEnabled }}>
            <Ionicons name="finger-print-outline" size={20} color={theme.textSecondary} />
            <Text style={[styles.menuLabel, { color: theme.textPrimary }]}>Déverrouillage biométrique</Text>
            <Ionicons name={biometricLock.isEnabled ? 'toggle' : 'toggle-outline'} size={28} color={biometricLock.isEnabled ? theme.primary : theme.textMuted} />
          </Pressable>
        </Card>
      ) : null}

      <Divider spacing={0} />

      <Button label="Se déconnecter" variant="outline" onPress={signOut} />

      <Text style={[styles.version, { color: theme.textMuted }]}>Version {Constants.expoConfig?.version ?? '1.0.0'}</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
  menuLabel: { flex: 1, fontSize: typography.size.base, fontWeight: typography.weight.medium },
  name: { fontSize: typography.size.lg, fontWeight: typography.weight.semibold },
  role: { fontSize: typography.size.sm },
  sectionTitle: {
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: spacing.xs,
  },
  cabinetName: { fontSize: typography.size.base, fontWeight: typography.weight.semibold },
  cabinetDetail: { fontSize: typography.size.sm },
  version: { fontSize: typography.size.xs, textAlign: 'center' },
});
