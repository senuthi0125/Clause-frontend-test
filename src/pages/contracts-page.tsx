import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Trash2, Upload, Loader2 } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api, buildContractsQuery } from "@/lib/api";
import type { Contract, ContractsResponse } from "@/types/api";

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

export default function ContractsPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [meta, setMeta] = useState<ContractsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleUploadChange = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const result = await api.uploadContract(file);
      await loadContracts();

      const newId = result?.contract?.id || result?.id;
      if (newId) {
        navigate(`/contracts/${newId}`);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to upload contract."
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <AppShell
      title="Contracts"
      subtitle="Browse live contracts from the backend and open detailed views."
      contractGroups={contractGroups}
      actions={
        <>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept=".pdf,.doc,.docx,.txt"
            onChange={handleUploadChange}
          />

          <Button
            variant="outline"
            onClick={handleUploadClick}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Upload contract
          </Button>

          <Button asChild>
            <Link to="/contracts/new">
              <Plus className="mr-2 h-4 w-4" />
              New contract
            </Link>
          </Button>
        </>
      }
    >
      <Card className="border border-slate-200 bg-white shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title"
                className="pl-9"
              />
            </div>

            <select
              className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm"
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

            <Button onClick={loadContracts}>Apply filters</Button>
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
                  <Badge className={badgeClass(contract.risk_level)}>
                    {formatLabel(contract.risk_level || "unrated")}
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

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                <div className="text-sm text-slate-500">
                  Parties:{" "}
                  {contract.parties?.map((party) => party.name).join(", ") ||
                    "No parties added"}
                </div>

                <div
                  className="flex gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  {contract.workflow_id ? (
                    <Button variant="outline" asChild>
                      <Link to={`/workflows/${contract.workflow_id}`}>
                        Open workflow
                      </Link>
                    </Button>
                  ) : null}

                  <Button variant="outline" asChild>
                    <Link to="/conflict-detection">Compare</Link>
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => deleteContract(contract.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
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
    </AppShell>
  );
}