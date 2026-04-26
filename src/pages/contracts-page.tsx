import { useEffect, useMemo, useState } from "react";
import { Plus, Search, Trash2, Upload } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/use-role";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { AppInput } from "@/components/ui/app-input";
import { AppBadge } from "@/components/ui/app-badge";
import {
  AppCard,
  AppCardDescription,
  AppCardHeader,
  AppCardTitle,
} from "@/components/ui/app-card";
import { api, buildContractsQuery } from "@/lib/api";
import type { Contract, ContractsResponse } from "@/types/api";

const WORKFLOW_STAGES = [
  "request",
  "authoring",
  "review",
  "approval",
  "execution",
  "storage",
  "monitoring",
  "renewal",
] as const;

function WorkflowProgressBar({ stage }: { stage?: string | null }) {
  const current = WORKFLOW_STAGES.indexOf(
    (stage ?? "request") as (typeof WORKFLOW_STAGES)[number]
  );
  const activeIdx = current < 0 ? 0 : current;

  return (
    <div className="mt-4">
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Document Stage
      </p>
      <div className="flex items-center gap-0.5">
        {WORKFLOW_STAGES.map((s, i) => {
          const isDone = i < activeIdx;
          const isCurrent = i === activeIdx;

          return (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-2 w-full rounded-full transition-all ${
                  isDone
                    ? "bg-green-500"
                    : isCurrent
                    ? "bg-violet-500"
                    : "bg-slate-200 dark:bg-white/10"
                }`}
              />
              {isCurrent && (
                <span className="whitespace-nowrap text-[10px] font-medium text-violet-600 dark:text-violet-300">
                  {formatLabel(s)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatLabel(value?: string | null) {
  return (value || "-")
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

function badgeVariant(
  value?: string | null
): "rose" | "amber" | "emerald" | "slate" | "violet" {
  switch ((value || "").toLowerCase()) {
    case "high":
      return "rose";
    case "medium":
      return "amber";
    case "low":
      return "emerald";
    case "active":
      return "emerald";
    case "draft":
      return "slate";
    case "review":
    case "approval":
    case "authoring":
    case "execution":
    case "monitoring":
    case "request":
    case "storage":
      return "violet";
    default:
      return "slate";
  }
}

function getRiskBadgeLabel(contract: Contract) {
  const riskScore = (contract as Contract & { risk_score?: number | null })
    .risk_score;

  if (typeof riskScore === "number" && !Number.isNaN(riskScore)) {
    return `Risk ${riskScore}`;
  }

  if (contract.risk_level) {
    return `${formatLabel(contract.risk_level)} risk`;
  }

  return "Unrated";
}

function getRiskBadgeVariant(
  contract: Contract
): "rose" | "amber" | "emerald" | "slate" | "violet" {
  if (contract.risk_level) {
    return badgeVariant(contract.risk_level);
  }

  return "slate";
}

export default function ContractsPage() {
  const navigate = useNavigate();
  const { isAdminOrManager } = useRole();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [meta, setMeta] = useState<ContractsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = async () => {
    setLoading(true);
    setError(null);

    try {
      const query = buildContractsQuery({ search, status, per_page: 50 });
      const data = await api.listContracts(query);
      setContracts(Array.isArray(data.contracts) ? data.contracts : []);
      setMeta(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load contracts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadContracts();
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

  const deleteContract = async (id: string) => {
    const confirmed = window.confirm("Delete this contract?");
    if (!confirmed) return;

    try {
      await api.deleteContract(id);
      await loadContracts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete contract."
      );
    }
  };

  return (
    <AppShell
      title="Contracts"
      subtitle={
        isAdminOrManager
          ? "All contracts across all users — manage, review, and advance workflows."
          : "Your uploaded contracts — track each document's approval stage below."
      }
      contractGroups={contractGroups}
    >
      <AppCard tone="default" padded={false}>
        <div className="p-4">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <AppInput
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadContracts()}
                  placeholder="Search by title"
                  className="h-11 pl-9"
                />
              </div>

              <select
                className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900 outline-none transition-all focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100 dark:border-white/10 dark:bg-white/5 dark:text-white"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
                <option value="renewed">Renewed</option>
              </select>

              <Button
                onClick={loadContracts}
                className="h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow hover:opacity-90"
              >
                Apply filters
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-3 dark:border-white/6">
              <Button
                variant="outline"
                asChild
                className="h-11 rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
              >
                <Link to="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload contract
                </Link>
              </Button>

              <Button
                asChild
                className="h-11 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow hover:opacity-90"
              >
                <Link to="/contracts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New contract
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </AppCard>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Loading contracts...
          </p>
        ) : null}

        {!loading && contracts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            No contracts found.
          </p>
        ) : null}

        {contracts.map((contract) => (
          <AppCard
            key={contract.id}
            tone="default"
            padded={false}
            className="cursor-pointer transition hover:border-slate-300 hover:shadow-md dark:hover:border-white/15"
            onClick={() => navigate(`/contracts/${contract.id}`)}
          >
            <div className="border-b border-slate-100 px-5 py-5 dark:border-white/6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <AppCardTitle className="text-xl">
                    {contract.title}
                  </AppCardTitle>
                  <AppCardDescription>
                    {contract.description || "No description provided."}
                  </AppCardDescription>
                </div>

                <div
                  className="flex flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <AppBadge variant={badgeVariant(contract.status)}>
                    {formatLabel(contract.status)}
                  </AppBadge>
                  <AppBadge variant={badgeVariant(contract.workflow_stage)}>
                    {formatLabel(contract.workflow_stage)}
                  </AppBadge>
                  <AppBadge variant={getRiskBadgeVariant(contract)}>
                    {getRiskBadgeLabel(contract)}
                  </AppBadge>
                </div>
              </div>
            </div>

            <div className="px-5 py-5">
              <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    Type:
                  </span>{" "}
                  {formatLabel(contract.contract_type)}
                </div>
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    Value:
                  </span>{" "}
                  {formatCurrency(contract.value)}
                </div>
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    Start:
                  </span>{" "}
                  {formatDate(contract.start_date)}
                </div>
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    End:
                  </span>{" "}
                  {formatDate(contract.end_date)}
                </div>
                <div>
                  <span className="font-medium text-slate-900 dark:text-white">
                    Version:
                  </span>{" "}
                  {contract.current_version ?? 1}
                </div>
              </div>

              <WorkflowProgressBar stage={contract.workflow_stage} />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-white/6">
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Parties:{" "}
                    {contract.parties?.map((party) => party.name).join(", ") ||
                      "No parties added"}
                  </div>
                  {isAdminOrManager && contract.created_by && (
                    <div className="text-xs text-slate-400 dark:text-slate-500">
                      Uploaded by:{" "}
                      <span className="font-medium text-slate-600 dark:text-slate-300">
                        {contract.created_by}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="flex flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {contract.workflow_id ? (
                    <Button
                      variant="outline"
                      asChild
                      className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                    >
                      <Link to={`/workflows/${contract.workflow_id}`}>
                        {isAdminOrManager ? "Manage workflow" : "Track progress"}
                      </Link>
                    </Button>
                  ) : null}

                  <Button
                    variant="outline"
                    asChild
                    className="rounded-xl border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
                  >
                    <Link to="/conflict-detection">Compare</Link>
                  </Button>

                  {isAdminOrManager && (
                    <Button
                      variant="destructive"
                      onClick={() => deleteContract(contract.id)}
                      className="rounded-xl bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:hover:bg-rose-500/20"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </AppCard>
        ))}
      </div>

      {meta ? (
        <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
          Showing {contracts.length} of {meta.total} contracts.
        </p>
      ) : null}
    </AppShell>
  );
}