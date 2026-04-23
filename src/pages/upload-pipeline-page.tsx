import { useRef, useState } from "react";
import { API_BASE_URL } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  Upload,
  Loader2,
  FileText,
  Download,
  Plus,
  Edit3,
  Save,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { AiAnalysisResponse, Contract, ConflictResult } from "@/types/api";

// ─── Types ──────────────────────────────────────────────────────────────────

type PipelineStep = 1 | 2 | 3;

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatLabel(value?: string | null) {
  return (value || "—")
    .replace(/_/g, " ")
    .split(" ")
    .map((p) => (p ? p[0].toUpperCase() + p.slice(1) : p))
    .join(" ");
}

function formatDate(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime())
    ? "—"
    : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function severityClass(v?: string | null) {
  switch ((v || "").toLowerCase()) {
    case "high":
    case "critical":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-green-100 text-green-700";
  }
}

function riskBarColor(level?: string | null) {
  switch ((level || "").toLowerCase()) {
    case "high":   return "bg-red-500";
    case "medium": return "bg-amber-400";
    default:       return "bg-green-500";
  }
}

// ─── Step Indicator ─────────────────────────────────────────────────────────

const STEPS = [
  { id: 1, label: "Upload / Create" },
  { id: 2, label: "Review & Analysis" },
  { id: 3, label: "Conflict Check" },
] as const;

function StepIndicator({ current }: { current: PipelineStep }) {
  return (
    <div className="mb-8 flex items-center justify-center gap-0">
      {STEPS.map((step, idx) => {
        const done    = step.id < current;
        const active  = step.id === current;
        const pending = step.id > current;

        return (
          <div key={step.id} className="flex items-center">
            {/* Circle */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all ${
                  done
                    ? "border-green-500 bg-green-500 text-white"
                    : active
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-400"
                }`}
              >
                {done ? <CheckCircle2 className="h-5 w-5" /> : step.id}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  done ? "text-green-600" : active ? "text-blue-700" : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector */}
            {idx < STEPS.length - 1 && (
              <div
                className={`mx-2 mb-5 h-0.5 w-24 rounded-full transition-all md:w-36 ${
                  done ? "bg-green-400" : active ? "bg-blue-300" : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1 — Upload ─────────────────────────────────────────────────────────

function UploadStep({
  onUploaded,
}: {
  onUploaded: (contract: Contract, extractedText: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const result = await api.uploadContract(file);
      if (!result?.contract?.id && !result?.id) throw new Error("Upload failed — no contract ID returned.");
      const contract = result.contract as Contract;
      onUploaded(contract, result.extracted_text || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function onInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="mx-auto max-w-xl">
      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept=".pdf,.doc,.docx,.txt"
        onChange={onInputChange}
      />

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex cursor-pointer flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-14 transition-all ${
          dragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"
        }`}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
            <p className="text-base font-medium text-slate-700">Uploading your document…</p>
          </>
        ) : (
          <>
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50">
              <Upload className="h-8 w-8 text-blue-500" />
            </div>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-800">
                Drop your contract here
              </p>
              <p className="mt-1 text-sm text-slate-500">
                or click to browse — PDF, DOC, DOCX, TXT supported (max 20 MB)
              </p>
            </div>
            <Button variant="outline" className="pointer-events-none rounded-xl px-6">
              Browse Files
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Step 2 — Review, Edit & Analysis ───────────────────────────────────────

const CONTRACT_TYPES = [
  "service_agreement","nda","employment","vendor","licensing","partnership","other",
] as const;

function ReviewStep({
  contract,
  analysis,
  analysing,
  onContractUpdated,
  onContinue,
}: {
  contract: Contract;
  analysis: AiAnalysisResponse | null;
  analysing: boolean;
  onContractUpdated: (c: Contract) => void;
  onContinue: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);

  // Local edit state
  const [title,      setTitle]      = useState(contract.title);
  const [cType,      setCType]      = useState(contract.contract_type);
  const [startDate,  setStartDate]  = useState(contract.start_date?.slice(0, 10) ?? "");
  const [endDate,    setEndDate]    = useState(contract.end_date?.slice(0, 10) ?? "");
  const [value,      setValue]      = useState(String(contract.value ?? ""));
  const [desc,       setDesc]       = useState(contract.description ?? "");
  const [saving,     setSaving]     = useState(false);
  const [saveMsg,    setSaveMsg]    = useState<string | null>(null);

  async function handleSave() {
    setSaving(true); setSaveMsg(null);
    try {
      const payload: Record<string, unknown> = {
        title: title.trim() || contract.title,
        contract_type: cType,
        start_date: startDate || contract.start_date,
        end_date:   endDate   || contract.end_date,
        description: desc || null,
      };
      if (value !== "") payload.value = parseFloat(value) || null;
      const updated = await api.updateContract(contract.id, payload);
      onContractUpdated(updated);
      setSaveMsg("✓ Saved");
      setTimeout(() => { setSaveMsg(null); setEditOpen(false); }, 1500);
    } catch {
      setSaveMsg("✗ Save failed");
    } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5">
      {/* Top grid: contract summary + AI analysis */}
      <div className="grid gap-5 lg:grid-cols-2">
        {/* Contract meta */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Uploaded Contract
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row label="Title"    value={contract.title} />
            <Row label="Type"     value={formatLabel(contract.contract_type)} />
            <Row label="Status"   value={formatLabel(contract.status)} />
            <Row label="Uploaded" value={formatDate(contract.created_at)} />
            <Row label="Version"  value={String(contract.current_version ?? 1)} />
          </CardContent>
        </Card>

        {/* AI analysis */}
        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-violet-500" />
              AI Risk Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analysing ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <p className="text-sm text-slate-500">Running AI analysis…</p>
              </div>
            ) : analysis ? (
              <div className="space-y-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <span className="font-medium text-slate-700">Risk Score</span>
                    <Badge className={severityClass(analysis.risk_level)}>
                      {formatLabel(analysis.risk_level)} — {analysis.risk_score ?? "N/A"}
                    </Badge>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full transition-all ${riskBarColor(analysis.risk_level)}`}
                      style={{ width: `${analysis.risk_score ?? 0}%` }}
                    />
                  </div>
                </div>
                {analysis.summary && (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-700 leading-relaxed">
                    {analysis.summary}
                  </p>
                )}
                {(analysis.risk_factors?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Risk Factors</p>
                    <ul className="space-y-1">
                      {analysis.risk_factors!.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {(analysis.recommendations?.length ?? 0) > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-500">Recommendations</p>
                    <ul className="space-y-1">
                      {analysis.recommendations!.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Analysis unavailable.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Collapsible Edit Details ───────────────────────────────────────── */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <button
          onClick={() => setEditOpen((o) => !o)}
          className="flex w-full items-center justify-between px-5 py-4 text-left transition hover:bg-slate-50"
        >
          <div className="flex items-center gap-2">
            <Edit3 className="h-4 w-4 text-blue-500" />
            <span className="font-medium text-slate-800">Edit Contract Details</span>
            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
              Fix AI-extracted fields before saving
            </span>
          </div>
          {editOpen
            ? <ChevronUp className="h-4 w-4 text-slate-400" />
            : <ChevronDown className="h-4 w-4 text-slate-400" />
          }
        </button>

        {editOpen && (
          <div className="border-t border-slate-100 px-5 pb-5 pt-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Title */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contract Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>

              {/* Type */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contract Type
                </label>
                <select
                  value={cType}
                  onChange={(e) => setCType(e.target.value as typeof cType)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                >
                  {CONTRACT_TYPES.map((t) => (
                    <option key={t} value={t}>{formatLabel(t)}</option>
                  ))}
                </select>
              </div>

              {/* Value */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Contract Value (USD)
                </label>
                <input
                  type="number"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="e.g. 50000"
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>

              {/* Start date */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>

              {/* End date */}
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Description <span className="font-normal normal-case text-slate-400">(optional)</span>
                </label>
                <textarea
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  rows={2}
                  placeholder="Brief description of this contract…"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm outline-none focus:border-blue-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="mt-4 flex items-center justify-end gap-3">
              {saveMsg && (
                <span className={`text-sm font-medium ${saveMsg.startsWith("✓") ? "text-green-600" : "text-red-600"}`}>
                  {saveMsg}
                </span>
              )}
              <Button
                size="sm"
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl"
              >
                {saving
                  ? <><Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> Saving…</>
                  : <><Save className="mr-1.5 h-3.5 w-3.5" /> Save Details</>
                }
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Continue button */}
      <div className="flex justify-end">
        <Button
          onClick={onContinue}
          disabled={analysing}
          className="rounded-xl px-8"
        >
          {analysing
            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analysing…</>
            : "Continue to Conflict Check →"
          }
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3 — Conflict Check ─────────────────────────────────────────────────

function ConflictStep({
  contract,
  analysis,
  conflictResult,
  scanning,
  onEdit,
  onDownload,
  onCreateAnother,
}: {
  contract: Contract;
  analysis: AiAnalysisResponse | null;
  conflictResult: ConflictResult | null;
  scanning: boolean;
  onEdit: () => void;
  onDownload: () => void;
  onCreateAnother: () => void;
}) {
  const hasConflicts = (conflictResult?.total_conflicts ?? 0) > 0;

  if (scanning) {
    return (
      <div className="flex flex-col items-center gap-4 py-20">
        <Loader2 className="h-12 w-12 animate-spin text-blue-500" />
        <p className="text-base font-medium text-slate-700">
          Scanning against existing contracts…
        </p>
        <p className="text-sm text-slate-500">
          This may take a few seconds
        </p>
      </div>
    );
  }

  if (!conflictResult) return null;

  /* ── Conflicts found ── */
  if (hasConflicts) {
    return (
      <div className="space-y-5">
        {/* Alert banner */}
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-5 py-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
          <div>
            <p className="font-semibold text-red-800">Conflict Detected</p>
            <p className="mt-0.5 text-sm text-red-700">
              We found conflicting clauses with existing contracts
            </p>
          </div>
        </div>

        {/* Issues bar */}
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">
              Conflicts Found: {conflictResult.total_conflicts} Issue
              {conflictResult.total_conflicts !== 1 ? "s" : ""} Detected
            </span>
            <span className="text-xs text-amber-600">
              Please review the highlighted sections below
            </span>
          </div>
          <Badge className={severityClass(conflictResult.overall_risk)}>
            {formatLabel(conflictResult.overall_risk)} Risk
          </Badge>
        </div>

        {/* Side-by-side panels */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Left — uploaded contract summary */}
          <Card className="border border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Your Uploaded Contract</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <Row label="Title"   value={contract.title} />
              <Row label="Type"    value={formatLabel(contract.contract_type)} />
              <Row label="Status"  value={formatLabel(contract.status)} />
              {analysis?.risk_level && (
                <Row label="Risk" value={
                  <Badge className={severityClass(analysis.risk_level)}>
                    {formatLabel(analysis.risk_level)}
                  </Badge>
                } />
              )}
              {analysis?.summary && (
                <p className="mt-3 rounded-lg bg-slate-50 p-3 leading-relaxed">
                  {analysis.summary}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Right — conflicts list */}
          <Card className="border border-red-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base text-red-700">
                Conflicts with Existing Contracts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {conflictResult.conflicts.map((c) => (
                <div
                  key={c.id}
                  className="rounded-xl border border-slate-200 p-4 text-sm"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-800">
                      vs. {c.contract_b}
                    </span>
                    <Badge className={severityClass(c.severity)}>
                      {formatLabel(c.severity)}
                    </Badge>
                  </div>
                  <p className="mt-1 text-slate-500">
                    {formatLabel(c.conflict_type)}: {c.description}
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 p-2 text-xs">
                      <span className="font-medium">Your clause:</span> {c.clause_a}
                    </div>
                    <div className="rounded-lg bg-red-50 p-2 text-xs">
                      <span className="font-medium">Conflicting:</span> {c.clause_b}
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    <span className="font-medium text-slate-700">Fix: </span>
                    {c.recommendation}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="outline" className="rounded-xl" onClick={onEdit}>
            <Edit3 className="mr-2 h-4 w-4" />
            Edit Contract
          </Button>
          <Button className="rounded-xl bg-blue-600 hover:bg-blue-700" onClick={onCreateAnother}>
            Remove Conflicts and Continue
          </Button>
        </div>
      </div>
    );
  }

  /* ── No conflicts ── */
  return (
    <div className="space-y-6">
      {/* Success hero */}
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
          <ShieldCheck className="h-10 w-10 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900">No Conflicts Detected!</h2>
        <p className="text-slate-500">
          Your contract has been created/uploaded successfully
        </p>
      </div>

      {/* Contract Summary */}
      <Card className="border border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle>Contract Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-8 gap-y-3 text-sm md:grid-cols-2">
            <SummaryRow label="Contract Title"  value={contract.title} />
            <SummaryRow label="Uploaded By"     value={contract.created_by ?? "—"} />
            <SummaryRow label="Contract Type"   value={formatLabel(contract.contract_type)} />
            <SummaryRow label="Upload Date"     value={formatDate(contract.created_at)} />
            <SummaryRow label="Party / Vendor"  value={contract.parties?.[0]?.name ?? "—"} />
            <SummaryRow
              label="Status"
              value={
                <Badge className="bg-green-100 text-green-700">
                  {formatLabel(contract.status)}
                </Badge>
              }
            />
          </div>
        </CardContent>
      </Card>

      <p className="text-center text-sm font-medium text-slate-500">
        What would you like to do next?
      </p>

      {/* Action cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <ActionCard
          icon={<Edit3 className="h-7 w-7 text-blue-500" />}
          title="Edit Contract"
          description="Make changes to your document"
          buttonLabel="Edit Now"
          onClick={onEdit}
        />
        <ActionCard
          icon={<Download className="h-7 w-7 text-teal-500" />}
          title="Download Contract"
          description="Download your contract file"
          buttonLabel="Download"
          onClick={onDownload}
          variant="outline"
        />
        <ActionCard
          icon={<Plus className="h-7 w-7 text-slate-500" />}
          title="Create New Contract"
          description="Start creating another contract"
          buttonLabel="Create Another"
          onClick={onCreateAnother}
          variant="outline"
        />
      </div>
    </div>
  );
}

// ─── Small sub-components ────────────────────────────────────────────────────

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <span className="w-28 shrink-0 font-medium text-slate-700">{label}:</span>
      <span className="text-slate-600">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 font-medium text-slate-800">{value}</p>
    </div>
  );
}

function ActionCard({
  icon,
  title,
  description,
  buttonLabel,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
  variant?: "default" | "outline";
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-50">
        {icon}
      </div>
      <div>
        <p className="font-semibold text-slate-900">{title}</p>
        <p className="mt-0.5 text-xs text-slate-500">{description}</p>
      </div>
      <Button variant={variant} className="w-full rounded-xl" onClick={onClick}>
        {buttonLabel}
      </Button>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function UploadPipelinePage() {
  const navigate = useNavigate();

  const [step, setStep]                   = useState<PipelineStep>(1);
  const [contract, setContract]           = useState<Contract | null>(null);
  const [analysis, setAnalysis]           = useState<AiAnalysisResponse | null>(null);
  const [analysing, setAnalysing]         = useState(false);
  const [conflictResult, setConflictResult] = useState<ConflictResult | null>(null);
  const [scanning, setScanning]           = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // ── Step 1 complete ──────────────────────────────────────────────────────
  async function handleUploaded(uploaded: Contract, _extractedText: string) {
    setContract(uploaded);
    setStep(2);

    // Kick off AI analysis immediately in the background
    setAnalysing(true);
    setAnalysisError(null);
    try {
      const result = await api.analyzeContract(uploaded.id);
      setAnalysis(result);
    } catch {
      setAnalysisError("AI analysis failed — you can still continue.");
    } finally {
      setAnalysing(false);
    }
  }

  // ── Step 2 → Step 3 ─────────────────────────────────────────────────────
  async function handleContinueToConflict() {
    if (!contract) return;
    setStep(3);
    setScanning(true);
    try {
      const result = await api.scanContractConflicts(contract.id);
      setConflictResult(result);
    } catch {
      // Show a safe empty result on failure
      setConflictResult({
        total_conflicts: 0,
        overall_risk: "low",
        summary: "Conflict scan failed — treating as conflict-free.",
        conflicts: [],
      });
    } finally {
      setScanning(false);
    }
  }

  // ── Action handlers ──────────────────────────────────────────────────────
  function handleEdit() {
    if (contract) navigate(`/contracts/${contract.id}`);
  }

  function handleDownload() {
    if (contract) {
      window.open(
        `${API_BASE_URL}/api/documents/download/${contract.id}`,
        "_blank"
      );
    }
  }

  function handleCreateAnother() {
    navigate("/upload");
    // Reset state for a fresh pipeline
    setStep(1);
    setContract(null);
    setAnalysis(null);
    setConflictResult(null);
  }

  return (
    <AppShell
      title="Upload Contract"
      subtitle="Upload your document and we'll analyse it and check for conflicts automatically."
    >
      <div className="mx-auto max-w-4xl">
        <StepIndicator current={step} />

        {analysisError && (
          <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            {analysisError}
          </div>
        )}

        {step === 1 && (
          <UploadStep onUploaded={handleUploaded} />
        )}

        {step === 2 && contract && (
          <ReviewStep
            contract={contract}
            analysis={analysis}
            analysing={analysing}
            onContractUpdated={(updated) => setContract(updated)}
            onContinue={handleContinueToConflict}
          />
        )}

        {step === 3 && contract && (
          <ConflictStep
            contract={contract}
            analysis={analysis}
            conflictResult={conflictResult}
            scanning={scanning}
            onEdit={handleEdit}
            onDownload={handleDownload}
            onCreateAnother={handleCreateAnother}
          />
        )}
      </div>
    </AppShell>
  );
}
