import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Users,
  GitBranch,
  ChevronRight,
  Bot,
  Sparkles,
  ArrowLeft,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Contracts", icon: FileText, href: "/contracts" },
  { label: "AI Analysis", icon: ShieldAlert, href: "/ai-analysis" },
  { label: "Conflict Detection", icon: ShieldCheck, href: "/conflict-detection" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Workflows", icon: GitBranch, href: "/workflows" },
  { label: "Admin", icon: Users, href: "/admin" },
];

const contractGroups = [
  { name: "Master Service Agreements", count: 18, color: "bg-orange-400" },
  { name: "Vendor Contracts", count: 9, color: "bg-emerald-400" },
  { name: "Employment Contracts", count: 14, color: "bg-violet-400" },
  { name: "NDAs", count: 22, color: "bg-sky-400" },
];

const typeOptions = [
  { value: "service_agreement", label: "Service Agreement" },
  { value: "nda", label: "NDA" },
  { value: "employment", label: "Employment" },
  { value: "vendor", label: "Vendor" },
  { value: "licensing", label: "Licensing" },
  { value: "partnership", label: "Partnership" },
  { value: "other", label: "Other" },
];

const approvalOptions = [
  { value: "majority", label: "Majority" },
  { value: "first_person", label: "First Person" },
  { value: "all_required", label: "All Required" },
];

const triggerOptions = [
  { value: "creation", label: "On Creation" },
  { value: "modification", label: "On Modification" },
  { value: "renewal", label: "On Renewal" },
];

type Party = {
  name: string;
  role: string;
  email: string;
  organization: string;
};

const emptyParty: Party = {
  name: "",
  role: "",
  email: "",
  organization: "",
};

function getTemplateLabel(template: string | null) {
  switch (template) {
    case "service_agreement":
      return "Service Agreement";
    case "nda":
      return "NDA";
    case "employment":
      return "Employment";
    case "vendor":
      return "Vendor";
    case "licensing":
      return "Licensing";
    case "partnership":
      return "Partnership";
    case "other":
      return "Other";
    default:
      return "Blank Contract";
  }
}

function getTemplateDescription(template: string | null) {
  switch (template) {
    case "service_agreement":
      return "Service delivery contract with scope, fees, and obligations.";
    case "nda":
      return "Confidentiality contract for protecting sensitive information.";
    case "employment":
      return "Employment contract with role, duration, and compensation fields.";
    case "vendor":
      return "Vendor-facing contract for procurement and service expectations.";
    case "licensing":
      return "IP licensing contract with usage rights and limitations.";
    case "partnership":
      return "Partnership agreement with shared responsibilities and terms.";
    case "other":
      return "Generic contract structure for custom legal arrangements.";
    default:
      return "Create a contract completely from scratch.";
  }
}

export default function CreateContractPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const template = searchParams.get("template");
  const mode = searchParams.get("mode");

  const initialTitle = useMemo(() => {
    if (template === "nda") return "New NDA";
    if (template === "service_agreement") return "New Service Agreement";
    if (template === "employment") return "New Employment Contract";
    if (template === "vendor") return "New Vendor Agreement";
    if (template === "licensing") return "New Licensing Agreement";
    if (template === "partnership") return "New Partnership Agreement";
    if (template === "other") return "New Contract";
    return "";
  }, [template]);

  const [form, setForm] = useState({
    title: initialTitle,
    contract_type: template || "service_agreement",
    description: "",
    parties: [{ ...emptyParty }],
    start_date: "",
    end_date: "",
    value: "",
    payment_terms: "",
    approval_type: "majority",
    workflow_trigger: "creation",
    template_id: template || "",
    tags: [] as string[],
  });

  const [tagInput, setTagInput] = useState("");

  const updateField = (field: string, value: string | Party[] | string[]) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateParty = (index: number, field: keyof Party, value: string) => {
    const updatedParties = [...form.parties];
    updatedParties[index] = {
      ...updatedParties[index],
      [field]: value,
    };
    updateField("parties", updatedParties);
  };

  const addParty = () => {
    updateField("parties", [...form.parties, { ...emptyParty }]);
  };

  const removeParty = (index: number) => {
    updateField(
      "parties",
      form.parties.filter((_, i) => i !== index)
    );
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (!trimmed) return;
    if (form.tags.includes(trimmed)) return;

    updateField("tags", [...form.tags, trimmed]);
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    updateField(
      "tags",
      form.tags.filter((t) => t !== tag)
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Create contract form data:", form);
    alert("Contract form submitted successfully.");
  };

  return (
    <div className="min-h-screen w-full bg-slate-100">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="bg-slate-900 text-slate-100 lg:min-h-screen">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 via-blue-500 to-emerald-400 text-sm font-bold text-white">
                  C
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">clause</h1>
                  <p className="text-xs text-slate-400">
                    Contract lifecycle workspace
                  </p>
                </div>
              </div>
            </div>

            <div className="px-4 py-4">
              <nav className="space-y-1.5">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.label}
                      to={item.href}
                      end={item.href === "/"}
                      className={({ isActive }) =>
                        cn(
                          "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition cursor-pointer",
                          isActive
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-300 hover:bg-white/5 hover:text-white"
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>
            </div>

            <div className="px-6 pt-2">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.16em] text-slate-400">
                <span>My Contracts</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6 rounded-full text-slate-300 hover:bg-white/10 hover:text-white"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="mt-3 flex-1 px-4">
              <div className="space-y-2 pb-6">
                {contractGroups.map((item) => (
                  <div
                    key={item.name}
                    className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("h-2.5 w-2.5 rounded-full", item.color)} />
                      <div>
                        <p className="text-sm text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-400">Tracked repository</p>
                      </div>
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded-full bg-white/10 text-slate-200 hover:bg-white/10"
                    >
                      {item.count}
                    </Badge>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="m-4 rounded-[24px] bg-white p-5 text-slate-900 shadow-lg">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100">
                  <Bot className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Clause AI Assistant</p>
                  <p className="text-xs text-slate-500">Drafting support chat</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested prompt
                </div>
                <p className="text-sm text-slate-700">
                  Draft a contract summary and highlight risky clauses before submission.
                </p>
              </div>

              <Button className="mt-4 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                Open AI Chatbot
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-slate-100">
          <div className="border-b border-slate-200 bg-white px-5 py-4 md:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-start gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mt-1 rounded-xl"
                  onClick={() => navigate("/contracts/new")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div>
                  <p className="text-sm text-slate-500">Contracts workspace</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                    Create Contract
                  </h2>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm w-fit">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>SA</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium text-slate-900">Ashen</p>
                  <p className="text-xs text-slate-500">Legal Ops / Admin</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 md:p-7">
            <div>
              <h3 className="text-4xl font-semibold tracking-tight text-slate-900">
                {mode === "upload" ? "Upload Contract" : getTemplateLabel(template)}
              </h3>
              <p className="mt-2 text-lg text-slate-500">
                {mode === "upload"
                  ? "Upload an existing contract and complete its details."
                  : getTemplateDescription(template)}
              </p>

              {(template || mode === "upload") && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {template && (
                    <span className="inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700">
                      Template: {getTemplateLabel(template)}
                    </span>
                  )}
                  {mode === "upload" && (
                    <span className="inline-flex rounded-full bg-sky-100 px-4 py-2 text-sm font-medium text-sky-700">
                      Upload Mode
                    </span>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => navigate("/contracts/new")}
                  >
                    Change Option
                  </Button>
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-slate-900">Basic Information</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Add title, type, and a short description.
                  </p>
                </div>

                <div className="grid gap-5">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Contract Title *
                    </label>
                    <Input
                      value={form.title}
                      onChange={(e) => updateField("title", e.target.value)}
                      placeholder="Enter contract title"
                      className="h-12 rounded-2xl border-slate-200"
                    />
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Contract Type
                      </label>
                      <select
                        value={form.contract_type}
                        onChange={(e) => updateField("contract_type", e.target.value)}
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                      >
                        {typeOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-slate-700">
                        Selected Template
                      </label>
                      <Input
                        value={getTemplateLabel(template)}
                        readOnly
                        className="h-12 rounded-2xl border-slate-200 bg-slate-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Description
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateField("description", e.target.value)}
                      placeholder="Add a short contract description"
                      className="min-h-[120px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-slate-900">Upload Contract File</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Upload the supporting file if you already have a contract draft.
                  </p>
                </div>

                <div className="flex min-h-[220px] items-center justify-center rounded-[24px] border-2 border-dashed border-violet-200 bg-violet-50/70 p-8 text-center">
                  <div>
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">
                      <Upload className="h-6 w-6 text-violet-600" />
                    </div>
                    <p className="text-base font-medium text-slate-900">
                      Choose a file or drag & drop
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      PDF, DOCX, or draft files up to 20MB
                    </p>
                    <Button
                      type="button"
                      className="mt-5 rounded-xl bg-violet-600 hover:bg-violet-700"
                    >
                      Upload Contract
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h4 className="text-xl font-semibold text-slate-900">Parties</h4>
                    <p className="mt-1 text-sm text-slate-500">
                      Add the people or organizations involved in this contract.
                    </p>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={addParty}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Party
                  </Button>
                </div>

                <div className="space-y-4">
                  {form.parties.map((party, index) => (
                    <div
                      key={index}
                      className="rounded-[24px] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-700">
                          Party {index + 1}
                        </p>

                        {form.parties.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="rounded-xl text-rose-500 hover:text-rose-600"
                            onClick={() => removeParty(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <Input
                          placeholder="Name *"
                          value={party.name}
                          onChange={(e) => updateParty(index, "name", e.target.value)}
                          className="h-12 rounded-2xl border-slate-200 bg-white"
                        />
                        <Input
                          placeholder="Role *"
                          value={party.role}
                          onChange={(e) => updateParty(index, "role", e.target.value)}
                          className="h-12 rounded-2xl border-slate-200 bg-white"
                        />
                        <Input
                          placeholder="Email"
                          type="email"
                          value={party.email}
                          onChange={(e) => updateParty(index, "email", e.target.value)}
                          className="h-12 rounded-2xl border-slate-200 bg-white"
                        />
                        <Input
                          placeholder="Organization"
                          value={party.organization}
                          onChange={(e) => updateParty(index, "organization", e.target.value)}
                          className="h-12 rounded-2xl border-slate-200 bg-white"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-slate-900">Terms</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Define dates, value, and payment details.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Start Date *
                    </label>
                    <Input
                      type="date"
                      value={form.start_date}
                      onChange={(e) => updateField("start_date", e.target.value)}
                      className="h-12 rounded-2xl border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      End Date *
                    </label>
                    <Input
                      type="date"
                      value={form.end_date}
                      onChange={(e) => updateField("end_date", e.target.value)}
                      className="h-12 rounded-2xl border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Contract Value
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter contract value"
                      value={form.value}
                      onChange={(e) => updateField("value", e.target.value)}
                      className="h-12 rounded-2xl border-slate-200"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Payment Terms
                    </label>
                    <Input
                      placeholder="Eg: Net 30 days"
                      value={form.payment_terms}
                      onChange={(e) => updateField("payment_terms", e.target.value)}
                      className="h-12 rounded-2xl border-slate-200"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-slate-900">Workflow Settings</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Set how this contract should move through your approval flow.
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Approval Type
                    </label>
                    <select
                      value={form.approval_type}
                      onChange={(e) => updateField("approval_type", e.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                    >
                      {approvalOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                      Workflow Trigger
                    </label>
                    <select
                      value={form.workflow_trigger}
                      onChange={(e) => updateField("workflow_trigger", e.target.value)}
                      className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm text-slate-700 outline-none"
                    >
                      {triggerOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
                <div className="mb-6">
                  <h4 className="text-xl font-semibold text-slate-900">Tags</h4>
                  <p className="mt-1 text-sm text-slate-500">
                    Add tags to organize and search this contract easily.
                  </p>
                </div>

                <div className="flex flex-col gap-4 md:flex-row">
                  <Input
                    placeholder="Add a tag"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag();
                      }
                    }}
                    className="h-12 rounded-2xl border-slate-200"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    className="h-12 rounded-2xl"
                    onClick={addTag}
                  >
                    Add Tag
                  </Button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {form.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-2 text-sm font-medium text-violet-700"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-violet-700 hover:text-violet-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col justify-end gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-12 rounded-2xl"
                  onClick={() => navigate("/contracts")}
                >
                  Cancel
                </Button>

                <Button
                  type="submit"
                  className="h-12 rounded-2xl bg-violet-600 px-6 text-white hover:bg-violet-700"
                >
                  Create Contract
                </Button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}