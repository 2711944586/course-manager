/**
 * Exports data as a CSV file download.
 * @param filename - Name for the downloaded file (without extension).
 * @param headers - Column header labels.
 * @param rows - 2D array of cell values (strings or numbers).
 */
export function exportCsv(
  filename: string,
  headers: readonly string[],
  rows: readonly (readonly (string | number)[])[]
): void {
  const bom = '\uFEFF';
  const csvContent =
    bom +
    [headers.join(','), ...rows.map(row => row.map(escapeCsvCell).join(','))].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.csv`;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeCsvCell(value: string | number): string {
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
