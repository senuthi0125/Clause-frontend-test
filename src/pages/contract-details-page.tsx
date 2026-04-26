import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Eye,
  FileEdit,
  FileText,
  Layers,
  Loader2,
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const [mode, setMode] = useState<ViewMode>("libreoffice");
  const [fileType, setFileType] = useState("");
  const [hasFile, setHasFile] = useState(false);
  const [text, setText] = useState("");
  const [docxHtml, setDocxHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [docxLoading, setDocxLoading] = useState(false);
  const [wopiUrl, setWopiUrl] = useState<string | null>(null);
  const [wopiLoading, setWopiLoading] = useState(false);
  const [wopiError, setWopiError] = useState<string | null>(null);

  const viewUrl = `${API_BASE_URL}/api/documents/view/${contractId}`;
  const isPdf = fileType === ".pdf";
  const isDocx = fileType === ".docx" || fileType === ".doc";
  const isTxt = fileType === ".txt" || fileType === ".rtf" || fileType === ".odt";
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
      .catch(() => { })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
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
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${mode === "preview" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}
          >
            <Eye className="h-3.5 w-3.5" /> Preview
          </button>
          {canLibreOffice && (
            <button
              onClick={() => setMode("libreoffice")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${mode === "libreoffice" ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
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
    setSubmitting(true); setError(null);
    const ids = approverInput.split(",").map((s) => s.trim()).filter(Boolean);
    try {
      await api.createApproval({
        contract_id: contractId,
        workflow_id: workflowId,
        approval_type: approvalType,
        approver_ids: ids,
      });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create approval.");
    } finally { setSubmitting(false); }
  }

  return (
    <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="font-semibold text-blue-900 flex items-center gap-2">
          <Send className="h-4 w-4" /> Send for Approval
        </p>
        <button onClick={onClose} className="text-blue-400 hover:text-blue-600"><X className="h-4 w-4" /></button>
      </div>

      {error && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Approval Type
          </label>
          <select
            value={approvalType}
            onChange={(e) => setApprovalType(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
          >
            <option value="all_required">All Required — everyone must approve</option>
            <option value="majority">Majority — more than half must approve</option>
            <option value="first_person">First Person — first vote decides</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Approver User IDs <span className="font-normal normal-case text-slate-400">(comma-separated, optional)</span>
          </label>
          <input
            type="text"
            value={approverInput}
            onChange={(e) => setApproverInput(e.target.value)}
            placeholder="user_abc123, user_def456 — leave blank for admin to decide"
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" className="rounded-xl" onClick={onClose}>Cancel</Button>
        <Button size="sm" className="rounded-xl" onClick={handleSubmit} disabled={submitting}>
          {submitting ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Send className="mr-1.5 h-3.5 w-3.5" />}
          {submitting ? "Submitting…" : "Submit for Approval"}
        </Button>
      </div>
    </div>
  );
}

// ─── Workflow template picker modal ──────────────────────────────────────────

const DEFAULT_STEP_DESCRIPTION =
  "Request & Initiation → Authoring → AI Risk Analysis → Review & Negotiation → Approval → Execution & Signing → Storage → Monitoring → Renewal / Expiration";

function WorkflowTemplatePicker({
  onConfirm,
  onClose,
}: {
  onConfirm: (template: WorkflowTemplate | null) => void;
  onClose: () => void;
}) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | "default">("default");

  useEffect(() => {
    api.listWorkflowTemplates()
      .then((list) => setTemplates(list))
      .catch(() => setTemplates([]))
      .finally(() => setLoading(false));
  }, []);

  const chosenTemplate = templates.find((t) => t.id === selected) ?? null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-500" />
            <h2 className="font-semibold text-slate-900">Choose Workflow Template</h2>
          </div>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Options */}
        <div className="max-h-72 space-y-2 overflow-y-auto p-4">
          {/* Default 9-step option */}
          <button
            onClick={() => setSelected("default")}
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${selected === "default"
                ? "border-indigo-500 bg-indigo-50"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
              }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
              <Workflow className="h-4 w-4 text-indigo-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900">Default (9 steps)</p>
              <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">{DEFAULT_STEP_DESCRIPTION}</p>
            </div>
            {selected === "default" && (
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            )}
          </button>

          {/* Custom templates */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-4 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading templates…
            </div>
          ) : templates.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center text-sm text-slate-400">
              No custom templates yet.{" "}
              <Link to="/admin/workflow-templates" className="text-indigo-500 underline hover:text-indigo-600">
                Create one
              </Link>
            </div>
          ) : (
            templates.map((t) => (
              <button
                key={t.id}
                onClick={() => setSelected(t.id)}
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${selected === t.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-100">
                  <Layers className="h-4 w-4 text-violet-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-900">{t.name}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {t.steps.length} steps
                    {t.description ? ` — ${t.description}` : ""}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {t.steps.slice(0, 5).map((s, i) => (
                      <span key={i} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                        {s.name}
                      </span>
                    ))}
                    {t.steps.length > 5 && (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-400">
                        +{t.steps.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                {selected === t.id && (
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
                )}
              </button>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
          <p className="text-xs text-slate-400">
            {selected === "default"
              ? "9-step standard workflow will be used"
              : `"${chosenTemplate?.name}" — ${chosenTemplate?.steps.length} steps`}
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="rounded-xl" onClick={onClose}>
              Cancel
            </Button>
            <Button
              size="sm"
              className="rounded-xl"
              onClick={() => onConfirm(chosenTemplate)}
            >
              <Plus className="mr-1.5 h-3.5 w-3.5" /> Start Workflow
            </Button>
          </div>
        </div>
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
  const [showPicker, setShowPicker] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = workflows[0] ?? null;

  async function handleConfirm(template: WorkflowTemplate | null) {
    setCreating(true); setError(null); setShowPicker(false);
    try {
      const payload: Record<string, unknown> = {
        contract_id: contractId,
        name: template ? template.name : "Contract Review Workflow",
      };
      if (template?.steps?.length) {
        payload.steps = template.steps.map((s, i) => ({
          step_number: s.step_number ?? i + 1,
          name: s.name,
          step_type: s.step_type,
          description: s.description ?? null,
        }));
      }
      await api.createWorkflow(payload);
      onWorkflowCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start workflow.");
    } finally { setCreating(false); }
  }

  return (
    <>
      {showPicker && (
        <WorkflowTemplatePicker
          onConfirm={handleConfirm}
          onClose={() => setShowPicker(false)}
        />
      )}

      <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Workflow className="h-5 w-5 text-slate-500" /> Workflow
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && <p className="text-xs text-red-600">{error}</p>}

          {!latest ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-500">No workflow started yet.</p>
              <Button
                size="sm"
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => setShowPicker(true)}
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
              {/* Status + step indicator */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{latest.name || "Review Workflow"}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Step {latest.current_step} of {latest.steps?.length ?? 9}
                  </p>
                </div>
                <Badge className={badgeClass(latest.status)}>{fmt(latest.status)}</Badge>
              </div>

              {/* Current step name */}
              <div className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Current Step</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-800">
                  {latest.steps?.find((s) => s.step_number === latest.current_step)?.name
                    ?? STEP_LABELS[latest.current_step]
                    ?? `Step ${latest.current_step}`}
                </p>
              </div>

              {/* Mini step progress bar */}
              <div className="flex items-center gap-1">
                {(latest.steps?.length
                  ? latest.steps
                  : Array.from({ length: 9 }, (_, i) => ({ step_number: i + 1, status: "pending" as const }))
                ).map((step) => {
                  const isDone = step.status === "completed";
                  const isCurrent = step.step_number === latest.current_step;
                  const isRejected = step.status === "rejected";
                  return (
                    <div
                      key={step.step_number}
                      title={"name" in step ? (step as { name: string }).name : STEP_LABELS[step.step_number] ?? `Step ${step.step_number}`}
                      className={`h-2 flex-1 rounded-full transition-all ${isRejected ? "bg-red-400"
                          : isDone ? "bg-green-500"
                            : isCurrent ? "bg-blue-500"
                              : "bg-slate-200"
                        }`}
                    />
                  );
                })}
              </div>
              <p className="text-right text-[10px] text-slate-400">
                {latest.steps?.filter((s) => s.status === "completed").length ?? 0} / {latest.steps?.length ?? 9} steps completed
              </p>

              <Button asChild size="sm" variant="outline" className="w-full rounded-xl">
                <Link to={`/workflows/${latest.id}`}>
                  Open workflow <ChevronRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </>
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
  const [voting, setVoting] = useState<string | null>(null); // approvalId being voted on
  const [voteError, setVoteError] = useState<string | null>(null);
  const latest = approvals[0] ?? null;

  async function handleVote(approvalId: string, decision: string) {
    setVoting(approvalId); setVoteError(null);
    try {
      await api.castVote(approvalId, decision);
      onRefresh();
    } catch (err) {
      setVoteError(err instanceof Error ? err.message : "Vote failed.");
    } finally { setVoting(null); }
  }

  const voteCount = latest
    ? {
      approved: latest.approvers?.filter((a) => a.decision === "approved").length ?? 0,
      rejected: latest.approvers?.filter((a) => a.decision === "rejected").length ?? 0,
      pending: latest.approvers?.filter((a) => !a.decision).length ?? 0,
      total: latest.approvers?.length ?? 0,
    }
    : null;

  const alreadyVoted = latest && currentUserClerkId
    ? latest.approvers?.some((a) => a.user_id === currentUserClerkId && a.decision)
    : false;

  return (
    <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShieldCheck className="h-5 w-5 text-slate-500" /> Approval
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {voteError && <p className="text-xs text-red-600">{voteError}</p>}

        {!latest && !showPanel && (
          <div className="space-y-3">
            <p className="text-sm text-slate-500">No approval request yet.</p>
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
            onDone={() => { setShowPanel(false); onRefresh(); }}
            onClose={() => setShowPanel(false)}
          />
        )}

        {latest && (
          <div className="space-y-4">
            {/* Status header */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-800">{fmt(latest.approval_type)} Approval</p>
                {latest.due_date && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="h-3 w-3" /> Due {fmtDate(latest.due_date)}
                  </p>
                )}
              </div>
              <Badge className={badgeClass(latest.status)}>{fmt(latest.status)}</Badge>
            </div>

            {/* Vote tally */}
            {voteCount && voteCount.total > 0 && (
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-green-50 py-2">
                  <p className="text-lg font-bold text-green-700">{voteCount.approved}</p>
                  <p className="text-[11px] text-green-600">Approved</p>
                </div>
                <div className="rounded-xl bg-red-50 py-2">
                  <p className="text-lg font-bold text-red-700">{voteCount.rejected}</p>
                  <p className="text-[11px] text-red-600">Rejected</p>
                </div>
                <div className="rounded-xl bg-slate-50 py-2">
                  <p className="text-lg font-bold text-slate-600">{voteCount.pending}</p>
                  <p className="text-[11px] text-slate-400">Pending</p>
                </div>
              </div>
            )}

            {/* Admin / manager voting buttons — shown while approval is pending */}
            {isAdminOrManager && latest.status === "pending" && !alreadyVoted && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Cast your vote</p>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    size="sm"
                    className="rounded-xl bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => handleVote(latest.id, "approved")}
                    disabled={voting === latest.id}
                  >
                    {voting === latest.id
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <><ThumbsUp className="mr-1 h-3.5 w-3.5" /> Approve</>}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => handleVote(latest.id, "rejected")}
                    disabled={voting === latest.id}
                  >
                    <ThumbsDown className="mr-1 h-3.5 w-3.5" /> Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl text-amber-700 border-amber-200 hover:bg-amber-50"
                    onClick={() => handleVote(latest.id, "changes_requested")}
                    disabled={voting === latest.id}
                  >
                    <RotateCcw className="mr-1 h-3.5 w-3.5" /> Revise
                  </Button>
                </div>
              </div>
            )}

            {isAdminOrManager && latest.status === "pending" && alreadyVoted && (
              <p className="flex items-center gap-1.5 text-xs text-green-600">
                <CheckCircle2 className="h-3.5 w-3.5" /> You have already cast your vote
              </p>
            )}

            {/* Approver list */}
            {(latest.approvers?.length ?? 0) > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Approvers</p>
                <div className="space-y-1.5">
                  {latest.approvers.map((a, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2">
                      <p className="truncate text-xs text-slate-600 max-w-[120px]">{a.user_id}</p>
                      <Badge className={`text-[10px] ${badgeClass(a.decision ?? "pending")}`}>
                        {a.decision ? fmt(a.decision) : "Pending"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Send another approval if the last one closed */}
            {["approved", "rejected"].includes(latest.status) && (
              <Button size="sm" variant="outline" className="w-full rounded-xl" onClick={() => setShowPanel(true)}>
                <Send className="mr-2 h-3.5 w-3.5" /> New Approval Request
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
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
  const { isAdminOrManager } = useRole();
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
      setWorkflows(Array.isArray((w as any)?.workflows) ? (w as any).workflows : []);
      setApprovals(Array.isArray((a as any)?.approvals) ? (a as any).approvals : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load contract.");
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const contractGroups = useMemo(
    () => (contract ? [{ name: fmt(contract.contract_type), count: 1 }] : []),
    [contract]
  );

  async function handleDelete() {
    if (!contract?.id) return;
    if (!window.confirm("Delete this contract? This cannot be undone.")) return;
    setDeleting(true);
    try { await api.deleteContract(contract.id); navigate("/contracts"); }
    catch (err) { setError(err instanceof Error ? err.message : "Delete failed."); setDeleting(false); }
  }

  const latestWorkflowId = workflows[0]?.id;

  return (
    <AppShell
      title={contract?.title || "Contract Details"}
      subtitle="View, edit and manage your contract document."
      contractGroups={contractGroups}
      actions={
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild className="rounded-xl">
            <Link to="/contracts"><ArrowLeft className="mr-2 h-4 w-4" /> Back</Link>
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleting || !contract} className="rounded-xl">
            <Trash2 className="mr-2 h-4 w-4" />
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </div>
      }
    >
      {error && (
        <div className="mb-4 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <XCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading contract…
        </div>
      )}

      {!loading && !contract && <p className="text-sm text-slate-500">Contract not found.</p>}

      {contract && (
        <div className="space-y-6">

          {/* ── Hero strip ───────────────────────────────────────────────── */}
          <div className="rounded-3xl border border-slate-200 bg-slate-50/70 px-6 py-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
                  {contract.title}
                </h1>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge className={badgeClass(contract.status)}>{fmt(contract.status)}</Badge>
                  <Badge className={badgeClass(contract.workflow_stage)}>{fmt(contract.workflow_stage)}</Badge>
                  <Badge className={badgeClass(contract.risk_level)}>{fmt(contract.risk_level || "unrated")}</Badge>
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {[
                { icon: <FileText className="h-5 w-5 text-violet-500" />, label: "Type", value: fmt(contract.contract_type) },
                { icon: <CircleDollarSign className="h-5 w-5 text-emerald-500" />, label: "Value", value: fmtCurrency(contract.value) },
                { icon: <CalendarDays className="h-5 w-5 text-blue-500" />, label: "Start", value: fmtDate(contract.start_date) },
                { icon: <CalendarDays className="h-5 w-5 text-amber-500" />, label: "End", value: fmtDate(contract.end_date) },
              ].map(({ icon, label, value }) => (
                <Card key={label} className="rounded-2xl border-slate-200 shadow-sm">
                  <CardContent className="flex items-center gap-3 p-4">
                    {icon}
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
                      <p className="mt-0.5 font-semibold text-slate-900">{value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* ── Document viewer + AI Chat (side by side) ─────────────────── */}
          <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
            <DocumentPanel contractId={contract.id} contractTitle={contract.title} />
            <ContractAIChat contractId={contract.id} />
          </div>

          {/* ── Details + sidebar ─────────────────────────────────────────── */}
          <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">

            {/* Details */}
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardHeader><CardTitle>Contract Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <InfoBlock label="Description" value={contract.description || "No description provided."} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBlock label="Approval Type" value={fmt((contract as any).approval_type)} />
                  <InfoBlock label="Workflow Trigger" value={fmt((contract as any).workflow_trigger)} />
                </div>
                <InfoBlock label="Payment Terms" value={contract.payment_terms || "—"} />

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="mb-2 flex items-center gap-1.5 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
                    <Tag className="h-3.5 w-3.5" /> Tags
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {contract.tags?.length
                      ? contract.tags.map((t, i) => (
                        <Badge key={i} className="bg-violet-100 text-violet-700">{String(t).toUpperCase()}</Badge>
                      ))
                      : <p className="text-sm text-slate-500">No tags</p>}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="mb-3 text-xs font-medium uppercase tracking-[0.2em] text-slate-400">Parties</p>
                  {contract.parties?.length
                    ? (
                      <div className="space-y-2">
                        {contract.parties.map((p, i) => (
                          <div key={i} className="rounded-xl border border-slate-200 bg-white p-3">
                            <p className="font-medium text-slate-900">{p.name || "Unnamed"}</p>
                            <p className="mt-0.5 text-sm text-slate-500">
                              {p.role}{p.organization ? ` · ${p.organization}` : ""}
                            </p>
                            {p.email && <p className="text-xs text-slate-400 mt-0.5">{p.email}</p>}
                          </div>
                        ))}
                      </div>
                    )
                    : <p className="text-sm text-slate-500">No parties added yet.</p>
                  }
                </div>
              </CardContent>
            </Card>

            {/* Sidebar */}
            <div className="space-y-6">

              {/* Workflow card */}
              <WorkflowCard
                workflows={workflows}
                contractId={contract.id}
                onWorkflowCreated={load}
              />

              {/* Approval card */}
              <ApprovalCard
                approvals={approvals}
                contractId={contract.id}
                workflowId={latestWorkflowId}
                currentUserClerkId={currentUserClerkId}
                isAdminOrManager={isAdminOrManager}
                onRefresh={load}
              />

              {/* AI summary (if available) */}
              {contract.ai_analysis && (
                <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5 text-violet-500" /> AI Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Risk</span>
                      <Badge className={badgeClass(contract.ai_analysis.risk_level)}>
                        {fmt(contract.ai_analysis.risk_level)} — {contract.ai_analysis.risk_score ?? "—"}
                      </Badge>
                    </div>
                    {contract.ai_analysis.summary && (
                      <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600 leading-relaxed">
                        {contract.ai_analysis.summary}
                      </p>
                    )}
                    {(contract.ai_analysis.recommendations?.length ?? 0) > 0 && (
                      <ul className="space-y-1">
                        {contract.ai_analysis.recommendations!.slice(0, 3).map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" /> {r}
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
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-slate-800">{value}</p>
    </div>
  );
}