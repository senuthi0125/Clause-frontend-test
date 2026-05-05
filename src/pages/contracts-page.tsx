import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Plus, Search, Trash2, Upload, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useRole } from "@/hooks/use-role";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, buildContractsQuery } from "@/lib/api";
import { formatLabel, formatDate, formatCurrency, statusBadgeClass as badgeClass } from "@/lib/utils";
import type { Contract, ContractsResponse } from "@/types/api";

// Ordered pipeline stages — used to build the progress tracker
const WORKFLOW_STAGES = [
  "request",
  "authoring",
  "review",
  "approval",
  "execution",
  "storage",
  "monitoring",
  "renewal",
] as const;

function WorkflowProgressBar({ stage }: { stage?: string | null }) {
  const current = WORKFLOW_STAGES.indexOf(
    (stage ?? "request") as (typeof WORKFLOW_STAGES)[number]
  );
  const activeIdx = current < 0 ? 0 : current;

  return (
    <div className="mt-3">
      <p className="mb-1.5 text-xs font-medium text-slate-500 uppercase tracking-wide">
        Document Stage
      </p>
      <div className="flex items-center gap-0.5">
        {WORKFLOW_STAGES.map((s, i) => {
          const isDone = i < activeIdx;
          const isCurrent = i === activeIdx;
          return (
            <div key={s} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`h-1.5 w-full rounded-full transition-all ${
                  isDone
                    ? "bg-green-500"
                    : isCurrent
                    ? "bg-violet-500"
                    : "bg-slate-200"
                }`}
              />
              {isCurrent && (
                <span className="text-[10px] font-medium text-violet-600 whitespace-nowrap">
                  {formatLabel(s)}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function getRiskBadgeLabel(contract: Contract) {
  const riskScore = (contract as Contract & { risk_score?: number | null })
    .risk_score;

  if (typeof riskScore === "number" && !Number.isNaN(riskScore)) {
    return `Risk ${riskScore}`;
  }

  if (contract.risk_level) {
    return `${formatLabel(contract.risk_level)} risk`;
  }

  return "Unrated";
}

function getRiskBadgeClass(contract: Contract) {
  if (contract.risk_level) {
    return badgeClass(contract.risk_level);
  }

  return "bg-slate-100 text-slate-700";
}

export default function ContractsPage() {
  const navigate = useNavigate();
  const { isAdminOrManager } = useRole();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [meta, setMeta] = useState<ContractsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleUploadFile(file: File) {
    setUploading(true);
    setUploadError(null);
    try {
      const result = await api.uploadContract(file);
      if (!result?.contract?.id && !result?.id) throw new Error("Upload failed — no contract ID returned.");
      setUploadOpen(false);
      await loadContracts();
      const id = result.contract?.id ?? result.id;
      if (id) navigate(`/contracts/${id}`);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  const loadContracts = async () => {
    setLoading(true);
    setError(null);

    try {
      const query = buildContractsQuery({ search, status, per_page: 50 });
      const data = await api.listContracts(query);
      setContracts(Array.isArray(data.contracts) ? data.contracts : []);
      setMeta(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load contracts."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();

    contracts.forEach((contract) => {
      const type = contract.contract_type || "other";
      counts.set(type, (counts.get(type) || 0) + 1);
    });

    return Array.from(counts.entries()).map(([name, count]) => ({
      name: formatLabel(name),
      count,
    }));
  }, [contracts]);

  const deleteContract = async (id: string) => {
    const confirmed = window.confirm("Delete this contract?");
    if (!confirmed) return;

    try {
      await api.deleteContract(id);
      await loadContracts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete contract."
      );
    }
  };

  return (
    <AppShell
      title="Contracts"
      subtitle={
        isAdminOrManager
          ? "All contracts across all users — manage, review, and advance workflows."
          : "Your uploaded contracts — track each document's approval stage below."
      }
      contractGroups={contractGroups}
    >
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && loadContracts()}
                  placeholder="Search by title"
                  className="h-11 pl-9"
                />
              </div>

              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
                <option value="renewed">Renewed</option>
              </select>

              <Button onClick={loadContracts} className="h-11 rounded-xl">
                Apply filters
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 border-t border-slate-100 pt-1">
              <Button variant="outline" className="h-11 rounded-xl" onClick={() => { setUploadError(null); setUploadOpen(true); }}>
                <Upload className="mr-2 h-4 w-4" />
                Upload contract
              </Button>

              <Button asChild className="h-11 rounded-xl">
                <Link to="/contracts/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New contract
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4">
        {loading ? (
          <p className="text-sm text-slate-500">Loading contracts...</p>
        ) : null}

        {!loading && contracts.length === 0 ? (
          <p className="text-sm text-slate-500">No contracts found.</p>
        ) : null}

        {contracts.map((contract) => (
          <Card
            key={contract.id}
            className="cursor-pointer border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md"
            onClick={() => navigate(`/contracts/${contract.id}`)}
          >
            <CardHeader>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <CardTitle>{contract.title}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500">
                    {contract.description || "No description provided."}
                  </p>
                </div>

                <div
                  className="flex flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Badge className={badgeClass(contract.status)}>
                    {formatLabel(contract.status)}
                  </Badge>
                  <Badge className={badgeClass(contract.workflow_stage)}>
                    {formatLabel(contract.workflow_stage)}
                  </Badge>
                  <Badge className={getRiskBadgeClass(contract)}>
                    {getRiskBadgeLabel(contract)}
                  </Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid gap-3 text-sm text-slate-600 md:grid-cols-2 xl:grid-cols-5">
                <div>
                  <span className="font-medium text-slate-900">Type:</span>{" "}
                  {formatLabel(contract.contract_type)}
                </div>
                <div>
                  <span className="font-medium text-slate-900">Value:</span>{" "}
                  {formatCurrency(contract.value)}
                </div>
                <div>
                  <span className="font-medium text-slate-900">Start:</span>{" "}
                  {formatDate(contract.start_date)}
                </div>
                <div>
                  <span className="font-medium text-slate-900">End:</span>{" "}
                  {formatDate(contract.end_date)}
                </div>
                <div>
                  <span className="font-medium text-slate-900">Version:</span>{" "}
                  {contract.current_version ?? 1}
                </div>
              </div>

              {/* Workflow progress bar — always visible so users know their document stage */}
              <WorkflowProgressBar stage={contract.workflow_stage} />

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="flex flex-col gap-1">
                  <div className="text-sm text-slate-500">
                    Parties:{" "}
                    {contract.parties?.map((party) => party.name).join(", ") ||
                      "No parties added"}
                  </div>
                  {isAdminOrManager && contract.created_by && (
                    <div className="text-xs text-slate-400">
                      Uploaded by:{" "}
                      <span className="font-medium text-slate-600">
                        {contract.created_by}
                      </span>
                    </div>
                  )}
                </div>

                <div
                  className="flex flex-wrap gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {contract.workflow_id ? (
                    <Button variant="outline" asChild className="rounded-xl">
                      <Link to={`/workflows/${contract.workflow_id}`}>
                        {isAdminOrManager ? "Manage workflow" : "Track progress"}
                      </Link>
                    </Button>
                  ) : null}

                  <Button variant="outline" asChild className="rounded-xl">
                    <Link to="/conflict-detection">Compare</Link>
                  </Button>

                  {isAdminOrManager && (
                    <Button
                      variant="destructive"
                      onClick={() => deleteContract(contract.id)}
                      className="rounded-xl"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {meta ? (
        <p className="mt-4 text-sm text-slate-500">
          Showing {contracts.length} of {meta.total} contracts.
        </p>
      ) : null}

      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => !uploading && setUploadOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Upload contract</h2>
              <button onClick={() => !uploading && setUploadOpen(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUploadFile(f); e.target.value = ""; }} />

            {uploadError && (
              <div className="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-700">{uploadError}</div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files?.[0]; if (f) handleUploadFile(f); }}
              onClick={() => !uploading && fileRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-12 transition-all ${dragging ? "border-violet-500 bg-violet-50" : "border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50"}`}
            >
              {uploading ? (
                <>
                  <Loader2 className="h-10 w-10 animate-spin text-violet-500" />
                  <p className="text-sm font-medium text-slate-600">Uploading…</p>
                </>
              ) : (
                <>
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50">
                    <Upload className="h-7 w-7 text-violet-500" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-700">Drop a file or click to browse</p>
                    <p className="mt-1 text-xs text-slate-400">PDF, DOC, DOCX, TXT</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}