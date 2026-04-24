import { useEffect, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

function actionBadgeClass(action: string) {
  const a = action?.toLowerCase() ?? "";
  if (a.includes("delete") || a.includes("reject"))
    return "bg-red-100 text-red-700";
  if (a.includes("create")) return "bg-emerald-100 text-emerald-700";
  if (a.includes("update") || a.includes("change"))
    return "bg-amber-100 text-amber-700";
  if (a.includes("approve") || a.includes("advance"))
    return "bg-blue-100 text-blue-700";
  return "bg-slate-100 text-slate-700";
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

  const loadData = async (targetPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listAuditLogs({
        resource_type: resourceType || undefined,
        action: actionFilter || undefined,
        user_id: userId || undefined,
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
  };

  useEffect(() => {
    loadData(page);
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
    if (page === 1) {
      loadData(1);
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
        <Button variant="outline" onClick={() => loadData(page)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card className="mb-4 border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700">
            <Filter className="h-4 w-4" /> Filters
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Resource type
              </label>
              <Input
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
                placeholder="contract, user, workflow..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Action
              </label>
              <Input
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value)}
                placeholder="create, update, delete..."
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-slate-500">
                User ID
              </label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="clerk_id"
              />
            </div>
            <div className="flex items-end gap-2">
              <Button onClick={applyFilters} className="bg-slate-900 text-white hover:bg-slate-800">
                Apply
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-5">
          <div className="mb-3 flex items-center justify-between text-sm">
            <p className="text-slate-500">
              {loading
                ? "Loading audit logs..."
                : `${data?.total ?? 0} log${(data?.total ?? 0) === 1 ? "" : "s"}`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
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
                    <td
                      colSpan={5}
                      className="py-6 text-center text-sm text-slate-500"
                    >
                      No audit logs found.
                    </td>
                  </tr>
                ) : null}
                {(data?.logs ?? []).map((log) => (
                  <tr
                    key={log.id}
                    className="border-b border-slate-100 last:border-b-0 align-top"
                  >
                    <td className="whitespace-nowrap py-3 pr-4 text-slate-600">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge className={actionBadgeClass(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      <p>{log.resource_type}</p>
                      {log.resource_id ? (
                        <p className="text-xs text-slate-400">
                          {log.resource_id}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {log.user_email ?? log.user_id ?? "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {log.details ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 ? (
            <div className="mt-4 flex items-center justify-between text-sm">
              <p className="text-slate-500">
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
        </CardContent>
      </Card>
    </AppShell>
  );
}
