import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Users,
  GitBranch,
  Search,
  Plus,
  Filter,
  ChevronRight,
  Bot,
  Sparkles,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
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

const contracts = [
  {
    name: "Office Lease Renewal - Downtown HQ",
    company: "Clause Inc.",
    type: "Other",
    status: "Draft",
    stage: "Request",
    risk: "High",
    value: "$360,000",
    end: "Jul 01, 2029",
  },
  {
    name: "Strategic Partnership - InnovateCo",
    company: "Clause Inc.",
    type: "Partnership",
    status: "Draft",
    stage: "Authoring",
    risk: "-",
    value: "$500,000",
    end: "May 01, 2029",
  },
  {
    name: "TechBridge Licensing Agreement",
    company: "Clause Inc.",
    type: "Licensing",
    status: "Draft",
    stage: "Approval",
    risk: "Medium",
    value: "$120,000",
    end: "Apr 01, 2028",
  },
  {
    name: "DataSecure Vendor Agreement",
    company: "Clause Inc.",
    type: "Vendor",
    status: "Draft",
    stage: "Review",
    risk: "High",
    value: "$75,000",
    end: "Sep 15, 2026",
  },
  {
    name: "Senior Developer Employment Contract",
    company: "Clause Inc.",
    type: "Employment",
    status: "Active",
    stage: "Execution",
    risk: "Low",
    value: "$145,000",
    end: "Mar 01, 2027",
  },
];

function badgeStyle(type: string) {
  switch (type) {
    case "High":
      return "bg-red-100 text-red-600";
    case "Medium":
      return "bg-yellow-100 text-yellow-700";
    case "Low":
      return "bg-green-100 text-green-600";
    case "Request":
    case "Authoring":
    case "Approval":
    case "Execution":
    case "Review":
      return "bg-purple-100 text-purple-600";
    case "Draft":
      return "bg-slate-100 text-slate-600";
    case "Active":
      return "bg-green-100 text-green-600";
    default:
      return "bg-slate-100 text-slate-500";
  }
}

export default function ContractsPage() {
  const navigate = useNavigate();

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
                  <p className="text-xs text-slate-500">Contracts support chat</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested prompt
                </div>
                <p className="text-sm text-slate-700">
                  Show contracts that need review and suggest the next action.
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
              <div>
                <p className="text-sm text-slate-500">Contracts workspace</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Contracts
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button
                  className="h-11 rounded-2xl bg-violet-600 px-5 text-white hover:bg-violet-700"
                  onClick={() => navigate("/contracts/new")}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  New Contract
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

          <div className="space-y-6 p-5 md:p-7">
            <div>
              <h3 className="text-4xl font-semibold tracking-tight text-slate-900">
                Contracts
              </h3>
              <p className="mt-2 text-lg text-slate-500">8 total contracts</p>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search contracts by title, party, tag..."
                    className="h-14 rounded-2xl border-slate-200 bg-white pl-12 text-base shadow-none"
                  />
                </div>

                <Button
                  variant="outline"
                  className="h-14 rounded-2xl border-slate-200 px-6 text-base"
                >
                  <Filter className="mr-2 h-5 w-5" />
                  Filters
                </Button>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-white p-4 shadow-sm md:p-7">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-[0.14em] text-slate-400">
                      <th className="pb-5 font-semibold">Contract</th>
                      <th className="pb-5 font-semibold">Type</th>
                      <th className="pb-5 font-semibold">Status</th>
                      <th className="pb-5 font-semibold">Stage</th>
                      <th className="pb-5 font-semibold">Risk</th>
                      <th className="pb-5 font-semibold">Value</th>
                      <th className="pb-5 font-semibold">End Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {contracts.map((contract, index) => (
                      <tr
                        key={`${contract.name}-${index}`}
                        className="border-b border-slate-100 last:border-b-0"
                      >
                        <td className="py-6 pr-6">
                          <div>
                            <p className="text-[17px] font-semibold text-slate-900">
                              {contract.name}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">{contract.company}</p>
                          </div>
                        </td>

                        <td className="py-6 pr-6 text-base text-slate-700">{contract.type}</td>

                        <td className="py-6 pr-6">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-4 py-1.5 text-sm font-medium",
                              badgeStyle(contract.status)
                            )}
                          >
                            {contract.status}
                          </span>
                        </td>

                        <td className="py-6 pr-6">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-4 py-1.5 text-sm font-medium",
                              badgeStyle(contract.stage)
                            )}
                          >
                            {contract.stage}
                          </span>
                        </td>

                        <td className="py-6 pr-6">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-4 py-1.5 text-sm font-medium",
                              badgeStyle(contract.risk)
                            )}
                          >
                            {contract.risk}
                          </span>
                        </td>

                        <td className="py-6 pr-6 text-[17px] font-medium text-slate-800">
                          {contract.value}
                        </td>

                        <td className="py-6 text-[17px] text-slate-700">{contract.end}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}