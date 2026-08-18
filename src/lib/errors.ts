/**
 * Les erreurs Supabase/PostgREST échouent `instanceof Error` au runtime de ce
 * projet (constructeur "Object" observé en pratique, malgré une classe qui
 * étend Error côté source) — sans ce duck-typing, chaque erreur serveur
 * (contrainte unique, permission refusée...) retombait silencieusement sur un
 * message générique au lieu du message réel, précis et actionnable.
 */
export function getErrorMessage(error: unknown, fallback = 'Une erreur est survenue.'): string {
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object' && 'message' in error && typeof (error as { message: unknown }).message === 'string') {
    return (error as { message: string }).message;
  }
  return fallback;
}
