import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api";
import type { ContractParty, Template } from "@/types/api";

type FormState = {
  title: string;
  contract_type: string;
  description: string;
  start_date: string;
  end_date: string;
  value: string;
  payment_terms: string;
  approval_type: string;
  workflow_trigger: string;
  tags: string;
};

const initialState: FormState = {
  title: "",
  contract_type: "nda",
  description: "",
  start_date: "",
  end_date: "",
  value: "",
  payment_terms: "",
  approval_type: "all_required",
  workflow_trigger: "creation",
  tags: "",
};

function blankParty(): ContractParty {
  return { name: "", role: "", email: "", organization: "" };
}

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

const selectClass =
  "h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-white/5 dark:text-white";

export default function CreateContractPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("templateId");

  const [form, setForm] = useState<FormState>(initialState);
  const [parties, setParties] = useState<ContractParty[]>([blankParty(), blankParty()]);
  const [template, setTemplate] = useState<Template | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!templateId) return;
    const loadTemplate = async () => {
      setLoadingTemplate(true);
      setError(null);
      try {
        const data = await api.getTemplate(templateId);
        setTemplate(data);
        setForm((prev) => ({
          ...prev,
          contract_type: data.contract_type || prev.contract_type,
          title: prev.title || data.name || "",
          description: prev.description || data.description || "",
        }));
      } catch {
        setError("Failed to load template.");
      } finally {
        setLoadingTemplate(false);
      }
    };
    loadTemplate();
  }, [templateId]);

  const contractGroups = useMemo(
    () => [{ name: formatLabel(form.contract_type), count: 1 }],
    [form.contract_type]
  );

  const updateParty = (index: number, key: keyof ContractParty, value: string) => {
    setParties((prev) =>
      prev.map((party, i) => (i === index ? { ...party, [key]: value } : party))
    );
  };

  const addParty = () => setParties((prev) => [...prev, blankParty()]);
  const removeParty = (index: number) =>
    setParties((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));

  const submit = async () => {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const filteredParties = parties.filter((p) => p.name.trim() && p.role.trim());
      const payload = {
        title: form.title,
        contract_type: form.contract_type,
        description: form.description || null,
        parties: filteredParties,
        start_date: new Date(form.start_date).toISOString(),
        end_date: new Date(form.end_date).toISOString(),
        value: form.value ? Number(form.value) : null,
        payment_terms: form.payment_terms || null,
        approval_type: form.approval_type,
        workflow_trigger: form.workflow_trigger,
        tags: form.tags
          ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        template_id: template?.id || null,
      };
      const createdContract = await api.createContract(payload);
      const workflow = await api.createWorkflow({
        contract_id: createdContract.id,
        name: `${createdContract.title} workflow`,
      });
      setMessage("Contract created and workflow started successfully.");
      setTimeout(() => navigate(`/workflows/${workflow.id}`), 800);
    } catch {
      setError("Failed to create contract.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title="Create Contract"
      subtitle="Create a contract and send it to the backend."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-500/20 dark:bg-green-500/10 dark:text-green-300">
          {message}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
          <CardHeader>
            <CardTitle className="dark:text-white">Contract Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 text-sm dark:text-slate-300">
                <span>Title</span>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>

              <label className="space-y-2 text-sm dark:text-slate-300">
                <span>Type</span>
                <select
                  className={selectClass}
                  value={form.contract_type}
                  onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
                >
                  <option value="service_agreement">Service Agreement</option>
                  <option value="nda">NDA</option>
                  <option value="employment">Employment</option>
                  <option value="vendor">Vendor</option>
                  <option value="licensing">Licensing</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </label>

              <label className="space-y-2 text-sm dark:text-slate-300 md:col-span-2">
                <span>Description</span>
                <textarea
                  className="min-h-28 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm outline-none dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-slate-500"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </label>

              <label className="space-y-2 text-sm dark:text-slate-300">
                <span>Start Date</span>
                <Input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>

              <label className="space-y-2 text-sm dark:text-slate-300">
                <span>End Date</span>
                <Input
                  type="date"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>

              <label className="space-y-2 text-sm dark:text-slate-300">
                <span>Contract Value</span>
                <Input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>

              <label className="space-y-2 text-sm dark:text-slate-300">
                <span>Approval Type</span>
                <select
                  className={selectClass}
                  value={form.approval_type}
                  onChange={(e) => setForm({ ...form, approval_type: e.target.value })}
                >
                  <option value="all_required">All Required</option>
                  <option value="majority">Majority</option>
                  <option value="first_person">First Person</option>
                </select>
              </label>

              <label className="space-y-2 text-sm dark:text-slate-300 md:col-span-2">
                <span>Payment Terms</span>
                <Input
                  value={form.payment_terms}
                  onChange={(e) => setForm({ ...form, payment_terms: e.target.value })}
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>

              <label className="space-y-2 text-sm dark:text-slate-300">
                <span>Workflow Trigger</span>
                <select
                  className={selectClass}
                  value={form.workflow_trigger}
                  onChange={(e) => setForm({ ...form, workflow_trigger: e.target.value })}
                >
                  <option value="creation">On Creation</option>
                  <option value="modification">On Modification</option>
                  <option value="renewal">On Renewal</option>
                </select>
              </label>

              <label className="space-y-2 text-sm dark:text-slate-300">
                <span>Tags</span>
                <Input
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="security, vendor, renewal"
                  className="dark:border-white/10 dark:bg-white/5 dark:text-white"
                />
              </label>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card className="border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="dark:text-white">Parties</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parties.map((party, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200 p-4 dark:border-white/10"
                  >
                    <div className="grid gap-3 md:grid-cols-2">
                      <Input placeholder="Name" value={party.name}
                        onChange={(e) => updateParty(index, "name", e.target.value)}
                        className="dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      <Input placeholder="Role" value={party.role}
                        onChange={(e) => updateParty(index, "role", e.target.value)}
                        className="dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      <Input placeholder="Email" value={party.email || ""}
                        onChange={(e) => updateParty(index, "email", e.target.value)}
                        className="dark:border-white/10 dark:bg-white/5 dark:text-white" />
                      <Input placeholder="Organization" value={party.organization || ""}
                        onChange={(e) => updateParty(index, "organization", e.target.value)}
                        className="dark:border-white/10 dark:bg-white/5 dark:text-white" />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <Button variant="outline" onClick={() => removeParty(index)}>
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" onClick={addParty}>Add Party</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/5">
            <CardHeader>
              <CardTitle className="dark:text-white">
                {loadingTemplate ? "Loading template..." : template ? "Template Linked" : "No Template Selected"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {template ? (
                <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                  <p className="font-medium text-slate-900 dark:text-white">{template.name}</p>
                  <p>{template.description || "No description provided."}</p>
                  <p>Fields available: {template.fields?.length || 0}</p>
                </div>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  You can create a contract from scratch or use a template.
                </p>
              )}
              <Button
                className="mt-4 w-full"
                onClick={submit}
                disabled={saving || !form.title || !form.start_date || !form.end_date}
              >
                {saving ? "Saving..." : "Create Contract and Workflow"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
