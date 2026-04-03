import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  ShieldAlert,
  Settings,
  Users,
  Bell,
  Search,
  ChevronRight,
  Clock3,
  TrendingUp,
  AlertTriangle,
  CircleCheckBig,
  MoreHorizontal,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Calendar", icon: CalendarDays },
  { label: "Contracts", icon: FileText },
  { label: "AI Analysis", icon: ShieldAlert },
  { label: "Admin", icon: Users },
  { label: "Settings", icon: Settings },
];

const contractGroups = [
  { name: "Master Service Agreements", count: 18, color: "bg-orange-400" },
  { name: "Vendor Contracts", count: 9, color: "bg-emerald-400" },
  { name: "Employment Contracts", count: 14, color: "bg-violet-400" },
  { name: "NDAs", count: 22, color: "bg-sky-400" },
];

const statCards = [
  {
    title: "Total Contracts",
    value: "128",
    change: "+12.4%",
    description: "Across all repositories",
    icon: FileText,
  },
  {
    title: "Active Contracts",
    value: "84",
    change: "+4.2%",
    description: "Currently in force",
    icon: CircleCheckBig,
  },
  {
    title: "Pending Approvals",
    value: "11",
    change: "-2.1%",
    description: "Awaiting stakeholder action",
    icon: Clock3,
  },
  {
    title: "High Risk Items",
    value: "7",
    change: "+1.8%",
    description: "Need immediate review",
    icon: AlertTriangle,
  },
];

const dueDocuments = [
  {
    title: "Vendor Agreement renewal",
    subtitle: "Renews in 5 days",
    badge: "Soon",
  },
  {
    title: "Website redesign service agreement",
    subtitle: "Review due Thursday",
    badge: "Review",
  },
  {
    title: "Employment contract amendment",
    subtitle: "Approval due Monday",
    badge: "Approval",
  },
  {
    title: "Maintenance agreement",
    subtitle: "Reminder sent today",
    badge: "Reminder",
  },
];

const approvalTrend = [
  { month: "Jan", approvals: 14 },
  { month: "Feb", approvals: 21 },
  { month: "Mar", approvals: 18 },
  { month: "Apr", approvals: 24 },
  { month: "May", approvals: 15 },
  { month: "Jun", approvals: 20 },
  { month: "Jul", approvals: 19 },
  { month: "Aug", approvals: 22 },
  { month: "Sep", approvals: 17 },
  { month: "Oct", approvals: 26 },
  { month: "Nov", approvals: 16 },
  { month: "Dec", approvals: 23 },
];

const riskData = [
  { name: "Low", value: 52, fill: "#4f46e5" },
  { name: "Medium", value: 31, fill: "#a5b4fc" },
  { name: "High", value: 17, fill: "#e5e7eb" },
];

function StatCard({
  title,
  value,
  change,
  description,
  icon: Icon,
}: {
  title: string;
  value: string;
  change: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="border-0 bg-white/70 shadow-sm backdrop-blur-sm">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">{title}</p>
            <div className="mt-2 flex items-end gap-2">
              <h3 className="text-3xl font-semibold tracking-tight text-slate-900">
                {value}
              </h3>
              <span className="mb-1 text-xs font-medium text-slate-500">
                {change}
              </span>
            </div>
            <p className="mt-2 text-xs text-slate-500">{description}</p>
          </div>
          <div className="rounded-2xl bg-slate-900 p-2.5 text-white shadow-sm">
            <Icon className="h-4 w-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const totalRisk = riskData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="min-h-screen bg-slate-950 p-4 md:p-6">
      <div className="mx-auto grid min-h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 gap-4 rounded-[28px] bg-slate-100 p-3 shadow-2xl lg:grid-cols-[280px_minmax(0,1fr)] lg:p-4">
        <aside className="rounded-[24px] bg-slate-900 text-slate-100 shadow-xl">
          <div className="flex h-full flex-col">
            <div className="border-b border-white/10 px-6 py-6">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-orange-400 via-blue-500 to-emerald-400 text-sm font-bold text-white">
                  C
                </div>
                <div>
                  <h1 className="text-2xl font-semibold tracking-tight">
                    clause
                  </h1>
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
                    <button
                      key={item.label}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                        item.active
                          ? "bg-white text-slate-900 shadow-sm"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </button>
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
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-100">
                <Bell className="h-5 w-5 text-amber-500" />
              </div>
              <h3 className="font-semibold">Need a faster review cycle?</h3>
              <p className="mt-2 text-sm text-slate-500">
                Use AI clause analysis and approval routing to reduce manual
                follow-ups.
              </p>
              <Button className="mt-4 w-full rounded-xl">Create Contract</Button>
            </div>
          </div>
        </aside>

        <main className="overflow-hidden rounded-[24px] bg-gradient-to-b from-white to-slate-50 shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4 md:px-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm text-slate-500">Welcome back</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Contract operations overview
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[260px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search contracts, parties, clauses..."
                    className="h-11 rounded-2xl border-slate-200 bg-white pl-10 shadow-sm"
                  />
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>SA</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-900">Senuthi A.</p>
                    <p className="text-xs text-slate-500">Legal Ops / Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 md:p-7">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {statCards.map((card) => (
                <StatCard key={card.title} {...card} />
              ))}
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
              <Card className="border-0 bg-white/80 shadow-sm">
                <CardHeader className="flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">
                      Upcoming and due documents
                    </CardTitle>
                    <CardDescription>
                      Deadlines, renewals, and contracts that need action this week.
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" className="rounded-xl">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {dueDocuments.map((item) => (
                      <div
                        key={item.title}
                        className="flex items-start justify-between gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 px-4 py-4"
                      >
                        <div className="flex items-start gap-3">
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                          <div>
                            <p className="font-medium text-slate-900">{item.title}</p>
                            <p className="mt-1 text-sm text-slate-500">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>
                        <Badge className="rounded-full bg-slate-900 text-white hover:bg-slate-900">
                          {item.badge}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-white/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Risk distribution</CardTitle>
                  <CardDescription>
                    AI-generated contract risk summary across your repository.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center gap-5 md:flex-row md:items-center md:justify-between xl:flex-col xl:items-center">
                    <div className="relative h-64 w-full max-w-[280px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={riskData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={70}
                            outerRadius={96}
                            paddingAngle={6}
                            cornerRadius={12}
                          >
                            {riskData.map((entry) => (
                              <Cell key={entry.name} fill={entry.fill} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                          Total
                        </p>
                        <p className="text-3xl font-semibold text-slate-900">
                          {totalRisk}
                        </p>
                        <p className="text-sm text-slate-500">Analysed contracts</p>
                      </div>
                    </div>

                    <div className="w-full space-y-3">
                      {riskData.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3"
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className="h-3 w-3 rounded-full"
                              style={{ backgroundColor: item.fill }}
                            />
                            <span className="text-sm font-medium text-slate-700">
                              {item.name} risk
                            </span>
                          </div>
                          <span className="text-sm text-slate-500">{item.value}%</span>
                        </div>
                      ))}

                      <div className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-950">
                        <div className="flex items-center gap-2 font-medium">
                          <TrendingUp className="h-4 w-4" />
                          Cross-contract conflict detection ready
                        </div>
                        <p className="mt-2 text-indigo-900/80">
                          Surface contradictory clauses by comparing new submissions
                          against historical agreements.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section>
              <Card className="border-0 bg-white/80 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Monthly contract approvals
                  </CardTitle>
                  <CardDescription>
                    Approval activity trend for the current contract portfolio.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[320px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={approvalTrend} barSize={24}>
                        <CartesianGrid vertical={false} strokeDasharray="3 3" />
                        <XAxis dataKey="month" tickLine={false} axisLine={false} />
                        <YAxis tickLine={false} axisLine={false} />
                        <Tooltip />
                        <Bar
                          dataKey="approvals"
                          radius={[12, 12, 0, 0]}
                          fill="#818cf8"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}