/**
 * Nuancier pour les catégories de stock (couleur modifiable par
 * l'utilisateur, voir migration 0025) — même principe que POST_IT_COLORS
 * dans PostItFormSheet : des teintes fixes hors de theme.ts, puisqu'il s'agit
 * d'un choix libre de l'utilisateur et non de tokens sémantiques de l'app.
 * Volontairement plus saturé que les pastels des Post-it : ces couleurs
 * doivent rester lisibles en petit point/badge dans une liste.
 */
export const CATEGORY_COLORS = [
  '#E15B5B',
  '#E08A3C',
  '#D9B341',
  '#5FA777',
  '#4FA8A0',
  '#4F86C6',
  '#6C6FC4',
  '#9B6BC7',
  '#D66FA0',
  '#8B8680',
] as const;
