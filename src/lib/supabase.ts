import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

import { env } from '@/config/env';
import type { Database } from '@/types/database';

// L'export web d'Expo Router fait un premier rendu côté Node (pas de
// `window`) pour produire le HTML initial — y compris en dev. React Native
// polyfille `window` sur natif (Hermes/JSC), donc ce check ne cible que le
// vrai SSR Node, jamais iOS/Android/navigateur réel. AsyncStorage y plante
// (`window is not defined`) : en SSR on ne fournit aucun storage, ce qui est
// sans conséquence puisqu'il n'existe de toute façon aucune session
// persistée côté serveur pour ce rendu initial.
const isServerRendering = typeof window === 'undefined';

export const supabase = createClient<Database>(env.EXPO_PUBLIC_SUPABASE_URL, env.EXPO_PUBLIC_SUPABASE_ANON_KEY, {
  auth: {
    storage: isServerRendering ? undefined : AsyncStorage,
    autoRefreshToken: !isServerRendering,
    persistSession: !isServerRendering,
    // L'app est mobile : pas de redirection OAuth via URL de navigateur à intercepter.
    detectSessionInUrl: false,
  },
});
