import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowRight, Workflow as WorkflowIcon } from "lucide-react";
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
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Loading workflows...
        </p>
      )}

      {!loading && items.length === 0 && !error && (
        <div className="rounded-3xl border border-dashed border-violet-100 bg-violet-50/60 px-6 py-10 text-center dark:border-violet-500/20 dark:bg-violet-500/10">
          <WorkflowIcon className="mx-auto h-10 w-10 text-violet-400" />
          <p className="mt-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            No workflows found for the existing contracts.
          </p>
        </div>
      )}

      <div className="grid gap-4">
        {items.map(({ workflow, contract }) => {
          const totalSteps = Array.isArray(workflow.steps)
            ? workflow.steps.length
            : 0;
          const currentStep = workflow.current_step ?? 0;
          const progress =
            totalSteps > 0
              ? Math.min(100, Math.round((currentStep / totalSteps) * 100))
              : 0;

          return (
            <Card
              key={workflow.id}
              className="overflow-hidden rounded-3xl border border-violet-100 bg-violet-50/60 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg dark:border-violet-500/20 dark:bg-violet-500/10"
            >
              <CardHeader>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300">
                      <WorkflowIcon className="h-5 w-5" />
                    </div>

                    <div>
                      <CardTitle className="text-xl text-slate-900 dark:text-white">
                        {workflow.name || "Workflow"}
                      </CardTitle>
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                        {contract?.title || `Contract ID: ${workflow.contract_id}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge className={badgeClass(workflow.status)}>
                      {formatLabel(workflow.status)}
                    </Badge>
                    <Badge className="bg-violet-100 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300">
                      Step {currentStep}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <div className="grid gap-3 text-sm text-slate-600 dark:text-slate-300 md:grid-cols-3">
                  <div className="rounded-2xl border border-violet-100 bg-white/70 p-4 dark:border-violet-500/20 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Contract type
                    </p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {contract ? formatLabel(contract.contract_type) : "—"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-100 bg-white/70 p-4 dark:border-violet-500/20 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Total steps
                    </p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {totalSteps}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-100 bg-white/70 p-4 dark:border-violet-500/20 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-wide text-slate-400">
                      Updated
                    </p>
                    <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                      {workflow.updated_at
                        ? new Date(workflow.updated_at).toLocaleDateString()
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>Workflow progress</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/80 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="mt-5 flex justify-end">
                  <Button
                    asChild
                    className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-sm hover:opacity-90"
                  >
                    <Link to={`${detailBasePath}/${workflow.id}`}>
                      Open workflow
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppShell>
  );
}