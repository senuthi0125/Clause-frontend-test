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
  ArrowLeft,
  CheckCircle,
  Circle,
  XCircle,
  Play,
  Clock,
} from "lucide-react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
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

const workflows = [
  {
    id: "wf-001",
    name: "Vendor Approval Workflow",
    status: "active",
    contract_id: "c-101",
    contract_name: "Vendor Services Agreement",
    current_step: 2,
    steps: [
      {
        step_number: 1,
        name: "Initial Submission",
        step_type: "request",
        status: "completed",
        comments: "Contract submitted by procurement team.",
        completed_at: "Apr 03, 2026 09:30",
      },
      {
        step_number: 2,
        name: "Legal Review",
        step_type: "review",
        status: "in_progress",
        comments: "Waiting for clause validation.",
        completed_at: "",
      },
      {
        step_number: 3,
        name: "Finance Approval",
        step_type: "approval",
        status: "pending",
        comments: "",
        completed_at: "",
      },
      {
        step_number: 4,
        name: "Final Execution",
        step_type: "execution",
        status: "pending",
        comments: "",
        completed_at: "",
      },
    ],
  },
  {
    id: "wf-002",
    name: "MSA Legal Review Workflow",
    status: "completed",
    contract_id: "c-102",
    contract_name: "Master Service Agreement",
    current_step: 4,
    steps: [
      {
        step_number: 1,
        name: "Submission",
        step_type: "request",
        status: "completed",
        comments: "Received from business team.",
        completed_at: "Apr 01, 2026 10:00",
      },
      {
        step_number: 2,
        name: "Legal Review",
        step_type: "review",
        status: "completed",
        comments: "Reviewed and cleared.",
        completed_at: "Apr 02, 2026 13:15",
      },
      {
        step_number: 3,
        name: "Management Approval",
        step_type: "approval",
        status: "completed",
        comments: "Approved by management.",
        completed_at: "Apr 03, 2026 11:45",
      },
      {
        step_number: 4,
        name: "Execution",
        step_type: "execution",
        status: "completed",
        comments: "Contract signed by both parties.",
        completed_at: "Apr 03, 2026 15:20",
      },
    ],
  },
  {
    id: "wf-003",
    name: "Employment Approval Chain",
    status: "rejected",
    contract_id: "c-103",
    contract_name: "Employment Contract - Senior Engineer",
    current_step: 2,
    steps: [
      {
        step_number: 1,
        name: "Submission",
        step_type: "request",
        status: "completed",
        comments: "Draft uploaded by HR.",
        completed_at: "Mar 29, 2026 09:00",
      },
      {
        step_number: 2,
        name: "Legal Review",
        step_type: "review",
        status: "rejected",
        comments: "Termination clause needs revision.",
        completed_at: "Mar 30, 2026 14:10",
      },
      {
        step_number: 3,
        name: "Executive Approval",
        step_type: "approval",
        status: "skipped",
        comments: "",
        completed_at: "",
      },
    ],
  },
];

function formatType(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

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

function StepIcon({ status }: { status: string }) {
  switch (status) {
    case "completed":
      return <CheckCircle className="h-5.5 w-5.5 text-green-500" />;
    case "in_progress":
      return <Play className="h-5.5 w-5.5 text-blue-500" />;
    case "rejected":
      return <XCircle className="h-5.5 w-5.5 text-red-500" />;
    case "skipped":
      return <Circle className="h-5.5 w-5.5 text-slate-300" />;
    default:
      return <Clock className="h-5.5 w-5.5 text-amber-500" />;
  }
}

export default function WorkflowDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const workflow = useMemo(() => {
    return workflows.find((item) => item.id === id) ?? workflows[0];
  }, [id]);

  const [currentWorkflow, setCurrentWorkflow] = useState(workflow);
  const [comments, setComments] = useState("");
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  const completedCount = currentWorkflow.steps.filter(
    (step) => step.status === "completed"
  ).length;
  const progressPct = Math.round(
    (completedCount / currentWorkflow.steps.length) * 100
  );

  const isActive = currentWorkflow.status === "active";

  const handleAdvance = () => {
    const nextStepIndex = currentWorkflow.steps.findIndex(
      (step) => step.status === "in_progress"
    );

    if (nextStepIndex === -1) {
      setShowAdvanceModal(false);
      setComments("");
      return;
    }

    const updatedSteps = [...currentWorkflow.steps];
    updatedSteps[nextStepIndex] = {
      ...updatedSteps[nextStepIndex],
      status: "completed",
      comments: comments || "Step completed successfully.",
      completed_at: "Apr 06, 2026 11:20",
    };

    if (updatedSteps[nextStepIndex + 1]) {
      updatedSteps[nextStepIndex + 1] = {
        ...updatedSteps[nextStepIndex + 1],
        status: "in_progress",
      };
    }

    const allCompleted = updatedSteps.every((step) => step.status === "completed");

    setCurrentWorkflow((prev) => ({
      ...prev,
      steps: updatedSteps,
      status: allCompleted ? "completed" : "active",
      current_step: allCompleted ? prev.steps.length : prev.current_step + 1,
    }));

    setShowAdvanceModal(false);
    setComments("");
  };

  const handleReject = () => {
    const currentIndex = currentWorkflow.steps.findIndex(
      (step) => step.status === "in_progress"
    );

    if (currentIndex === -1) {
      setShowRejectModal(false);
      setComments("");
      return;
    }

    const updatedSteps = [...currentWorkflow.steps];
    updatedSteps[currentIndex] = {
      ...updatedSteps[currentIndex],
      status: "rejected",
      comments: comments || "Workflow rejected.",
      completed_at: "Apr 06, 2026 11:20",
    };

    for (let i = currentIndex + 1; i < updatedSteps.length; i++) {
      updatedSteps[i] = {
        ...updatedSteps[i],
        status: "skipped",
      };
    }

    setCurrentWorkflow((prev) => ({
      ...prev,
      steps: updatedSteps,
      status: "rejected",
    }));

    setShowRejectModal(false);
    setComments("");
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
                  <p className="text-xs text-slate-500">Workflow support chat</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested prompt
                </div>
                <p className="text-sm text-slate-700">
                  Explain the current workflow bottleneck and next approval step.
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
            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex items-start gap-4">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="mt-1 rounded-xl"
                  onClick={() => navigate("/workflows")}
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>

                <div>
                  <p className="text-sm text-slate-500">Workflow detail</p>
                  <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                    {currentWorkflow.name}
                  </h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-medium",
                        getStatusStyles(currentWorkflow.status)
                      )}
                    >
                      {currentWorkflow.status}
                    </span>
                    <span className="text-xs text-slate-500">
                      Step {currentWorkflow.current_step} of {currentWorkflow.steps.length}
                    </span>
                  </div>
                </div>
              </div>

              {isActive && (
                <div className="flex gap-2">
                  <Button
                    className="rounded-xl bg-green-600 text-white hover:bg-green-700"
                    onClick={() => setShowAdvanceModal(true)}
                  >
                    <ChevronRight className="mr-2 h-4 w-4" />
                    Advance
                  </Button>
                  <Button
                    variant="destructive"
                    className="rounded-xl"
                    onClick={() => setShowRejectModal(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6 p-5 md:p-7">
            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Progress</CardTitle>
                  <CardDescription>
                    Workflow completion based on finished steps.
                  </CardDescription>
                </div>
                <span className="text-2xl font-bold text-blue-600">{progressPct}%</span>
              </CardHeader>
              <CardContent>
                <div className="h-3 w-full rounded-full bg-slate-100">
                  <div
                    className="h-3 rounded-full bg-blue-600 transition-all"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-3 flex justify-between text-xs text-slate-500">
                  <span>{completedCount} completed</span>
                  <span>{currentWorkflow.steps.length - completedCount} remaining</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Workflow Steps</CardTitle>
                <CardDescription>
                  Track review, approval, rejection, and execution stages.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <div className="absolute bottom-4 left-[19px] top-4 w-[2px] bg-slate-100" />
                  <div className="space-y-2">
                    {currentWorkflow.steps.map((step, index) => (
                      <div
                        key={index}
                        className={cn(
                          "relative flex items-start gap-4 rounded-2xl border p-4 transition",
                          step.status === "in_progress"
                            ? "border-blue-200 bg-blue-50"
                            : "border-transparent bg-white hover:bg-slate-50"
                        )}
                      >
                        <div className="relative z-10 rounded-full bg-white p-0.5">
                          <StepIcon status={step.status} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">
                                {step.step_number}. {step.name}
                              </p>
                              <p className="mt-1 text-xs text-slate-500">
                                {formatType(step.step_type)}
                              </p>
                            </div>

                            <span
                              className={cn(
                                "w-fit rounded-full px-3 py-1 text-xs font-medium",
                                step.status === "completed" && "bg-green-100 text-green-700",
                                step.status === "in_progress" && "bg-blue-100 text-blue-700",
                                step.status === "rejected" && "bg-red-100 text-red-700",
                                step.status === "skipped" && "bg-slate-100 text-slate-600",
                                step.status === "pending" && "bg-amber-100 text-amber-700"
                              )}
                            >
                              {formatType(step.status)}
                            </span>
                          </div>

                          {step.comments && (
                            <div className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-sm italic text-slate-600">
                              "{step.comments}"
                            </div>
                          )}

                          {step.completed_at && (
                            <p className="mt-2 text-xs text-slate-400">
                              Completed {step.completed_at}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card
              className="cursor-pointer border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              onClick={() => navigate("/contracts")}
            >
              <CardContent className="flex items-center justify-between p-6">
                <div>
                  <h4 className="text-lg font-semibold text-slate-900">
                    Associated Contract
                  </h4>
                  <p className="mt-1 text-sm text-slate-500">
                    {currentWorkflow.contract_name}
                  </p>
                </div>

                <Button variant="outline" className="rounded-xl">
                  View Contract
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>

      {showAdvanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Advance Workflow</h3>
            <p className="mt-2 text-sm text-slate-500">
              Add an optional comment before moving this workflow to the next step.
            </p>

            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Add notes for this step..."
              className="mt-4 min-h-[130px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setShowAdvanceModal(false)}>
                Cancel
              </Button>
              <Button className="rounded-xl bg-green-600 text-white hover:bg-green-700" onClick={handleAdvance}>
                Advance
              </Button>
            </div>
          </div>
        </div>
      )}

      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-6 shadow-xl">
            <h3 className="text-xl font-semibold text-slate-900">Reject Workflow</h3>
            <p className="mt-2 text-sm text-slate-500">
              Add a reason for rejection before closing this workflow.
            </p>

            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Reason for rejection..."
              className="mt-4 min-h-[130px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setShowRejectModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" className="rounded-xl" onClick={handleReject}>
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}