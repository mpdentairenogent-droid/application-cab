import type { Session } from '@supabase/supabase-js';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { supabase } from '@/lib/supabase';
import type { AppRole, ProfileRow } from '@/types/database';

interface AuthContextValue {
  session: Session | null;
  profile: ProfileRow | null;
  permissions: Set<string>;
  /** Session en cours de résolution (démarrage app) ou profil/permissions en cours de chargement. */
  isLoading: boolean;
  isSigningIn: boolean;
  /** Échec du chargement du profil/des permissions (ex. réseau indisponible) — distinct d'une absence de session. */
  profileError: unknown;
  retryProfile: () => void;
  /** true entre le clic sur un lien de réinitialisation et la saisie du nouveau mot de passe (§18). */
  isPasswordRecovery: boolean;
  clearPasswordRecovery: () => void;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  /**
   * TODO(retirer avant publication) : le paramètre `role` permet à
   * l'inscription publique de s'auto-attribuer n'importe quel rôle, y
   * compris owner_dentist/super_admin. Ajouté temporairement à la demande de
   * l'utilisateur pour créer le premier compte admin sans passer par la clé
   * service_role. Sans ce paramètre, le trigger handle_new_user retombe sur
   * 'assistant' — c'est ce comportement par défaut qu'il faut restaurer
   * (retirer le sélecteur de rôle de signup.tsx et ce paramètre) avant toute
   * publication publique de l'app.
   */
  signUp: (email: string, password: string, firstName: string, lastName: string, role?: AppRole) => Promise<{ error: string | null; needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<{ error: string | null }>;
  confirmPasswordReset: (newPassword: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function fetchProfileAndPermissions(userId: string) {
  const [{ data: profile, error: profileError }, { data: permissionRows, error: permissionsError }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.rpc('my_permissions'),
  ]);

  if (profileError) throw profileError;
  if (permissionsError) throw permissionsError;

  return {
    profile,
    permissions: new Set((permissionRows ?? []).map((row) => row.permission_code)),
  };
}

function translateAuthError(message: string): string {
  if (message.includes('Invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (message.includes('Email not confirmed')) return "Ce compte n'a pas encore été confirmé.";
  if (message.includes('User already registered')) return 'Un compte existe déjà avec cet email.';
  if (message.includes('Password should be at least')) return 'Le mot de passe doit faire au moins 8 caractères.';
  return 'Une erreur est survenue. Réessaie dans un instant.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isSessionResolved, setIsSessionResolved] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setIsSessionResolved(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
      }
      setSession(newSession);
      setIsSessionResolved(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const userId = session?.user.id;

  const profileQuery = useQuery({
    queryKey: ['auth-profile', userId],
    queryFn: () => fetchProfileAndPermissions(userId as string),
    enabled: !!userId,
    staleTime: 60_000,
  });

  const signIn: AuthContextValue['signIn'] = async (email, password) => {
    setIsSigningIn(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setIsSigningIn(false);
    return { error: error ? translateAuthError(error.message) : null };
  };

  const signUp: AuthContextValue['signUp'] = async (email, password, firstName, lastName, role) => {
    setIsSigningIn(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // `role` temporaire — voir TODO sur le type signUp ci-dessus. Sans
        // valeur, le trigger handle_new_user retombe sur 'assistant'.
        data: { first_name: firstName, last_name: lastName, ...(role ? { role } : {}) },
        emailRedirectTo: Linking.createURL('login'),
      },
    });
    setIsSigningIn(false);
    return {
      error: error ? translateAuthError(error.message) : null,
      needsEmailConfirmation: !error && !data.session,
    };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    queryClient.clear();
  };

  const requestPasswordReset: AuthContextValue['requestPasswordReset'] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: Linking.createURL('reset-password'),
    });
    return { error: error ? translateAuthError(error.message) : null };
  };

  const confirmPasswordReset: AuthContextValue['confirmPasswordReset'] = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (!error) setIsPasswordRecovery(false);
    return { error: error ? translateAuthError(error.message) : null };
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile: profileQuery.data?.profile ?? null,
      permissions: profileQuery.data?.permissions ?? new Set(),
      isLoading: !isSessionResolved || (!!userId && profileQuery.isPending),
      isSigningIn,
      profileError: profileQuery.error,
      retryProfile: () => profileQuery.refetch(),
      isPasswordRecovery,
      clearPasswordRecovery: () => setIsPasswordRecovery(false),
      signIn,
      signUp,
      signOut,
      requestPasswordReset,
      confirmPasswordReset,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, profileQuery.data, profileQuery.isPending, profileQuery.error, isSessionResolved, isSigningIn, isPasswordRecovery, userId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé sous <AuthProvider>.');
  return ctx;
}
