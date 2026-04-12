import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Shield,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Contract } from "@/types/api";

function formatLabel(value?: string | null) {
  return (value || "-")
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function formatCurrency(value?: number | null) {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && !Number.isNaN(value) ? value : fallback;
}

function roleBadgeClass(role?: string | null) {
  switch ((role || "").toLowerCase()) {
    case "admin":
      return "bg-[#07153A] text-white";
    case "manager":
      return "bg-slate-900 text-white";
    case "viewer":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-[#07153A] text-white";
  }
}

export default function AdminOverviewPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [adminStats, setAdminStats] = useState<any>(null);
  const [contractsByStage, setContractsByStage] = useState<any[]>([]);
  const [approvalStats, setApprovalStats] = useState<any[]>([]);
  const [valueByType, setValueByType] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [userActivity, setUserActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadAdminOverview = async () => {
    setLoading(true);
    setError(null);

    try {
      const [
        statsRes,
        stagesRes,
        approvalsRes,
        valueByTypeRes,
        recentUsersRes,
        userActivityRes,
        contractsRes,
      ] = await Promise.all([
        api.getAdminStats().catch(() => null),
        api.getAdminContractsByStage().catch(() => []),
        api.getAdminApprovalStats().catch(() => []),
        api.getAdminValueByType().catch(() => []),
        api.getAdminRecentUsers().catch(() => []),
        api.getAdminUserActivity().catch(() => []),
        api.listContracts("?per_page=200").catch(() => ({ contracts: [] })),
      ]);

      setAdminStats(statsRes);
      setContractsByStage(Array.isArray(stagesRes) ? stagesRes : []);
      setApprovalStats(Array.isArray(approvalsRes) ? approvalsRes : []);
      setValueByType(Array.isArray(valueByTypeRes) ? valueByTypeRes : []);
      setRecentUsers(Array.isArray(recentUsersRes) ? recentUsersRes : []);
      setUserActivity(Array.isArray(userActivityRes) ? userActivityRes : []);
      setContracts(
        Array.isArray(contractsRes?.contracts) ? contractsRes.contracts : []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load admin overview."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminOverview();
  }, []);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();

    contracts.forEach((contract) => {
      const type = contract.contract_type || "other";
      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, count]) => ({
      name: formatLabel(name),
      count,
    }));
  }, [contracts]);

  const totalUsers = useMemo(() => {
    return (
      getNumber(adminStats?.total_users) ||
      getNumber(adminStats?.users_total) ||
      getNumber(adminStats?.user_count)
    );
  }, [adminStats]);

  const activeUsers = useMemo(() => {
    return (
      getNumber(adminStats?.active_users) ||
      getNumber(adminStats?.users_active) ||
      totalUsers
    );
  }, [adminStats, totalUsers]);

  const totalContracts = useMemo(() => {
    return (
      getNumber(adminStats?.total_contracts) ||
      getNumber(adminStats?.contracts_total) ||
      contracts.length
    );
  }, [adminStats, contracts.length]);

  const createdLast30Days = useMemo(() => {
    return (
      getNumber(adminStats?.contracts_created_last_30_days) ||
      getNumber(adminStats?.created_last_30_days) ||
      0
    );
  }, [adminStats]);

  const pendingApprovals = useMemo(() => {
    const fromStats =
      getNumber(adminStats?.pending_approvals) ||
      getNumber(adminStats?.approvals_pending);

    if (fromStats) return fromStats;

    const pendingItem = approvalStats.find((item) =>
      String(item?.status || "").toLowerCase().includes("pending")
    );

    return getNumber(pendingItem?.count);
  }, [adminStats, approvalStats]);

  const totalApprovals = useMemo(() => {
    const fromStats =
      getNumber(adminStats?.total_approvals) ||
      getNumber(adminStats?.approvals_total);

    if (fromStats) return fromStats;

    return approvalStats.reduce(
      (sum, item) => sum + getNumber(item?.count),
      0
    );
  }, [adminStats, approvalStats]);

  const highRiskContracts = useMemo(() => {
    const fromStats =
      getNumber(adminStats?.high_risk_contracts) ||
      getNumber(adminStats?.contracts_high_risk);

    if (fromStats) return fromStats;

    return contracts.filter(
      (contract) => String(contract.risk_level || "").toLowerCase() === "high"
    ).length;
  }, [adminStats, contracts]);

  const mediumRiskContracts = useMemo(() => {
    return contracts.filter(
      (contract) => String(contract.risk_level || "").toLowerCase() === "medium"
    ).length;
  }, [contracts]);

  const lowRiskContracts = useMemo(() => {
    return contracts.filter(
      (contract) => String(contract.risk_level || "").toLowerCase() === "low"
    ).length;
  }, [contracts]);

  const contractValueSummary = useMemo(() => {
    const values = contracts
      .map((contract) => Number(contract.value))
      .filter((value) => !Number.isNaN(value));

    const total = values.reduce((sum, value) => sum + value, 0);
    const average = values.length ? total / values.length : 0;
    const largest = values.length ? Math.max(...values) : 0;

    return { total, average, largest };
  }, [contracts]);

  const normalizedStages = useMemo(() => {
    if (contractsByStage.length > 0) {
      return contractsByStage
        .map((item) => ({
          label: formatLabel(item?.stage || item?.name || item?.workflow_stage),
          count: getNumber(item?.count),
        }))
        .filter((item) => item.count > 0)
        .sort((a, b) => b.count - a.count);
    }

    const counts = new Map<string, number>();
    contracts.forEach((contract) => {
      const key = formatLabel(contract.workflow_stage || "unknown");
      counts.set(key, (counts.get(key) || 0) + 1);
    });

    return Array.from(counts.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count);
  }, [contractsByStage, contracts]);

  const largestStage = useMemo(() => {
    return normalizedStages[0] || null;
  }, [normalizedStages]);

  const normalizedValueByType = useMemo(() => {
    if (valueByType.length > 0) {
      return valueByType
        .map((item) => ({
          type: formatLabel(item?.type || item?.contract_type || "Other"),
          totalValue: getNumber(item?.value || item?.total_value),
          count: getNumber(item?.count, 0),
        }))
        .sort((a, b) => b.totalValue - a.totalValue);
    }

    const grouped = new Map<string, { totalValue: number; count: number }>();

    contracts.forEach((contract) => {
      const key = formatLabel(contract.contract_type || "Other");
      const current = grouped.get(key) || { totalValue: 0, count: 0 };
      current.totalValue += Number(contract.value) || 0;
      current.count += 1;
      grouped.set(key, current);
    });

    return Array.from(grouped.entries())
      .map(([type, values]) => ({
        type,
        totalValue: values.totalValue,
        count: values.count,
      }))
      .sort((a, b) => b.totalValue - a.totalValue);
  }, [valueByType, contracts]);

  const normalizedApprovals = useMemo(() => {
    return approvalStats
      .map((item) => ({
        label: formatLabel(item?.status || "unknown"),
        count: getNumber(item?.count),
      }))
      .filter((item) => item.count > 0);
  }, [approvalStats]);

  return (
    <AppShell
      title="Admin Overview"
      subtitle="System-wide statistics, value, risk and activity (admin/manager only)."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Total Users</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {loading ? "—" : totalUsers}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {loading ? "Loading..." : `${activeUsers} active`}
                </p>
              </div>

              <div className="rounded-2xl bg-sky-100 p-4 text-sky-700">
                <Users className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Total Contracts</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {loading ? "—" : totalContracts}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {loading
                    ? "Loading..."
                    : `${createdLast30Days} created in last 30 days`}
                </p>
              </div>

              <div className="rounded-2xl bg-violet-100 p-4 text-violet-700">
                <FileText className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">Pending Approvals</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {loading ? "—" : pendingApprovals}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {loading ? "Loading..." : `${totalApprovals} total`}
                </p>
              </div>

              <div className="rounded-2xl bg-amber-100 p-4 text-amber-700">
                <CheckCircle2 className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500">High Risk Contracts</p>
                <p className="mt-2 text-2xl font-semibold text-slate-950">
                  {loading ? "—" : highRiskContracts}
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  {loading
                    ? "Loading..."
                    : `${mediumRiskContracts} medium · ${lowRiskContracts} low`}
                </p>
              </div>

              <div className="rounded-2xl bg-rose-100 p-4 text-rose-700">
                <AlertTriangle className="h-4 w-4" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[0.9fr_1.9fr]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-950">
              Contract value
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-600">Total value</span>
                <span className="text-lg font-semibold text-slate-950">
                  {loading ? "—" : formatCurrency(contractValueSummary.total)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-600">Average</span>
                <span className="text-lg font-semibold text-slate-950">
                  {loading ? "—" : formatCurrency(contractValueSummary.average)}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-slate-600">Largest</span>
                <span className="text-lg font-semibold text-slate-950">
                  {loading ? "—" : formatCurrency(contractValueSummary.largest)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <CardTitle className="text-lg text-slate-950">
              Contracts by workflow stage
            </CardTitle>

            {largestStage ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-right">
                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                  Largest Segment
                </p>
                <p className="mt-2 text-base font-semibold text-slate-950">
                  {largestStage.label}
                </p>
                <p className="text-xs text-slate-500">
                  {largestStage.count} contracts
                </p>
              </div>
            ) : null}
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-xs text-slate-500">
                Loading workflow stages...
              </p>
            ) : normalizedStages.length === 0 ? (
              <p className="text-xs text-slate-500">No workflow data found.</p>
            ) : (
              <div className="space-y-5">
                {normalizedStages.map((stage) => {
                  const max = largestStage?.count || 1;
                  const width = `${(stage.count / max) * 100}%`;

                  return (
                    <div key={stage.label}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-700">
                          {stage.label}
                        </span>
                        <span className="text-lg font-semibold text-slate-950">
                          {stage.count}
                        </span>
                      </div>

                      <div className="h-3 rounded-full bg-slate-200">
                        <div
                          className="h-3 rounded-full bg-[#07153A]"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-950">
              Value by contract type
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-xs text-slate-500">Loading values...</p>
            ) : normalizedValueByType.length === 0 ? (
              <p className="text-xs text-slate-500">No value data found.</p>
            ) : (
              <div className="space-y-3">
                {normalizedValueByType.map((item) => (
                  <div
                    key={item.type}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-medium text-slate-950">
                          {item.type}
                        </p>
                        <p className="text-xs text-slate-500">
                          {item.count} contract{item.count === 1 ? "" : "s"}
                        </p>
                      </div>
                      <p className="text-lg font-semibold text-slate-950">
                        {formatCurrency(item.totalValue)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg text-slate-950">
              Approvals breakdown
            </CardTitle>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-xs text-slate-500">Loading approvals...</p>
            ) : normalizedApprovals.length === 0 ? (
              <p className="text-xs text-slate-500">No approval data found.</p>
            ) : (
              <div className="space-y-5">
                {normalizedApprovals.map((item) => {
                  const max = Math.max(
                    ...normalizedApprovals.map((x) => x.count),
                    1
                  );
                  const width = `${(item.count / max) * 100}%`;

                  return (
                    <div key={item.label}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <span className="text-sm text-slate-700">
                          {item.label}
                        </span>
                        <span className="text-lg font-semibold text-slate-950">
                          {item.count}
                        </span>
                      </div>

                      <div className="h-3 rounded-full bg-slate-200">
                        <div
                          className="h-3 rounded-full bg-[#07153A]"
                          style={{ width }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-slate-700" />
              <CardTitle className="text-lg text-slate-950">
                Recent users
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-xs text-slate-500">Loading users...</p>
            ) : recentUsers.length === 0 ? (
              <p className="text-xs text-slate-500">No recent users found.</p>
            ) : (
              <div className="space-y-4">
                {recentUsers.map((user, index) => (
                  <div
                    key={user.id || index}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-medium text-slate-950">
                          {user.full_name || user.name || "Unnamed user"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {user.email || "No email"}
                        </p>
                      </div>

                      <div className="text-right">
                        <Badge className={roleBadgeClass(user.role)}>
                          {formatLabel(user.role || "user")}
                        </Badge>
                        <p className="mt-2 text-xs text-slate-500">
                          {formatDate(user.created_at || user.joined_at)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-slate-700" />
              <CardTitle className="text-lg text-slate-950">
                Recent system activity
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <p className="text-xs text-slate-500">Loading activity...</p>
            ) : userActivity.length === 0 ? (
              <p className="text-xs text-slate-500">
                No recent activity found.
              </p>
            ) : (
              <div className="space-y-4">
                {userActivity.map((item, index) => (
                  <div
                    key={item.id || index}
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-base font-medium text-slate-950">
                          {item.title ||
                            `${formatLabel(item.action)} · ${formatLabel(item.resource_type)}`}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {item.description ||
                            item.message ||
                            `${item.user_email || "User"} — activity recorded.`}
                        </p>
                      </div>

                      <p className="text-xs text-slate-500">
                        {formatDate(item.created_at || item.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}