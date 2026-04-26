import { useCallback, useEffect, useRef, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { AppCard } from "@/components/ui/app-card";
import { AppBadge } from "@/components/ui/app-badge";
import { AppInput } from "@/components/ui/app-input";
import { AppEmptyState } from "@/components/ui/app-empty-state";
import { api } from "@/lib/api";
import type { AuditLogResponse } from "@/types/api";

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function actionBadgeVariant(
  action: string
): "rose" | "emerald" | "amber" | "blue" | "slate" {
  const a = action?.toLowerCase() ?? "";
  if (a.includes("delete") || a.includes("reject")) return "rose";
  if (a.includes("create")) return "emerald";
  if (a.includes("update") || a.includes("change")) return "amber";
  if (a.includes("approve") || a.includes("advance")) return "blue";
  return "slate";
}

export default function AdminAuditPage() {
  const [data, setData] = useState<AuditLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [perPage] = useState(50);

  const [resourceType, setResourceType] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [userId, setUserId] = useState("");

  // Keep a ref to latest filter values so loadData always reads current state
  const filtersRef = useRef({ resourceType, actionFilter, userId });
  useEffect(() => {
    filtersRef.current = { resourceType, actionFilter, userId };
  }, [resourceType, actionFilter, userId]);

  const loadData = useCallback(async (
    targetPage = page,
    filterOverrides?: { resourceType?: string; actionFilter?: string; userId?: string }
  ) => {
    const rt  = filterOverrides?.resourceType  ?? filtersRef.current.resourceType;
    const af  = filterOverrides?.actionFilter  ?? filtersRef.current.actionFilter;
    const uid = filterOverrides?.userId        ?? filtersRef.current.userId;

    setLoading(true);
    setError(null);
    try {
      const result = await api.listAuditLogs({
        resource_type: rt || undefined,
        action: af || undefined,
        user_id: uid || undefined,
        page: targetPage,
        per_page: perPage,
      });
      setData(result);
    } catch (err) {
      console.error("List audit logs failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load audit logs."
      );
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, perPage]);

  // Load on page change
  useEffect(() => {
    loadData(page);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => loadData(page), 30_000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const applyFilters = () => {
    if (page === 1) {
      loadData(1);
    } else {
      setPage(1);
    }
  };

  const clearFilters = () => {
    setResourceType("");
    setActionFilter("");
    setUserId("");
    // Pass empty overrides directly — avoids stale closure issue
    if (page === 1) {
      loadData(1, { resourceType: "", actionFilter: "", userId: "" });
    } else {
      setPage(1);
    }
  };

  const totalPages = data?.total_pages ?? 1;

  return (
    <AppShell
      title="Audit Logs"
      subtitle="Immutable record of system activity (admin/manager only)."
      actions={
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Live · refreshes every 30s
          </span>
          <Button variant="outline" onClick={() => loadData(page)}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      ) : null}

      <AppCard tone="soft" className="mb-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
          <Filter className="h-4 w-4" />
          Filters
        </div>

        <div className="grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              Resource type
            </label>
            <AppInput
              value={resourceType}
              onChange={(e) => setResourceType(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="contract, user, workflow..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              Action
            </label>
            <AppInput
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="create, update, delete..."
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-slate-500 dark:text-slate-400">
              User ID
            </label>
            <AppInput
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              placeholder="clerk_id"
            />
          </div>

          <div className="flex items-end gap-2">
            <Button
              onClick={applyFilters}
              className="bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
            >
              Apply
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </div>
      </AppCard>

      <AppCard tone="default">
        <div className="mb-3 flex items-center justify-between text-sm">
          <p className="text-slate-500 dark:text-slate-400">
            {loading
              ? "Loading audit logs..."
              : `${data?.total ?? 0} log${(data?.total ?? 0) === 1 ? "" : "s"}`}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500 dark:border-white/10 dark:text-slate-400">
                <th className="py-2 pr-4">Time</th>
                <th className="py-2 pr-4">Action</th>
                <th className="py-2 pr-4">Resource</th>
                <th className="py-2 pr-4">User</th>
                <th className="py-2 pr-4">Details</th>
              </tr>
            </thead>
            <tbody>
              {(data?.logs ?? []).length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="py-6">
                    <AppEmptyState title="No audit logs found." />
                  </td>
                </tr>
              ) : null}

              {(data?.logs ?? []).map((log) => (
                <tr
                  key={log.id}
                  className="border-b border-slate-100 align-top last:border-b-0 dark:border-white/6"
                >
                  <td className="whitespace-nowrap py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {formatDateTime(log.created_at)}
                  </td>

                  <td className="py-3 pr-4">
                    <AppBadge variant={actionBadgeVariant(log.action)}>
                      {log.action}
                    </AppBadge>
                  </td>

                  <td className="py-3 pr-4 text-slate-700 dark:text-slate-200">
                    <p>{log.resource_type}</p>
                    {log.resource_id ? (
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {log.resource_id}
                      </p>
                    ) : null}
                  </td>

                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {log.user_email ?? log.user_id ?? "—"}
                  </td>

                  <td className="py-3 pr-4 text-slate-600 dark:text-slate-300">
                    {log.details ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="mt-4 flex items-center justify-between text-sm">
            <p className="text-slate-500 dark:text-slate-400">
              Page {data?.page ?? page} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        ) : null}
      </AppCard>
    </AppShell>
  );
}