import "server-only";

/** Erreur attendue et sûre à afficher telle quelle à l'utilisateur (validation métier, conflit...). */
export class ValidationError extends Error {}
