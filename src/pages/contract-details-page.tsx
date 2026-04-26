import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Eye,
  FileEdit,
  FileText,
  Loader2,
  Save,
  Layers,
  Plus,
  Send,
  ShieldCheck,
  Tag,
  Trash2,
  Workflow,
  X,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Clock,
  ChevronRight,
  User,
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { useRole } from "@/hooks/use-role";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { AppBadge } from "@/components/ui/app-badge";
import { AppCard } from "@/components/ui/app-card";
import { api, API_BASE_URL } from "@/lib/api";
import { cn, formatLabel as fmt, formatDate as fmtDate, formatCurrency as fmtCurrency, statusBadgeClass as badgeClass } from "@/lib/utils";
import type { Contract, Workflow as WorkflowType, Approval, WorkflowTemplate } from "@/types/api";

// ─── Workflow step names (matches DEFAULT_WORKFLOW_STEPS on the backend) ──────
const STEP_LABELS: Record<number, string> = {
  1: "Request & Initiation",
  2: "Authoring & Drafting",
  3: "AI Risk Analysis",
  4: "Review & Negotiation",
  5: "Approval",
  6: "Execution & Signing",
  7: "Storage & Repository",
  8: "Monitoring & Obligations",
  9: "Renewal / Expiration",
};

// ─── Document viewer ─────────────────────────────────────────────────────────

type ViewMode = "preview" | "libreoffice";

function DocumentPanel({ contractId, contractTitle }: { contractId: string; contractTitle?: string }) {
  const [mode, setMode]               = useState<ViewMode>("libreoffice");
  const [fileType, setFileType]       = useState("");
  const [hasFile, setHasFile]         = useState(false);
  const [text, setText]               = useState("");
  const [docxHtml, setDocxHtml]       = useState("");
  const [loading, setLoading]         = useState(true);
  const [docxLoading, setDocxLoading] = useState(false);
  const [wopiUrl, setWopiUrl]         = useState<string | null>(null);
  const [wopiLoading, setWopiLoading] = useState(false);
  const [wopiError, setWopiError]     = useState<string | null>(null);

  const viewUrl        = `${API_BASE_URL}/api/documents/view/${contractId}`;
  const isPdf          = fileType === ".pdf";
  const isDocx         = fileType === ".docx" || fileType === ".doc";
  const isTxt          = fileType === ".txt" || fileType === ".rtf" || fileType === ".odt";
  const canLibreOffice = hasFile;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api.getDocumentText(contractId)
      .then((r) => {
        if (!cancelled) {
          setFileType(r.file_type || "");
          setHasFile(r.has_file);
          setText(r.text || "");
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [contractId]);

  const loadDocxHtml = useCallback(async () => {
    if (!isDocx || docxHtml || docxLoading) return;
    setDocxLoading(true);
    try {
      const resp    = await fetch(viewUrl);
      const buf     = await resp.arrayBuffer();
      const mammoth = await import("mammoth");
      const result  = await mammoth.convertToHtml({ arrayBuffer: buf });
      setDocxHtml(result.value);
    } catch {
      setDocxHtml("<p style='color:#888'>Could not render DOCX — download to view.</p>");
    } finally {
      setDocxLoading(false);
    }
  }, [isDocx, docxHtml, docxLoading, viewUrl]);

  useEffect(() => {
    if (isDocx && mode === "preview") loadDocxHtml();
  }, [isDocx, mode, loadDocxHtml]);

  const loadWopiUrl = useCallback(async () => {
    if (wopiUrl || wopiLoading) return;
    setWopiLoading(true);
    setWopiError(null);
    try {
      const data = await api.getWopiUrl(contractId);
      setWopiUrl(data.editor_url);
    } catch (err) {
      setWopiError(err instanceof Error ? err.message : "Could not load LibreOffice editor.");
    } finally {
      setWopiLoading(false);
    }
  }, [contractId, wopiUrl, wopiLoading]);

  useEffect(() => {
    if (mode === "libreoffice") loadWopiUrl();
  }, [mode, loadWopiUrl]);

  function handleDownload() {
    const a = document.createElement("a");
    a.href = viewUrl;
    a.download = contractTitle ? `${contractTitle}${fileType}` : `contract${fileType}`;
    a.click();
  }

  if (loading) return (
    <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16">
      <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
      <span className="text-sm text-slate-500">Loading document…</span>
    </div>
  );

  if (!hasFile) return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center">
      <FileText className="h-10 w-10 text-slate-300" />
      <p className="font-medium text-slate-600">No document file attached yet</p>
      <p className="text-sm text-slate-400">
        Upload a file from the{" "}
        <Link to="/contracts" className="text-blue-500 underline hover:text-blue-600">
          Contracts page
        </Link>{" "}
        to view it here.
      </p>
    </div>
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
          <button
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              mode === "preview" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          {canLibreOffice && (
            <button
              onClick={() => setMode("libreoffice")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                mode === "libreoffice" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              <FileEdit className="h-3.5 w-3.5" /> LibreOffice
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleDownload} className="rounded-xl">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download
          </Button>
          <Badge className="rounded-lg bg-slate-100 px-2 py-1 text-[11px] uppercase tracking-wide text-slate-600">
            {fileType || "file"}
          </Badge>
        </div>
      </div>

      {/* LibreOffice (Collabora Online) */}
      {mode === "libreoffice" && (
        <div style={{ height: "80vh" }}>
          {wopiLoading && (
            <div className="flex h-full items-center justify-center gap-3 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm">Loading LibreOffice editor…</span>
            </div>
          )}
          {wopiError && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
              <p className="text-sm font-medium text-red-600">{wopiError}</p>
              <button
                onClick={() => { setWopiUrl(null); setWopiError(null); loadWopiUrl(); }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                Retry
              </button>
            </div>
          )}
          {wopiUrl && !wopiLoading && (
            <iframe
              src={wopiUrl}
              title="LibreOffice Editor"
              className="h-full w-full border-0"
              allow="clipboard-read; clipboard-write"
            />
          )}
        </div>
      )}

      {/* Preview */}
      {mode === "preview" && (
        <>
          {isPdf && (
            <iframe
              src={viewUrl}
              title="Contract document"
              className="w-full"
              style={{ height: "72vh", border: "none" }}
            />
          )}
          {isDocx && (
            <div
              className="prose prose-slate max-w-none overflow-auto px-10 py-8"
              style={{ minHeight: "60vh", maxHeight: "72vh" }}
            >
              {docxLoading ? (
                <div className="flex items-center gap-2 py-10 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin" /> Rendering…
                </div>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: docxHtml || "<p>No content.</p>" }} />
              )}
            </div>
          )}
          {isTxt && (
            <pre
              className="overflow-auto whitespace-pre-wrap break-words px-10 py-8 font-mono text-sm text-slate-800"
              style={{ minHeight: "50vh", maxHeight: "72vh" }}
            >
              {text || <span className="italic text-slate-400">No text extracted.</span>}
            </pre>
          )}
          {!isPdf && !isDocx && !isTxt && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500">Preview not supported for this file type.</p>
              <Button variant="outline" className="rounded-xl" onClick={handleDownload}>
                <Download className="mr-2 h-4 w-4" /> Download to view
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Send for Approval panel ─────────────────────────────────────────────────

function SendApprovalPanel({
  contractId,
  workflowId,
  onDone,
  onClose,
}: {
  contractId: string;
  workflowId?: string;
  onDone: () => void;
  onClose: () => void;
}) {
  const [approvalType, setApprovalType] = useState("all_required");
  const [approverInput, setApproverInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    const ids = approverInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await api.createApproval({
        contract_id: contractId,
        workflow_id: workflowId,
        approval_type: approvalType,
        approver_ids: ids,
      });
      onDone();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create approval."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4 rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 font-semibold text-blue-900 dark:text-blue-300">
          <Send className="h-4 w-4" /> Send for Approval
        </p>
        <button
          onClick={onClose}
          className="text-blue-400 hover:text-blue-600 dark:hover:text-blue-200"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Approval Type
          </label>
          <select
            value={approvalType}
            onChange={(e) => setApprovalType(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white"
          >
            <option value="all_required">
              All Required — everyone must approve
            </option>
            <option value="majority">
              Majority — more than half must approve
            </option>
            <option value="first_person">
              First Person — first vote decides
            </option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Approver User IDs{" "}
            <span className="font-normal normal-case text-slate-400">
              (comma-separated, optional)
            </span>
          </label>
          <input
            type="text"
            value={approverInput}
            onChange={(e) => setApproverInput(e.target.value)}
            placeholder="user_abc123, user_def456 — leave blank for admin to decide"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 dark:border-white/10 dark:bg-white/10 dark:text-white"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl border-slate-200 dark:border-white/10"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="rounded-xl"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <Send className="mr-1.5 h-3.5 w-3.5" />
          )}
          {submitting ? "Submitting…" : "Submit for Approval"}
        </Button>
      </div>
    </div>
  );
}

// ─── Workflow status card ─────────────────────────────────────────────────────

function WorkflowCard({
  workflows,
  contractId,
  onWorkflowCreated,
}: {
  workflows: WorkflowType[];
  contractId: string;
  onWorkflowCreated: () => void;
}) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = workflows[0] ?? null;

  async function startWorkflow() {
    setCreating(true);
    setError(null);
    try {
      await api.createWorkflow({
        contract_id: contractId,
        name: "Contract Review Workflow",
      });
      onWorkflowCreated();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start workflow."
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <AppCard tone="soft">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
          <Workflow className="h-5 w-5 text-slate-500" /> Workflow
        </h2>
      </div>

      <div className="space-y-4">
        {error && <p className="text-xs text-red-600 dark:text-red-300">{error}</p>}

        {!latest ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No workflow started yet.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full rounded-xl border-slate-200 dark:border-white/10"
              onClick={startWorkflow}
              disabled={creating}
            >
              {creating ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Workflow className="mr-2 h-3.5 w-3.5" />
              )}
              {creating ? "Starting…" : "Start Workflow"}
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {latest.name || "Review Workflow"}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  Step {latest.current_step} of {latest.steps?.length ?? 9}
                </p>
              </div>
              <AppBadge variant={badgeVariant(latest.status)}>
                {fmt(latest.status)}
              </AppBadge>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 dark:border-white/8 dark:bg-white/5">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                Current Step
              </p>
              <p className="mt-0.5 text-sm font-semibold text-slate-800 dark:text-white">
                {STEP_LABELS[latest.current_step] ??
                  `Step ${latest.current_step}`}
              </p>
            </div>

            <div className="flex items-center gap-1">
              {Array.from({ length: latest.steps?.length ?? 9 }, (_, i) => {
                const stepNum = i + 1;
                const stepData = latest.steps?.find(
                  (s) => s.step_number === stepNum
                );
                const isDone = stepData?.status === "completed";
                const isCurrent = stepNum === latest.current_step;
                const isRejected = stepData?.status === "rejected";

                return (
                  <div
                    key={stepNum}
                    title={STEP_LABELS[stepNum] ?? `Step ${stepNum}`}
                    className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                      isRejected
                        ? "bg-red-400"
                        : isDone
                        ? "bg-green-500"
                        : isCurrent
                        ? "bg-blue-500"
                        : "bg-slate-200 dark:bg-white/10"
                    }`}
                  />
                );
              })}
            </div>

            <p className="text-right text-[10px] text-slate-400">
              {latest.steps?.filter((s) => s.status === "completed").length ??
                0}{" "}
              / {latest.steps?.length ?? 9} steps completed
            </p>

            <Button
              asChild
              size="sm"
              variant="outline"
              className="w-full rounded-xl border-slate-200 dark:border-white/10"
            >
              <Link to={`/workflows/${latest.id}`}>
                Open workflow <ChevronRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </>
        )}
      </div>
    </AppCard>
  );
}

// ─── Approval status card ─────────────────────────────────────────────────────

function ApprovalCard({
  approvals,
  contractId,
  workflowId,
  currentUserClerkId,
  isAdminOrManager,
  onRefresh,
}: {
  approvals: Approval[];
  contractId: string;
  workflowId?: string;
  currentUserClerkId?: string;
  isAdminOrManager: boolean;
  onRefresh: () => void;
}) {
  const [showPanel, setShowPanel] = useState(false);
  const [voting, setVoting] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<string | null>(null);
  const latest = approvals[0] ?? null;

  async function handleVote(approvalId: string, decision: string) {
    setVoting(approvalId);
    setVoteError(null);
    try {
      await api.castVote(approvalId, decision);
      onRefresh();
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : "Vote failed.");
    } finally {
      setVoting(null);
    }
  }

  const voteCount = latest
    ? {
        approved:
          latest.approvers?.filter((a) => a.decision === "approved").length ??
          0,
        rejected:
          latest.approvers?.filter((a) => a.decision === "rejected").length ??
          0,
        pending: latest.approvers?.filter((a) => !a.decision).length ?? 0,
        total: latest.approvers?.length ?? 0,
      }
    : null;

  const alreadyVoted =
    latest && currentUserClerkId
      ? latest.approvers?.some(
          (a) => a.user_id === currentUserClerkId && a.decision
        )
      : false;

  return (
    <AppCard tone="soft">
      <div className="mb-5">
        <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
          <ShieldCheck className="h-5 w-5 text-slate-500" /> Approval
        </h2>
      </div>

      <div className="space-y-4">
        {voteError && (
          <p className="text-xs text-red-600 dark:text-red-300">{voteError}</p>
        )}

        {!latest && !showPanel && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              No approval request yet.
            </p>
            <Button
              size="sm"
              className="w-full rounded-xl"
              onClick={() => setShowPanel(true)}
            >
              <Send className="mr-2 h-3.5 w-3.5" /> Send for Approval
            </Button>
          </div>
        )}

        {showPanel && (
          <SendApprovalPanel
            contractId={contractId}
            workflowId={workflowId}
            onDone={() => {
              setShowPanel(false);
              onRefresh();
            }}
            onClose={() => setShowPanel(false)}
          />
        )}

        {latest && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800 dark:text-white">
                  {fmt(latest.approval_type)} Approval
                </p>
                {latest.due_date && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock className="h-3 w-3" /> Due {fmtDate(latest.due_date)}
                  </p>
                )}
              </div>
              <AppBadge variant={badgeVariant(latest.status)}>
                {fmt(latest.status)}
              </AppBadge>
            </div>

            {voteCount && voteCount.total > 0 && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-green-50 py-2 dark:bg-green-500/10">
                  <p className="text-lg font-bold text-green-700 dark:text-green-300">
                    {voteCount.approved}
                  </p>
                  <p className="text-[11px] text-green-600 dark:text-green-300">
                    Approved
                  </p>
                </div>
                <div className="rounded-xl bg-red-50 py-2 dark:bg-red-500/10">
                  <p className="text-lg font-bold text-red-700 dark:text-red-300">
                    {voteCount.rejected}
                  </p>
                  <p className="text-[11px] text-red-600 dark:text-red-300">
                    Rejected
                  </p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2 dark:bg-white/5">
                  <p className="text-lg font-bold text-slate-600 dark:text-slate-300">
                    {voteCount.pending}
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-400">
                    Pending
                  </p>
                </div>
              </div>
            )}

            {isAdminOrManager &&
              latest.status === "pending" &&
              !alreadyVoted && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Cast your vote
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      className="rounded-xl bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={() => handleVote(latest.id, "approved")}
                      disabled={voting === latest.id}
                    >
                      {voting === latest.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <>
                          <ThumbsUp className="mr-1 h-3.5 w-3.5" /> Approve
                        </>
                      )}
                    </Button>

                    <Button
                      size="sm"
                      className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
                      onClick={() => handleVote(latest.id, "rejected")}
                      disabled={voting === latest.id}
                    >
                      <ThumbsDown className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>

                    <Button
                      size="sm"
                      className="rounded-xl bg-amber-500 text-white hover:bg-amber-600"
                      onClick={() => handleVote(latest.id, "changes_requested")}
                      disabled={voting === latest.id}
                    >
                      <RotateCcw className="mr-1 h-3.5 w-3.5" /> Revise
                    </Button>
                  </div>
                </div>
              )}

            {isAdminOrManager &&
              latest.status === "pending" &&
              alreadyVoted && (
                <p className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-300">
                  <CheckCircle2 className="h-3.5 w-3.5" /> You have already cast
                  your vote
                </p>
              )}

            {(latest.approvers?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Approvers
                </p>
                <div className="space-y-1.5">
                  {latest.approvers.map((a, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2 dark:border-white/8"
                    >
                      <p className="max-w-[120px] truncate text-xs text-slate-600 dark:text-slate-300">
                        {a.user_id}
                      </p>
                      <AppBadge
                        variant={badgeVariant(a.decision ?? "pending")}
                        className="text-[10px]"
                      >
                        {a.decision ? fmt(a.decision) : "Pending"}
                      </AppBadge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {["approved", "rejected"].includes(latest.status) && (
              <Button
                size="sm"
                variant="outline"
                className="w-full rounded-xl border-slate-200 dark:border-white/10"
                onClick={() => setShowPanel(true)}
              >
                <Send className="mr-2 h-3.5 w-3.5" /> New Approval Request
              </Button>
            )}
          </div>
        )}
      </div>
    </AppCard>
  );
}

// ─── Contract AI Chat ─────────────────────────────────────────────────────────

type AiChatMsg = { id: string; role: "user" | "assistant"; content: string; pending?: boolean };

function ContractAIChat({ contractId }: { contractId: string }) {
  const [messages, setMessages] = useState<AiChatMsg[]>([
    { id: "intro", role: "assistant", content: "Hi! I'm your contract assistant. Ask me anything about this document or any general legal question." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setLoading(true);
    const uid = `${Date.now()}-u`;
    const aid = `${Date.now()}-a`;
    setMessages((prev) => [
      ...prev,
      { id: uid, role: "user", content: q },
      { id: aid, role: "assistant", content: "Thinking…", pending: true },
    ]);
    try {
      const data = await api.chat(q, contractId);
      const answer =
        typeof data?.answer === "string" && data.answer.trim()
          ? data.answer
          : "I couldn't generate a response right now.";
      setMessages((prev) =>
        prev.map((m) => (m.id === aid ? { ...m, content: answer, pending: false } : m))
      );
    } catch {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === aid ? { ...m, content: "Request failed — please try again.", pending: false } : m
        )
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-4 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
          <Bot className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="font-semibold text-white">AI Contract Assistant</p>
          <p className="text-xs text-white/70">Ask questions about this contract or general legal topics</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-5" style={{ minHeight: 0 }}>
        {messages.map((msg) => {
          const isUser = msg.role === "user";
          return (
            <div key={msg.id} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div className={`flex max-w-[80%] items-start gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                <div className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full mt-0.5",
                  isUser
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-violet-600"
                )}>
                  {isUser ? <User className="h-3.5 w-3.5" /> : <Bot className="h-3.5 w-3.5" />}
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm",
                  isUser
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-slate-50 text-slate-700"
                )}>
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                  {msg.pending && (
                    <span className="mt-1 flex items-center gap-1 text-xs text-slate-400">
                      <Loader2 className="h-3 w-3 animate-spin" /> Generating…
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 shrink-0">
        <div className="flex items-end gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
          <textarea
            ref={textareaRef}
            className="min-h-[36px] flex-1 resize-none bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about this contract…"
            rows={1}
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white transition hover:bg-violet-700 disabled:opacity-40"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
        <p className="mt-1.5 text-center text-[10px] text-slate-400">Enter to send · Shift+Enter for new line</p>
      </div>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ContractDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const role = String(
    user?.publicMetadata?.role || user?.unsafeMetadata?.role || ""
  )
    .trim()
    .toLowerCase();

  const isAdminOrManager = role === "admin" || role === "manager";
  const currentUserClerkId = user?.id ?? "";

  const [contract, setContract] = useState<Contract | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, w, a] = await Promise.all([
        api.getContract(id),
        api.getContractWorkflows(id).catch(() => ({ workflows: [] })),
        api.getApprovalsByContract(id).catch(() => ({ approvals: [] })),
      ]);
      setContract(c);
      setWorkflows(
        Array.isArray((w as any)?.workflows) ? (w as any).workflows : []
      );
      setApprovals(
        Array.isArray((a as any)?.approvals) ? (a as any).approvals : []
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load contract."
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const contractGroups = useMemo(
    () => (contract ? [{ name: fmt(contract.contract_type), count: 1 }] : []),
    [contract]
  );

  async function handleDelete() {
    if (!contract?.id) return;
    if (!window.confirm("Delete this contract? This cannot be undone.")) return;
    setDeleting(true);
    try {
      await api.deleteContract(contract.id);
      navigate("/contracts");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
      setDeleting(false);
    }
  }

  const latestWorkflowId = workflows[0]?.id;

  return (
    <AppShell
      title={contract?.title || "Contract Details"}
      subtitle="View, edit and manage your contract document."
      contractGroups={contractGroups}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            asChild
            className="rounded-xl border-slate-200 dark:border-white/10"
          >
            <Link to="/contracts">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting || !contract} className="rounded-xl">
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="py-10 text-sm text-slate-400 animate-pulse">
          Loading contract…
        </div>
      )}

      {!loading && !contract && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Contract not found.
        </p>
      )}

      {contract && (
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-6 py-6 shadow-sm dark:border-white/10 dark:from-white/5 dark:to-transparent">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 md:text-4xl dark:text-white">
                  {contract.title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <AppBadge variant={badgeVariant(contract.status)}>
                    {fmt(contract.status)}
                  </AppBadge>
                  <AppBadge variant={badgeVariant(contract.workflow_stage)}>
                    {fmt(contract.workflow_stage)}
                  </AppBadge>
                  <AppBadge variant={badgeVariant(contract.risk_level)}>
                    {fmt(contract.risk_level || "unrated")}
                  </AppBadge>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                {
                  icon: <FileText className="h-5 w-5 text-violet-500" />,
                  label: "Type",
                  value: fmt(contract.contract_type),
                },
                {
                  icon: (
                    <CircleDollarSign className="h-5 w-5 text-emerald-500" />
                  ),
                  label: "Value",
                  value: fmtCurrency(contract.value),
                },
                {
                  icon: <CalendarDays className="h-5 w-5 text-blue-500" />,
                  label: "Start",
                  value: fmtDate(contract.start_date),
                },
                {
                  icon: <CalendarDays className="h-5 w-5 text-amber-500" />,
                  label: "End",
                  value: fmtDate(contract.end_date),
                },
              ].map(({ icon, label, value }) => (
                <div
                  key={label}
                  className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex items-center gap-3 p-4">
                    {icon}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">
                        {label}
                      </p>
                      <p className="mt-0.5 font-semibold text-slate-900 dark:text-white">
                        {value}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ── Document viewer + AI Chat (side by side) ─────────────────── */}
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <DocumentPanel contractId={contract.id} contractTitle={contract.title} />
            <ContractAIChat contractId={contract.id} />
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">
            <AppCard tone="soft">
              <div className="mb-5">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Contract Details
                </h2>
              </div>

              <div className="space-y-4">
                <InfoBlock
                  label="Description"
                  value={contract.description || "No description provided."}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBlock
                    label="Approval Type"
                    value={fmt((contract as any).approval_type)}
                  />
                  <InfoBlock
                    label="Workflow Trigger"
                    value={fmt((contract as any).workflow_trigger)}
                  />
                </div>

                <InfoBlock
                  label="Payment Terms"
                  value={contract.payment_terms || "—"}
                />

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    <Tag className="h-3.5 w-3.5" /> Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contract.tags?.length ? (
                      contract.tags.map((t, i) => (
                        <AppBadge key={i} variant="violet">
                          {String(t).toUpperCase()}
                        </AppBadge>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        No tags
                      </p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-white/10 dark:bg-white/5">
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    Parties
                  </p>
                  {contract.parties?.length ? (
                    <div className="space-y-2">
                      {contract.parties.map((p, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-slate-200 bg-white p-3 dark:border-white/10 dark:bg-white/5"
                        >
                          <p className="font-medium text-slate-900 dark:text-white">
                            {p.name || "Unnamed"}
                          </p>
                          <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                            {p.role}
                            {p.organization ? ` · ${p.organization}` : ""}
                          </p>
                          {p.email && (
                            <p className="mt-0.5 text-xs text-slate-400">
                              {p.email}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      No parties added yet.
                    </p>
                  )}
                </div>
              </div>
            </AppCard>

            <div className="space-y-6">
              <WorkflowCard
                workflows={workflows}
                contractId={contract.id}
                onWorkflowCreated={load}
              />

              <ApprovalCard
                approvals={approvals}
                contractId={contract.id}
                workflowId={latestWorkflowId}
                currentUserClerkId={currentUserClerkId}
                isAdminOrManager={isAdminOrManager}
                onRefresh={load}
              />

              {contract.ai_analysis && (
                <AppCard tone="soft">
                  <div className="mb-5">
                    <h2 className="flex items-center gap-2 text-xl font-semibold text-slate-900 dark:text-white">
                      <Bot className="h-5 w-5 text-violet-500" /> AI Summary
                    </h2>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600 dark:text-slate-300">
                        Risk
                      </span>
                      <AppBadge
                        variant={badgeVariant(contract.ai_analysis.risk_level)}
                      >
                        {fmt(contract.ai_analysis.risk_level)} —{" "}
                        {contract.ai_analysis.risk_score ?? "—"}
                      </AppBadge>
                    </div>

                    {contract.ai_analysis.summary && (
                      <p className="rounded-xl bg-slate-50 p-3 text-sm leading-relaxed text-slate-600 dark:bg-white/5 dark:text-slate-300">
                        {contract.ai_analysis.summary}
                      </p>
                    )}

                    {(contract.ai_analysis.recommendations?.length ?? 0) > 0 && (
                      <ul className="space-y-1">
                        {contract.ai_analysis.recommendations!
                          .slice(0, 3)
                          .map((r, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-300"
                            >
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />{" "}
                              {r}
                            </li>
                          ))}
                      </ul>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

// ─── tiny helper ─────────────────────────────────────────────────────────────

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-white/10 dark:bg-white/5">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-slate-800 dark:text-slate-200">{value}</p>
    </div>
  );
}
