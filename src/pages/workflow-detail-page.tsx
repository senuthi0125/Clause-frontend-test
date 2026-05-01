import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { useRole } from "@/hooks/use-role";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import { formatLabel, statusBadgeClass as badgeClass } from "@/lib/utils";
import type { ApprovalListResponse, Contract, Workflow } from "@/types/api";

type ApprovalItem =
  ApprovalListResponse["approvals"] extends Array<infer T> ? T : never;

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const { isAdminOrManager: canManage } = useRole();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [contract, setContract] = useState<Contract | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadData = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const workflowData = await api.getWorkflow(id);
      setWorkflow(workflowData);

      try {
        const contractData = await api.getContract(workflowData.contract_id);
        setContract(contractData);
      } catch {
        setContract(null);
      }

      try {
        const approvalsData = await api.getApprovalsByContract(
          workflowData.contract_id
        );
        setApprovals(Array.isArray(approvalsData.approvals) ? approvalsData.approvals : []);
      } catch {
        setApprovals([]);
      }
    } catch {
      setError("Failed to load workflow details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const contractGroups = useMemo(() => {
    return contract ? [{ name: formatLabel(contract.contract_type), count: 1 }] : [];
  }, [contract]);

  const advance = async () => {
    if (!id) return;

    setActionLoading(true);
    setError(null);

    try {
      await api.advanceWorkflow(id, note);
      setNote("");
      await loadData();
    } catch {
      setError("Failed to advance workflow.");
    } finally {
      setActionLoading(false);
    }
  };

  const reject = async () => {
    if (!id) return;

    setActionLoading(true);
    setError(null);

    try {
      await api.rejectWorkflow(id, note || "Rejected from frontend");
      setNote("");
      await loadData();
    } catch {
      setError("Failed to reject workflow.");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AppShell
      title="Workflow Details"
      subtitle="Monitor and control a workflow instance from the backend."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500">Loading workflow details...</p>
      )}

      {!loading && workflow && (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="border border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>{workflow.name}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    {contract?.title || "No linked contract"}
                  </p>
                </div>

                <Badge className={badgeClass(workflow.status)}>
                  {formatLabel(workflow.status)}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {(workflow.steps || []).map((step) => (
                  <div
                    key={step.step_number}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-medium text-slate-900">
                          {step.step_number}. {step.name}
                        </p>
                        <p className="text-sm text-slate-500">
                          Type: {formatLabel(step.step_type)}
                        </p>
                        {step.comments ? (
                          <p className="mt-2 text-sm text-slate-600">
                            {step.comments}
                          </p>
                        ) : null}
                      </div>

                      <Badge className={badgeClass(step.status)}>
                        {formatLabel(step.status)}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-5">
            {canManage ? (
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Workflow Actions</CardTitle>
                </CardHeader>

                <CardContent>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Add a comment for this step"
                    className="min-h-36 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none"
                  />

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Button onClick={advance} disabled={actionLoading}>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Advance
                    </Button>

                    <Button
                      variant="destructive"
                      onClick={reject}
                      disabled={actionLoading}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Workflow Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-500">
                    Your document is currently at step{" "}
                    <span className="font-medium text-slate-900">
                      {workflow?.current_step ?? "—"}
                    </span>{" "}
                    of{" "}
                    <span className="font-medium text-slate-900">
                      {workflow?.steps?.length ?? "—"}
                    </span>
                    . An admin or manager will review and advance the workflow.
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Related Approvals</CardTitle>
              </CardHeader>

              <CardContent>
                {approvals.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    No related approvals found.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {approvals.map((approval) => (
                      <div
                        key={approval.id}
                        className="rounded-xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-slate-900">
                              {formatLabel(approval.approval_type)}
                            </p>
                            <p className="mt-2 text-sm text-slate-500">
                              Approvers:{" "}
                              {approval.approvers
                                ?.map((item) => item.user_id)
                                .join(", ") || "—"}
                            </p>
                          </div>

                          <Badge className={badgeClass(approval.status)}>
                            {formatLabel(approval.status)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}