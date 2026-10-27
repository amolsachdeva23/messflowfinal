import { cn } from '@/lib/utils';

/**
 * Compact, aligned table used across the operational pages.
 * columns: [{ key, header, align, width, className, render(row) }]
 */
export default function DataTable({ columns, rows, getRowKey, empty, minWidth = 720, footer }) {
  return (
    <div className="overflow-x-auto scroll-slim">
      <table className="w-full border-collapse" style={{ minWidth }}>
        <thead>
          <tr className="border-b border-line">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cn(
                  'whitespace-nowrap px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink-muted',
                  col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                  col.className,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-6">
                {empty || <p className="text-[13px] text-ink-muted">No records for this selection.</p>}
              </td>
            </tr>
          ) : (
            rows.map((row, index) => (
              <tr
                key={getRowKey ? getRowKey(row, index) : row.id || index}
                className="border-b border-line last:border-b-0 transition-colors hover:bg-sunken"
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      'px-4 py-2.5 align-middle text-[13px] text-ink',
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left',
                      col.cellClassName,
                    )}
                  >
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
        {footer ? <tfoot className="border-t border-line">{footer}</tfoot> : null}
      </table>
    </div>
  );
}