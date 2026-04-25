import { useEffect, useMemo, useState } from "react";
import { ArrowRight, FilePlus2, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api";
import type { Template } from "@/types/api";

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

export default function ContractTemplatePage() {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await api.listTemplates("?per_page=50");
      setTemplates(data.templates);
    } catch {
      setError("Failed to load templates.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();

    templates.forEach((template) => {
      counts.set(
        template.contract_type,
        (counts.get(template.contract_type) || 0) + 1
      );
    });

    return Array.from(counts.entries()).map(([name, count]) => ({
      name: formatLabel(name),
      count,
    }));
  }, [templates]);

  return (
    <AppShell
      title="Templates"
      subtitle="Choose a contract template or start from scratch."
      contractGroups={contractGroups}
      actions={
        <>
          <Button variant="outline" onClick={loadTemplates}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button onClick={() => navigate("/contracts/create")}>
            <FilePlus2 className="mr-2 h-4 w-4" />
            Blank contract
          </Button>
        </>
      }
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {loading && (
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading templates...</p>
      )}

      {!loading && templates.length === 0 && (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          No templates found. Add templates in backend.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => (
          <Card
            key={template.id}
            className="border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5"
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <CardTitle className="dark:text-white">{template.name}</CardTitle>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    {template.description || "No description provided"}
                  </p>
                </div>

                <Badge className="bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300">
                  v{template.version}
                </Badge>
              </div>
            </CardHeader>

            <CardContent>
              <div className="space-y-3 text-sm text-slate-600 dark:text-slate-400">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-200">Type:</span>{" "}
                  {formatLabel(template.contract_type)}
                </div>

                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-200">Fields:</span>{" "}
                  {template.fields?.length || 0}
                </div>

                <div className="flex flex-wrap gap-2">
                  {(template.tags || []).map((tag) => (
                    <Badge key={tag} className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300">
                      {tag}
                    </Badge>
                  ))}
                </div>

                <Button
                  className="w-full"
                  onClick={() =>
                    navigate(`/contracts/create?templateId=${template.id}`)
                  }
                >
                  Use template
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </AppShell>
  );
}