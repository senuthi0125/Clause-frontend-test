import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  FileWarning,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
} from "lucide-react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Contract } from "@/types/api";

function formatLabel(value?: string | null) {
  return (value || "unrated")
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
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

function formatCurrency(value?: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function badgeClass(value?: string | null) {
  switch ((value || "").toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    case "low":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getDaysRemaining(endDate?: string | null) {
  if (!endDate) return null;

  const end = new Date(endDate);
  if (Number.isNaN(end.getTime())) return null;

  const now = new Date();
  const diff = end.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getRiskScore(contract: Contract) {
  const value = (contract.risk_level || "").toLowerCase();
  if (value === "high") return 3;
  if (value === "medium") return 2;
  if (value === "low") return 1;
  return 0;
}

export default function RiskAnalysisPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.listContracts("?per_page=200");
      setContracts(Array.isArray(data?.contracts) ? data.contracts : []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load risk data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
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

  const stats = useMemo(() => {
    let high = 0;
    let medium = 0;
    let low = 0;
    let unrated = 0;

    contracts.forEach((contract) => {
      const risk = (contract.risk_level || "").toLowerCase();
      if (risk === "high") high += 1;
      else if (risk === "medium") medium += 1;
      else if (risk === "low") low += 1;
      else unrated += 1;
    });

    return {
      total: contracts.length,
      high,
      medium,
      low,
      unrated,
    };
  }, [contracts]);

  const riskByType = useMemo(() => {
    const grouped = new Map<
      string,
      { total: number; high: number; medium: number; low: number; unrated: number }
    >();

    contracts.forEach((contract) => {
      const type = formatLabel(contract.contract_type || "other");
      const risk = (contract.risk_level || "").toLowerCase();

      if (!grouped.has(type)) {
        grouped.set(type, {
          total: 0,
          high: 0,
          medium: 0,
          low: 0,
          unrated: 0,
        });
      }

      const entry = grouped.get(type)!;
      entry.total += 1;

      if (risk === "high") entry.high += 1;
      else if (risk === "medium") entry.medium += 1;
      else if (risk === "low") entry.low += 1;
      else entry.unrated += 1;
    });

    return Array.from(grouped.entries())
      .map(([type, values]) => ({
        type,
        ...values,
      }))
      .sort((a, b) => b.total - a.total);
  }, [contracts]);

  const riskyContracts = useMemo(() => {
    return [...contracts]
      .filter((contract) => {
        const risk = (contract.risk_level || "").toLowerCase();
        return risk === "high" || risk === "medium";
      })
      .sort((a, b) => {
        const riskDiff = getRiskScore(b) - getRiskScore(a);
        if (riskDiff !== 0) return riskDiff;

        const aDays = getDaysRemaining(a.end_date) ?? Number.MAX_SAFE_INTEGER;
        const bDays = getDaysRemaining(b.end_date) ?? Number.MAX_SAFE_INTEGER;
        return aDays - bDays;
      })
      .slice(0, 8);
  }, [contracts]);

  const expiringRiskyContracts = useMemo(() => {
    return [...contracts]
      .filter((contract) => {
        const risk = (contract.risk_level || "").toLowerCase();
        const days = getDaysRemaining(contract.end_date);
        return (risk === "high" || risk === "medium") && days !== null && days <= 90;
      })
      .sort((a, b) => {
        const aDays = getDaysRemaining(a.end_date) ?? Number.MAX_SAFE_INTEGER;
        const bDays = getDaysRemaining(b.end_date) ?? Number.MAX_SAFE_INTEGER;
        return aDays - bDays;
      })
      .slice(0, 6);
  }, [contracts]);

  return (
    <AppShell
      title="Risk Analysis"
      subtitle="Review contract risk levels, risky agreements, and backend-driven contract trends."
      contractGroups={contractGroups}
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading risk analysis...</p>
      ) : null}

      {!loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">High Risk</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">
                      {stats.high}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-red-50 p-3 text-red-600">
                    <ShieldAlert className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Medium Risk</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">
                      {stats.medium}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
                    <AlertTriangle className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Low Risk</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">
                      {stats.low}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">Unrated</p>
                    <p className="mt-2 text-3xl font-semibold text-slate-950">
                      {stats.unrated}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-slate-100 p-3 text-slate-600">
                    <ShieldQuestion className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Contracts Requiring Attention</CardTitle>
              </CardHeader>
              <CardContent>
                {riskyContracts.length ? (
                  <div className="space-y-4">
                    {riskyContracts.map((contract) => (
                      <Link
                        key={contract.id}
                        to={`/contracts/${contract.id}`}
                        className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                      >
                        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                          <div>
                            <p className="text-lg font-medium text-slate-900">
                              {contract.title}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {contract.description || "No description provided."}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-2">
                              <Badge className={badgeClass(contract.risk_level)}>
                                {formatLabel(contract.risk_level)}
                              </Badge>
                              <Badge className="bg-slate-100 text-slate-700">
                                {formatLabel(contract.contract_type)}
                              </Badge>
                              <Badge className="bg-slate-100 text-slate-700">
                                {formatLabel(contract.status)}
                              </Badge>
                            </div>
                          </div>

                          <div className="min-w-[180px] text-sm text-slate-500">
                            <p>
                              <span className="font-medium text-slate-900">
                                Value:
                              </span>{" "}
                              {formatCurrency(contract.value)}
                            </p>
                            <p className="mt-1">
                              <span className="font-medium text-slate-900">
                                End:
                              </span>{" "}
                              {formatDate(contract.end_date)}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">
                    No high or medium risk contracts found.
                  </p>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Expiring Risky Contracts</CardTitle>
                </CardHeader>
                <CardContent>
                  {expiringRiskyContracts.length ? (
                    <div className="space-y-3">
                      {expiringRiskyContracts.map((contract) => {
                        const days = getDaysRemaining(contract.end_date);

                        return (
                          <Link
                            key={contract.id}
                            to={`/contracts/${contract.id}`}
                            className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-slate-900">
                                {contract.title}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {formatDate(contract.end_date)}
                              </p>
                            </div>

                            <div className="shrink-0 text-right">
                              <Badge className={badgeClass(contract.risk_level)}>
                                {formatLabel(contract.risk_level)}
                              </Badge>
                              <p className="mt-2 text-xs text-slate-500">
                                {days != null ? `${days} days left` : "—"}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">
                      No risky contracts expiring within 90 days.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Overall Coverage</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-200 p-2 text-slate-700">
                        <FileWarning className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-slate-600">Total contracts</p>
                    </div>
                    <p className="text-xl font-semibold text-slate-950">
                      {stats.total}
                    </p>
                  </div>

                  <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-slate-200 p-2 text-slate-700">
                        <CalendarClock className="h-5 w-5" />
                      </div>
                      <p className="text-sm text-slate-600">
                        High + medium combined
                      </p>
                    </div>
                    <p className="text-xl font-semibold text-slate-950">
                      {stats.high + stats.medium}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Risk Distribution by Contract Type</CardTitle>
            </CardHeader>
            <CardContent>
              {riskByType.length ? (
                <div className="overflow-x-auto">
                  <div className="min-w-[720px] space-y-4">
                    {riskByType.map((item) => {
                      const total = item.total || 1;
                      const highPercent = (item.high / total) * 100;
                      const mediumPercent = (item.medium / total) * 100;
                      const lowPercent = (item.low / total) * 100;
                      const unratedPercent = (item.unrated / total) * 100;

                      return (
                        <div
                          key={item.type}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <p className="font-medium text-slate-900">
                              {item.type}
                            </p>
                            <p className="text-sm text-slate-500">
                              {item.total} contract{item.total === 1 ? "" : "s"}
                            </p>
                          </div>

                          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                            <div className="flex h-full w-full">
                              <div
                                className="h-full bg-red-400"
                                style={{ width: `${highPercent}%` }}
                              />
                              <div
                                className="h-full bg-amber-400"
                                style={{ width: `${mediumPercent}%` }}
                              />
                              <div
                                className="h-full bg-emerald-400"
                                style={{ width: `${lowPercent}%` }}
                              />
                              <div
                                className="h-full bg-slate-300"
                                style={{ width: `${unratedPercent}%` }}
                              />
                            </div>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-red-50 px-3 py-1 text-red-700">
                              High: {item.high}
                            </span>
                            <span className="rounded-full bg-amber-50 px-3 py-1 text-amber-700">
                              Medium: {item.medium}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                              Low: {item.low}
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                              Unrated: {item.unrated}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">
                  No contract risk data available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      ) : null}
    </AppShell>
  );
}