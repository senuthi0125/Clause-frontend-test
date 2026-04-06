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
  ArrowRight,
  CheckCircle,
  Play,
  Clock,
  XCircle,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
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
import { useMemo, useState } from "react";

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

const workflows = [
  {
    id: "wf-001",
    name: "Vendor Approval Workflow",
    contract: "Vendor Services Agreement",
    status: "active",
    current_step: 2,
    total_steps: 4,
    updated_at: "Apr 05, 2026",
  },
  {
    id: "wf-002",
    name: "MSA Legal Review Workflow",
    contract: "Master Service Agreement",
    status: "completed",
    current_step: 4,
    total_steps: 4,
    updated_at: "Apr 03, 2026",
  },
  {
    id: "wf-003",
    name: "Employment Approval Chain",
    contract: "Employment Contract - Senior Engineer",
    status: "rejected",
    current_step: 2,
    total_steps: 3,
    updated_at: "Apr 01, 2026",
  },
  {
    id: "wf-004",
    name: "Confidentiality Review Flow",
    contract: "Confidentiality Agreement",
    status: "pending",
    current_step: 1,
    total_steps: 3,
    updated_at: "Mar 30, 2026",
  },
];

function getStatusStyles(status: string) {
  switch (status) {
    case "completed":
      return "bg-green-100 text-green-700";
    case "active":
      return "bg-blue-100 text-blue-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    case "active":
      return <Play className="h-4 w-4 text-blue-600" />;
    case "rejected":
      return <XCircle className="h-4 w-4 text-red-600" />;
    default:
      return <Clock className="h-4 w-4 text-amber-600" />;
  }
}

export default function WorkflowsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const filteredWorkflows = useMemo(() => {
    return workflows.filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(search.toLowerCase()) ||
        workflow.contract.toLowerCase().includes(search.toLowerCase()) ||
        workflow.status.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

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
                  <p className="text-xs text-slate-500">Workflow support chat</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested prompt
                </div>
                <p className="text-sm text-slate-700">
                  Show bottlenecks in current approval workflows and suggest next actions.
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
                <p className="text-sm text-slate-500">Approval and lifecycle tracking</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Workflows
                </h2>
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
                Workflow Tracker
              </h3>
              <p className="mt-2 text-lg text-slate-500">
                Monitor approval progress, identify blockers, and manage workflow states.
              </p>
            </div>

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardContent className="p-5">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search workflows by name, contract, or status..."
                    className="h-12 rounded-2xl border-slate-200 pl-11"
                  />
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4">
              {filteredWorkflows.map((workflow) => {
                const progress = Math.round(
                  (workflow.current_step / workflow.total_steps) * 100
                );

                return (
                  <Card
                    key={workflow.id}
                    className="cursor-pointer border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                    onClick={() => navigate(`/workflows/${workflow.id}`)}
                  >
                    <CardContent className="p-6">
                      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            {getStatusIcon(workflow.status)}
                            <h4 className="text-lg font-semibold text-slate-900">
                              {workflow.name}
                            </h4>
                            <span
                              className={cn(
                                "rounded-full px-3 py-1 text-xs font-medium",
                                getStatusStyles(workflow.status)
                              )}
                            >
                              {workflow.status}
                            </span>
                          </div>

                          <p className="text-sm text-slate-500">{workflow.contract}</p>

                          <div className="mt-4 space-y-2">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-slate-500">
                                Step {workflow.current_step} of {workflow.total_steps}
                              </span>
                              <span className="font-medium text-slate-700">
                                {progress}%
                              </span>
                            </div>

                            <div className="h-2.5 w-full rounded-full bg-slate-100">
                              <div
                                className="h-2.5 rounded-full bg-blue-600 transition-all"
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col items-start gap-3 xl:items-end">
                          <p className="text-sm text-slate-400">
                            Updated {workflow.updated_at}
                          </p>
                          <Button variant="outline" className="rounded-xl">
                            View Workflow
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {filteredWorkflows.length === 0 && (
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardContent className="py-16 text-center">
                    <h4 className="text-lg font-semibold text-slate-900">
                      No workflows found
                    </h4>
                    <p className="mt-2 text-sm text-slate-500">
                      Try a different search term.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}