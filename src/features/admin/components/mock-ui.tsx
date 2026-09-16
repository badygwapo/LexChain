"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

type ToastTone = "success" | "error" | "info" | "warning";

type Toast = {
  id: number;
  title: string;
  detail?: string;
  tone: ToastTone;
};

type ToastInput = {
  title: string;
  detail?: string;
  tone?: ToastTone;
};

type MockToastContextValue = {
  showToast: (toast: ToastInput) => void;
};

const MockToastContext = createContext<MockToastContextValue | null>(null);

const toastToneStyles: Record<ToastTone, string> = {
  success: "border-[#BBF7D0] bg-[#F0FDF4] text-[#166534]",
  error: "border-[#FCA5A5] bg-[#FEF2F2] text-[#991B1B]",
  info: "border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]",
  warning: "border-[#FED7AA] bg-[#FFF7ED] text-[#9A3412]",
};

function ToastIcon({ tone }: { tone: ToastTone }) {
  if (tone === "success") return <CheckCircleIcon fontSize="small" />;
  if (tone === "error") return <ErrorIcon fontSize="small" />;
  if (tone === "warning") return <WarningAmberIcon fontSize="small" />;
  return <InfoOutlinedIcon fontSize="small" />;
}

export function MockToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timeoutIds = useRef(new Set<number>());

  const removeToast = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: ToastInput) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    setToasts((current) => [
      ...current,
      { id, title: toast.title, detail: toast.detail, tone: toast.tone ?? "success" },
    ]);
    const timeoutId = window.setTimeout(() => {
      timeoutIds.current.delete(timeoutId);
      removeToast(id);
    }, 3200);
    timeoutIds.current.add(timeoutId);
  }, [removeToast]);

  useEffect(() => () => {
    timeoutIds.current.forEach(window.clearTimeout);
    timeoutIds.current.clear();
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <MockToastContext.Provider value={value}>
      {children}
      <div className="fixed right-5 top-5 z-[80] flex w-[min(380px,calc(100vw-40px))] flex-col gap-3">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-start gap-3 rounded-2xl border p-4 shadow-[0_18px_45px_rgba(12,43,73,0.16)] backdrop-blur ${toastToneStyles[toast.tone]}`}
          >
            <div className="mt-0.5 shrink-0">
              <ToastIcon tone={toast.tone} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">{toast.title}</p>
              {toast.detail ? <p className="mt-1 text-xs font-semibold opacity-80">{toast.detail}</p> : null}
            </div>
            <button type="button" onClick={() => removeToast(toast.id)} className="rounded-lg p-1 opacity-70 transition hover:bg-white/50 hover:opacity-100" aria-label="Dismiss notification">
              <CloseIcon sx={{ fontSize: 16 }} />
            </button>
          </div>
        ))}
      </div>
    </MockToastContext.Provider>
  );
}

export function useMockToast() {
  const context = useContext(MockToastContext);
  if (!context) {
    return {
      showToast: () => undefined,
    };
  }
  return context;
}

export function MockModal({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  size = "md",
}: {
  open: boolean;
  title: string;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  onClose: () => void;
  size?: "sm" | "md" | "lg";
}) {
  if (!open) return null;

  const maxWidth = size === "lg" ? "max-w-2xl" : size === "sm" ? "max-w-sm" : "max-w-md";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#071B33]/45 p-5 backdrop-blur-sm" onClick={onClose}>
      <div
        onClick={(event) => event.stopPropagation()}
        className={`admin-table-scroll max-h-[min(760px,calc(100vh-40px))] w-full ${maxWidth} overflow-auto rounded-2xl border border-[#E4EEF9] bg-white shadow-[0_28px_90px_rgba(12,43,73,0.24)]`}
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[#E4EEF9] bg-white px-6 py-5">
          <div>
            <h2 className="text-lg font-black text-[#071B33]">{title}</h2>
            {description ? <p className="mt-1 text-sm font-semibold text-[#5B6F8A]">{description}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-[#64748B] transition hover:bg-[#EEF4FB] hover:text-[#0C2B49]" aria-label="Close modal">
            <CloseIcon fontSize="small" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
        {footer ? <div className="sticky bottom-0 border-t border-[#E4EEF9] bg-white px-6 py-4">{footer}</div> : null}
      </div>
    </div>
  );
}

export function exportMockRows(filename: string, rows: Array<Record<string, unknown>>, format: "json" | "csv" = "json") {
  const safeRows = rows.length > 0 ? rows : [{ message: "No rows in current filter." }];
  const text = format === "json" ? JSON.stringify(safeRows, null, 2) : toCsv(safeRows);
  const blob = new Blob([text], { type: format === "json" ? "application/json" : "text/csv" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${filename}.${format}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Array<Record<string, unknown>>) {
  const keys = Array.from(rows.reduce((set, row) => {
    Object.keys(row).forEach((key) => set.add(key));
    return set;
  }, new Set<string>()));
  const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  return [
    keys.join(","),
    ...rows.map((row) => keys.map((key) => escape(row[key])).join(",")),
  ].join("\n");
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.12em] text-[#64748B]">{label}</span>
      {children}
    </label>
  );
}

export const inputClassName = "w-full rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-4 py-2.5 text-sm font-semibold text-[#0C2B49] outline-none transition placeholder:text-[#94A3B8] focus:border-[#0985E7] focus:bg-white";
