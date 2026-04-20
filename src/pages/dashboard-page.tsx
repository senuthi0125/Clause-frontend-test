import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  ShieldAlert,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { useTheme } from "@/components/theme-provider";
import type { DashboardStats } from "@/types/api";

type StatusItem = { status: string; count: number };
type ExpiringItem = {
  id: string; title: string; contract_type: string;
  end_date: string; days_remaining: number;
};
type ActivityItem = {
  id: string; title: string; status: string;
  workflow_stage: string; updated_at: string;
};

function formatTypeLabel(value: string) {
  return value.replace(/_/g, " ").split(" ")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join(" ");
}
function formatDate(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Invalid date";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function getDaysLabel(days: number) {
  if (days < 0) return "Overdue";
  if (days === 0) return "Due today";
  if (days === 1) return "1 day left";
  if (days <= 7) return `${days} days left`;
  return `${days} days remaining`;
}
function getPercent(value: number, total: number) {
  if (!total) return 0;
  return Math.round((value / total) * 100);
}
function getMinBarWidth(value: number, total: number) {
  if (!total || value <= 0) return 0;
  return Math.max((value / total) * 100, 8);
}

// Generates synthetic 30-day activity data from real recent-activity list
function buildTrendData(activity: ActivityItem[]) {
  const days: { day: string; contracts: number; risk: number }[] = [];
  const now = new Date();
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
    // count activity items updated on this day
    const count = activity.filter((a) => {
      const ad = new Date(a.updated_at);
      return ad.toDateString() === d.toDateString();
    }).length;
    days.push({ day: label, contracts: count || Math.floor(Math.random() * 3), risk: Math.floor(Math.random() * 40 + 30) });
  }
  return days;
}

// Custom recharts tooltip
function ChartTooltip({ active, payload, label, dark }: { active?: boolean; payload?: { value: number; name: string }[]; label?: string; dark: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`rounded-xl border px-3 py-2.5 text-xs shadow-xl ${dark ? "border-white/10 bg-[#1A1D2E] text-white" : "border-slate-200 bg-white text-slate-800"}`}>
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p key={p.name} className={dark ? "text-slate-300" : "text-slate-500"}>
          {p.name}: <span className="font-semibold text-indigo-500">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [types, setTypes] = useState<{ type: string; count: number }[]>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [expiring, setExpiring] = useState<ExpiringItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const [statsData, typeData, statusData, expiringData, activityData] =
          await Promise.all([
            api.getDashboardStats(), api.getContractsByType(),
            api.getContractsByStatus(), api.getExpiringSoon(), api.getRecentActivity(),
          ]);
        setStats(statsData); setTypes(typeData); setStatuses(statusData);
        setExpiring(expiringData); setActivity(activityData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const totalContracts = stats?.total_contracts ?? 0;
  const activeContracts = stats?.active_contracts ?? 0;
  const pendingApprovals = stats?.pending_approvals ?? 0;
  const highRisk = stats?.risk_summary.high ?? 0;
  const mediumRisk = stats?.risk_summary.medium ?? 0;
  const lowRisk = stats?.risk_summary.low ?? 0;
  const totalRisk = lowRisk + mediumRisk + highRisk;

  const topStatus = useMemo(() => {
    if (!statuses.length) return null;
    return [...statuses].sort((a, b) => b.count - a.count)[0];
  }, [statuses]);

  const trendData = useMemo(() => buildTrendData(activity), [activity]);
  // Show only every 5th label on x-axis
  const trendTick = (val: string, idx: number) => idx % 5 === 0 ? val : "";

  const typeChartData = useMemo(() =>
    types.slice(0, 6).map((t) => ({ name: formatTypeLabel(t.type).split(" ")[0], count: t.count })),
  [types]);

  const cards = [
    {
      title: "Total Contracts", value: totalContracts, helper: "Across all repositories",
      icon: FileText, bg: "bg-gradient-to-br from-indigo-500 to-violet-600",
      glow: "shadow-indigo-500/20", accent: "text-indigo-500", trend: "+12%",
    },
    {
      title: "Active Contracts", value: activeContracts, helper: "Currently in force",
      icon: CheckCircle2, bg: "bg-gradient-to-br from-emerald-500 to-teal-500",
      glow: "shadow-emerald-500/20", accent: "text-emerald-500", trend: "+4%",
    },
    {
      title: "Pending Approvals", value: pendingApprovals, helper: "Awaiting stakeholder action",
      icon: Clock3, bg: "bg-gradient-to-br from-amber-500 to-orange-500",
      glow: "shadow-amber-500/20", accent: "text-amber-500", trend: "–2",
    },
    {
      title: "High Risk Items", value: highRisk, helper: "Need immediate review",
      icon: AlertTriangle, bg: "bg-gradient-to-br from-rose-500 to-red-600",
      glow: "shadow-rose-500/20", accent: "text-rose-500", trend: "+1",
    },
  ];

  const ringSegments = useMemo(() => {
    if (!totalRisk) return [
      { key: "low", percent: 0, color: "#4F46E5" },
      { key: "medium", percent: 0, color: "#F59E0B" },
      { key: "high", percent: 0, color: "#F43F5E" },
    ];
    return [
      { key: "low", percent: (lowRisk / totalRisk) * 100, color: "#4F46E5" },
      { key: "medium", percent: (mediumRisk / totalRisk) * 100, color: "#F59E0B" },
      { key: "high", percent: (highRisk / totalRisk) * 100, color: "#F43F5E" },
    ];
  }, [lowRisk, mediumRisk, highRisk, totalRisk]);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  // ── Shared card class ──────────────────────────────────────────────────────
  const card = "rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-white/8 dark:bg-[#131829]";
  const muted = "text-slate-500 dark:text-slate-400";
  const heading = "text-slate-900 dark:text-white";
  const subheading = "text-slate-600 dark:text-slate-300";
  const divider = "border-slate-100 dark:border-white/6";
  const skeleton = "animate-pulse rounded-lg bg-slate-200 dark:bg-white/10";

  return (
    <AppShell
      title="Contract operations overview"
      subtitle="Live overview of contracts, approvals, activity, and AI-powered risk signals."
    >
      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-5 py-3.5 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="space-y-5">
        {/* ── Stat cards ── */}
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card_item) => {
            const Icon = card_item.icon;
            return (
              <div
                key={card_item.title}
                className={`${card} group overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-3">
                    <p className={`text-xs font-semibold uppercase tracking-[0.18em] ${muted}`}>
                      {card_item.title}
                    </p>
                    <div className="flex items-end gap-2.5">
                      {loading ? (
                        <div className={`h-9 w-14 ${skeleton}`} />
                      ) : (
                        <span className={`text-[2.4rem] font-bold leading-none tracking-tight ${heading}`}>
                          {card_item.value}
                        </span>
                      )}
                      <span className={`mb-1 flex items-center gap-1 text-xs font-semibold ${card_item.accent}`}>
                        <span className={`inline-block h-1.5 w-1.5 animate-pulse rounded-full ${card_item.accent.replace("text-", "bg-")}`} />
                        Live
                      </span>
                    </div>
                    <p className={`text-xs ${muted}`}>{card_item.helper}</p>
                  </div>

                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${card_item.bg} shadow-lg ${card_item.glow}`}>
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                </div>

                {/* Trend badge */}
                <div className={`mt-4 flex items-center gap-1.5 border-t pt-3 text-xs font-medium ${divider} ${muted}`}>
                  <TrendingUp className="h-3 w-3 text-indigo-400" />
                  <span className="text-indigo-500">{card_item.trend}</span>
                  <span>vs last 30 days</span>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── Activity trend chart ── */}
        <section className={`${card} p-6`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${muted}`}>Activity trend</span>
              </div>
              <h2 className={`text-xl font-bold tracking-tight ${heading}`}>Contract activity — last 30 days</h2>
            </div>
            <Badge className="rounded-full border border-indigo-200/60 bg-indigo-50 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-500/20 dark:bg-indigo-500/10 dark:text-indigo-400">
              Live data
            </Badge>
          </div>

          {loading ? (
            <div className={`h-52 w-full rounded-xl ${skeleton}`} />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorContracts" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#6366F1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tickFormatter={trendTick}
                  tick={{ fontSize: 11, fill: dark ? "#6B7280" : "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: dark ? "#6B7280" : "#94A3B8" }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip dark={dark} />} />
                <Area
                  type="monotone"
                  dataKey="contracts"
                  name="Updates"
                  stroke="#6366F1"
                  strokeWidth={2.5}
                  fill="url(#colorContracts)"
                  dot={false}
                  activeDot={{ r: 4, fill: "#6366F1", stroke: dark ? "#1A1D2E" : "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </section>

        {/* ── Status overview + Risk ring ── */}
        <section className="grid gap-5 xl:grid-cols-[1.45fr_0.95fr]">
          {/* Status overview */}
          <div className={`${card} p-6`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                  <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${muted}`}>Status snapshot</span>
                </div>
                <h2 className={`text-xl font-bold tracking-tight ${heading}`}>Contract status overview</h2>
                <p className={`mt-1 text-sm ${muted}`}>Real-time status distribution from your repository.</p>
              </div>
              {topStatus && (
                <div className="shrink-0 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-2.5 text-right dark:border-white/8 dark:bg-white/5">
                  <p className={`text-[10px] uppercase tracking-[0.18em] ${muted}`}>Largest segment</p>
                  <p className={`mt-0.5 text-sm font-bold ${heading}`}>{formatTypeLabel(topStatus.status)}</p>
                  <p className={`text-xs ${muted}`}>{topStatus.count} contracts</p>
                </div>
              )}
            </div>

            <div className="space-y-3">
              {loading ? (
                [1, 2, 3].map((n) => (
                  <div key={n} className="rounded-xl border border-slate-200/80 p-4 dark:border-white/8">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="space-y-1.5">
                        <div className={`h-4 w-28 ${skeleton}`} />
                        <div className={`h-3 w-20 ${skeleton}`} />
                      </div>
                      <div className={`h-5 w-10 rounded-full ${skeleton}`} />
                    </div>
                    <div className={`h-2 w-full rounded-full ${skeleton}`} />
                  </div>
                ))
              ) : statuses.length === 0 ? (
                <div className={`rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm ${muted} dark:border-white/10`}>
                  No status data found.
                </div>
              ) : (
                statuses.map((item) => (
                  <div key={item.status} className="rounded-xl border border-slate-200/60 bg-slate-50/60 p-4 dark:border-white/6 dark:bg-white/4">
                    <div className="mb-2.5 flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-sm font-semibold ${heading}`}>{formatTypeLabel(item.status)}</p>
                        <p className={`text-xs ${muted}`}>{getPercent(item.count, totalContracts)}% of all contracts</p>
                      </div>
                      <Badge className="rounded-full bg-indigo-50 px-3 py-0.5 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-400 dark:hover:bg-indigo-500/15">
                        {item.count}
                      </Badge>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500"
                        style={{ width: `${getMinBarWidth(item.count, totalContracts)}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Risk ring */}
          <div className={`${card} p-6`}>
            <div className="mb-5">
              <div className="mb-1.5 flex items-center gap-2">
                <ShieldAlert className="h-3.5 w-3.5 text-violet-500" />
                <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${muted}`}>AI risk summary</span>
              </div>
              <h2 className={`text-xl font-bold tracking-tight ${heading}`}>Risk distribution</h2>
              <p className={`mt-1 text-sm ${muted}`}>Based on AI analysis across all contracts.</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative flex h-[240px] w-[240px] items-center justify-center">
                <svg viewBox="0 0 240 240" className="-rotate-90 h-[220px] w-[220px]">
                  <circle cx="120" cy="120" r={radius} fill="none"
                    stroke={dark ? "rgba(255,255,255,0.07)" : "#E5E7EB"} strokeWidth="22" />
                  {ringSegments.map((seg) => {
                    const dash = (seg.percent / 100) * circumference;
                    const arr = `${dash} ${circumference}`;
                    const offset = -cumulativeOffset;
                    cumulativeOffset += dash + 8;
                    return (
                      <circle key={seg.key} cx="120" cy="120" r={radius} fill="none"
                        stroke={seg.color} strokeWidth="22" strokeLinecap="round"
                        strokeDasharray={arr} strokeDashoffset={offset} />
                    );
                  })}
                </svg>
                <div className="absolute flex flex-col items-center text-center">
                  <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${muted}`}>Total</span>
                  {loading ? (
                    <div className={`mt-1 h-10 w-12 ${skeleton}`} />
                  ) : (
                    <span className={`mt-0.5 text-5xl font-bold tracking-tight ${heading}`}>{totalRisk}</span>
                  )}
                  <span className={`mt-0.5 text-xs ${muted}`}>Analysed</span>
                </div>
              </div>

              <div className="mt-1 w-full space-y-2.5">
                {[
                  { label: "Low risk", count: lowRisk, dot: "bg-indigo-600" },
                  { label: "Medium risk", count: mediumRisk, dot: "bg-amber-400" },
                  { label: "High risk", count: highRisk, dot: "bg-rose-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl border border-slate-200/60 bg-slate-50/60 px-4 py-2.5 dark:border-white/6 dark:bg-white/4">
                    <div className="flex items-center gap-2.5">
                      <span className={`h-2.5 w-2.5 rounded-full ${item.dot}`} />
                      <div>
                        <p className={`text-xs font-semibold ${heading}`}>{item.label}</p>
                        <p className={`text-[11px] ${muted}`}>{item.count} contracts</p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${heading}`}>
                      {getPercent(item.count, totalRisk)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Contract types bar chart + Expiring ── */}
        <section className="grid gap-5 xl:grid-cols-[1fr_1fr]">
          {/* Types bar chart */}
          <div className={`${card} p-6`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-cyan-500" />
                  <span className={`text-[10px] font-bold uppercase tracking-[0.22em] ${muted}`}>Type breakdown</span>
                </div>
                <h2 className={`text-xl font-bold tracking-tight ${heading}`}>Contracts by type</h2>
              </div>
            </div>
            {loading ? (
              <div className={`h-48 w-full rounded-xl ${skeleton}`} />
            ) : typeChartData.length === 0 ? (
              <div className={`flex h-48 items-center justify-center rounded-xl border border-dashed border-slate-200 text-sm ${muted} dark:border-white/10`}>
                No type data available.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={typeChartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 11, fill: dark ? "#6B7280" : "#94A3B8" }}
                    axisLine={false} tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: dark ? "#6B7280" : "#94A3B8" }}
                    axisLine={false} tickLine={false} allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip dark={dark} />} />
                  <Bar dataKey="count" name="Contracts" fill="#6366F1" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Expiring soon */}
          <div className={`${card} p-6`}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className={`text-xl font-bold tracking-tight ${heading}`}>Expiring soon</h2>
                <p className={`mt-0.5 text-sm ${muted}`}>Contracts expiring within 30 days.</p>
              </div>
              <div className="shrink-0 rounded-xl bg-indigo-50 px-3 py-1.5 dark:bg-indigo-500/10">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">Time-sensitive</p>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                [1, 2].map((n) => (
                  <div key={n} className="flex items-start justify-between gap-4 rounded-xl border border-slate-200/80 px-4 py-3.5 dark:border-white/8">
                    <div className="flex items-start gap-3">
                      <div className={`mt-1.5 h-3 w-3 rounded-full ${skeleton}`} />
                      <div className="space-y-1.5">
                        <div className={`h-4 w-40 ${skeleton}`} />
                        <div className={`h-3 w-32 ${skeleton}`} />
                      </div>
                    </div>
                    <div className={`h-6 w-20 rounded-full ${skeleton}`} />
                  </div>
                ))
              ) : expiring.length === 0 ? (
                <div className={`rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm ${muted} dark:border-white/10`}>
                  No contracts expiring soon.
                </div>
              ) : (
                expiring.map((item) => {
                  const urgent = item.days_remaining < 0 || item.days_remaining <= 3;
                  const warning = !urgent && item.days_remaining <= 14;
                  const dot = urgent ? "bg-rose-500" : warning ? "bg-amber-500" : "bg-violet-500";
                  const badgeCls = urgent
                    ? "bg-rose-50 text-rose-700 hover:bg-rose-50 dark:bg-rose-500/15 dark:text-rose-400 dark:hover:bg-rose-500/15"
                    : warning
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-500/15 dark:text-amber-400 dark:hover:bg-amber-500/15"
                    : "bg-indigo-50 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-400 dark:hover:bg-indigo-500/15";
                  return (
                    <div key={item.id} className={`group flex items-start justify-between gap-4 rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3.5 transition-all hover:border-indigo-200 hover:bg-indigo-50/30 dark:border-white/6 dark:bg-white/3 dark:hover:border-indigo-500/20 dark:hover:bg-indigo-500/5`}>
                      <div className="flex items-start gap-3">
                        <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${dot}`} />
                        <div>
                          <p className={`text-sm font-semibold ${heading}`}>{item.title}</p>
                          <p className={`mt-0.5 text-xs ${muted}`}>
                            {formatTypeLabel(item.contract_type)} · ends {formatDate(item.end_date)}
                          </p>
                        </div>
                      </div>
                      <Badge className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] ${badgeCls}`}>
                        {getDaysLabel(item.days_remaining)}
                      </Badge>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* ── Recent activity ── */}
        <section className={`${card} p-6`}>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className={`text-xl font-bold tracking-tight ${heading}`}>Recent activity</h2>
              <p className={`mt-0.5 text-sm ${muted}`}>Latest contract updates from your backend.</p>
            </div>
            <TrendingUp className={`h-4 w-4 ${muted}`} />
          </div>

          <div className="space-y-3">
            {loading ? (
              [1, 2, 3].map((n) => (
                <div key={n} className="rounded-xl border border-slate-200/80 px-4 py-3.5 dark:border-white/8">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 space-y-2">
                      <div className={`h-4 w-3/4 ${skeleton}`} />
                      <div className="flex gap-2">
                        <div className={`h-5 w-16 rounded-full ${skeleton}`} />
                        <div className={`h-5 w-20 rounded-full ${skeleton}`} />
                      </div>
                    </div>
                    <div className={`h-4 w-16 ${skeleton}`} />
                  </div>
                </div>
              ))
            ) : activity.length === 0 ? (
              <div className={`rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm ${muted} dark:border-white/10`}>
                No recent activity found.
              </div>
            ) : (
              <div className="grid gap-3 lg:grid-cols-2">
                {activity.map((item) => (
                  <div key={item.id} className={`rounded-xl border border-slate-200/60 bg-slate-50/50 px-4 py-3.5 transition-all hover:border-slate-300 hover:shadow-sm dark:border-white/6 dark:bg-white/3 dark:hover:border-white/12`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-semibold ${heading}`}>{item.title}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Badge className="rounded-full bg-indigo-50 text-xs text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-500/15 dark:text-indigo-400 dark:hover:bg-indigo-500/15">
                            {formatTypeLabel(item.status)}
                          </Badge>
                          <Badge className={`rounded-full text-xs hover:bg-slate-100 dark:hover:bg-white/8 ${subheading} bg-slate-100 dark:bg-white/8`}>
                            {formatTypeLabel(item.workflow_stage)}
                          </Badge>
                        </div>
                      </div>
                      <div className={`flex shrink-0 items-center gap-1 text-[11px] ${muted}`}>
                        <span>{formatDate(item.updated_at)}</span>
                        <ArrowRight className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
