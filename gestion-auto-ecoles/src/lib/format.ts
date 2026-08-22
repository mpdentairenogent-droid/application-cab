// Formatage centralisé : dates en Europe/Paris, montants en euros.
// Les DateTime sont toujours stockées en UTC (timestamptz) — ces fonctions sont
// le seul endroit où l'on convertit pour l'affichage (voir prisma/schema.prisma).

const TIMEZONE = "Europe/Paris";

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TIMEZONE, dateStyle: "short" }).format(value);
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    timeZone: TIMEZONE,
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return "—";
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", { timeZone: TIMEZONE, timeStyle: "short" }).format(value);
}

/** Montant en centimes entiers -> affichage euros ("12,50 €"). */
export function formatCurrency(amountCents: number | null | undefined): string {
  if (amountCents === null || amountCents === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(amountCents / 100);
}

export function formatNumber(value: number | null | undefined, options?: Intl.NumberFormatOptions): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("fr-FR", options).format(value);
}
