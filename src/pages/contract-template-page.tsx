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
  Briefcase,
  FileSignature,
  UsersRound,
  Shield,
  Building2,
  Handshake,
  Layers3,
  Upload,
  PlusCircle,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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

const templates = [
  {
    title: "Service Agreement",
    value: "service_agreement",
    description: "Use for service delivery, scope, fees, and obligations.",
    icon: Briefcase,
  },
  {
    title: "NDA",
    value: "nda",
    description: "Protect confidential information between parties.",
    icon: Shield,
  },
  {
    title: "Employment",
    value: "employment",
    description: "Create employee contracts with role and compensation terms.",
    icon: UsersRound,
  },
  {
    title: "Vendor",
    value: "vendor",
    description: "Define supply, payment, and service expectations with vendors.",
    icon: Building2,
  },
  {
    title: "Licensing",
    value: "licensing",
    description: "Manage IP rights, usage permissions, and restrictions.",
    icon: FileSignature,
  },
  {
    title: "Partnership",
    value: "partnership",
    description: "Capture shared responsibilities and commercial terms.",
    icon: Handshake,
  },
  {
    title: "Other",
    value: "other",
    description: "Start from a generic structure for custom agreements.",
    icon: Layers3,
  },
];

export default function ContractTemplatePage() {
  const navigate = useNavigate();

  const goToTemplate = (template: string) => {
    navigate(`/contracts/create?template=${template}`);
  };

  const goToBlank = () => {
    navigate("/contracts/create");
  };

  const goToUpload = () => {
    navigate("/contracts/create?mode=upload");
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
                  <p className="text-xs text-slate-500">Template support chat</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested prompt
                </div>
                <p className="text-sm text-slate-700">
                  Recommend the best contract template for a vendor onboarding flow.
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
                  onClick={() => navigate("/contracts")}
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

          <div className="space-y-8 p-5 md:p-7">
            <div>
              <h3 className="text-4xl font-semibold tracking-tight text-slate-900">
                Choose how to start
              </h3>
              <p className="mt-2 text-lg text-slate-500">
                Start from a template, create a blank contract, or upload an existing file.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <button
                type="button"
                onClick={goToBlank}
                className="rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
                  <PlusCircle className="h-6 w-6 text-violet-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900">Create from Scratch</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Start with a blank contract form and define all terms manually.
                </p>
              </button>

              <button
                type="button"
                onClick={goToUpload}
                className="rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100">
                  <Upload className="h-6 w-6 text-sky-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900">Upload Existing Contract</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Upload a draft or signed contract and continue editing details.
                </p>
              </button>

              <div className="rounded-[28px] border border-violet-200 bg-violet-50 p-6 shadow-sm">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white">
                  <Sparkles className="h-6 w-6 text-violet-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-900">Use a Template</h4>
                <p className="mt-2 text-sm text-slate-600">
                  Pick a ready-made structure and customize it for your use case.
                </p>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm md:p-7">
              <div className="mb-6">
                <h4 className="text-2xl font-semibold text-slate-900">Contract Templates</h4>
                <p className="mt-2 text-sm text-slate-500">
                  Select a template below to prefill the contract creation form.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((template) => {
                  const Icon = template.icon;
                  return (
                    <button
                      key={template.value}
                      type="button"
                      onClick={() => goToTemplate(template.value)}
                      className="rounded-[24px] border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-violet-200 hover:bg-violet-50"
                    >
                      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm">
                        <Icon className="h-6 w-6 text-violet-600" />
                      </div>

                      <h5 className="text-lg font-semibold text-slate-900">
                        {template.title}
                      </h5>
                      <p className="mt-2 text-sm text-slate-500">
                        {template.description}
                      </p>

                      <div className="mt-5">
                        <span className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">
                          Use Template
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}