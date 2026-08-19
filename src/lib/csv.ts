import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

function escapeCsvField(value: string): string {
  if (/[";\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

/** `;` comme séparateur et BOM UTF-8 : Excel en locale FR n'importe proprement qu'avec ces deux-là (sinon colonne unique / accents cassés). */
export function rowsToCsv(headers: string[], rows: (string | number)[][]): string {
  const BOM = String.fromCharCode(0xfeff);
  const lines = [headers, ...rows].map((row) => row.map((cell) => escapeCsvField(String(cell))).join(';'));
  return BOM + lines.join('\r\n');
}

export async function shareCsv(filename: string, csvContent: string): Promise<void> {
  const file = new File(Paths.cache, filename);
  file.create({ overwrite: true });
  file.write(csvContent);
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(file.uri, { mimeType: 'text/csv', UTI: 'public.comma-separated-values-text' });
  }
}
