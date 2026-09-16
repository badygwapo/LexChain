"use client";

import { useState } from "react";
import { createDemoReport, downloadDemoReport, type DemoReport, type DemoReportType } from "@/features/office/reports";
import { PortalDropdown } from "@/features/portal/components";

const reportOptions: ReadonlyArray<{
  type: DemoReportType;
  title: string;
  description: string;
}> = [
  {
    type: "system-users",
    title: "System Users",
    description: "User accounts created during the selected dates.",
  },
  {
    type: "system-audit",
    title: "System Audit",
    description: "System audit events recorded during the selected dates.",
  },
];

export function GeneratedReportsManagementView({ embedded = false }: { embedded?: boolean }) {
  const [reportType, setReportType] = useState<DemoReportType>("system-users");
  const [from, setFrom] = useState("2026-03-01");
  const [to, setTo] = useState("2026-05-31");
  const [report, setReport] = useState<DemoReport>();
  const [error, setError] = useState("");
  const selected = reportOptions.find((option) => option.type === reportType) ?? reportOptions[0];
  const generated = reportOptions.find((option) => option.type === report?.reportType);

  function generate() {
    try {
      setReport(createDemoReport(reportType, from, to));
      setError("");
    } catch (cause) {
      setReport(undefined);
      setError(cause instanceof Error ? cause.message : "Report generation failed.");
    }
  }

  return (
    <div className={`flex flex-col gap-5 ${embedded ? '' : 'min-h-[calc(100vh-48px)] w-full'}`}>
      {!embedded ? <header>
        <p className="text-xs font-black uppercase tracking-[0.22em] text-[#0879D8]">LexChain Operations</p>
        <h1 className="mt-1 text-3xl font-black leading-tight text-[#071B33]">Generated Reports</h1>
        <p className="mt-1 text-sm font-semibold text-[#4B6382]">Generate one of two fixed reports from seeded system data.</p>
      </header> : null}

      {embedded ? <label className="block text-sm font-black text-[#0C2B49]">
        Report type
        <PortalDropdown
          ariaLabel="Report type"
          value={reportType}
          onChange={(value) => setReportType(value as DemoReportType)}
          options={reportOptions.map((option) => ({ label: option.title, value: option.type }))}
        />
      </label> : <fieldset className="grid gap-4 md:grid-cols-2">
        <legend className="sr-only">Report type</legend>
        {reportOptions.map((option) => (
          <label
            key={option.type}
            className={[
              "cursor-pointer rounded-2xl border bg-white p-5 shadow-sm shadow-[#DDEAF7]/35 transition",
              reportType === option.type ? "border-[#0985E7] ring-2 ring-[#0985E7]/15" : "border-[#E4EEF9] hover:border-[#B9D6ED]",
            ].join(" ")}
          >
            <input
              type="radio"
              name="system-report-type"
              value={option.type}
              checked={reportType === option.type}
              onChange={() => setReportType(option.type)}
              aria-label={option.title}
              className="accent-[#0985E7]"
            />
            <span className="contents">
              <span className="ml-3 text-lg font-black text-[#071B33]">{option.title}</span>
              <span className="mt-2 block text-sm font-semibold leading-6 text-[#5B6F8A]">{option.description}</span>
            </span>
          </label>
        ))}
      </fieldset>}

      <section aria-label="Report dates" className={embedded ? "grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end" : "flex flex-wrap items-end gap-3 rounded-2xl border border-[#E4EEF9] bg-white p-5 shadow-sm shadow-[#DDEAF7]/35"}>
        <label className={embedded ? "text-sm font-black text-[#0C2B49]" : "grid gap-1 text-sm font-black text-[#071B33]"}>
          From
          <input type="date" value={from} onChange={(event) => setFrom(event.target.value)} className={embedded ? "mt-2 block w-full rounded-xl border border-[#D9E5F0] px-3 py-2.5 font-semibold" : "rounded-xl border border-[#D7E4F2] px-3 py-2 font-semibold"} />
        </label>
        <label className={embedded ? "text-sm font-black text-[#0C2B49]" : "grid gap-1 text-sm font-black text-[#071B33]"}>
          To
          <input type="date" value={to} onChange={(event) => setTo(event.target.value)} className={embedded ? "mt-2 block w-full rounded-xl border border-[#D9E5F0] px-3 py-2.5 font-semibold" : "rounded-xl border border-[#D7E4F2] px-3 py-2 font-semibold"} />
        </label>
        <button type="button" onClick={generate} className={embedded ? "rounded-xl bg-[#0985E7] px-5 py-3 text-sm font-black text-white hover:bg-[#0770C4]" : "rounded-xl bg-[#0985E7] px-5 py-2.5 text-sm font-black text-white hover:bg-[#0770C4]"}>
          Generate
        </button>
      </section>

      {error ? <p role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">{error}</p> : null}

      {!report && !error ? (
        <p role="status" className="rounded-2xl border border-dashed border-[#CFE1F2] bg-white p-6 text-center text-sm font-semibold text-[#5B6F8A]">
          Choose a date range and generate {selected.title}.
        </p>
      ) : null}

      {report ? (
        <section aria-label={`${generated?.title} report`} className="overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white shadow-sm shadow-[#DDEAF7]/35">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E4EEF9] p-5">
            <div>
              <h2 className="text-lg font-black text-[#071B33]">{generated?.title}</h2>
              <p className="mt-1 text-sm font-semibold text-[#5B6F8A]">{report.rows.length} seeded rows · {report.from} to {report.to}</p>
            </div>
            <button type="button" onClick={() => downloadDemoReport(report)} className="rounded-xl border border-[#B9D6ED] px-4 py-2 text-sm font-black text-[#0879D8] hover:bg-[#F0F7FF]">
              Download CSV
            </button>
          </div>
          <div className="overflow-x-auto">
            {report.rows.length ? (
              <table aria-label={`${generated?.title} preview`} className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-[#F8FBFF] text-xs uppercase tracking-[0.06em] text-[#5B6F8A]">
                  <tr>{report.columns.map((column) => <th key={column} className="px-4 py-3 font-black">{column}</th>)}</tr>
                </thead>
                <tbody>
                  {report.rows.map((row, index) => (
                    <tr key={index} className="border-t border-[#EEF4FA]">
                      {report.columns.map((column) => <td key={column} className="px-4 py-3 font-semibold text-[#0C2B49]">{String(row[column] ?? "")}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : <p className="p-6 text-center text-sm font-semibold text-[#5B6F8A]">No seeded rows fall within this date range.</p>}
          </div>
          <p className="border-t border-[#E4EEF9] bg-[#F8FBFF] px-5 py-3 text-xs font-bold text-[#5B6F8A]">
            Demo report — generated locally from seeded data and not stored.
          </p>
        </section>
      ) : null}
    </div>
  );
}
