import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  CalendarDays,
  CircleDollarSign,
  FileText,
  ShieldCheck,
  Tag,
  Trash2,
  Workflow,
  Bot,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import type { Contract, Workflow as WorkflowType } from "@/types/api";

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

function badgeClass(value?: string | null) {
  switch ((value || "").toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    case "low":
      return "bg-green-100 text-green-700";
    case "active":
      return "bg-green-100 text-green-700";
    case "draft":
      return "bg-slate-100 text-slate-700";
    case "review":
    case "approval":
    case "authoring":
    case "execution":
    case "monitoring":
    case "request":
    case "storage":
      return "bg-violet-100 text-violet-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ContractDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContractDetails = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const [contractData, workflowsData, approvalsData] = await Promise.all([
        api.getContract(id),
        api.getContractWorkflows(id).catch(() => ({ workflows: [] })),
        api.getApprovalsByContract(id).catch(() => ({ approvals: [] })),
      ]);

      setContract(contractData);
      setWorkflows(Array.isArray(workflowsData?.workflows) ? workflowsData.workflows : []);
      setApprovals(
        Array.isArray((approvalsData as any)?.approvals)
          ? (approvalsData as any).approvals
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load contract details."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContractDetails();
  }, [id]);

  const contractGroups = useMemo(() => {
    if (!contract) return [];
    return [
      {
        name: formatLabel(contract.contract_type),
        count: 1,
      },
    ];
  }, [contract]);

  const handleDelete = async () => {
    if (!contract?.id) return;

    const confirmed = window.confirm("Delete this contract?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await api.deleteContract(contract.id);
      navigate("/contracts");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete contract."
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell
      title="Contract Details"
      subtitle="View the full contract record from your backend."
      contractGroups={contractGroups}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link to="/contracts">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>

          {contract?.id ? (
            <Button variant="outline" asChild>
              <Link to={`/ai-analysis?contractId=${contract.id}`}>
                <Bot className="mr-2 h-4 w-4" />
                Analyze
              </Link>
            </Button>
          ) : null}

          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting || !contract}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      }
    >
      {error ? (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="text-sm text-slate-500">Loading contract details...</p>
      ) : null}

      {!loading && !contract ? (
        <p className="text-sm text-slate-500">Contract not found.</p>
      ) : null}

      {contract ? (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {contract.title}
                </h1>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Badge className={badgeClass(contract.status)}>
                    {formatLabel(contract.status)}
                  </Badge>
                  <Badge className={badgeClass(contract.workflow_stage)}>
                    {formatLabel(contract.workflow_stage)}
                  </Badge>
                  <Badge className={badgeClass(contract.risk_level)}>
                    {formatLabel(contract.risk_level || "unrated")}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="mt-6 grid gap-4 xl:grid-cols-[1fr_1fr_1fr_1fr_1.4fr]">
              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <FileText className="mb-4 h-6 w-6 text-violet-500" />
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Type
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatLabel(contract.contract_type)}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <CircleDollarSign className="mb-4 h-6 w-6 text-emerald-500" />
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Value
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatCurrency(contract.value)}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <CalendarDays className="mb-4 h-6 w-6 text-slate-700" />
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    Start
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatDate(contract.start_date)}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <CalendarDays className="mb-4 h-6 w-6 text-amber-500" />
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    End
                  </p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">
                    {formatDate(contract.end_date)}
                  </p>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border-slate-200 shadow-sm">
                <CardContent className="p-5">
                  <Tag className="mb-4 h-6 w-6 text-slate-500" />
                  <p className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                    Tags
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {contract.tags?.length ? (
                      contract.tags.map((tag, index) => (
                        <Badge
                          key={`${tag}-${index}`}
                          className="bg-violet-100 text-violet-700"
                        >
                          {String(tag).toUpperCase()}
                        </Badge>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No tags yet</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Details</CardTitle>
              </CardHeader>

              <CardContent className="space-y-5">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Description
                  </p>
                  <p className="mt-3 text-lg text-slate-800">
                    {contract.description || "No description provided."}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                      Approval Type
                    </p>
                    <p className="mt-3 text-xl font-medium text-slate-900">
                      {formatLabel((contract as any).approval_type)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-5">
                    <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                      Workflow Trigger
                    </p>
                    <p className="mt-3 text-xl font-medium text-slate-900">
                      {formatLabel((contract as any).workflow_trigger)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Payment Terms
                  </p>
                  <p className="mt-3 text-xl text-slate-900">
                    {contract.payment_terms || "No payment terms available."}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Parties
                  </p>

                  <div className="mt-3 space-y-3">
                    {contract.parties?.length ? (
                      contract.parties.map((party, index) => (
                        <div
                          key={`${party.name}-${index}`}
                          className="rounded-xl border border-slate-200 bg-white p-4"
                        >
                          <p className="font-medium text-slate-900">
                            {party.name || "Unnamed party"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {party.role || "No role"}
                            {party.organization
                              ? ` • ${party.organization}`
                              : ""}
                          </p>
                          {party.email ? (
                            <p className="mt-1 text-sm text-slate-500">
                              {party.email}
                            </p>
                          ) : null}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">
                        No parties added yet.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Workflow className="h-5 w-5 text-slate-500" />
                    Workflows
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {workflows.length ? (
                    <div className="space-y-3">
                      {workflows.map((workflow) => (
                        <Link
                          key={workflow.id}
                          to={`/workflows/${workflow.id}`}
                          className="block rounded-2xl border border-slate-200 p-4 transition hover:bg-slate-50"
                        >
                          <p className="font-medium text-slate-900">
                            {workflow.name || "Workflow"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatLabel((workflow as any).status || "active")}
                          </p>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No workflows yet</p>
                  )}
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-slate-500" />
                    Approvals
                  </CardTitle>
                </CardHeader>

                <CardContent>
                  {approvals.length ? (
                    <div className="space-y-3">
                      {approvals.map((approval, index) => (
                        <div
                          key={approval.id || index}
                          className="rounded-2xl border border-slate-200 p-4"
                        >
                          <p className="font-medium text-slate-900">
                            {approval.name ||
                              approval.approver_name ||
                              approval.approver ||
                              "Approval"}
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            {formatLabel(approval.status || "pending")}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500">No approvals yet</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}