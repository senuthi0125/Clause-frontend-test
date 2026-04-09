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
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/types/api";

type StatusItem = {
  status: string;
  count: number;
};

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
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
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

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [types, setTypes] = useState<Array<{ type: string; count: number }>>([]);
  const [statuses, setStatuses] = useState<StatusItem[]>([]);
  const [expiring, setExpiring] = useState<ExpiringItem[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        err instanceof Error ? err.message : "Failed to load dashboard data."
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

  const cards = [
    {
      title: "Total Contracts",
      value: totalContracts,
      helper: "Across all repositories",
      icon: FileText,
      iconWrap:
        "bg-gradient-to-br from-indigo-600 to-violet-500 text-white shadow-lg shadow-indigo-500/20",
      accent: "text-indigo-600",
    },
    {
      title: "Active Contracts",
      value: activeContracts,
      helper: "Currently in force",
      icon: CheckCircle2,
      iconWrap:
        "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/20",
      accent: "text-emerald-600",
    },
    {
      title: "Pending Approvals",
      value: pendingApprovals,
      helper: "Awaiting stakeholder action",
      icon: Clock3,
      iconWrap:
        "bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/20",
      accent: "text-amber-600",
    },
    {
      title: "High Risk Items",
      value: highRisk,
      helper: "Need immediate review",
      icon: AlertTriangle,
      iconWrap:
        "bg-gradient-to-br from-rose-500 to-red-500 text-white shadow-lg shadow-rose-500/20",
      accent: "text-rose-600",
    },
  ];

  const ringSegments = useMemo(() => {
    if (!totalRisk) {
      return [
        { key: "low", percent: 0, color: "#4F46E5" },
        { key: "medium", percent: 0, color: "#A5B4FC" },
        { key: "high", percent: 0, color: "#F43F5E" },
      ];
    }

    return [
      { key: "low", percent: (lowRisk / totalRisk) * 100, color: "#4F46E5" },
      { key: "medium", percent: (mediumRisk / totalRisk) * 100, color: "#A5B4FC" },
      { key: "high", percent: (highRisk / totalRisk) * 100, color: "#F43F5E" },
    ];
  }, [lowRisk, mediumRisk, highRisk, totalRisk]);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  let cumulativeOffset = 0;

  return (
    <AppShell
      title="Contract operations overview"
      subtitle="Live overview of contracts, approvals, activity, and AI-powered risk signals."
      contractGroups={contractGroups}
    >
      {error ? (
        <div className="mb-6 rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700 shadow-sm">
          {error}
        </div>
      ) : null}

      <div className="space-y-6">
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <Card
                key={card.title}
                className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-slate-500">
                        {card.title}
                      </p>

                      <div className="flex items-end gap-2">
                        <h3 className="text-4xl font-semibold tracking-tight text-slate-900">
                          {loading ? "..." : card.value}
                        </h3>
                        <span className={`pb-1 text-xs font-semibold ${card.accent}`}>
                          Live
                        </span>
                      </div>

                      <p className="text-sm text-slate-500">{card.helper}</p>
                    </div>

                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-2xl ${card.iconWrap}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.45fr_0.95fr]">
          <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-500" />
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Status snapshot
                    </span>
                  </div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Contract status overview
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Real-time status distribution from your contract repository.
                  </p>
                </div>

                {topStatus ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                      Largest segment
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-900">
                      {formatTypeLabel(topStatus.status)}
                    </p>
                    <p className="text-xs text-slate-500">
                      {topStatus.count} contracts
                    </p>
                  </div>
                ) : null}
              </div>

              <div className="space-y-4">
                {!loading && statuses.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No status data found.
                  </div>
                ) : null}

                {statuses.map((item) => (
                  <div
                    key={item.status}
                    className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4"
                  >
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {formatTypeLabel(item.status)}
                        </p>
                        <p className="text-xs text-slate-500">
                          {getPercent(item.count, totalContracts)}% of all contracts
                        </p>
                      </div>

                      <Badge className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-900">
                        {item.count}
                      </Badge>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-blue-500"
                        style={{
                          width: `${getMinBarWidth(item.count, totalContracts)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6">
                <div className="mb-2 flex items-center gap-2">
                  <ShieldAlert className="h-4 w-4 text-violet-500" />
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                    AI risk summary
                  </span>
                </div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                  Risk distribution
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Based on your backend AI analysis data.
                </p>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative flex h-[270px] w-[270px] items-center justify-center">
                  <svg
                    viewBox="0 0 240 240"
                    className="-rotate-90 h-[240px] w-[240px]"
                  >
                    <circle
                      cx="120"
                      cy="120"
                      r={radius}
                      fill="none"
                      stroke="#E5E7EB"
                      strokeWidth="24"
                    />

                    {ringSegments.map((segment) => {
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
                    })}
                  </svg>

                  <div className="absolute flex flex-col items-center justify-center text-center">
                    <span className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                      Total
                    </span>
                    <span className="mt-1 text-5xl font-semibold tracking-tight text-slate-900">
                      {loading ? "..." : totalRisk}
                    </span>
                    <span className="mt-1 text-sm text-slate-500">
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
                      dot: "bg-indigo-600",
                    },
                    {
                      label: "Medium risk",
                      count: mediumRisk,
                      percent: getPercent(mediumRisk, totalRisk),
                      dot: "bg-indigo-300",
                    },
                    {
                      label: "High risk",
                      count: highRisk,
                      percent: getPercent(highRisk, totalRisk),
                      dot: "bg-rose-500",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${item.dot}`} />
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            {item.label}
                          </p>
                          <p className="text-xs text-slate-500">
                            {item.count} contracts
                          </p>
                        </div>
                      </div>

                      <span className="text-sm font-semibold text-slate-700">
                        {item.percent}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Upcoming and due documents
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Pulled directly from contracts expiring within the next 30 days.
                  </p>
                </div>

                <div className="hidden rounded-2xl bg-indigo-50 px-3 py-2 text-right sm:block">
                  <p className="text-xs uppercase tracking-[0.2em] text-indigo-500">
                    Focus
                  </p>
                  <p className="text-sm font-semibold text-indigo-700">
                    Time-sensitive actions
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {!loading && expiring.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No active contracts are expiring soon.
                  </div>
                ) : null}

                {expiring.map((item) => (
                  <div
                    key={item.id}
                    className="group flex items-start justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50/70 px-5 py-4 transition-all duration-200 hover:border-indigo-200 hover:bg-indigo-50/40"
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-2 h-3 w-3 rounded-full bg-violet-500 shadow-sm shadow-violet-400/50" />

                      <div>
                        <p className="font-semibold text-slate-900">{item.title}</p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatTypeLabel(item.contract_type)} · ends{" "}
                          {formatDate(item.end_date)}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Badge className="rounded-full bg-slate-900 px-3 py-1 text-white hover:bg-slate-900">
                        {getDaysLabel(item.days_remaining)}
                      </Badge>
                      <span className="text-xs text-slate-400 group-hover:text-indigo-500">
                        Action needed
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border border-slate-200/80 bg-white shadow-sm">
            <CardContent className="p-6">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                    Recent activity
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Latest contract updates from your backend.
                  </p>
                </div>

                <TrendingUp className="h-5 w-5 text-slate-400" />
              </div>

              <div className="space-y-4">
                {!loading && activity.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No recent activity found.
                  </div>
                ) : null}

                {activity.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4 transition-all duration-200 hover:border-slate-300 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-slate-900">
                          {item.title}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Badge className="rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-50">
                            {formatTypeLabel(item.status)}
                          </Badge>
                          <Badge className="rounded-full bg-slate-100 text-slate-700 hover:bg-slate-100">
                            {formatTypeLabel(item.workflow_stage)}
                          </Badge>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 text-xs text-slate-400">
                        <span>{formatDate(item.updated_at)}</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </AppShell>
  );
}