import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { useEffect } from 'react';
import { StyleSheet, Text } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Button, ErrorState, LoadingState, ScreenContainer } from '@/components/ui';
import { spacing, typography } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { registerForPushNotificationsAsync } from '@/services/pushNotifications';

function TabIcon({ name, color }: { name: ComponentProps<typeof Ionicons>['name']; color: ComponentProps<typeof Ionicons>['color'] }) {
  return <Ionicons name={name} size={24} color={color} />;
}

function AccountInactiveScreen() {
  const theme = useAppTheme();
  const { signOut } = useAuth();
  return (
    <ScreenContainer scroll={false} style={styles.centered}>
      <Text style={[styles.inactiveTitle, { color: theme.textPrimary }]}>Compte désactivé</Text>
      <Text style={[styles.inactiveDescription, { color: theme.textSecondary }]}>
        Ton accès a été désactivé par un titulaire du cabinet. Contacte-le si tu penses qu&apos;il s&apos;agit d&apos;une erreur.
      </Text>
      <Button label="Se déconnecter" variant="outline" onPress={signOut} />
    </ScreenContainer>
  );
}

export default function AppLayout() {
  const { profile, isLoading, profileError, retryProfile, signOut } = useAuth();
  const theme = useAppTheme();

  // Doit rester avant tout "return" conditionnel (règle des hooks) — la
  // logique d'activation reste, elle, conditionnelle à l'intérieur.
  useEffect(() => {
    if (!profile || profile.status !== 'active') return;
    registerForPushNotificationsAsync(profile.id).catch(() => {
      // Échec silencieux (permission refusée, projet EAS non configuré...) : ne bloque jamais l'usage de l'app.
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id, profile?.status]);

  if (isLoading) return <LoadingState label="Chargement du profil..." />;

  if (profileError || !profile) {
    return (
      <ScreenContainer scroll={false} style={styles.centered}>
        <ErrorState
          title="Impossible de charger ton profil"
          description="Vérifie ta connexion internet et réessaie. Si le problème persiste après plusieurs essais, ton compte a peut-être changé entre-temps — déconnecte-toi et reconnecte-toi."
          onRetry={retryProfile}
        />
        {/* Filet de sécurité : une session valide mais dont le compte a été supprimé/recréé
            entre-temps (ex. après une purge de données) reste bloquée ici pour toujours sans
            ça — "Réessayer" échoue indéfiniment puisqu'il n'y a jamais eu de souci réseau. */}
        <Button label="Se déconnecter" variant="ghost" onPress={signOut} />
      </ScreenContainer>
    );
  }

  if (profile.status !== 'active') {
    return <AccountInactiveScreen />;
  }

  const { role } = profile;
  const isOwnerLike = role === 'owner_dentist' || role === 'super_admin';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
        tabBarStyle: { backgroundColor: theme.surface, borderTopColor: theme.border },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Accueil', tabBarIcon: ({ color }) => <TabIcon name="home" color={color} /> }} />

      {/* href:null (pas Tabs.Protected) : seul le titulaire a un onglet dédié
          Finances — un comptable/secrétariat autorisé au cas par cas (§15)
          sur une permission finance doit quand même pouvoir atteindre la
          route, la garde réelle reste RLS + vérifications côté écran. */}
      <Tabs.Screen
        name="finances"
        options={{ title: 'Finances', tabBarIcon: ({ color }) => <TabIcon name="cash-outline" color={color} />, href: isOwnerLike ? undefined : null }}
      />

      <Tabs.Protected guard={role === 'collaborator_dentist' || isOwnerLike}>
        <Tabs.Screen
          name="activity"
          options={{
            title: role === 'collaborator_dentist' ? 'Mon activité' : 'Activité',
            tabBarIcon: ({ color }) => <TabIcon name="stats-chart-outline" color={color} />,
          }}
        />
      </Tabs.Protected>

      {/* Le titulaire n'a pas d'onglet Tâches dédié dans le cahier des
          charges (§23 : Accueil/Finances/Activité/Équipe/Plus, 5 max) — il
          garde un aperçu "Tâches de l'équipe" sur son dashboard à la place. */}
      <Tabs.Protected guard={role === 'assistant' || role === 'collaborator_dentist' || role === 'admin_staff'}>
        <Tabs.Screen name="tasks" options={{ title: 'Tâches', tabBarIcon: ({ color }) => <TabIcon name="checkbox-outline" color={color} /> }} />
      </Tabs.Protected>

      {/* href:null (pas Tabs.Protected) : seule l'assistante a un onglet
          dédié Stock (5 onglets max, §23) — titulaire/collaborateur peuvent
          quand même consulter le stock et créer des demandes de matériel
          (§28) via le lien "Stock" dans Plus, la route doit donc rester
          atteignable pour eux même sans bouton d'onglet. */}
      <Tabs.Screen
        name="stock"
        options={{ title: 'Stock', tabBarIcon: ({ color }) => <TabIcon name="cube-outline" color={color} />, href: role === 'assistant' ? undefined : null }}
      />

      {/* href:null (pas Tabs.Protected) : seule l'assistante a un onglet
          dédié Stérilisation (5 onglets max, §23) — titulaire/collaborateur
          gardent un accès lecture via "Plus", la route doit donc rester
          atteignable pour eux même sans bouton d'onglet. */}
      <Tabs.Screen
        name="sterilization"
        options={{
          title: 'Stérilisation',
          tabBarIcon: ({ color }) => <TabIcon name="water-outline" color={color} />,
          href: role === 'assistant' ? undefined : null,
        }}
      />

      {/* href:null (pas Tabs.Protected) : titulaire/secrétariat composent
          les annonces via le lien "Communication" dans Plus plutôt qu'un
          6e onglet — mais la route doit rester atteignable pour eux. */}
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => <TabIcon name="chatbubbles-outline" color={color} />,
          href: role === 'collaborator_dentist' ? undefined : null,
        }}
      />

      <Tabs.Protected guard={isOwnerLike}>
        <Tabs.Screen name="team" options={{ title: 'Équipe', tabBarIcon: ({ color }) => <TabIcon name="people-outline" color={color} /> }} />
      </Tabs.Protected>

      <Tabs.Screen
        name="more"
        options={{ title: 'Plus', tabBarIcon: ({ color }) => <TabIcon name="ellipsis-horizontal-circle-outline" color={color} /> }}
      />

      {/* Accessibles depuis les dashboards/Plus, mais pas des onglets à part
          entière — le cahier des charges (§23) ne prévoit que 5 onglets max
          par rôle. */}
      <Tabs.Screen name="post-its" options={{ href: null }} />
      <Tabs.Screen name="suppliers" options={{ href: null }} />
      <Tabs.Screen name="orders" options={{ href: null }} />
      <Tabs.Screen name="equipment" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="checklists" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="absences" options={{ href: null }} />
      <Tabs.Screen name="notifications" options={{ href: null }} />
      <Tabs.Screen name="scan-qr" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  centered: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  inactiveTitle: { fontSize: typography.size.xl, fontWeight: typography.weight.bold, textAlign: 'center' },
  inactiveDescription: { fontSize: typography.size.base, textAlign: 'center', maxWidth: 320 },
});
