import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RefreshCw,
  RotateCcw,
  Unlink,
  Calendar,
  Clock,
  AlertTriangle,
} from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatDate as fmtDate } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type ContractEvent = {
  id: string;
  contract_id: string;
  title: string;
  date: string;           // "YYYY-MM-DD"
  kind: "start" | "expiry";
  contract_type: string;
};

type GCalEvent = {
  id: string;
  summary: string;
  start: string;
  end: string;
  html_link: string;
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getDaysUntil(dateStr: string): number {
  const now  = new Date(); now.setHours(0, 0, 0, 0);
  const then = new Date(dateStr + "T00:00:00");
  return Math.ceil((then.getTime() - now.getTime()) / 86_400_000);
}


function kindColor(kind: "start" | "expiry") {
  return kind === "start" ? "bg-green-500" : "bg-red-500";
}
function kindBg(kind: "start" | "expiry") {
  return kind === "start"
    ? "bg-green-50 border-green-200 text-green-800"
    : "bg-red-50 border-red-200 text-red-800";
}

// ── Mini calendar grid ────────────────────────────────────────────────────────

function CalendarGrid({
  year,
  month,
  events,
  onDayClick,
  selectedDay,
}: {
  year: number;
  month: number;
  events: ContractEvent[];
  onDayClick: (day: string) => void;
  selectedDay: string | null;
}) {
  const firstDay  = new Date(year, month, 1).getDay();           // 0=Sun
  const daysCount = new Date(year, month + 1, 0).getDate();
  const today     = new Date().toISOString().slice(0, 10);

  // Build a map: "YYYY-MM-DD" → events[]
  const byDay = useMemo(() => {
    const map = new Map<string, ContractEvent[]>();
    events.forEach((e) => {
      const list = map.get(e.date) || [];
      list.push(e);
      map.set(e.date, list);
    });
    return map;
  }, [events]);

  const cells: Array<{ day: number | null; dateStr: string | null }> = [];
  for (let i = 0; i < firstDay; i++) cells.push({ day: null, dateStr: null });
  for (let d = 1; d <= daysCount; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr });
  }

  const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      <div className="grid grid-cols-7 text-center text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
        {DAY_LABELS.map((d) => <div key={d} className="py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-px bg-slate-100 rounded-xl overflow-hidden border border-slate-100">
        {cells.map((cell, i) => {
          if (!cell.dateStr) return <div key={`empty-${i}`} className="bg-white h-14" />;
          const dayEvents = byDay.get(cell.dateStr) || [];
          const isToday   = cell.dateStr === today;
          const isSelected = cell.dateStr === selectedDay;
          return (
            <button
              key={cell.dateStr}
              onClick={() => onDayClick(cell.dateStr!)}
              className={`bg-white h-14 flex flex-col items-center pt-1.5 gap-0.5 hover:bg-slate-50 transition-colors relative
                ${isToday ? "ring-2 ring-inset ring-violet-400" : ""}
                ${isSelected ? "bg-violet-50" : ""}
              `}
            >
              <span className={`text-sm leading-none font-medium ${
                isToday ? "text-violet-700" : "text-slate-700"
              }`}>
                {cell.day}
              </span>
              <div className="flex gap-0.5 flex-wrap justify-center px-1">
                {dayEvents.slice(0, 3).map((ev) => (
                  <div key={ev.id} className={`h-1.5 w-1.5 rounded-full ${kindColor(ev.kind)}`} />
                ))}
                {dayEvents.length > 3 && (
                  <div className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const { user } = useUser();
  const [searchParams] = useSearchParams();
  const clerkId = user?.id ?? "";

  const [contractEvents, setContractEvents] = useState<ContractEvent[]>([]);
  const [gcalEvents,     setGcalEvents]     = useState<GCalEvent[]>([]);
  const [gcalConnected,  setGcalConnected]  = useState(false);
  const [gcalEmail,      setGcalEmail]      = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [gcalLoading,    setGcalLoading]    = useState(false);
  const [syncLoading,    setSyncLoading]    = useState(false);
  const [error,          setError]          = useState<string | null>(null);
  const [toast,          setToast]          = useState<string | null>(null);

  const now   = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  // Show connect toast if redirected from Google OAuth
  useEffect(() => {
    const connected = searchParams.get("connected");
    if (connected === "true") {
      setToast("✅ Google Calendar connected!");
      setTimeout(() => setToast(null), 4000);
    } else if (connected === "false") {
      setError("Google Calendar connection failed. Please try again.");
    }
  }, [searchParams]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [datesRes, statusRes] = await Promise.all([
        api.getContractDates(),
        api.getCalendarStatus().catch(() => ({ connected: false })),
      ]);
      setContractEvents(datesRes.events || []);
      setGcalConnected(statusRes.connected);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load calendar data.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load Google Calendar events when connected
  useEffect(() => {
    if (!gcalConnected) { setGcalEvents([]); return; }
    setGcalLoading(true);
    api.getCalendarEvents(30)
      .then((r) => setGcalEvents(r.events || []))
      .catch(() => setGcalEvents([]))
      .finally(() => setGcalLoading(false));
  }, [gcalConnected]);

  // Month navigation
  const prevMonth = () => { if (month === 0) { setYear(y => y - 1); setMonth(11); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setYear(y => y + 1); setMonth(0); } else setMonth(m => m + 1); };
  const monthLabel = new Date(year, month, 1).toLocaleDateString(undefined, { month: "long", year: "numeric" });

  // Connect Google Calendar
  async function handleConnect() {
    try {
      const res = await api.getCalendarAuthUrl();
      window.location.href = res.auth_url;
    } catch {
      setError("Failed to start Google Calendar connection.");
    }
  }

  // Sync all contracts
  async function handleSyncAll() {
    setSyncLoading(true);
    try {
      const res = await api.syncAllToCalendar();
      setToast(`✅ Synced ${res.synced} contracts to Google Calendar!`);
      setTimeout(() => setToast(null), 4000);
      // Reload gcal events
      const r = await api.getCalendarEvents(30);
      setGcalEvents(r.events || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setSyncLoading(false);
    }
  }

  // Disconnect
  async function handleDisconnect() {
    if (!confirm("Disconnect Google Calendar? Contract dates will no longer sync.")) return;
    try {
      await api.disconnectCalendar();
      setGcalConnected(false);
      setGcalEvents([]);
      setToast("Google Calendar disconnected.");
      setTimeout(() => setToast(null), 3000);
    } catch {
      setError("Failed to disconnect.");
    }
  }

  // Events for selected day
  const selectedDayEvents = selectedDay
    ? contractEvents.filter((e) => e.date === selectedDay)
    : [];

  // Upcoming events (next 30 days)
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() + 30);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    return contractEvents
      .filter((e) => e.date >= today && e.date <= cutoffStr)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 10);
  }, [contractEvents]);

  // Stats
  const expiringThisMonth = contractEvents.filter((e) => {
    if (e.kind !== "expiry") return false;
    const d = getDaysUntil(e.date);
    return d >= 0 && d <= 30;
  }).length;

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();
    contractEvents.forEach((e) => {
      const t = e.contract_type || "other";
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    return Array.from(counts.entries()).map(([name, count]) => ({
      name: name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
      count,
    }));
  }, [contractEvents]);

  return (
    <AppShell
      title="Calendar"
      subtitle="Contract dates, deadlines, and Google Calendar sync."
      contractGroups={contractGroups}
    >
      {/* Toast */}
      {toast && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
          {toast}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
          <button className="ml-3 underline" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Stats row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Events",    value: loading ? "—" : contractEvents.length, color: "text-slate-900",  icon: <CalendarDays className="h-5 w-5 text-violet-500" /> },
          { label: "Upcoming (30d)",  value: loading ? "—" : upcoming.length,       color: "text-blue-700",   icon: <Clock className="h-5 w-5 text-blue-500" /> },
          { label: "Expiring (30d)",  value: loading ? "—" : expiringThisMonth,     color: "text-red-700",    icon: <AlertTriangle className="h-5 w-5 text-red-500" /> },
        ].map(({ label, value, color, icon }) => (
          <Card key={label} className="border-slate-200 shadow-sm">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="rounded-2xl bg-slate-50 p-2.5">{icon}</div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400">{label}</p>
                <p className={`mt-0.5 text-2xl font-bold ${color}`}>{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">

        {/* ── Left: Calendar grid ───────────────────────────────────────── */}
        <div className="space-y-4">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{monthLabel}</CardTitle>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="rounded-xl px-2" onClick={prevMonth}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl px-2" onClick={nextMonth}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl px-2" onClick={() => { setYear(now.getFullYear()); setMonth(now.getMonth()); }}>
                    Today
                  </Button>
                </div>
              </div>
              {/* Legend */}
              <div className="flex gap-4 mt-2">
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500" /> Start date
                </span>
                <span className="flex items-center gap-1.5 text-xs text-slate-500">
                  <div className="h-2.5 w-2.5 rounded-full bg-red-500" /> Expiry date
                </span>
              </div>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
                : <CalendarGrid year={year} month={month} events={contractEvents} onDayClick={setSelectedDay} selectedDay={selectedDay} />
              }
            </CardContent>
          </Card>

          {/* Selected day events */}
          {selectedDay && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{fmtDate(selectedDay)}</CardTitle>
                  <button onClick={() => setSelectedDay(null)} className="text-xs text-slate-400 hover:text-slate-600">Clear</button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedDayEvents.length === 0
                  ? <p className="text-sm text-slate-500">No contract events on this day.</p>
                  : <div className="space-y-2">
                    {selectedDayEvents.map((ev) => (
                      <Link key={ev.id} to={`/contracts/${ev.contract_id}`}
                        className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2.5 hover:opacity-80 transition-opacity ${kindBg(ev.kind)}`}>
                        <div>
                          <p className="text-sm font-semibold">{ev.title}</p>
                          <p className="text-xs opacity-70">{ev.kind === "start" ? "Contract Start" : "Contract Expiry"}</p>
                        </div>
                        <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-60" />
                      </Link>
                    ))}
                  </div>
                }
              </CardContent>
            </Card>
          )}
        </div>

        {/* ── Right: Google Calendar + upcoming ─────────────────────────── */}
        <div className="space-y-5">

          {/* Google Calendar connection card */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4 text-slate-500" /> Google Calendar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {gcalConnected ? (
                <>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Connected</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Contract dates are synced to your Google Calendar with email reminders.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button size="sm" className="rounded-xl" onClick={handleSyncAll} disabled={syncLoading}>
                      {syncLoading
                        ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Syncing…</>
                        : <><RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Sync All Contracts</>}
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-xl text-red-600 border-red-200 hover:bg-red-50" onClick={handleDisconnect}>
                      <Unlink className="mr-1.5 h-3.5 w-3.5" /> Disconnect
                    </Button>
                  </div>

                  {/* Google Calendar events */}
                  {gcalLoading
                    ? <div className="flex items-center gap-2 py-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading calendar…</div>
                    : gcalEvents.length > 0 && (
                      <div>
                        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Your Google Calendar</p>
                        <div className="space-y-1.5 max-h-48 overflow-y-auto">
                          {gcalEvents.map((ev) => (
                            <a key={ev.id} href={ev.html_link} target="_blank" rel="noreferrer"
                              className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 hover:bg-slate-100 transition-colors">
                              <p className="text-xs font-medium text-slate-700 truncate">{ev.summary}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] text-slate-400">{String(ev.start).slice(0, 10)}</span>
                                <ExternalLink className="h-3 w-3 text-slate-400" />
                              </div>
                            </a>
                          ))}
                        </div>
                      </div>
                    )
                  }
                </>
              ) : (
                <>
                  <p className="text-sm text-slate-500">
                    Connect Google Calendar to automatically add contract start dates, expiry deadlines, and receive email reminders.
                  </p>
                  <ul className="space-y-1.5 text-sm text-slate-600">
                    {[
                      "Contract start & end dates added automatically",
                      "Email reminder 7 days before expiry",
                      "Popup reminder 1 day before expiry",
                    ].map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" /> {item}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full rounded-xl" onClick={handleConnect}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Connect Google Calendar
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Upcoming events list */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent>
              {loading
                ? <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
                : upcoming.length === 0
                  ? <p className="text-sm text-slate-500">No contract events in the next 30 days.</p>
                  : (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {upcoming.map((ev) => {
                        const days = getDaysUntil(ev.date);
                        return (
                          <Link key={ev.id} to={`/contracts/${ev.contract_id}`}
                            className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-2.5 hover:bg-slate-50 transition-colors">
                            <div className={`h-8 w-1 rounded-full shrink-0 ${kindColor(ev.kind)}`} />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-800 truncate">{ev.title}</p>
                              <p className="text-xs text-slate-500">
                                {ev.kind === "start" ? "Starts" : "Expires"} {fmtDate(ev.date)}
                              </p>
                            </div>
                            <Badge className={`shrink-0 text-[10px] ${
                              days <= 7  ? "bg-red-100 text-red-700" :
                              days <= 30 ? "bg-amber-100 text-amber-700" :
                              "bg-slate-100 text-slate-600"
                            }`}>
                              {days === 0 ? "Today" : days === 1 ? "Tomorrow" : `${days}d`}
                            </Badge>
                          </Link>
                        );
                      })}
                    </div>
                  )
              }
            </CardContent>
          </Card>

        </div>
      </div>
    </AppShell>
  );
}
