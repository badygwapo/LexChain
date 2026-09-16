"use client";

import { useEffect, useRef, useState } from "react";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import NotificationsIcon from "@mui/icons-material/Notifications";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import MailIcon from "@mui/icons-material/Mail";

type DashboardSelectProps = {
  ariaLabel: string;
  options: string[];
  defaultValue: string;
  icon?: React.ReactNode;
};

export function DashboardSelect({ ariaLabel, options, defaultValue, icon }: DashboardSelectProps) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="inline-flex items-center gap-2 rounded-xl border border-[#E4EEF9] bg-white px-3 py-2 text-sm font-bold text-[#0C2B49] shadow-sm transition hover:border-[#0985E7] focus:outline-none focus:ring-2 focus:ring-[#0985E7] focus:ring-offset-2"
      >
        {icon}
        <span>{value}</span>
        <KeyboardArrowDownIcon fontSize="small" className={`text-[#64748b] transition ${open ? "rotate-180" : ""}`} />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-full overflow-hidden rounded-xl border border-[#E4EEF9] bg-white shadow-[0_16px_40px_rgba(12,43,73,0.14)]">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                setValue(option);
                setOpen(false);
              }}
              className={`flex w-full cursor-pointer whitespace-nowrap px-4 py-2.5 text-left text-sm font-bold transition hover:bg-[#EEF4FB] ${
                option === value ? "bg-[#EEF4FB] text-[#0985E7]" : "text-[#0C2B49]"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function DashboardHeaderControls() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const notifications = [
    {
      title: "Failed document needs review",
      detail: "Barangay Resolution 2026-14.pdf",
      time: "4m ago",
      icon: <WarningAmberIcon fontSize="small" />,
      color: "bg-red-50 text-red-600",
    },
    {
      title: "Document anchored",
      detail: "Deed of Sale - Lot 18.pdf",
      time: "12m ago",
      icon: <CheckCircleIcon fontSize="small" />,
      color: "bg-green-50 text-green-600",
    },
    {
      title: "New invitation accepted",
      detail: "client@example.com",
      time: "28m ago",
      icon: <MailIcon fontSize="small" />,
      color: "bg-[#fefce8] text-[#ca8a04]",
    },
  ];

  useEffect(() => {
    function handleClick(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleRefresh() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    window.setTimeout(() => {
      setIsRefreshing(false);
    }, 650);
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DashboardSelect
        ariaLabel="Dashboard date range"
        defaultValue="May 12 – May 18, 2025"
        options={["Today", "Last 7 Days", "May 12 – May 18, 2025", "This Month"]}
        icon={<CalendarTodayIcon fontSize="small" className="text-[#64748b]" />}
      />
      <button
        type="button"
        aria-label="Refresh dashboard"
        onClick={handleRefresh}
        className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#E4EEF9] bg-white text-[#64748b] shadow-sm transition hover:border-[#0985E7] hover:text-[#0985E7] focus:outline-none focus:ring-2 focus:ring-[#0985E7] focus:ring-offset-2"
      >
        <RefreshIcon fontSize="small" className={isRefreshing ? "animate-spin" : ""} />
      </button>
      <div ref={notificationRef} className="relative">
        <button
          type="button"
          aria-label="Open dashboard notifications"
          aria-expanded={notificationsOpen}
          onClick={() => setNotificationsOpen((open) => !open)}
          className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-[#E4EEF9] bg-white text-[#64748b] shadow-sm transition hover:border-[#0985E7] hover:text-[#0985E7] focus:outline-none focus:ring-2 focus:ring-[#0985E7] focus:ring-offset-2"
        >
          <NotificationsIcon fontSize="small" />
          <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-black leading-none text-white">
            {notifications.length}
          </span>
        </button>

        {notificationsOpen ? (
          <div className="absolute right-0 top-full z-50 mt-2 w-[340px] overflow-hidden rounded-2xl border border-[#E4EEF9] bg-white shadow-[0_16px_40px_rgba(12,43,73,0.14)]">
            <div className="flex items-center justify-between border-b border-[#E4EEF9] px-4 py-3">
              <div>
                <p className="text-sm font-black text-[#0C2B49]">Notifications</p>
                <p className="text-xs font-semibold text-[#64748b]">{notifications.length} unread alerts</p>
              </div>
              <button
                type="button"
                onClick={() => setNotificationsOpen(false)}
                className="text-xs font-black text-[#0985E7]"
              >
                Mark all read
              </button>
            </div>
            <div className="max-h-[280px] overflow-y-auto">
              {notifications.map((notification) => (
                <div className="flex gap-3 border-b border-[#F1F5F9] px-4 py-3 last:border-b-0 hover:bg-[#F8FBFF]" key={`${notification.title}-${notification.time}`}>
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${notification.color}`}>
                    {notification.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-black text-[#0C2B49]">{notification.title}</p>
                    <p className="truncate text-xs font-semibold text-[#64748b]">{notification.detail}</p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-[#94a3b8]">{notification.time}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
