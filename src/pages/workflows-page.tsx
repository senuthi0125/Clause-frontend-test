import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatLabel, statusBadgeClass as badgeClass } from "@/lib/utils";
import type { Contract, Workflow } from "@/types/api";

type WorkflowItem = {
  workflow: Workflow;
  contract?: Contract | null;
};

export default function WorkflowsPage() {
  const location = useLocation();
  const isAdminView = location.pathname.startsWith("/admin");

  const [items, setItems] = useState<WorkflowItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const workflowsData = await api.getAllWorkflows();
      const allWorkflows: Workflow[] = Array.isArray(workflowsData?.workflows)
        ? workflowsData.workflows
        : [];

      let allContracts: Contract[] = [];
      try {
        const contractsData = await api.listContracts("?per_page=200");
        allContracts = Array.isArray(contractsData?.contracts)
          ? contractsData.contracts
          : [];
      } catch (contractErr) {
        console.warn("Contracts failed to load on workflows page:", contractErr);
      }

      const contractMap = new Map<string, Contract>();
      allContracts.forEach((contract) => {
        contractMap.set(contract.id, contract);
      });

      const mappedItems: WorkflowItem[] = allWorkflows
        .map((workflow) => ({
          workflow,
          contract: contractMap.get(workflow.contract_id) || null,
        }))
        .sort((a, b) => {
          const aTime = a.workflow.updated_at
            ? new Date(a.workflow.updated_at).getTime()
            : 0;
          const bTime = b.workflow.updated_at
            ? new Date(b.workflow.updated_at).getTime()
            : 0;
          return bTime - aTime;
        });

      setItems(mappedItems);
    } catch (err) {
      console.error("Workflow page load failed:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load workflows."
      );
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();

    items.forEach((item) => {
      const type = item.contract?.contract_type || "other";
      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, count]) => ({
      name: formatLabel(name),
      count,
    }));
  }, [items]);

  const detailBasePath = isAdminView ? "/admin/workflows" : "/workflows";

  return (
    <AppShell
      title="Workflows"
      subtitle="Track workflow progress for contracts connected to the backend."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">Loading workflows...</p>
      )}

      {!loading && items.length === 0 && !error && (
        <p className="text-sm text-slate-500">
          No workflows found for the existing contracts.
        </p>
      )}

      <div className="grid gap-4">
        {items.map(({ workflow, contract }) => (
          <Card
            key={workflow.id}
            className="border border-slate-200 bg-white shadow-sm"
          >
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>{workflow.name || "Workflow"}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    {contract?.title || `Contract ID: ${workflow.contract_id}`}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Badge className={badgeClass(workflow.status)}>
                    {formatLabel(workflow.status)}
                  </Badge>
                  <Badge className="bg-violet-100 text-violet-700">
                    Step {workflow.current_step ?? 0}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-3">
                <div>
                  <span className="font-medium text-slate-900">
                    Contract type:
                  </span>{" "}
                  {contract ? formatLabel(contract.contract_type) : "—"}
                </div>

                <div>
                  <span className="font-medium text-slate-900">
                    Total steps:
                  </span>{" "}
                  {Array.isArray(workflow.steps) ? workflow.steps.length : 0}
                </div>

                <div>
                  <span className="font-medium text-slate-900">Updated:</span>{" "}
                  {workflow.updated_at
                    ? new Date(workflow.updated_at).toLocaleDateString()
                    : "—"}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button asChild>
                  <Link to={`${detailBasePath}/${workflow.id}`}>
                    Open workflow
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}