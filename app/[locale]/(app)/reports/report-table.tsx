import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type ReportColumn<Row> = {
  key: string;
  label: string;
  /** Figures are right-aligned and set in tabular numerals. */
  numeric?: boolean;
  render: (row: Row) => ReactNode;
  /** Optional per-cell emphasis (e.g. a no-show rate over threshold). */
  emphasize?: (row: Row) => boolean;
};

/**
 * Report data: a ruled table from `sm` up; on phones each row becomes a block
 * titled by its first column with the figures listed beneath.
 */
export function ReportTable<Row>({
  title,
  columns,
  rows,
  rowKey,
  empty,
}: {
  title: string;
  columns: ReportColumn<Row>[];
  rows: Row[];
  rowKey: (row: Row) => string;
  empty: string;
}) {
  const [first, ...rest] = columns;
  const headingId = `report-${first.key}-${title.length}`;

  return (
    <section aria-labelledby={headingId} className="border-t border-[var(--rule)] py-6">
      <h2 id={headingId} className="text-[17px] font-semibold">{title}</h2>

      {rows.length === 0 ? (
        <p className="mt-3 text-[15px] text-[var(--muted-foreground)]">{empty}</p>
      ) : (
        <>
          <table className="mt-3 hidden w-full text-[15px] sm:table">
            <thead>
              <tr className="border-b border-[var(--rule)] text-sm text-[var(--muted-foreground)]">
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={cn("py-2 pr-4 font-semibold last:pr-0", column.numeric ? "text-right" : "text-left")}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={rowKey(row)} className="border-b border-[var(--rule)] last:border-b-0">
                  {columns.map((column, index) => {
                    const Cell = index === 0 ? "th" : "td";
                    return (
                      <Cell
                        key={column.key}
                        scope={index === 0 ? "row" : undefined}
                        className={cn(
                          "py-3 pr-4 last:pr-0",
                          index === 0 ? "text-left font-semibold" : "",
                          column.numeric ? "tabular text-right" : "",
                          column.emphasize?.(row) ? "font-semibold text-[var(--danger-fg)]" : ""
                        )}
                      >
                        {column.render(row)}
                      </Cell>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>

          <ul className="mt-3 border-t border-[var(--rule)] sm:hidden">
            {rows.map((row) => (
              <li key={rowKey(row)} className="border-b border-[var(--rule)] py-3">
                <p className="text-[16px] font-semibold">{first.render(row)}</p>
                <dl className="mt-1.5 grid grid-cols-2 gap-x-4 gap-y-1 text-[15px]">
                  {rest.map((column) => (
                    <div key={column.key} className="flex items-baseline justify-between gap-2">
                      <dt className="text-sm text-[var(--muted-foreground)]">{column.label}</dt>
                      <dd
                        className={cn(
                          column.numeric ? "tabular" : "",
                          column.emphasize?.(row) ? "font-semibold text-[var(--danger-fg)]" : ""
                        )}
                      >
                        {column.render(row)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
