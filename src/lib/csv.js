/** CSV helpers — exports use only locally available demo data. */

export function toCsv(columns, rows) {
  const escape = (value) => {
    const text = value === null || value === undefined ? '' : String(value);
    return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  };
  const header = columns.map((col) => escape(col.header)).join(',');
  const body = rows
    .map((row) =>
      columns
        .map((col) => escape(typeof col.value === 'function' ? col.value(row) : row[col.key]))
        .join(','),
    )
    .join('\n');
  return `${header}\n${body}`;
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}