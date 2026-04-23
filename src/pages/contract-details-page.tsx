import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  Bold,
  Bot,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDollarSign,
  Download,
  Edit3,
  Eye,
  FileText,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Layers,
  List,
  ListOrdered,
  Loader2,
  Plus,
  Save,
  Send,
  ShieldCheck,
  Tag,
  Trash2,
  Underline,
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
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExtension from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, API_BASE_URL } from "@/lib/api";
import type { Contract, Workflow as WorkflowType, Approval, WorkflowTemplate } from "@/types/api";

// ─── helpers ─────────────────────────────────────────────────────────────────

function fmt(v?: string | null) {
  return (v || "—").replace(/_/g, " ").split(" ")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p)).join(" ");
}
function fmtDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return isNaN(d.getTime()) ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function fmtCurrency(v?: number | null) {
  if (v == null) return "—";
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}
function badgeClass(v?: string | null) {
  switch ((v || "").toLowerCase()) {
    case "high":      return "bg-red-100 text-red-700";
    case "medium":    return "bg-amber-100 text-amber-700";
    case "low":
    case "active":
    case "approved":  return "bg-green-100 text-green-700";
    case "draft":
    case "pending":   return "bg-slate-100 text-slate-600";
    case "rejected":  return "bg-red-100 text-red-700";
    case "changes_requested": return "bg-amber-100 text-amber-700";
    case "review": case "approval": case "authoring":
    case "execution": case "monitoring": case "request":
    case "storage":   return "bg-violet-100 text-violet-700";
    default:          return "bg-slate-100 text-slate-600";
  }
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

// ─── Rich-text editor (TipTap / Google-Docs style) ───────────────────────────

function ToolbarButton({
  active, onClick, title, children,
}: { active?: boolean; onClick: () => void; title: string; children: React.ReactNode }) {
  return (
    <button
      onMouseDown={(e) => { e.preventDefault(); onClick(); }}
      title={title}
      className={`flex h-7 w-7 items-center justify-center rounded-lg transition-all ${
        active
          ? "bg-slate-900 text-white"
          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </button>
  );
}

function RichTextEditor({
  contractId,
  contractTitle,
  initialHtml,
  onSaved,
}: {
  contractId: string;
  contractTitle: string;
  initialHtml: string;
  onSaved?: () => void;
}) {
  const [saving,    setSaving]    = useState(false);
  const [exporting, setExporting] = useState<"docx" | "pdf" | null>(null);
  const [saveMsg,   setSaveMsg]   = useState<string | null>(null);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExtension,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Start typing your contract here…" }),
    ],
    content: initialHtml || "<p></p>",
    editorProps: {
      attributes: {
        class: "outline-none min-h-[65vh] px-10 py-8 prose prose-slate max-w-none text-slate-800 dark:text-slate-100",
      },
    },
    onUpdate: () => {
      // Auto-save after 2 s of inactivity
      if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
      autoSaveRef.current = setTimeout(() => handleSave(true), 2000);
    },
  });

  useEffect(() => {
    return () => { if (autoSaveRef.current) clearTimeout(autoSaveRef.current); };
  }, []);

  // When initialHtml changes (e.g. after parent re-fetches), update editor
  useEffect(() => {
    if (editor && initialHtml && editor.getHTML() !== initialHtml) {
      editor.commands.setContent(initialHtml);
    }
  }, [initialHtml, editor]);

  async function handleSave(silent = false) {
    if (!editor) return;
    if (!silent) setSaving(true);
    setSaveMsg(null);
    try {
      await api.saveDocumentHtml(contractId, editor.getHTML(), contractTitle);
      if (!silent) {
        setSaveMsg("✓ Saved");
        setTimeout(() => setSaveMsg(null), 3000);
        onSaved?.();
      }
    } catch {
      if (!silent) setSaveMsg("✗ Save failed");
    } finally {
      if (!silent) setSaving(false);
    }
  }

  async function handleExport(fmt: "docx" | "pdf") {
    // Save first so export uses latest content
    if (editor) await api.saveDocumentHtml(contractId, editor.getHTML(), contractTitle);
    setExporting(fmt);
    try {
      await api.exportDocument(contractId, fmt, `${contractTitle}.${fmt}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Export failed.");
    } finally { setExporting(null); }
  }

  if (!editor) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-[#0F1320]">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2 dark:border-white/8 dark:bg-white/4">
        {/* Formatting tools */}
        <div className="flex items-center gap-0.5">
          <ToolbarButton active={editor.isActive("bold")}      onClick={() => editor.chain().focus().toggleBold().run()}      title="Bold (Ctrl+B)">
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("italic")}    onClick={() => editor.chain().focus().toggleItalic().run()}    title="Italic (Ctrl+I)">
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline (Ctrl+U)">
            <Underline className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="mx-2 h-5 w-px bg-slate-200 dark:bg-white/10" />

          <ToolbarButton active={editor.isActive("heading", { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">
            <Heading1 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="mx-2 h-5 w-px bg-slate-200 dark:bg-white/10" />

          <ToolbarButton active={editor.isActive("bulletList")}  onClick={() => editor.chain().focus().toggleBulletList().run()}  title="Bullet list">
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton active={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {saveMsg && (
            <span className={`text-xs font-medium ${saveMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
              {saveMsg}
            </span>
          )}
          <Button size="sm" variant="outline" className="rounded-xl" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Save"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-blue-200 text-blue-700 hover:bg-blue-50"
            onClick={() => handleExport("docx")}
            disabled={!!exporting}
          >
            {exporting === "docx"
              ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              : <Download className="mr-1.5 h-3.5 w-3.5" />
            }
            {exporting === "docx" ? "Exporting…" : "Download DOCX"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="rounded-xl border-rose-200 text-rose-700 hover:bg-rose-50"
            onClick={() => handleExport("pdf")}
            disabled={!!exporting}
          >
            {exporting === "pdf"
              ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
              : <Download className="mr-1.5 h-3.5 w-3.5" />
            }
            {exporting === "pdf" ? "Exporting…" : "Download PDF"}
          </Button>
        </div>
      </div>

      {/* ── Auto-save indicator ── */}
      <div className="flex items-center justify-between border-b border-slate-50 bg-white px-5 py-1.5 dark:border-white/5 dark:bg-transparent">
        <span className="text-[11px] text-slate-400">
          Auto-saves every 2 seconds while you type
        </span>
        <span className="text-[11px] text-slate-400">
          Ctrl+B Bold · Ctrl+I Italic · Ctrl+U Underline
        </span>
      </div>

      {/* ── Editor canvas ── */}
      <EditorContent editor={editor} />
    </div>
  );
}

// ─── Document panel (handles load + original file preview) ────────────────────

function DocumentPanel({ contractId, contractTitle }: { contractId: string; contractTitle: string }) {
  const [loading,     setLoading]     = useState(true);
  const [hasFile,     setHasFile]     = useState(false);
  const [fileType,    setFileType]    = useState("");
  const [initialHtml, setInitialHtml] = useState("");
  const [showOrig,    setShowOrig]    = useState(false);   // toggle to see original uploaded file
  const viewUrl = `${API_BASE_URL}/api/documents/view/${contractId}`;
  const isPdf   = fileType === ".pdf";
  const isDocx  = fileType === ".docx" || fileType === ".doc";

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Load HTML for the editor and file metadata simultaneously
      const [htmlRes, textRes] = await Promise.all([
        api.getDocumentHtml(contractId).catch(() => ({ html: "", title: "" })),
        api.getDocumentText(contractId).catch(() => ({ text: "", file_type: "", has_file: false })),
      ]);
      setHasFile(textRes.has_file);
      setFileType(textRes.file_type || "");
      setInitialHtml(htmlRes.html || "");
    } finally {
      setLoading(false);
    }
  }, [contractId]);

  useEffect(() => { load(); }, [load]);

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
        Upload a file via the{" "}
        <Link to="/upload" className="text-blue-500 underline hover:text-blue-600">
          Upload Pipeline
        </Link>{" "}
        to view it here
      </p>
    </div>
  );

  return (
    <div className="space-y-3">
      {/* Toggle to view original file */}
      {(isPdf || isDocx) && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
          <p className="text-xs text-slate-500">
            Original <span className="font-semibold uppercase">{fileType.replace(".", "")}</span> file uploaded
          </p>
          <button
            onClick={() => setShowOrig((v) => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
          >
            <Eye className="h-3.5 w-3.5" />
            {showOrig ? "Hide original" : "View original file"}
          </button>
        </div>
      )}

      {/* Original file viewer (collapsible) */}
      {showOrig && (isPdf || isDocx) && (
        <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
          {isPdf && (
            <iframe src={viewUrl} title="Original document" className="w-full" style={{ height: "60vh", border: "none" }} />
          )}
          {isDocx && (
            <OriginalDocxViewer viewUrl={viewUrl} />
          )}
        </div>
      )}

      {/* Rich text editor — always shown */}
      <RichTextEditor
        contractId={contractId}
        contractTitle={contractTitle}
        initialHtml={initialHtml}
      />
    </div>
  );
}

function OriginalDocxViewer({ viewUrl }: { viewUrl: string }) {
  const [html, setHtml]     = useState("");
  const [loading, setLoad]  = useState(true);
  useEffect(() => {
    fetch(viewUrl)
      .then((r) => r.arrayBuffer())
      .then(async (buf) => {
        const mammoth = await import("mammoth");
        const result  = await mammoth.convertToHtml({ arrayBuffer: buf });
        setHtml(result.value);
      })
      .catch(() => setHtml("<p style='color:#888'>Could not render — download to view.</p>"))
      .finally(() => setLoad(false));
  }, [viewUrl]);
  if (loading) return <div className="flex items-center gap-2 p-8 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Rendering…</div>;
  return (
    <div
      className="prose prose-slate max-w-none overflow-auto px-10 py-8"
      style={{ maxHeight: "60vh" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
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
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<string | "default">("default");

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
            className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
              selected === "default"
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
                className={`flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                  selected === t.id
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
  const [creating, setCreating]     = useState(false);
  const [error, setError]           = useState<string | null>(null);
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
                  const isDone     = step.status === "completed";
                  const isCurrent  = step.step_number === latest.current_step;
                  const isRejected = step.status === "rejected";
                  return (
                    <div
                      key={step.step_number}
                      title={"name" in step ? (step as { name: string }).name : STEP_LABELS[step.step_number] ?? `Step ${step.step_number}`}
                      className={`h-2 flex-1 rounded-full transition-all ${
                        isRejected ? "bg-red-400"
                        : isDone    ? "bg-green-500"
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
  const [voting, setVoting]       = useState<string | null>(null); // approvalId being voted on
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
        pending:  latest.approvers?.filter((a) => !a.decision).length ?? 0,
        total:    latest.approvers?.length ?? 0,
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

// ─── Main page ────────────────────────────────────────────────────────────────

export default function ContractDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useUser();

  const role = String(user?.publicMetadata?.role || user?.unsafeMetadata?.role || "").trim().toLowerCase();
  const isAdminOrManager = role === "admin" || role === "manager";
  const currentUserClerkId = user?.id ?? "";

  const [contract, setContract]   = useState<Contract | null>(null);
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(false);
  const [error, setError]         = useState<string | null>(null);

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
          {contract?.id && (
            <Button variant="outline" asChild className="rounded-xl">
              <Link to={`/ai-analysis?contractId=${contract.id}`}>
                <Bot className="mr-2 h-4 w-4" /> AI Analyse
              </Link>
            </Button>
          )}
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
                { icon: <FileText className="h-5 w-5 text-violet-500" />, label: "Type",  value: fmt(contract.contract_type) },
                { icon: <CircleDollarSign className="h-5 w-5 text-emerald-500" />, label: "Value", value: fmtCurrency(contract.value) },
                { icon: <CalendarDays className="h-5 w-5 text-blue-500" />, label: "Start", value: fmtDate(contract.start_date) },
                { icon: <CalendarDays className="h-5 w-5 text-amber-500" />, label: "End",   value: fmtDate(contract.end_date) },
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

          {/* ── Document viewer / editor ──────────────────────────────────── */}
          <DocumentPanel contractId={contract.id} contractTitle={contract.title} />

          {/* ── Details + sidebar ─────────────────────────────────────────── */}
          <div className="grid gap-6 xl:grid-cols-[1.7fr_0.8fr]">

            {/* Details */}
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
              <CardHeader><CardTitle>Contract Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <InfoBlock label="Description" value={contract.description || "No description provided."} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <InfoBlock label="Approval Type"    value={fmt((contract as any).approval_type)} />
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
                    <Button variant="outline" asChild size="sm" className="w-full rounded-xl">
                      <Link to={`/ai-analysis?contractId=${contract.id}`}>Full Analysis</Link>
                    </Button>
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
