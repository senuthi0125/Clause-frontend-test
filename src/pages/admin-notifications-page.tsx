import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, CalendarClock, History } from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Contract } from "@/types/api";

function formatLabel(value?: string | null) {
  return (value || "unknown")
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function badgeClass(value?: string | null) {
  switch ((value || "").toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    case "low":
      return "bg-green-100 text-green-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function AdminNotificationsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [expiringSoon, setExpiringSoon] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);

    try {
      const [contractsRes, expiringRes, recentRes] = await Promise.all([
        api.listContracts("?per_page=100"),
        api.getExpiringSoon().catch(() => []),
        api.getRecentActivity().catch(() => []),
      ]);

      setContracts(Array.isArray(contractsRes?.contracts) ? contractsRes.contracts : []);
      setExpiringSoon(Array.isArray(expiringRes) ? expiringRes : []);
      setRecentActivity(Array.isArray(recentRes) ? recentRes : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
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

  const highRiskContracts = useMemo(() => {
    return contracts
      .filter((contract) => (contract.risk_level || "").toLowerCase() === "high")
      .slice(0, 6);
  }, [contracts]);

  return (
    <AppShell
      title="Notifications & Alerts"
      subtitle="Track expiring contracts, recent activity, and high-risk alerts."
      contractGroups={contractGroups}
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-slate-500" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : expiringSoon.length === 0 ? (
              <p className="text-sm text-slate-500">No expiring contracts found.</p>
            ) : (
              <div className="space-y-3">
                {expiringSoon.map((item: any) => (
                  <Link
                    key={item.id}
                    to={`/contracts/${item.id}`}
                    className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-950">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatLabel(item.contract_type)}
                        </p>
                      </div>

                      <div className="text-right text-sm text-slate-500">
                        <p>{item.days_remaining} days</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-slate-500" />
              High Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : highRiskContracts.length === 0 ? (
              <p className="text-sm text-slate-500">No high-risk alerts found.</p>
            ) : (
              <div className="space-y-3">
                {highRiskContracts.map((contract) => (
                  <Link
                    key={contract.id}
                    to={`/contracts/${contract.id}`}
                    className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-medium text-slate-950">
                          {contract.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {contract.description || "No description provided."}
                        </p>
                      </div>

                      <Badge className={badgeClass(contract.risk_level)}>
                        {formatLabel(contract.risk_level)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6 border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Loading activity...</p>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No recent activity found.</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((item: any) => (
                <Link
                  key={item.id}
                  to={`/contracts/${item.id}`}
                  className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium text-slate-950">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {formatLabel(item.status)} · {formatLabel(item.workflow_stage)}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-slate-400">
                      <Bell className="h-4 w-4" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}