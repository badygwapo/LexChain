"use client";

import { useMemo, useState } from "react";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import { AdminShell } from "@/features/admin/admin-shell";
import { Dropdown } from "@/features/admin/components/dropdown";
import { PageHeader } from "@/features/admin/components/page-header";
import { StatCard, StatColor } from "@/features/admin/components/stat-card";
import { Table } from "@/features/admin/components/table";
import AssessmentIcon from "@mui/icons-material/Assessment";

type Card = {
  label: string;
  value: string | number;
  detail: string;
  icon?: React.ReactNode;
  color?: StatColor;
};

type Column<Row> = {
  key: string;
  label: string;
  render: (row: Row) => React.ReactNode;
};

type AdminResourcePageProps<Row> = {
  activeHref: string;
  title: string;
  subtitle: string;
  cards: Card[];
  columns: Column<Row>[];
  rows: Row[];
  notice?: string;
  keyExtractor?: (row: Row) => string;
};

const filterKeys = [
  "status",
  "severity",
  "blockchain_status",
  "ocr_status",
  "nlp_status",
  "default_privacy",
  "organization_type",
  "scope",
];

const dateKeys = [
  "created_at",
  "verified_at",
  "anchored_at",
  "generated_at",
  "sent_at",
];

const fallbackCardColors: StatColor[] = ["blue", "green", "amber"];

export function formatAdminDate(value?: string | null) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

export function AdminBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-[#EEF4FB] px-2.5 py-1 text-xs font-black text-[#0985E7]">
      {children}
    </span>
  );
}

function stringifyValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

function formatOptionLabel(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRowValue(row: unknown, key: string) {
  return typeof row === "object" && row !== null && key in row
    ? (row as Record<string, unknown>)[key]
    : undefined;
}

function getSearchText(row: unknown) {
  if (typeof row !== "object" || row === null) {
    return stringifyValue(row).toLowerCase();
  }

  return Object.values(row)
    .map(stringifyValue)
    .join(" ")
    .toLowerCase();
}

export function AdminResourcePage<Row>({
  activeHref,
  title,
  subtitle,
  cards,
  columns,
  rows,
  notice,
  keyExtractor = (row) => JSON.stringify(row),
}: AdminResourcePageProps<Row>) {
  const [search, setSearch] = useState("");
  const [filterValue, setFilterValue] = useState("all");
  const [sortOrder, setSortOrder] = useState("latest");

  const filterKey = filterKeys.find((key) => rows.some((row) => getRowValue(row, key)));
  const dateKey = dateKeys.find((key) => rows.some((row) => getRowValue(row, key)));

  const filterOptions = useMemo(() => {
    if (!filterKey) {
      return [];
    }

    return [...new Set(rows.map((row) => stringifyValue(getRowValue(row, filterKey))).filter(Boolean))];
  }, [filterKey, rows]);

  const tableRows = useMemo(() => {
    return rows
      .filter((row) => {
        const matchesSearch = getSearchText(row).includes(search.toLowerCase());
        const matchesFilter =
          !filterKey ||
          filterValue === "all" ||
          stringifyValue(getRowValue(row, filterKey)) === filterValue;

        return matchesSearch && matchesFilter;
      })
      .sort((a, b) => {
        if (!dateKey) {
          return 0;
        }

        const diff =
          new Date(stringifyValue(getRowValue(b, dateKey))).getTime() -
          new Date(stringifyValue(getRowValue(a, dateKey))).getTime();

        return sortOrder === "latest" ? diff : -diff;
      });
  }, [dateKey, filterKey, filterValue, rows, search, sortOrder]);

  return (
    <AdminShell activeHref={activeHref}>
      <div className="flex h-full w-full flex-col gap-6">
        <PageHeader title={title} description={subtitle} />

        {notice ? (
          <div className="rounded-2xl border border-[#BEE3FF] bg-[#EAF6FF] px-5 py-4 text-sm font-semibold leading-6 text-[#0C2B49]">
            {notice}
          </div>
        ) : null}

        <section className="grid gap-4 md:grid-cols-3">
          {cards.map((card, index) => (
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              detail={card.detail}
              icon={card.icon ?? <AssessmentIcon fontSize="small" />}
              color={card.color ?? fallbackCardColors[index % fallbackCardColors.length]}
            />
          ))}
        </section>

        <article className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white">
          <div className="flex flex-wrap items-center gap-3 border-b border-[#E4EEF9] px-6 py-4">
            <h2 className="text-lg font-black text-[#0C2B49]">{title} Records</h2>
            <div className="ml-auto flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-[#E4EEF9] bg-[#F8FBFF] px-3 py-2">
                <SearchIcon fontSize="small" className="text-[#64748b]" />
                <input
                  type="text"
                  placeholder={`Search ${title.toLowerCase()}...`}
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-56 bg-transparent text-sm font-semibold text-[#0C2B49] outline-none placeholder:text-[#94a3b8]"
                />
              </div>
              {filterKey ? (
                <Dropdown
                  icon={<FilterListIcon fontSize="small" className="text-[#64748b]" />}
                  value={filterValue}
                  onChange={setFilterValue}
                  options={[
                    { label: `All ${formatOptionLabel(filterKey)}`, value: "all" },
                    ...filterOptions.map((option) => ({
                      label: formatOptionLabel(option),
                      value: option,
                    })),
                  ]}
                />
              ) : null}
              {dateKey ? (
                <Dropdown
                  value={sortOrder}
                  onChange={setSortOrder}
                  options={[
                    { label: "Latest", value: "latest" },
                    { label: "Oldest", value: "oldest" },
                  ]}
                />
              ) : null}
            </div>
          </div>
          <Table
            columns={columns}
            data={tableRows}
            keyExtractor={keyExtractor}
            emptyMessage={`No ${title.toLowerCase()} records found.`}
          />
        </article>
      </div>
    </AdminShell>
  );
}
