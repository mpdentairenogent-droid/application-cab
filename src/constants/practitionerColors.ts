/**
 * Nuancier des praticiens — mêmes 6 teintes que celles assignées
 * automatiquement à la création d'un compte dentiste (voir
 * supabase/migrations/0026_practitioner_auto_link.sql, fonction
 * handle_new_user) : reprises telles quelles ici pour que la palette
 * proposée en édition corresponde à ce que l'auto-attribution peut produire.
 * Si cette liste change un jour, mettre à jour les deux côtés ensemble.
 */
export const PRACTITIONER_COLORS = ['#7C9885', '#5B7C99', '#C97B3D', '#BC5449', '#5B84A3', '#8B8680'] as const;
