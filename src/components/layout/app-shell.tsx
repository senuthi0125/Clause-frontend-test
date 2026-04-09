import type { ReactNode } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { UserButton, useUser } from "@clerk/clerk-react";
import {
  CalendarDays,
  FileText,
  GitBranch,
  LayoutDashboard,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldUser,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Contracts", icon: FileText, href: "/contracts" },
  { label: "AI Analysis", icon: ShieldAlert, href: "/ai-analysis" },
  { label: "Conflict Detection", icon: ShieldCheck, href: "/conflict-detection" },
  { label: "Calendar", icon: CalendarDays, href: "/calendar" },
  { label: "Workflows", icon: GitBranch, href: "/workflows" },
];

type AppShellProps = {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
  contractGroups?: Array<{ name: string; count: number }>;
};

export function AppShell({
  title,
  subtitle,
  actions,
  children,
  contractGroups = [],
}: AppShellProps) {
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
                          "flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
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
                <span>Live Contract Types</span>
              </div>
            </div>

            <ScrollArea className="mt-3 flex-1 px-4">
              <div className="space-y-2 pb-6">
                {contractGroups.length === 0 ? (
                  <div className="rounded-2xl bg-white/5 px-4 py-3 text-sm text-slate-400">
                    No contract groups yet.
                  </div>
                ) : (
                  contractGroups.map((item) => (
                    <div
                      key={item.name}
                      className="flex items-center justify-between rounded-2xl bg-white/5 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm text-slate-100">{item.name}</p>
                        <p className="text-xs text-slate-400">From backend data</p>
                      </div>
                      <Badge
                        variant="secondary"
                        className="rounded-full bg-white/10 text-slate-200 hover:bg-white/10"
                      >
                        {item.count}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </aside>

        <main className="min-w-0 bg-slate-100">
          <div className="border-b border-slate-200 bg-white px-5 py-4 md:px-7">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="text-sm text-slate-500">Welcome back</p>
                <h2 className="text-2xl font-semibold leading-tight tracking-tight text-slate-900 md:text-3xl">
                  {title}
                </h2>
                {subtitle ? (
                  <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>
                ) : null}
              </div>

              <div className="flex items-center gap-3">
                {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
                <TopAdminButton />
                <TopSearchBar />
                <TopUserAvatar />
              </div>
            </div>
          </div>

          <div className="px-5 py-5 md:px-7">{children}</div>
        </main>
      </div>
    </div>
  );
}

function TopSearchBar() {
  return (
    <div className="relative w-full sm:w-[320px] lg:w-[430px]">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      <Input
        placeholder="Search contracts, parties, clauses..."
        className="h-14 rounded-2xl border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-700 shadow-sm placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-slate-200"
      />
    </div>
  );
}

function TopUserAvatar() {
  return (
    <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
      <UserButton
        afterSignOutUrl="/sign-in"
        appearance={{
          elements: {
            avatarBox: "h-10 w-10",
            userButtonAvatarBox: "h-10 w-10",
            userButtonTrigger:
              "flex h-10 w-10 items-center justify-center rounded-full overflow-hidden",
          },
        }}
      />
    </div>
  );
}

function TopAdminButton() {
  const { user, isLoaded } = useUser();
  const navigate = useNavigate();
  const location = useLocation();

  if (!isLoaded) return null;

  const role =
    (user?.publicMetadata?.role as string | undefined) ||
    (user?.unsafeMetadata?.role as string | undefined) ||
    "";

  const isAdmin = role.toLowerCase() === "admin";

  if (!isAdmin) return null;

  const isAdminPage = location.pathname.startsWith("/admin");

  return (
    <Button
      type="button"
      onClick={() => navigate("/admin")}
      className={cn(
        "h-14 rounded-2xl px-5 text-sm font-semibold shadow-sm",
        isAdminPage
          ? "bg-slate-900 text-white hover:bg-slate-900"
          : "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
      )}
      variant="outline"
    >
      <ShieldUser className="mr-2 h-4 w-4" />
      Admin
    </Button>
  );
}