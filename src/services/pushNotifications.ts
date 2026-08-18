import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

/**
 * §52 : enregistrement du token push. Nécessite un projet EAS lié
 * (`extra.eas.projectId`) pour obtenir un token Expo valide — ce projet n'a
 * pas encore été initialisé avec `eas init` (compte Expo de l'utilisateur,
 * pas quelque chose que je peux faire à sa place). Échoue silencieusement
 * (log + retour null) tant que ce n'est pas fait, plutôt que de planter l'app.
 */
export async function registerForPushNotificationsAsync(userId: string): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('registerForPushNotificationsAsync: aucun extra.eas.projectId — exécuter `eas init` avant que les notifications push ne puissent fonctionner.');
    return null;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', { name: 'default', importance: Notifications.AndroidImportance.DEFAULT });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  const { error } = await supabase.from('device_tokens').upsert({ user_id: userId, expo_push_token: token, platform: Platform.OS as 'ios' | 'android' }, { onConflict: 'expo_push_token' });
  if (error) throw error;

  return token;
}

export async function getNotificationPreferences(userId: string) {
  const { data, error } = await supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data;
}

export async function setNotificationPreferences(userId: string, input: { categoriesEnabled?: Record<string, boolean>; urgentOnly?: boolean }) {
  const payload: { user_id: string; categories_enabled?: Record<string, boolean>; urgent_only?: boolean } = { user_id: userId };
  if (input.categoriesEnabled !== undefined) payload.categories_enabled = input.categoriesEnabled;
  if (input.urgentOnly !== undefined) payload.urgent_only = input.urgentOnly;
  const { error } = await supabase.from('notification_preferences').upsert(payload, { onConflict: 'user_id' });
  if (error) throw error;
}
