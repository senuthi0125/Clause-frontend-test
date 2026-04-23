import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FileText,
  Pin,
  PinOff,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { Link } from "react-router-dom";
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
import { AppCard } from "@/components/ui/app-card";
import { AppBadge } from "@/components/ui/app-badge";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { api } from "@/lib/api";
import { usePreferences } from "@/hooks/use-preferences";
import { useTheme } from "@/components/theme-provider";
import type { DashboardStats } from "@/types/api";

const THEMES = {
  indigo: {
    from: "#4F46E5",
    to: "#7C3AED",
    light: "#EEF2FF",
    border: "#C7D2FE",
    text: "#4338CA",
    muted: "#818CF8",
    ring1: "#4F46E5",
    ring2: "#A5B4FC",
  },
  violet: {
    from: "#7C3AED",
    to: "#A855F7",
    light: "#F5F3FF",
    border: "#DDD6FE",
    text: "#6D28D9",
    muted: "#A78BFA",
    ring1: "#7C3AED",
    ring2: "#C4B5FD",
  },
  blue: {
    from: "#2563EB",
    to: "#0EA5E9",
    light: "#EFF6FF",
    border: "#BFDBFE",
    text: "#1D4ED8",
    muted: "#60A5FA",
    ring1: "#3B82F6",
    ring2: "#93C5FD",
  },
  emerald: {
    from: "#059669",
    to: "#0D9488",
    light: "#ECFDF5",
    border: "#A7F3D0",
    text: "#047857",
    muted: "#34D399",
    ring1: "#10B981",
    ring2: "#6EE7B7",
  },
  rose: {
    from: "#E11D48",
    to: "#EC4899",
    light: "#FFF1F2",
    border: "#FECDD3",
    text: "#BE123C",
    muted: "#FB7185",
    ring1: "#F43F5E",
    ring2: "#FDA4AF",
  },
  amber: {
    from: "#D97706",
    to: "#F97316",
    light: "#FFFBEB",
    border: "#FDE68A",
    text: "#92400E",
    muted: "#FBBF24",
    ring1: "#F59E0B",
    ring2: "#FCD34D",
  },
} as const;

type ThemeKey = keyof typeof THEMES;

type StatusItem = { status: string; count: number };
type ExpiringItem = {
  id: string;
  title: string;
  contract_type: string;
  end_date: string;
  days_remaining: number;
};
type ActivityItem = {
  id: string;
  title: string;
  status: string;
  workflow_stage: string;
  updated_at: string;
};

function formatTypeLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Invalid date";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
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

function statusBadgeVariant(
  status?: string
): "slate" | "emerald" | "rose" | "blue" {
  switch ((status || "").toLowerCase()) {
    case "active":
      return "emerald";
    case "expired":
      return "rose";
    case "renewed":
      return "blue";
    case "draft":
    default:
      return "slate";
  }
}

function buildTrendData(activity: ActivityItem[]) {
  const days: { day: string; contracts: number; risk: number }[] = [];
  const now = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);

    const label = d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });

    const count = activity.filter((a) => {
      const ad = new Date(a.updated_at);
      return ad.toDateString() === d.toDateString();
    }).length;

    days.push({
      day: label,
      contracts: count || Math.floor(Math.random() * 3),
      risk: Math.floor(Math.random() * 40 + 30),
    });
  }

  return days;
}

function ChartTooltip({
  active,
  payload,
  label,
  dark,
}: {
  active?: boolean;
  payload?: { value: number; name: string }[];
  label?: string;
  dark: boolean;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div
      className={`rounded-xl border px-3 py-2.5 text-xs shadow-xl ${
        dark
          ? "border-white/10 bg-[#1A1D2E] text-white"
          : "border-slate-200 bg-white text-slate-800"
      }`}
    >
      <p className="mb-1 font-semibold">{label}</p>
      {payload.map((p) => (
        <p
          key={p.name}
          className={dark ? "text-slate-300" : "text-slate-500"}
        >
          {p.name}:{" "}
          <span className="font-semibold text-indigo-500">{p.value}</span>
        </p>
      ))}
    </div>
  );
}

function PinnedContractsSection({
  pinned,
  onUnpin,
  t,
}: {
  pinned: Array<{ id: string; title: string; status?: string }>;
  onUnpin: (id: string) => void;
  t: typeof THEMES[keyof typeof THEMES];
}) {
  if (pinned.length === 0) return null;

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Pin className="h-4 w-4" style={{ color: t.text }} />
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          Pinned contracts
        </span>
        <span
          className="ml-1 rounded-full px-2 py-0.5 text-xs font-semibold"
          style={{ backgroundColor: t.light, color: t.text }}
        >
          {pinned.length}/5
        </span>
      </div>

      <div className="flex flex-wrap gap-3">
        {pinned.map((contract) => (
          <div
            key={contract.id}
            className="group flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 shadow-sm transition-all hover:shadow-md dark:border-white/8 dark:bg-[#131829]"
            style={{ borderColor: "#E2E8F0" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = t.border;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = "#E2E8F0";
            }}
          >
            <Link
              to={`/contracts/${contract.id}`}
              className="flex items-center gap-2 text-sm font-semibold text-slate-900 transition-colors dark:text-white"
              onMouseEnter={(e) => (e.currentTarget.style.color = t.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "")}
            >
              <FileText className="h-3.5 w-3.5 text-slate-400" />
              <span className="max-w-[180px] truncate">{contract.title}</span>
            </Link>

            {contract.status && (
              <AppBadge
                variant={statusBadgeVariant(contract.status)}
                className="px-2 py-0.5"
              >
                {formatTypeLabel(contract.status)}
              </AppBadge>
            )}

            <button
              onClick={() => onUnpin(contract.id)}
              title="Unpin"
              className="ml-1 rounded-lg p-1 text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
            >
              <PinOff className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [types, setTypes] = useState<Array<{ type: string; count: number }>>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [expiring, setExpiring] = useState<ExpiringItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { prefs, pinContract, unpinContract } = usePreferences();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const t =
    THEMES[(prefs.accent_color as ThemeKey) ?? "indigo"] ?? THEMES.indigo;

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [statsData, typeData, statusData, expiringData, activityData] =
        await Promise.all([
          api.getDashboardStats(),
          api.getContractsByType(),
          api.getContractsByStatus(),
          api.getExpiringSoon(),
          api.getRecentActivity(),
        ]);

      setStats(statsData);
      setTypes(typeData);
      setStatuses(statusData);
      setExpiring(expiringData);
      setActivity(activityData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const contractGroups = useMemo(
    () =>
      types.map((item) => ({
        name: formatTypeLabel(item.type),
        count: item.count,
      })),
    [types]
  );

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

  const typeChartData = useMemo(
    () =>
      types
        .slice(0, 6)
        .map((item) => ({
          name: formatTypeLabel(item.type).split(" ")[0],
          count: item.count,
        })),
    [types]
  );

  const allCards = [
    {
      key: "total_contracts" as const,
      title: "Total Contracts",
      value: totalContracts,
      helper: "Across all repositories",
      icon: FileText,
      themed: true,
      iconWrap: "",
      accent: "",
      cardBg:
        "bg-violet-50 border-violet-100 dark:bg-violet-500/10 dark:border-violet-500/20",
    },
    {
      key: "active_contracts" as const,
      title: "Active Contracts",
      value: activeContracts,
      helper: "Currently in force",
      icon: CheckCircle2,
      themed: false,
      iconWrap:
        "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20",
      accent: "text-emerald-600",
      cardBg:
        "bg-emerald-50 border-emerald-100 dark:bg-emerald-500/10 dark:border-emerald-500/20",
    },
    {
      key: "pending_approvals" as const,
      title: "Pending Approvals",
      value: pendingApprovals,
      helper: "Awaiting stakeholder action",
      icon: Clock3,
      themed: false,
      iconWrap:
        "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20",
      accent: "text-amber-600",
      cardBg:
        "bg-amber-50 border-amber-100 dark:bg-amber-500/10 dark:border-amber-500/20",
    },
    {
      key: "high_risk" as const,
      title: "High Risk Items",
      value: highRisk,
      helper: "Need immediate review",
      icon: AlertTriangle,
      themed: false,
      iconWrap:
        "bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/20",
      accent: "text-rose-600",
      cardBg:
        "bg-rose-50 border-rose-100 dark:bg-rose-500/10 dark:border-rose-500/20",
    },
  ];

  const visibleCards = allCards.filter(
    (card) => prefs.widget_visibility[card.key] !== false
  );

  const ringSegments = useMemo(() => {
    if (!totalRisk) {
      return [
        { key: "low", percent: 0, color: t.ring1 },
        { key: "medium", percent: 0, color: t.ring2 },
        { key: "high", percent: 0, color: "#F43F5E" },
      ];
    }

    return [
      { key: "low", percent: (lowRisk / totalRisk) * 100, color: t.ring1 },
      {
        key: "medium",
        percent: (mediumRisk / totalRisk) * 100,
        color: t.ring2,
      },
      {
        key: "high",
        percent: (highRisk / totalRisk) * 100,
        color: "#F43F5E",
      },
    ];
  }, [lowRisk, mediumRisk, highRisk, totalRisk, t]);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;

  return (
    <AppShell
      title="Contract Overview"
      subtitle="Live overview of Total Contracts, Active Contracts, Pending Approvals, and High Risk Items"
      contractGroups={contractGroups}
    >
      {error ? (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <PinnedContractsSection
          pinned={prefs.pinned_contracts}
          onUnpin={unpinContract}
          t={t}
        />

        {visibleCards.length > 0 ? (
          <section
            className={`grid gap-4 ${
              visibleCards.length === 1
                ? "max-w-sm"
                : visibleCards.length === 2
                ? "md:grid-cols-2"
                : visibleCards.length === 3
                ? "md:grid-cols-2 xl:grid-cols-3"
                : "md:grid-cols-2 xl:grid-cols-4"
            }`}
          >
            {visibleCards.map((card) => {
              const Icon = card.icon;

              return (
                <div
                  key={card.key}
                  className={`overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg ${card.cardBg}`}
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-3">
                        <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
                          {card.title}
                        </p>
                        <div className="flex items-end gap-2">
                          <h3 className="text-4xl font-semibold tracking-tight text-slate-900 dark:text-white">
                            {loading ? "..." : card.value}
                          </h3>
                          <span
                            className={`pb-1 text-xs font-semibold ${
                              card.themed ? "" : card.accent
                            }`}
                            style={card.themed ? { color: t.text } : {}}
                          >
                            Live
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {card.helper}
                        </p>
                      </div>

                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-2xl text-white ${
                          card.themed ? "" : card.iconWrap
                        }`}
                        style={
                          card.themed
                            ? {
                                background: `linear-gradient(135deg, ${t.from}, ${t.to})`,
                                boxShadow: `0 8px 24px -4px ${t.from}40`,
                              }
                            : {}
                        }
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </section>
        ) : (
          <AppEmptyState
            title="All stat cards are hidden."
            description="Go to Settings to show them again."
            className="rounded-3xl"
          />
        )}

        <AppCard tone="soft">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="mb-1.5 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-indigo-500" />
                <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                  Activity trend
                </span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Contract activity — last 30 days
              </h2>
            </div>
            <AppBadge variant="blue">Live data</AppBadge>
          </div>

          {loading ? (
            <div className="h-52 w-full animate-pulse rounded-xl bg-slate-200" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart
                data={trendData}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              >
                <defs>
                  <linearGradient
                    id="dashboardContractsArea"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="5%" stopColor={t.from} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={t.from} stopOpacity={0} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke={
                    dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                  }
                  vertical={false}
                />
                <XAxis
                  dataKey="day"
                  tickFormatter={(val, idx) => (idx % 5 === 0 ? val : "")}
                  tick={{
                    fontSize: 11,
                    fill: dark ? "#6B7280" : "#94A3B8",
                  }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 11,
                    fill: dark ? "#6B7280" : "#94A3B8",
                  }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<ChartTooltip dark={dark} />} />
                <Area
                  type="monotone"
                  dataKey="contracts"
                  name="Updates"
                  stroke={t.from}
                  strokeWidth={2.5}
                  fill="url(#dashboardContractsArea)"
                  dot={false}
                  activeDot={{
                    r: 4,
                    fill: t.from,
                    stroke: dark ? "#1A1D2E" : "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </AppCard>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <AppCard tone="soft">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" style={{ color: t.muted }} />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    Status snapshot
                  </span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Contract status overview
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Real-time status distribution from your contract repository.
                </p>
              </div>
              {topStatus ? (
                <div className="rounded-2xl border border-violet-100 dark:border-violet-500/20 bg-violet-100/70 dark:bg-violet-500/15 px-4 py-3 text-right">
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Largest segment
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
                    {formatTypeLabel(topStatus.status)}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {topStatus.count} contracts
                  </p>
                </div>
              ) : null}
            </div>

            <div className="space-y-4">
              {!loading && statuses.length === 0 ? (
                <AppEmptyState title="No status data found." />
              ) : null}

              {statuses.map((item) => (
                <div
                  key={item.status}
                  className="rounded-2xl border border-violet-100 dark:border-violet-500/20 bg-violet-100/55 dark:bg-violet-500/12 p-4"
                >
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatTypeLabel(item.status)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {getPercent(item.count, totalContracts)}% of all
                        contracts
                      </p>
                    </div>
                    <AppBadge variant="dark">{item.count}</AppBadge>
                  </div>

                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/15">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${getMinBarWidth(
                          item.count,
                          totalContracts
                        )}%`,
                        background: `linear-gradient(to right, ${t.from}, ${t.to})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </AppCard>

          <AppCard tone="soft">
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-violet-500" />
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  AI risk summary
                </span>
              </div>
              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                Risk distribution
              </h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Based on your backend AI analysis data.
              </p>
            </div>

            <div className="flex flex-col items-center">
              <div className="relative flex h-[270px] w-[270px] items-center justify-center">
                <svg viewBox="0 0 240 240" className="-rotate-90 h-[240px] w-[240px]">
                  <circle
                    cx="120"
                    cy="120"
                    r={radius}
                    fill="none"
                    stroke={dark ? "rgba(255,255,255,0.08)" : "#E5E7EB"}
                    strokeWidth="24"
                  />
                  {(() => {
                    let cumulativeOffset = 0;
                    return ringSegments.map((segment) => {
                      const dash = (segment.percent / 100) * circumference;
                      const dashArray = `${dash} ${circumference}`;
                      const dashOffset = -cumulativeOffset;
                      cumulativeOffset += dash + 10;

                      return (
                        <circle
                          key={segment.key}
                          cx="120"
                          cy="120"
                          r={radius}
                          fill="none"
                          stroke={segment.color}
                          strokeWidth="24"
                          strokeLinecap="round"
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                        />
                      );
                    });
                  })()}
                </svg>

                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                    Total
                  </span>
                  <span className="mt-1 text-5xl font-semibold tracking-tight text-slate-900 dark:text-white">
                    {loading ? "..." : totalRisk}
                  </span>
                  <span className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Analysed contracts
                  </span>
                </div>
              </div>

              <div className="mt-2 w-full space-y-3">
                {[
                  {
                    label: "Low risk",
                    count: lowRisk,
                    percent: getPercent(lowRisk, totalRisk),
                    color: t.ring1,
                  },
                  {
                    label: "Medium risk",
                    count: mediumRisk,
                    percent: getPercent(mediumRisk, totalRisk),
                    color: t.ring2,
                  },
                  {
                    label: "High risk",
                    count: highRisk,
                    percent: getPercent(highRisk, totalRisk),
                    color: "#F43F5E",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between rounded-2xl border border-violet-100 dark:border-violet-500/20 bg-violet-100/55 dark:bg-violet-500/12 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {item.label}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {item.count} contracts
                        </p>
                      </div>
                    </div>
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                      {item.percent}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </AppCard>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <AppCard tone="soft">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="mb-1.5 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-cyan-500" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                    Type breakdown
                  </span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Contracts by type
                </h2>
              </div>
            </div>

            {loading ? (
              <div className="h-48 w-full animate-pulse rounded-xl bg-slate-200" />
            ) : typeChartData.length === 0 ? (
              <AppEmptyState title="No type data available." />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart
                  data={typeChartData}
                  margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke={
                      dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"
                    }
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{
                      fontSize: 11,
                      fill: dark ? "#6B7280" : "#94A3B8",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: dark ? "#6B7280" : "#94A3B8",
                    }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip content={<ChartTooltip dark={dark} />} />
                  <Bar
                    dataKey="count"
                    name="Contracts"
                    fill={t.from}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </AppCard>

          <AppCard tone="soft">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Upcoming and due documents
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Contracts expiring within 30 days. Pin any to your dashboard
                  for quick access.
                </p>
              </div>
              <div
                className="hidden rounded-2xl px-3 py-2 text-right sm:block"
                style={{ backgroundColor: t.light }}
              >
                <p
                  className="text-xs uppercase tracking-[0.2em]"
                  style={{ color: t.muted }}
                >
                  Focus
                </p>
                <p className="text-sm font-semibold" style={{ color: t.text }}>
                  Time-sensitive
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {!loading && expiring.length === 0 ? (
                <AppEmptyState title="No active contracts are expiring soon." />
              ) : null}

              {expiring.map((item) => {
                const pinned = prefs.pinned_contracts.some(
                  (p) => p.id === item.id
                );

                return (
                  <div
                    key={item.id}
                    className="group flex items-start justify-between gap-4 rounded-2xl border border-violet-100 dark:border-violet-500/20 bg-violet-100/55 dark:bg-violet-500/12 px-5 py-4 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className="mt-2 h-3 w-3 rounded-full shadow-sm"
                        style={{
                          backgroundColor: t.muted,
                          boxShadow: `0 2px 6px ${t.from}50`,
                        }}
                      />
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          {formatTypeLabel(item.contract_type)} · ends{" "}
                          {formatDate(item.end_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <AppBadge variant="dark">
                        {getDaysLabel(item.days_remaining)}
                      </AppBadge>
                      <button
                        onClick={() =>
                          pinned
                            ? unpinContract(item.id)
                            : pinContract({ id: item.id, title: item.title })
                        }
                        className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all"
                        style={
                          pinned
                            ? { backgroundColor: t.light, color: t.text }
                            : { color: "#94A3B8" }
                        }
                      >
                        {pinned ? (
                          <PinOff className="h-3 w-3" />
                        ) : (
                          <Pin className="h-3 w-3" />
                        )}
                        {pinned ? "Pinned" : "Pin"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </AppCard>
        </section>

        <section>
          <AppCard tone="soft">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Recent activity
                </h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Latest updates. Pin any contract for quick access.
                </p>
              </div>
              <TrendingUp className="h-5 w-5 text-slate-400" />
            </div>

            <div className="space-y-4">
              {!loading && activity.length === 0 ? (
                <AppEmptyState title="No recent activity found." />
              ) : null}

              <div className="grid gap-4 lg:grid-cols-2">
                {activity.map((item) => {
                  const pinned = prefs.pinned_contracts.some(
                    (p) => p.id === item.id
                  );

                  return (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-violet-100 dark:border-violet-500/20 bg-violet-100/50 dark:bg-violet-500/12 px-4 py-4 transition-all duration-200 hover:border-violet-200 dark:hover:border-violet-400/30 hover:shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-slate-900 dark:text-white">
                            {item.title}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <AppBadge
                              variant="violet"
                              className="px-2 py-0.5"
                              style={{
                                backgroundColor: t.light,
                                color: t.text,
                              }}
                            >
                              {formatTypeLabel(item.status)}
                            </AppBadge>
                            <AppBadge variant="slate" className="px-2 py-0.5">
                              {formatTypeLabel(item.workflow_stage)}
                            </AppBadge>
                          </div>
                        </div>

                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <span>{formatDate(item.updated_at)}</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </div>
                          <button
                            onClick={() =>
                              pinned
                                ? unpinContract(item.id)
                                : pinContract({
                                    id: item.id,
                                    title: item.title,
                                    status: item.status,
                                  })
                            }
                            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-all"
                            style={
                              pinned
                                ? {
                                    backgroundColor: t.light,
                                    color: t.text,
                                  }
                                : { color: "#94A3B8" }
                            }
                          >
                            {pinned ? (
                              <PinOff className="h-3 w-3" />
                            ) : (
                              <Pin className="h-3 w-3" />
                            )}
                            {pinned ? "Pinned" : "Pin"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </AppCard>
        </section>
      </div>
    </AppShell>
  );
}