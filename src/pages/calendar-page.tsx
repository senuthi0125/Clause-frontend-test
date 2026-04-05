import {
  LayoutDashboard,
  CalendarDays,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Users,
  GitBranch,
  Bot,
  Search,
  ChevronRight,
  Plus,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Sparkles,
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

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const calendarDays = [
  { day: 1, muted: true, title: "Labour Day", tone: "green" },
  { day: 2, muted: false, title: "Vendor deadline", tone: "blue" },
  { day: 3, muted: false },
  { day: 4, muted: false },
  { day: 5, muted: false, title: "Clause review", tone: "green" },
  { day: 6, muted: false },
  { day: 7, muted: false },
  { day: 8, muted: false },
  { day: 9, muted: false, title: "Reminder sent", tone: "green" },
  { day: 10, muted: false },
  { day: 11, muted: false },
  { day: 12, muted: false, title: "Renewal alert", tone: "green" },
  { day: 13, muted: false },
  { day: 14, muted: false },
  { day: 15, muted: true },
  { day: 16, muted: true },
  { day: 17, muted: false, title: "Tax filing", tone: "red" },
  { day: 18, muted: false },
  { day: 19, muted: false },
  { day: 20, muted: false },
  { day: 21, muted: false },
  { day: 22, muted: true },
  { day: 23, muted: true },
  { day: 24, muted: false },
  { day: 25, muted: false },
  { day: 26, muted: false },
  { day: 27, muted: false, tone: "blue" },
  { day: 28, muted: false, tone: "blue" },
  { day: 29, muted: true, tone: "blue" },
  { day: 30, muted: true, title: "Beach day", tone: "blue" },
  { day: 31, muted: false, title: "Contract holiday", tone: "green" },
];

const upcomingAlerts = [
  {
    title: "Vendor agreement renewal",
    date: "May 5",
    type: "Renewal",
  },
  {
    title: "Employment contract review",
    date: "May 12",
    type: "Review",
  },
  {
    title: "MSA payment milestone",
    date: "May 17",
    type: "Deadline",
  },
  {
    title: "NDA expiry reminder",
    date: "May 31",
    type: "Expiry",
  },
];

function getDayStyles(tone?: string) {
  switch (tone) {
    case "green":
      return "bg-emerald-50";
    case "red":
      return "bg-rose-50";
    case "blue":
      return "bg-sky-50";
    default:
      return "bg-white";
  }
}

export default function CalendarPage() {
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
                      <span
                        className={cn("h-2.5 w-2.5 rounded-full", item.color)}
                      />
                      <div>
                        <p className="text-sm text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-400">
                          Tracked repository
                        </p>
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
                  <p className="text-xs text-slate-500">Calendar support chat</p>
                </div>
              </div>

              <div className="rounded-2xl bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-500">
                  <Sparkles className="h-3.5 w-3.5" />
                  Suggested prompt
                </div>
                <p className="text-sm text-slate-700">
                  Show upcoming renewals and alert me about critical contract dates.
                </p>
              </div>

              <Button className="mt-4 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800">
                Open AI Chatbot
              </Button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 bg-gradient-to-b from-white to-slate-50">
          <div className="border-b border-slate-200 px-5 py-4 md:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-slate-500">Calendar updated</p>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 md:text-3xl">
                  Contract calendar
                </h2>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-[260px]">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    placeholder="Search events, contracts, alerts..."
                    className="h-11 rounded-2xl border-slate-200 bg-white pl-10 shadow-sm"
                  />
                </div>

                <Button className="h-11 rounded-2xl">
                  <Plus className="mr-2 h-4 w-4" />
                  Add event
                </Button>

                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>SA</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-900">
                      Senuthi A.
                    </p>
                    <p className="text-xs text-slate-500">Legal Ops / Admin</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5 md:p-7">
            <section className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
              <Card className="border border-slate-200 bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                    <CardTitle className="text-xl">May 2026</CardTitle>
                    <CardDescription>
                      Contract deadlines, renewals, and reminders
                    </CardDescription>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" className="rounded-xl">
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-xl">
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-7 border-b border-slate-200">
                    {weekDays.map((day) => (
                      <div
                        key={day}
                        className="py-3 text-center text-sm font-medium text-slate-500"
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-7">
                    {calendarDays.map((item) => (
                      <div
                        key={item.day}
                        className={cn(
                          "min-h-[110px] border-b border-r border-slate-200 p-3",
                          getDayStyles(item.tone)
                        )}
                      >
                        <p
                          className={cn(
                            "text-sm font-medium",
                            item.muted ? "text-slate-400" : "text-slate-800"
                          )}
                        >
                          {item.day}
                        </p>

                        {item.title && (
                          <div className="mt-3">
                            <div className="rounded-xl bg-white/70 px-2 py-1 text-[11px] text-slate-600 shadow-sm">
                              {item.title}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Upcoming alerts</CardTitle>
                    <CardDescription>
                      Important contract-related dates this month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {upcomingAlerts.map((item) => (
                        <div
                          key={item.title}
                          className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-medium text-slate-900">
                                {item.title}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                {item.date}
                              </p>
                            </div>
                            <Badge className="rounded-full bg-slate-900 text-white hover:bg-slate-900">
                              {item.type}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-slate-200 bg-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-lg">Google Calendar sync</CardTitle>
                    <CardDescription>
                      Connect external events and send deadline notifications
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-2xl bg-indigo-50 p-4">
                      <p className="text-sm font-medium text-indigo-950">
                        Planned integration
                      </p>
                      <p className="mt-2 text-sm text-indigo-900/80">
                        Sync contract renewals, approval deadlines, review dates,
                        and reminders with Google Calendar so users receive alerts
                        on time.
                      </p>

                      <Button className="mt-4 rounded-xl">
                        Connect Google Calendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}