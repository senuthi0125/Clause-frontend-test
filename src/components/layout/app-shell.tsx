import { Link, useLocation } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Users,
  ScrollText,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";

type ContractGroup = {
  name: string;
  count: number;
};

type AppShellProps = {
  title: string;
  subtitle?: string;
  contractGroups?: ContractGroup[];
  actions?: React.ReactNode;
  children: React.ReactNode;
};

function getInitials(title?: string) {
  if (!title) return "C";
  return title.trim().charAt(0).toUpperCase() || "C";
}

export function AppShell({
  title,
  subtitle,
  contractGroups = [],
  actions,
  children,
}: AppShellProps) {
  const location = useLocation();
  const { user } = useUser();

  const role = String(
    user?.publicMetadata?.role || user?.unsafeMetadata?.role || ""
  )
    .trim()
    .toLowerCase();

  const isAdmin = role === "admin";

  const mainNavigation = [
    {
      label: "Dashboard",
      href: "/",
      icon: LayoutDashboard,
    },
    {
      label: "Contracts",
      href: "/contracts",
      icon: FileText,
    },
    {
      label: "AI Analysis",
      href: "/ai-analysis",
      icon: Sparkles,
    },
    {
      label: "Conflict Detection",
      href: "/conflict-detection",
      icon: Shield,
    },
    {
      label: "Calendar",
      href: "/calendar",
      icon: CalendarDays,
    },
    {
      label: "Risk Analysis",
      href: "/risk-analysis",
      icon: ShieldAlert,
    },
  ];

  const adminNavigation = [
    {
      label: "Admin Dashboard",
      href: "/admin",
      icon: LockKeyhole,
    },
    {
      label: "User Management",
      href: "/admin/users",
      icon: Users,
    },
    {
      label: "Approvals",
      href: "/admin/approvals",
      icon: CheckCheck,
    },
    {
      label: "Audit Logs",
      href: "/admin/audit",
      icon: ScrollText,
    },
    {
      label: "Notifications & Alerts",
      href: "/admin/notifications",
      icon: Bell,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] shrink-0 bg-[#07153A] text-white lg:flex lg:flex-col">
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-400 via-blue-500 to-cyan-400 text-lg font-semibold text-white">
                {getInitials(title)}
              </div>

              <div className="min-w-0">
                <p className="truncate text-[16px] font-semibold tracking-tight">
                  clause
                </p>
                <p className="text-xs text-blue-100/80">
                  Contract lifecycle workspace
                </p>
              </div>
            </div>
          </div>

          <nav className="overflow-y-auto px-3 py-4">
            <div className="space-y-2">
              {mainNavigation.map((item) => {
                const isActive =
                  item.href === "/"
                    ? location.pathname === item.href
                    : location.pathname.startsWith(item.href);

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-[20px] px-4 py-3 text-[14px] transition",
                      isActive
                        ? "bg-white text-slate-950 shadow-sm"
                        : "text-blue-50 hover:bg-white/8"
                    )}
                  >
                    <Icon className="h-[18px] w-[18px] shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {isAdmin ? (
              <div className="mt-8">
                <p className="px-3 text-[11px] uppercase tracking-[0.28em] text-blue-100/65">
                  Admin
                </p>

                <div className="mt-3 space-y-2">
                  {adminNavigation.map((item) => {
                    const isActive = location.pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                      <Link
                        key={item.href}
                        to={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-[20px] px-4 py-3 text-[14px] transition",
                          isActive
                            ? "bg-white text-slate-950 shadow-sm"
                            : "text-blue-50 hover:bg-white/8"
                        )}
                      >
                        <Icon className="h-[18px] w-[18px] shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ) : null}

            <div className="mt-10">
              <p className="px-3 text-[11px] uppercase tracking-[0.28em] text-blue-100/65">
                Live Contract Types
              </p>

              <div className="mt-4 space-y-3">
                {contractGroups.length > 0 ? (
                  contractGroups.map((group) => (
                    <div
                      key={group.name}
                      className="rounded-[20px] bg-white/8 px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-[14px] font-medium text-white">
                            {group.name}
                          </p>
                          <p className="text-xs text-blue-100/75">
                            From backend data
                          </p>
                        </div>

                        <div className="flex h-7 min-w-7 items-center justify-center rounded-full bg-white/10 px-2 text-xs text-white">
                          {group.count}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[20px] bg-white/8 px-4 py-3 text-xs text-blue-100/75">
                    No contract groups available
                  </div>
                )}
              </div>
            </div>
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="flex flex-col gap-4 px-6 py-5 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Welcome back</p>
                <h1 className="text-2xl font-semibold leading-tight tracking-tight text-slate-950 md:text-3xl">
                  {title}
                </h1>
                {subtitle ? (
                  <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
                    {subtitle}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col items-stretch gap-3 xl:min-w-[620px] xl:flex-row xl:items-center xl:justify-end">
                {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}

                <div className="flex items-center justify-end gap-3">
                  <div className="hidden h-12 min-w-[420px] items-center gap-3 rounded-[18px] border border-slate-200 bg-white px-4 shadow-sm xl:flex">
                    <Search className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      Search contracts, parties, clauses...
                    </span>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
                    <UserButton
                      afterSignOutUrl="/sign-in"
                      appearance={{
                        elements: {
                          avatarBox: "h-8 w-8",
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 bg-slate-100 px-5 py-5 md:px-6 md:py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}