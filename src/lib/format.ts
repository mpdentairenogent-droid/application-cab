/**
 * YYYY-MM-DD en heure LOCALE — jamais `date.toISOString().slice(0, 10)`, qui
 * convertit d'abord en UTC et peut faire reculer la date d'un jour pour tout
 * fuseau horaire positif (dont la France l'été, UTC+2) : minuit local le
 * 1er du mois devient 22h/23h UTC la veille, donc "31" au lieu de "1".
 */
export function toISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' }).format(new Date(dateStr));
}

export function formatDateTime(dateStr: string) {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(dateStr));
}

export function formatRelativeDay(dateStr: string) {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000);

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === -1) return 'Hier';
  if (diffDays === 1) return 'Demain';
  if (diffDays < 0) return `En retard (${formatDate(dateStr)})`;
  return formatDate(dateStr);
}
