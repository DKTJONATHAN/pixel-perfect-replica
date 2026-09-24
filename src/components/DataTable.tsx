/** Reusable table with sorting and pagination. Filtering happens upstream. */
import { useMemo, useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, EmptyState } from "@/components/UI";

export interface Column<T> {
  key: string;
  header: string;
  sortValue?: (row: T) => string | number;
  render: (row: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  pageSize = 10,
  emptyTitle = "Nothing here yet",
  emptyMessage = "Try adjusting your search or filters.",
  onRowClick,
}: {
  rows: T[];
  columns: Column<T>[];
  pageSize?: number;
  emptyTitle?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [dir, setDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);

  const sorted = useMemo(() => {
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const copy = [...rows];
    copy.sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av === bv) return 0;
      const result = av > bv ? 1 : -1;
      return dir === "asc" ? result : -result;
    });
    return copy;
  }, [rows, columns, sortKey, dir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, totalPages);
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setDir("asc");
    }
    setPage(1);
  }

  if (!rows.length) {
    return <EmptyState title={emptyTitle} message={emptyMessage} />;
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead className="bg-muted/60">
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  scope="col"
                  className={cn(
                    "px-4 py-3 text-left text-xs font-semibold tracking-wide text-muted-foreground uppercase",
                    c.hideOnMobile && "hidden md:table-cell",
                    c.className,
                  )}
                >
                  {c.sortValue ? (
                    <button
                      onClick={() => toggleSort(c.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground"
                    >
                      {c.header}
                      {sortKey === c.key ? (
                        dir === "asc" ? (
                          <ArrowUp className="size-3" />
                        ) : (
                          <ArrowDown className="size-3" />
                        )
                      ) : null}
                    </button>
                  ) : (
                    c.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr
                key={row.id}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn(
                  "border-t border-border bg-card",
                  onRowClick && "cursor-pointer hover:bg-muted/50",
                )}
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn(
                      "px-4 py-3 align-middle",
                      c.hideOnMobile && "hidden md:table-cell",
                      c.className,
                    )}
                  >
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <p className="min-w-0 text-xs text-muted-foreground">
          Showing {(current - 1) * pageSize + 1}–{Math.min(current * pageSize, sorted.length)} of{" "}
          {sorted.length}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            aria-label="Previous page"
            disabled={current === 1}
            onClick={() => setPage(current - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {current} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label="Next page"
            disabled={current === totalPages}
            onClick={() => setPage(current + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
