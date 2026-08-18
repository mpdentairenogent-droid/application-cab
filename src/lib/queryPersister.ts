import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

// Même garde SSR que src/lib/supabase.ts : AsyncStorage n'existe pas lors du
// premier rendu Node de l'export web d'Expo Router.
const isServerRendering = typeof window === 'undefined';

/**
 * §57 : sans ceci, les mutations mises en pause hors ligne (voir
 * queryClient.ts, networkMode 'online') seraient perdues si l'app est tuée
 * avant le retour de connexion — la persistance leur permet de reprendre et
 * de repartir automatiquement au prochain lancement.
 */
export const queryPersister = isServerRendering
  ? undefined
  : createAsyncStoragePersister({
      storage: AsyncStorage,
      key: 'cabinet-dentaire-query-cache',
    });
