/**
 * Détection de doublons "floue" — pas d'IA/API ici, une simple comparaison
 * de texte suffit pour repérer "Gants latex M" vs "gants  Latex M " (accents,
 * casse, espaces) et les fautes de frappe, sans dépendance externe ni coût,
 * et sans envoyer le contenu du stock à un service tiers.
 */

const COMBINING_DIACRITICS = new RegExp('[\\u0300-\\u036f]', 'g');

/** Accents/casse/espaces neutralisés — aussi réutilisé pour faire correspondre des en-têtes de colonnes Excel écrites librement (voir services/stockImport.ts). */
export function normalizeForComparison(value: string): string {
  return value
    .normalize('NFD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const distances: number[][] = Array.from({ length: rows }, () => new Array<number>(cols).fill(0));
  for (let i = 0; i < rows; i++) distances[i][0] = i;
  for (let j = 0; j < cols; j++) distances[0][j] = j;
  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      distances[i][j] = Math.min(distances[i - 1][j] + 1, distances[i][j - 1] + 1, distances[i - 1][j - 1] + cost);
    }
  }
  return distances[rows - 1][cols - 1];
}

/** 1 = identique, 0 = aucun rapport. */
function similarityRatio(a: string, b: string): number {
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLength;
}

/**
 * Repère les paires du type "Gants latex M" / "Gants latex L" : mêmes mots
 * sauf un seul, court (≤3 caractères — taille, calibre, référence courte).
 * Un seul caractère y change ("M"→"L"), donc la distance de Levenshtein
 * brute les classe presque aussi proches qu'une vraie faute de frappe —
 * sans cette règle, deux articles réellement différents seraient signalés
 * comme doublons l'un de l'autre à chaque fois. Vérifié en pratique via
 * scripts/_tmp_verify_dedup.ts avant de fixer ce comportement.
 */
function differsOnlyByShortToken(a: string, b: string): boolean {
  const tokensA = a.split(' ').filter(Boolean);
  const tokensB = b.split(' ').filter(Boolean);
  if (tokensA.length !== tokensB.length) return false;

  let diffIndex = -1;
  for (let i = 0; i < tokensA.length; i++) {
    if (tokensA[i] !== tokensB[i]) {
      if (diffIndex !== -1) return false;
      diffIndex = i;
    }
  }
  return diffIndex !== -1 && tokensA[diffIndex].length <= 3 && tokensB[diffIndex].length <= 3;
}

export interface ClosestMatch<T> {
  item: T;
  similarity: number;
  exact: boolean;
}

/**
 * Meilleure correspondance d'un nom parmi une liste de candidats, au-delà du
 * seuil donné (0.85 par défaut : tolère fautes de frappe/espacement). `exact`
 * signale une correspondance après normalisation (accents/casse/espaces),
 * quasi certainement le même article ; le reste n'est qu'une alerte à
 * confirmer par l'utilisateur — jamais une exclusion silencieuse (voir
 * buildImportPlan dans services/stockImport.ts : une correspondance non
 * exacte reste cochée par défaut, justement parce que cette heuristique ne
 * peut pas être parfaite).
 */
export function findClosestMatch<T>(name: string, candidates: T[], getName: (item: T) => string, threshold = 0.85): ClosestMatch<T> | null {
  const normalizedTarget = normalizeForComparison(name);
  if (!normalizedTarget) return null;

  let best: ClosestMatch<T> | null = null;
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeForComparison(getName(candidate));
    if (!normalizedCandidate) continue;
    const exact = normalizedCandidate === normalizedTarget;
    if (!exact && differsOnlyByShortToken(normalizedTarget, normalizedCandidate)) continue;
    const similarity = exact ? 1 : similarityRatio(normalizedTarget, normalizedCandidate);
    if ((exact || similarity >= threshold) && (!best || similarity > best.similarity)) {
      best = { item: candidate, similarity, exact };
    }
  }
  return best;
}
