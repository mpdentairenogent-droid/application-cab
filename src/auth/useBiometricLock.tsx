import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'biometric_lock_enabled';

interface BiometricLockContextValue {
  isSupported: boolean;
  isEnabled: boolean;
  isChecking: boolean;
  /** true si l'app doit rester derrière un écran de déverrouillage. */
  isLocked: boolean;
  unlock: () => Promise<boolean>;
  setEnabled: (next: boolean) => Promise<boolean>;
}

const BiometricLockContext = createContext<BiometricLockContextValue | undefined>(undefined);

/**
 * Verrou local devant une session déjà valide (§52) : ne remplace pas
 * l'authentification Supabase, protège juste la reprise à froid de l'app si
 * quelqu'un d'autre a le téléphone en main. Web n'a pas d'API biométrique —
 * la fonctionnalité y est silencieusement désactivée plutôt que plantée.
 *
 * Distingue une connexion fraîche (mot de passe qui vient d'être saisi, donc
 * pas besoin de redemander la biométrie tout de suite) d'une session restaurée
 * au démarrage à froid (verrouillée si l'option est active) via l'événement
 * Supabase 'SIGNED_IN' vs 'INITIAL_SESSION'. Contexte partagé (pas juste un
 * hook) car l'écran de réglages (Plus) et la garde racine doivent voir le
 * même état en mémoire.
 */
export function BiometricLockProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isHardwareReady, setIsHardwareReady] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (Platform.OS === 'web') {
      setIsChecking(false);
      return;
    }
    (async () => {
      const [hasHardware, isEnrolled, storedValue] = await Promise.all([
        LocalAuthentication.hasHardwareAsync(),
        LocalAuthentication.isEnrolledAsync(),
        SecureStore.getItemAsync(STORAGE_KEY),
      ]);
      setIsHardwareReady(hasHardware && isEnrolled);
      setIsEnabled(storedValue === 'true' && hasHardware && isEnrolled);
      setIsChecking(false);
    })();
  }, []);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') setIsUnlocked(true);
      if (event === 'SIGNED_OUT') setIsUnlocked(false);
    });
    return () => subscription.unsubscribe();
  }, []);

  const unlock = useCallback(async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Déverrouille l’application',
      cancelLabel: 'Annuler',
    });
    if (result.success) setIsUnlocked(true);
    return result.success;
  }, []);

  const setEnabled = useCallback(async (next: boolean) => {
    if (next) {
      const result = await LocalAuthentication.authenticateAsync({ promptMessage: 'Confirme pour activer le déverrouillage biométrique' });
      if (!result.success) return false;
    }
    await SecureStore.setItemAsync(STORAGE_KEY, String(next));
    setIsEnabled(next);
    return true;
  }, []);

  const value = useMemo<BiometricLockContextValue>(
    () => ({
      isSupported: Platform.OS !== 'web' && isHardwareReady,
      isEnabled,
      isChecking,
      isLocked: isEnabled && !isUnlocked,
      unlock,
      setEnabled,
    }),
    [isHardwareReady, isEnabled, isChecking, isUnlocked, unlock, setEnabled]
  );

  return <BiometricLockContext.Provider value={value}>{children}</BiometricLockContext.Provider>;
}

export function useBiometricLock() {
  const ctx = useContext(BiometricLockContext);
  if (!ctx) throw new Error('useBiometricLock doit être utilisé sous <BiometricLockProvider>.');
  return ctx;
}
