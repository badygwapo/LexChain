"use client";

import { useState } from "react";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

type Column<T> = {
  key: string;
  label: string;
  render: (row: T, index: number) => React.ReactNode;
};

type TableProps<T> = {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  emptyMessage?: string;
  pageSize?: number;
};

export function Table<T>({ columns, data, keyExtractor, emptyMessage = "No data found.", pageSize = 10 }: TableProps<T>) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(data.length / pageSize));
  const paged = data.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <>
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[#D9E5F0] bg-[#F1F6FB]">
              {columns.map((col) => (
                <th key={col.key} className="px-6 py-3.5 text-left text-xs font-black uppercase tracking-[0.1em] text-[#475569]">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((row, i) => (
              <tr key={keyExtractor(row)} className="h-[65px] border-b border-[#F1F5F9] transition-colors hover:bg-[#EEF4FB]">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4">
                    {col.render(row, page * pageSize + i)}
                  </td>
                ))}
              </tr>
            ))}
            {paged.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-6 py-8 text-center text-[#64748b]">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-[#E4EEF9] px-6 py-3">
        <span className="text-xs font-semibold text-[#64748b]">
          Showing {data.length === 0 ? 0 : page * pageSize + 1}–{Math.min((page + 1) * pageSize, data.length)} of {data.length}
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            aria-label="Previous page"
            className="cursor-pointer rounded-lg p-1 text-[#64748b] transition hover:bg-[#EEF4FB] disabled:cursor-default disabled:opacity-30"
          >
            <ChevronLeftIcon fontSize="small" />
          </button>
          <span className="px-2 text-xs font-semibold text-[#0C2B49]">
            {page + 1} / {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            aria-label="Next page"
            className="cursor-pointer rounded-lg p-1 text-[#64748b] transition hover:bg-[#EEF4FB] disabled:cursor-default disabled:opacity-30"
          >
            <ChevronRightIcon fontSize="small" />
          </button>
        </div>
      </div>
    </>
  );
}
