import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  FileText,
  LayoutDashboard,
  Menu,
  Monitor,
  Moon,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Sun,
  Users,
  ScrollText,
  LockKeyhole,
  Workflow,
  UploadCloud,
  Settings,
  X,
} from "lucide-react";
import { UserButton, useUser } from "@clerk/clerk-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";

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

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  const options: {
    value: "light" | "dark" | "system";
    icon: React.ElementType;
    label: string;
  }[] = [
    { value: "light", icon: Sun, label: "Light" },
    { value: "dark", icon: Moon, label: "Dark" },
    { value: "system", icon: Monitor, label: "System" },
  ];

  return (
    <div className="flex items-center rounded-xl border border-slate-200 bg-slate-100 p-1 dark:border-white/10 dark:bg-white/8">
      {options.map(({ value, icon: Icon, label }) => (
        <button
          key={value}
          onClick={() => setTheme(value)}
          title={label}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-lg transition-all",
            theme === value
              ? "bg-white text-slate-900 shadow-sm dark:bg-white/15 dark:text-white"
              : "text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </button>
      ))}
    </div>
  );
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
  const [adminMode, setAdminMode] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  void contractGroups;

  const role = String(
    user?.publicMetadata?.role || user?.unsafeMetadata?.role || ""
  )
    .trim()
    .toLowerCase();

  const isAdmin = role === "admin";
  const isManager = role === "manager";
  const isAdminOrManager = isAdmin || isManager;

  useEffect(() => {
    if (!isAdminOrManager) {
      localStorage.removeItem("admin_mode");
      setAdminMode(false);
      return;
    }
    const stored = localStorage.getItem("admin_mode");
    if (stored === "true") setAdminMode(true);
    if (location.pathname.startsWith("/admin")) {
      localStorage.setItem("admin_mode", "true");
      setAdminMode(true);
    }
  }, [isAdminOrManager, location.pathname]);

  const mainNavigation = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Contracts", href: "/contracts", icon: FileText },
    { label: "Upload Contract", href: "/upload", icon: UploadCloud },
    { label: "AI Analysis", href: "/ai-analysis", icon: Sparkles },
    { label: "Conflict Detection", href: "/conflict-detection", icon: Shield },
    { label: "Calendar", href: "/calendar", icon: CalendarDays },
    { label: "Risk Analysis", href: "/risk-analysis", icon: ShieldAlert },
    { label: "Settings", href: "/settings", icon: Settings },
  ];

  const adminNavigation = [
    { label: "Admin Dashboard", href: "/admin", icon: LockKeyhole },
    { label: "User Management", href: "/admin/users", icon: Users },
    { label: "Workflows", href: "/admin/workflows", icon: Workflow },
    { label: "Approvals", href: "/admin/approvals", icon: CheckCheck },
    { label: "Audit Logs", href: "/admin/audit", icon: ScrollText },
    { label: "Notifications & Alerts", href: "/admin/notifications", icon: Bell },
  ];

  const managerNavigation = [
    { label: "Workflows", href: "/admin/workflows", icon: Workflow },
    { label: "Approvals", href: "/admin/approvals", icon: CheckCheck },
  ];

  const showAdminSection = isAdminOrManager && adminMode;
  const activeNavigation = isAdmin ? adminNavigation : managerNavigation;
  const firstName = user?.firstName || user?.username || null;

  const handleAdminClick = () => {
    localStorage.setItem("admin_mode", "true");
    setAdminMode(true);
  };

  const NavLink = ({
    item,
    onClick,
  }: {
    item: { label: string; href: string; icon: React.ElementType };
    onClick?: () => void;
  }) => {
    const isActive =
      item.href === "/dashboard"
        ? location.pathname === "/dashboard"
        : location.pathname.startsWith(item.href);

    const Icon = item.icon;

    return (
      <Link
        to={item.href}
        onClick={onClick}
        className={cn(
          "group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-[13.5px] font-medium transition-all duration-150",
          isActive
            ? "bg-white/15 text-white shadow-sm"
            : "text-blue-100/70 hover:bg-white/8 hover:text-blue-50"
        )}
      >
        <Icon
          className={cn(
            "h-4 w-4 shrink-0 transition-transform duration-150",
            isActive
              ? "text-white"
              : "text-blue-200/60 group-hover:text-blue-100"
          )}
        />
        <span className="truncate">{item.label}</span>
        {isActive && (
          <span className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      <div className="px-4 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-400 via-blue-500 to-cyan-400 shadow-lg shadow-indigo-500/30">
            <FileText className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[15px] font-bold tracking-tight text-white">
              clause
            </p>
            <p className="text-[11px] text-blue-100/50 leading-tight">
              Contract workspace
            </p>
          </div>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/8" />

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3.5">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100/35">
            Main menu
          </p>
        </div>
        <div className="space-y-0.5">
          {mainNavigation.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              onClick={() => setMobileOpen(false)}
            />
          ))}
        </div>

        {showAdminSection && (
          <div className="mt-6">
            <div className="mb-2 px-3.5">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-blue-100/35">
                {isAdmin ? "Admin" : "Management"}
              </p>
            </div>
            <div className="space-y-0.5">
              {activeNavigation.map((item) => (
                <NavLink
                  key={item.href}
                  item={item}
                  onClick={() => setMobileOpen(false)}
                />
              ))}
            </div>
          </div>
        )}
      </nav>

      <div className="mx-4 mb-4 mt-2 h-px bg-white/8" />
      <div className="px-4 pb-5">
        <div className="flex items-center gap-3 rounded-xl bg-white/6 px-3 py-2.5">
          <UserButton appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[12.5px] font-semibold text-white">
              {firstName ??
                user?.emailAddresses?.[0]?.emailAddress?.split("@")[0] ??
                "User"}
            </p>
            <p className="truncate text-[11px] text-blue-100/45 capitalize">
              {role || "member"}
            </p>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-[#0C0F1D]">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex h-full w-[260px] flex-col bg-[#07153A] shadow-2xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-lg text-white/50 hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex min-h-screen">
        <aside className="hidden w-[240px] shrink-0 flex-col bg-[#07153A] dark:bg-[#080B16] lg:flex">
          <SidebarContent />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/95 backdrop-blur-md dark:border-white/8 dark:bg-[#0F1320]/95">
            <div className="flex items-center gap-4 px-5 py-3.5 xl:px-6">
              <button
                onClick={() => setMobileOpen(true)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:text-slate-400 dark:hover:bg-white/8 lg:hidden"
              >
                <Menu className="h-4 w-4" />
              </button>

              <div className="min-w-0 flex-1 lg:hidden">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-white">
                  {title}
                </p>
              </div>

              <div className="hidden flex-1 lg:block">
                <div className="flex h-10 max-w-[440px] items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-4 transition-all focus-within:border-indigo-300 focus-within:ring-2 focus-within:ring-indigo-100 dark:border-white/8 dark:bg-white/5 dark:focus-within:border-indigo-500/50 dark:focus-within:ring-indigo-500/10">
                  <Search className="h-3.5 w-3.5 shrink-0 text-slate-400 dark:text-slate-500" />
                  <span className="text-[13px] text-slate-400 dark:text-slate-500">
                    Search contracts, parties, clauses…
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <ThemeToggle />

                {isAdminOrManager && (
                  <Link
                    to={isAdmin ? "/admin" : "/admin/workflows"}
                    onClick={handleAdminClick}
                    className={cn(
                      "hidden h-9 items-center gap-2 rounded-xl border px-3.5 text-[13px] font-medium transition-all sm:inline-flex",
                      location.pathname.startsWith("/admin")
                        ? "border-indigo-500/40 bg-indigo-600 text-white shadow-sm shadow-indigo-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-white/10 dark:bg-white/8 dark:text-slate-300 dark:hover:bg-white/12"
                    )}
                  >
                    <LockKeyhole className="h-3.5 w-3.5" />
                    <span>{isAdmin ? "Admin" : "Manage"}</span>
                  </Link>
                )}

                <button className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 dark:border-white/10 dark:bg-white/8 dark:text-slate-400 dark:hover:bg-white/12">
                  <Bell className="h-4 w-4" />
                  <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-indigo-500" />
                </button>
              </div>
            </div>
          </header>

          <div className="border-b border-slate-200/60 bg-white px-5 pb-5 pt-5 dark:border-white/6 dark:bg-[#0F1320] xl:px-6">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div className="min-w-0">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">
                  {firstName ? `Welcome back, ${firstName}` : "Welcome back"}
                </p>
                <h1 className="text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white md:text-3xl">
                  {title}
                </h1>
                {subtitle && (
                  <p className="mt-1.5 max-w-2xl text-sm text-slate-500 dark:text-slate-400">
                    {subtitle}
                  </p>
                )}
              </div>
              {actions && (
                <div className="flex flex-wrap items-center gap-2">
                  {actions}
                </div>
              )}
            </div>
          </div>

          <main className="flex-1 bg-slate-100 px-5 py-6 dark:bg-[#0C0F1D] md:px-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}