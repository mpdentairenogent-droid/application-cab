const UTF8_BOM = "﻿";

/** Génère un CSV compatible Excel FR : séparateur point-virgule, BOM UTF-8. */
export function toCsv(rows: string[][]): string {
  const escape = (value: string) => {
    if (/[;"\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
    return value;
  };
  const body = rows.map((row) => row.map(escape).join(";")).join("\r\n");
  return UTF8_BOM + body;
}

export function csvResponse(csv: string, fileName: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
