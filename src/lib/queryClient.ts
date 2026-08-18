import NetInfo from '@react-native-community/netinfo';
import { onlineManager, QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * §57 : sans ce branchement, TanStack Query se fie à `navigator.onLine`, qui
 * n'existe pas côté natif et laisserait les requêtes se croire "en ligne" en
 * permanence — elles tenteraient (et échoueraient) en boucle au lieu de se
 * mettre en pause proprement pendant une coupure, puis de reprendre au retour
 * du réseau. NetInfo donne le vrai statut réseau du téléphone.
 *
 * Ne couvre que les lectures (useQuery) : les écritures de ce projet
 * n'utilisent pas useMutation (voir chaque *FormSheet), donc échouent
 * immédiatement avec un message clair si le réseau est coupé plutôt que
 * d'être mises en file d'attente — voir OfflineBanner pour le choix assumé.
 */
export function setupOnlineManager() {
  return NetInfo.addEventListener((state) => {
    onlineManager.setOnline(!!state.isConnected && state.isInternetReachable !== false);
  });
}
