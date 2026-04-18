import { useEffect, useMemo, useState } from "react";
import { ShieldAlert } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { ConflictResult, Contract } from "@/types/api";

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function severityClass(value: string) {
  switch (value) {
    case "high":
    case "critical":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-green-100 text-green-700";
  }
}

export default function ConflictDetectionPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<ConflictResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadContracts = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.listContracts("?per_page=100");
      setContracts(data.contracts);
    } catch {
      setError("Failed to load contracts.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContracts();
  }, []);

  const filteredContracts = useMemo(() => {
    return contracts.filter(
      (contract) =>
        contract.title.toLowerCase().includes(search.toLowerCase()) ||
        contract.contract_type.toLowerCase().includes(search.toLowerCase())
    );
  }, [contracts, search]);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();

    contracts.forEach((contract) => {
      counts.set(
        contract.contract_type,
        (counts.get(contract.contract_type) || 0) + 1
      );
    });

    return Array.from(counts.entries()).map(([name, count]) => ({
      name: formatLabel(name),
      count,
    }));
  }, [contracts]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id].slice(0, 10)
    );
  };

  const analyze = async () => {
    setAnalyzing(true);
    setError(null);

    try {
      const data = await api.detectConflicts(selectedIds);
      setResult(data);
    } catch {
      setError("Failed to detect conflicts.");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <AppShell
      title="Conflict Detection"
      subtitle="Compare contracts and detect clause conflicts using the backend."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Select contracts to compare</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search contracts"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="mt-4 space-y-3">
              {loading && (
                <p className="text-sm text-slate-500">Loading contracts...</p>
              )}

              {!loading && filteredContracts.length === 0 && (
                <p className="text-sm text-slate-500">No contracts found.</p>
              )}

              {filteredContracts.map((contract) => {
                const checked = selectedIds.includes(contract.id);

                return (
                  <button
                    key={contract.id}
                    type="button"
                    onClick={() => toggleSelection(contract.id)}
                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                      checked
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-slate-900">
                          {contract.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {formatLabel(contract.contract_type)}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Status: {formatLabel(contract.status)}
                        </p>
                      </div>
                      <input type="checkbox" readOnly checked={checked} />
                    </div>
                  </button>
                );
              })}
            </div>

            <Button
              className="mt-4 w-full"
              onClick={analyze}
              disabled={selectedIds.length < 2 || analyzing}
            >
              {analyzing
                ? "Analyzing..."
                : `Analyze ${selectedIds.length} contract(s)`}
            </Button>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 bg-white shadow-sm">
          <CardHeader>
            <CardTitle>Conflict results</CardTitle>
          </CardHeader>
          <CardContent>
            {!result && (
              <p className="text-sm text-slate-500">
                Select at least two contracts and run analysis.
              </p>
            )}

            {result && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">
                        {result.summary || "Conflict analysis completed."}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Total conflicts: {result.total_conflicts}
                      </p>
                    </div>
                    <Badge className={severityClass(result.overall_risk)}>
                      {formatLabel(result.overall_risk)}
                    </Badge>
                  </div>
                </div>

                {result.conflicts.length === 0 && (
                  <p className="text-sm text-slate-500">
                    No conflicts were returned.
                  </p>
                )}

                {result.conflicts.map((conflict) => (
                  <div
                    key={conflict.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2 font-medium text-slate-900">
                        <ShieldAlert className="h-4 w-4" />
                        {conflict.contract_a} vs {conflict.contract_b}
                      </div>
                      <Badge className={severityClass(conflict.severity)}>
                        {formatLabel(conflict.severity)}
                      </Badge>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      Type: {formatLabel(conflict.conflict_type)}
                    </p>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div className="rounded-lg bg-slate-50 p-3 text-sm">
                        <span className="font-medium text-slate-900">
                          Clause A:
                        </span>{" "}
                        {conflict.clause_a}
                      </div>
                      <div className="rounded-lg bg-slate-50 p-3 text-sm">
                        <span className="font-medium text-slate-900">
                          Clause B:
                        </span>{" "}
                        {conflict.clause_b}
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-slate-700">
                      {conflict.description}
                    </p>
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-900">
                        Recommendation:
                      </span>{" "}
                      {conflict.recommendation}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}