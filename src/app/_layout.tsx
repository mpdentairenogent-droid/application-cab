import { QueryClientProvider } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { BiometricLockScreen } from '@/auth/BiometricLockScreen';
import { BiometricLockProvider, useBiometricLock } from '@/auth/useBiometricLock';
import { OfflineBanner } from '@/components/OfflineBanner';
import { queryClient, setupOnlineManager } from '@/lib/queryClient';
import { queryPersister } from '@/lib/queryPersister';

setupOnlineManager();

SplashScreen.preventAutoHideAsync();

// §52 : notifications reçues app ouverte — affichées quand même (banniere +
// son), pas de digest ici, la préférence "urgent uniquement" est appliquée
// côté serveur (voir migration 0020) avant même l'envoi du push.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

function RootNavigator() {
  const { isLoading, session, isPasswordRecovery } = useAuth();
  const biometricLock = useBiometricLock();

  useEffect(() => {
    if (!isLoading && !biometricLock.isChecking) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, biometricLock.isChecking]);

  if (isLoading || biometricLock.isChecking) {
    // Le splash natif reste affiché tant que la session (et le statut du verrou biométrique) n'est pas résolue.
    return null;
  }

  if (session && !isPasswordRecovery && biometricLock.isLocked) {
    return <BiometricLockScreen onUnlock={biometricLock.unlock} />;
  }

  return (
    <View style={{ flex: 1 }}>
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false }}>
        {/* Un lien de réinitialisation ouvre une session temporaire : ce cas
            doit être vérifié avant le routage normal session/pas-session,
            sinon l'utilisateur atterrirait dans (app) sans avoir changé son
            mot de passe. */}
        <Stack.Protected guard={isPasswordRecovery}>
          <Stack.Screen name="reset-password" />
        </Stack.Protected>
        <Stack.Protected guard={!isPasswordRecovery && !session}>
          <Stack.Screen name="login" />
          <Stack.Screen name="forgot-password" />
          <Stack.Screen name="signup" />
        </Stack.Protected>
        <Stack.Protected guard={!isPasswordRecovery && !!session}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
      </Stack>
    </View>
  );
}

function Providers({ children }: { children: ReactNode }) {
  // §57 : persiste le cache de lecture (AsyncStorage) pour qu'un retour à
  // froid hors ligne affiche quand même les dernières données connues,
  // plutôt qu'un écran vide. queryPersister est absent lors du rendu SSR web
  // (pas d'AsyncStorage côté Node) — dans ce cas, provider non persistant.
  if (!queryPersister) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: 24 * 60 * 60_000,
        // Invalide tout cache déjà persisté avant chaque nouvelle exclusion
        // ci-dessous (sans ça, une entrée déjà corrompue — un Set devenu {}
        // après une sérialisation JSON — resterait lue au démarrage suivant).
        buster: 'v3-exclude-role-permission-codes',
        // auth-profile (permissions) et role-permission-codes (TeamMemberDetailSheet)
        // ont tous les deux porté un Set un jour, qui ne survit pas à une
        // sérialisation JSON (redevient un objet vide au réhydratage — a fait
        // planter can()/permissions.has puis roleDefaultsQuery.data.includes).
        // Ces deux requêtes se rechargent de toute façon très vite : pas besoin
        // de les mettre en cache hors-ligne. Toute future requête dont la donnée
        // n'est pas un JSON "plat" (Set/Map/classe) doit être ajoutée ici plutôt
        // que servir de prochaine surprise.
        dehydrateOptions: { shouldDehydrateQuery: (query) => query.queryKey[0] !== 'auth-profile' && query.queryKey[0] !== 'role-permission-codes' },
      }}>
      {children}
    </PersistQueryClientProvider>
  );
}

export default function RootLayout() {
  return (
    // Requis par react-native-gesture-handler (glisser-déposer du tableau des
    // demandes de matériel, §28) — doit englober toute l'app, le plus haut possible.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Providers>
          <AuthProvider>
            <BiometricLockProvider>
              <StatusBar style="auto" />
              <RootNavigator />
            </BiometricLockProvider>
          </AuthProvider>
        </Providers>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
