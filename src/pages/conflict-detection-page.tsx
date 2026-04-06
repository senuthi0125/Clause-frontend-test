import { useMemo, useState } from "react";
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
  Search,
  Zap,
  CheckCircle,
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

const contracts = [
  {
    id: "c1",
    title: "Vendor Services Agreement",
    contract_type: "vendor",
    status: "Draft",
    risk_level: "high",
  },
  {
    id: "c2",
    title: "Master Service Agreement",
    contract_type: "service_agreement",
    status: "Active",
    risk_level: "medium",
  },
  {
    id: "c3",
    title: "Website Redesign Contract",
    contract_type: "service_agreement",
    status: "Review",
    risk_level: "low",
  },
  {
    id: "c4",
    title: "Data Processing Addendum",
    contract_type: "other",
    status: "Draft",
    risk_level: "medium",
  },
  {
    id: "c5",
    title: "Confidentiality Agreement",
    contract_type: "nda",
    status: "Active",
    risk_level: "low",
  },
  {
    id: "c6",
    title: "Employment Contract - Senior Engineer",
    contract_type: "employment",
    status: "Pending",
    risk_level: "medium",
  },
];

const mockResult = {
  total_conflicts: 3,
  overall_risk: "high",
  summary:
    "The selected contracts contain conflicting payment timelines, overlapping confidentiality obligations, and incompatible termination conditions.",
  contracts_analyzed: [
    { id: "c1", title: "Vendor Services Agreement" },
    { id: "c2", title: "Master Service Agreement" },
    { id: "c5", title: "Confidentiality Agreement" },
  ],
  conflicts: [
    {
      id: 1,
      severity: "high",
      conflict_type: "contradiction",
      description: "Payment due timelines are inconsistent across two contracts.",
      contract_a: "Vendor Services Agreement",
      contract_b: "Master Service Agreement",
      clause_a: "Invoices must be paid within 15 calendar days from receipt.",
      clause_b: "Client shall settle approved invoices within 45 business days.",
      recommendation:
        "Standardize payment terms across both agreements to avoid billing disputes.",
    },
    {
      id: 2,
      severity: "medium",
      conflict_type: "overlap",
      description: "Confidentiality duties duplicate and partially overlap.",
      contract_a: "Vendor Services Agreement",
      contract_b: "Confidentiality Agreement",
      clause_a:
        "Recipient must protect confidential materials for 2 years after termination.",
      clause_b:
        "Receiving party must preserve confidentiality for 5 years from disclosure.",
      recommendation:
        "Align confidentiality periods or clarify which agreement takes precedence.",
    },
    {
      id: 3,
      severity: "high",
      conflict_type: "incompatibility",
      description: "Termination for convenience terms are not compatible.",
      contract_a: "Master Service Agreement",
      contract_b: "Vendor Services Agreement",
      clause_a:
        "Either party may terminate with 30 days written notice without cause.",
      clause_b:
        "This agreement may only be terminated for material breach with cure period.",
      recommendation:
        "Clarify termination hierarchy and ensure both contracts use a compatible exit model.",
    },
  ],
};

function formatType(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRiskBadge(risk: string) {
  switch (risk) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-amber-100 text-amber-700";
    case "low":
      return "bg-green-100 text-green-700";
    case "critical":
      return "bg-red-100 text-red-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function getSeverityStyles(severity: string) {
  switch (severity) {
    case "high":
      return {
        badge: "bg-red-100 text-red-700",
        card: "border-red-200 bg-red-50/40",
        icon: "text-red-500",
      };
    case "medium":
      return {
        badge: "bg-amber-100 text-amber-700",
        card: "border-amber-200 bg-amber-50/40",
        icon: "text-amber-500",
      };
    default:
      return {
        badge: "bg-green-100 text-green-700",
        card: "border-green-200 bg-green-50/40",
        icon: "text-green-500",
      };
  }
}

function getConflictTypeLabel(type: string) {
  switch (type) {
    case "contradiction":
      return "Contradiction";
    case "overlap":
      return "Overlap";
    case "incompatibility":
      return "Incompatibility";
    case "ambiguity":
      return "Ambiguity";
    default:
      return formatType(type);
  }
}

export default function ConflictDetectionPage() {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [result, setResult] = useState<typeof mockResult | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedConflict, setExpandedConflict] = useState<number | null>(null);
  const [search, setSearch] = useState("");

  const filteredContracts = useMemo(() => {
    return contracts.filter(
      (contract) =>
        contract.title.toLowerCase().includes(search.toLowerCase()) ||
        contract.contract_type.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleAnalyze = async () => {
    if (selectedIds.length < 2) return;

    setAnalyzing(true);
    setResult(null);

    setTimeout(() => {
      const selectedContracts = contracts
        .filter((contract) => selectedIds.includes(contract.id))
        .map((contract) => ({
          id: contract.id,
          title: contract.title,
        }));

      setResult({
        ...mockResult,
        contracts_analyzed: selectedContracts,
      });
      setAnalyzing(false);
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
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

            <div className="m-4 rounded-[24px] border border-slate-200 bg-white p-5 text-slate-900 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100">
                  <Bot className="h-5 w-5 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold">Clause AI Assistant</p>
                  <p className="text-xs text-slate-500">Conflict support chat</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested prompt
                </div>
                <p className="text-sm text-slate-700">
                  Compare selected contracts and summarize the biggest legal risks.
                </p>
              </div>

              <Button className="mt-4 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                Open AI Chatbot
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-slate-50">
          <div className="border-b border-slate-200 bg-white px-5 py-4 md:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-slate-500">AI-powered comparison</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Conflict Detection
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  className="h-11 rounded-2xl bg-blue-600 px-5 text-white hover:bg-blue-700"
                  onClick={handleAnalyze}
                  disabled={selectedIds.length < 2 || analyzing}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  {analyzing
                    ? "Analyzing..."
                    : `Analyze ${selectedIds.length} Contract${
                        selectedIds.length !== 1 ? "s" : ""
                      }`}
                </Button>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
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
          </div>

          <div className="grid gap-6 p-5 md:p-7 xl:grid-cols-[360px_minmax(0,1fr)]">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Select Contracts</CardTitle>
                  <CardDescription>
                    Choose at least 2 contracts to compare for conflicting clauses.
                  </CardDescription>
                </div>
                <Badge variant="secondary" className="rounded-full">
                  {selectedIds.length} selected
                </Badge>
              </CardHeader>

              <CardContent>
                <div className="relative mb-4">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search contracts..."
                    className="h-11 rounded-2xl border-slate-200 pl-11"
                  />
                </div>

                {selectedIds.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {selectedIds.map((id) => {
                      const contract = contracts.find((item) => item.id === id);

                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700"
                        >
                          {contract?.title.slice(0, 22) || id}
                          <button
                            type="button"
                            onClick={() => toggleSelect(id)}
                            className="text-blue-700 hover:text-blue-900"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="max-h-[520px] space-y-2 overflow-y-auto pr-1">
                  {filteredContracts.map((contract) => {
                    const isSelected = selectedIds.includes(contract.id);

                    return (
                      <button
                        key={contract.id}
                        type="button"
                        onClick={() => toggleSelect(contract.id)}
                        className={cn(
                          "flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition",
                          isSelected
                            ? "border-blue-200 bg-blue-50"
                            : "border-transparent bg-slate-50 hover:border-slate-200 hover:bg-white"
                        )}
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-5 w-5 items-center justify-center rounded-md border-2",
                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-300 bg-white"
                          )}
                        >
                          {isSelected && <CheckCircle className="h-3.5 w-3.5" />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {contract.title}
                          </p>
                          <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                            <span>{formatType(contract.contract_type)}</span>
                            <span>•</span>
                            <span>{contract.status}</span>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1 text-[11px] font-medium",
                            getRiskBadge(contract.risk_level)
                          )}
                        >
                          {contract.risk_level}
                        </span>
                      </button>
                    );
                  })}

                  {filteredContracts.length === 0 && (
                    <div className="py-10 text-center text-sm text-slate-400">
                      No contracts found
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {!result && !analyzing && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="flex min-h-[320px] flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-amber-50">
                      <ShieldCheck className="h-9 w-9 text-amber-500" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      AI Conflict Detection
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-500">
                      Select 2 or more contracts and click Analyze to detect
                      contradictions, overlaps, ambiguous language, and incompatible
                      terms across agreements.
                    </p>
                  </CardContent>
                </Card>
              )}

              {analyzing && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="flex min-h-[320px] flex-col items-center justify-center text-center">
                    <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[24px] bg-blue-50">
                      <Zap className="h-9 w-9 animate-pulse text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-slate-900">
                      Analyzing Contracts
                    </h3>
                    <p className="mt-2 text-sm text-slate-500">
                      Comparing selected contracts for potential legal conflicts...
                    </p>
                  </CardContent>
                </Card>
              )}

              {result && !analyzing && (
                <>
                  <Card className="border border-slate-200 bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                        <div className="flex-1">
                          <div className="mb-3 flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-semibold text-slate-900">
                              Analysis Results
                            </h3>
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-semibold uppercase",
                                getRiskBadge(result.overall_risk)
                              )}
                            >
                              {result.overall_risk} risk
                            </span>
                          </div>

                          <p className="text-sm leading-relaxed text-slate-600">
                            {result.summary}
                          </p>
                        </div>

                        <div className="text-right">
                          <p className="text-4xl font-bold text-slate-900">
                            {result.total_conflicts}
                          </p>
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                            Conflict{result.total_conflicts !== 1 ? "s" : ""} found
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 border-t border-slate-100 pt-5">
                        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-400">
                          Contracts analyzed
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {result.contracts_analyzed.map((contract) => (
                            <span
                              key={contract.id}
                              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 text-xs text-slate-600"
                            >
                              <FileText className="h-3.5 w-3.5" />
                              {contract.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {result.total_conflicts === 0 ? (
                    <Card className="border border-slate-200 bg-white shadow-sm">
                      <CardContent className="flex min-h-[240px] flex-col items-center justify-center text-center">
                        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50">
                          <CheckCircle className="h-8 w-8 text-green-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-slate-900">
                          No Conflicts Detected
                        </h3>
                        <p className="mt-2 text-sm text-slate-500">
                          The selected contracts appear to be compatible.
                        </p>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">
                          Detected conflicts
                        </h3>
                      </div>

                      {result.conflicts.map((conflict) => {
                        const styles = getSeverityStyles(conflict.severity);
                        const isExpanded = expandedConflict === conflict.id;

                        return (
                          <Card
                            key={conflict.id}
                            className={cn(
                              "overflow-hidden border shadow-sm",
                              styles.card
                            )}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedConflict(isExpanded ? null : conflict.id)
                              }
                              className="w-full px-6 py-5 text-left"
                            >
                              <div className="flex items-start gap-4">
                                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-white">
                                  <AlertTriangle className={cn("h-5 w-5", styles.icon)} />
                                </div>

                                <div className="min-w-0 flex-1">
                                  <div className="mb-2 flex flex-wrap items-center gap-2">
                                    <span
                                      className={cn(
                                        "rounded-full px-3 py-1 text-xs font-medium",
                                        styles.badge
                                      )}
                                    >
                                      {conflict.severity}
                                    </span>
                                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                                      {getConflictTypeLabel(conflict.conflict_type)}
                                    </span>
                                  </div>

                                  <p className="text-sm font-semibold text-slate-900">
                                    {conflict.description}
                                  </p>
                                  <p className="mt-1 text-xs text-slate-500">
                                    {conflict.contract_a} ↔ {conflict.contract_b}
                                  </p>
                                </div>

                                <div className="mt-1 text-slate-400">
                                  {isExpanded ? (
                                    <ChevronUp className="h-4 w-4" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4" />
                                  )}
                                </div>
                              </div>
                            </button>

                            {isExpanded && (
                              <div className="border-t border-slate-200 bg-white px-6 py-5">
                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="rounded-2xl border border-red-100 bg-red-50/50 p-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-red-400">
                                      {conflict.contract_a}
                                    </p>
                                    <p className="text-sm leading-relaxed text-slate-700">
                                      "{conflict.clause_a}"
                                    </p>
                                  </div>

                                  <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-amber-500">
                                      {conflict.contract_b}
                                    </p>
                                    <p className="text-sm leading-relaxed text-slate-700">
                                      "{conflict.clause_b}"
                                    </p>
                                  </div>
                                </div>

                                <div className="mt-4 rounded-2xl border border-green-100 bg-green-50/50 p-4">
                                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-green-500">
                                    Recommendation
                                  </p>
                                  <p className="text-sm leading-relaxed text-slate-700">
                                    {conflict.recommendation}
                                  </p>
                                </div>
                              </div>
                            )}
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}