import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Edit3,
  Eye,
  FileText,
  Loader2,
  Save,
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
} from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { AppBadge } from "@/components/ui/app-badge";
import { AppCard } from "@/components/ui/app-card";
import { api, API_BASE_URL } from "@/lib/api";
import type { Contract, Workflow as WorkflowType, Approval } from "@/types/api";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(v?: string | null) {
  return (v || "—")
    .replace(/_/g, " ")
    .split(" ")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
}

function fmtCurrency(v?: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(v);
}

function badgeVariant(
  v?: string | null
): "rose" | "amber" | "emerald" | "slate" | "blue" | "violet" | "dark" {
  const val = (v || "").toLowerCase();

  if (["high", "rejected"].includes(val)) return "rose";
  if (["medium", "changes_requested"].includes(val)) return "amber";
  if (["low", "active", "approved"].includes(val)) return "emerald";
  if (["pending", "draft"].includes(val)) return "slate";
  if (
    [
      "review",
      "approval",
      "authoring",
      "execution",
      "monitoring",
      "request",
      "storage",
    ].includes(val)
  ) {
    return "violet";
  }

  return "blue";
}

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

// ─── Document viewer / editor ─────────────────────────────────────────────────

type ViewMode = "preview" | "edit";

function DocumentPanel({ contractId }: { contractId: string }) {
  const [mode, setMode] = useState<ViewMode>("preview");
  const [fileType, setFileType] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const [text, setText] = useState("");
  const [editText, setEditText] = useState("");
  const [docxHtml, setDocxHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [docxLoading, setDocxLoading] = useState(false);

  const viewUrl = `${API_BASE_URL}/api/documents/view/${contractId}`;
  const isPdf = fileType === ".pdf";
  const isDocx = fileType === ".docx" || fileType === ".doc";
  const isTxt =
    fileType === ".txt" || fileType === ".rtf" || fileType === ".odt";

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getDocumentText(contractId)
      .then((r) => {
        if (!cancelled) {
          setFileType(r.file_type || "");
          setHasFile(r.has_file);
          setText(r.text || "");
          setEditText(r.text || "");
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [contractId]);

  const loadDocxHtml = useCallback(async () => {
    if (!isDocx || docxHtml || docxLoading) return;
    setDocxLoading(true);
    try {
      const resp = await fetch(viewUrl);
      const buf = await resp.arrayBuffer();
      const mammoth = await import("mammoth");
      const result = await mammoth.convertToHtml({ arrayBuffer: buf });
      setDocxHtml(result.value);
    } catch {
      setDocxHtml(
        "<p style='color:#888'>Could not render DOCX — download to view.</p>"
      );
    } finally {
      setDocxLoading(false);
    }
  }, [isDocx, docxHtml, docxLoading, viewUrl]);

  useEffect(() => {
    if (isDocx && mode === "preview") loadDocxHtml();
  }, [isDocx, mode, loadDocxHtml]);

  async function handleSave() {
    if (!editText.trim()) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      await api.saveDocumentText(contractId, editText);
      setText(editText);
      setSaveMsg("✓ Saved");
      setTimeout(() => setSaveMsg(null), 3000);
    } catch {
      setSaveMsg("✗ Save failed — try again");
    } finally {
      setSaving(false);
    }
  }

  function handleDownload() {
    const a = document.createElement("a");
    a.href = `${API_BASE_URL}/api/documents/download/${contractId}`;
    a.setAttribute("download", "");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  if (loading)
    return (
      <div className="flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white py-16 dark:border-white/10 dark:bg-white/5">
        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        <div className="animate-pulse text-sm text-slate-400">
          Loading document…
        </div>
      </div>
    );

  if (!hasFile)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-14 text-center dark:border-white/10 dark:bg-white/5">
        <FileText className="h-10 w-10 text-slate-300" />
        <p className="font-medium text-slate-600 dark:text-slate-300">
          No document file attached yet
        </p>
        <p className="text-sm text-slate-400">
          Upload a file via the{" "}
          <Link
            to="/upload"
            className="text-blue-500 underline hover:text-blue-600"
          >
            Upload Pipeline
          </Link>{" "}
          to view it here
        </p>
      </div>
    );

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 bg-slate-50 px-5 py-3 dark:border-white/6 dark:bg-white/5">
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 dark:border-white/10 dark:bg-white/5">
          {(["preview", "edit"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                mode === m
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10"
              }`}
            >
              {m === "preview" ? (
                <Eye className="h-3.5 w-3.5" />
              ) : (
                <Edit3 className="h-3.5 w-3.5" />
              )}
              {m === "preview" ? "Preview" : "Edit"}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {saveMsg && (
            <span
              className={`text-xs font-medium ${
                saveMsg.startsWith("✓") ? "text-green-600" : "text-red-600"
              }`}
            >
              {saveMsg}
            </span>
          )}

          {mode === "edit" && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl"
            >
              {saving ? (
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="mr-1.5 h-3.5 w-3.5" />
              )}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={handleDownload}
            className="rounded-xl border-slate-200 dark:border-white/10"
          >
            <Download className="mr-1.5 h-3.5 w-3.5" /> Download
          </Button>

          <AppBadge variant="slate" className="rounded-lg uppercase tracking-wide">
            {fileType || "file"}
          </AppBadge>
        </div>
      </div>

      {mode === "preview" ? (
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
              className="prose prose-slate max-w-none overflow-auto px-10 py-8 dark:prose-invert"
              style={{ minHeight: "60vh", maxHeight: "72vh" }}
            >
              {docxLoading ? (
                <div className="flex items-center gap-2 py-10 text-slate-500 dark:text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin" /> Rendering…
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: docxHtml || "<p>No content.</p>",
                  }}
                />
              )}
            </div>
          )}

          {isTxt && (
            <pre
              className="overflow-auto whitespace-pre-wrap break-words px-10 py-8 font-mono text-sm text-slate-800 dark:text-slate-200"
              style={{ minHeight: "50vh", maxHeight: "72vh" }}
            >
              {text || (
                <span className="italic text-slate-400">No text extracted.</span>
              )}
            </pre>
          )}

          {!isPdf && !isDocx && !isTxt && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <FileText className="h-10 w-10 text-slate-300" />
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Preview not supported for this file type.
              </p>
              <Button
                variant="outline"
                className="rounded-xl border-slate-200 dark:border-white/10"
                onClick={handleDownload}
              >
                <Download className="mr-2 h-4 w-4" /> Download to view
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="relative">
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            spellCheck
            className="w-full resize-none bg-white px-10 py-8 font-mono text-sm text-slate-800 outline-none dark:bg-transparent dark:text-slate-200"
            style={{ minHeight: "72vh" }}
            placeholder="Start typing your contract content here…"
          />
          {editText !== text && (
            <div className="absolute bottom-4 right-4 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-white/10 dark:bg-white/10">
              <span className="text-xs text-slate-500 dark:text-slate-300">
                Unsaved changes
              </span>
              <button
                onClick={() => setEditText(text)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Discard"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
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

          {contract?.id && (
            <Button
              variant="outline"
              asChild
              className="rounded-xl border-slate-200 dark:border-white/10"
            >
              <Link to={`/ai-analysis?contractId=${contract.id}`}>
                <Bot className="mr-2 h-4 w-4" /> AI Analyse
              </Link>
            </Button>
          )}

          <Button
            className="rounded-xl bg-rose-600 text-white hover:bg-rose-700"
            onClick={handleDelete}
            disabled={deleting || !contract}
          >
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

          <DocumentPanel contractId={contract.id} />

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

                    <Button
                      variant="outline"
                      asChild
                      size="sm"
                      className="w-full rounded-xl border-slate-200 dark:border-white/10"
                    >
                      <Link to={`/ai-analysis?contractId=${contract.id}`}>
                        Full Analysis
                      </Link>
                    </Button>
                  </div>
                </AppCard>
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
