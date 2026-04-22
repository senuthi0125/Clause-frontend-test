import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";
import { usePreferences } from "@/hooks/use-preferences";
import { useTheme } from "@/components/theme-provider";

const THEMES = {
  indigo:  { label: "Indigo",  from: "#4F46E5", to: "#7C3AED", light: "#EEF2FF", darkBg: "#1E1B4B", border: "#C7D2FE", darkBorder: "#4338CA", text: "#4338CA", darkText: "#A5B4FC" },
  violet:  { label: "Violet",  from: "#7C3AED", to: "#A855F7", light: "#F5F3FF", darkBg: "#1D1035", border: "#DDD6FE", darkBorder: "#6D28D9", text: "#6D28D9", darkText: "#C4B5FD" },
  blue:    { label: "Blue",    from: "#2563EB", to: "#0EA5E9", light: "#EFF6FF", darkBg: "#0F1E3D", border: "#BFDBFE", darkBorder: "#1D4ED8", text: "#1D4ED8", darkText: "#93C5FD" },
  emerald: { label: "Emerald", from: "#059669", to: "#0D9488", light: "#ECFDF5", darkBg: "#022C22", border: "#A7F3D0", darkBorder: "#047857", text: "#047857", darkText: "#6EE7B7" },
  rose:    { label: "Rose",    from: "#E11D48", to: "#EC4899", light: "#FFF1F2", darkBg: "#2D0A14", border: "#FECDD3", darkBorder: "#BE123C", text: "#BE123C", darkText: "#FDA4AF" },
  amber:   { label: "Amber",   from: "#D97706", to: "#F97316", light: "#FFFBEB", darkBg: "#271A03", border: "#FDE68A", darkBorder: "#92400E", text: "#92400E", darkText: "#FCD34D" },
} as const;

type ThemeKey = keyof typeof THEMES;

const WIDGET_META = [
  { key: "total_contracts"   as const, label: "Total Contracts",   description: "All contracts across repositories" },
  { key: "active_contracts"  as const, label: "Active Contracts",  description: "Currently in-force contracts" },
  { key: "pending_approvals" as const, label: "Pending Approvals", description: "Awaiting stakeholder action" },
  { key: "high_risk"         as const, label: "High Risk Items",   description: "Contracts needing immediate review" },
];

export default function SettingsPage() {
  const { prefs, loading, setWidgetVisibility, setAccentColor } = usePreferences();
  const { resolvedTheme } = useTheme();
  const dark = resolvedTheme === "dark";

  const currentTheme = (prefs.accent_color as ThemeKey) ?? "indigo";
  const t = THEMES[currentTheme] ?? THEMES.indigo;

  if (loading) {
    return (
      <AppShell title="Settings" subtitle="Manage your dashboard preferences.">
        <p className="text-sm text-slate-500 dark:text-slate-400">Loading preferences...</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Settings"
      subtitle="Personalise your Clause workspace. All changes save automatically."
    >
      <div className="mx-auto max-w-3xl space-y-6">

        {/* Accent colour */}
        <Card className="rounded-3xl border border-slate-200 dark:border-white/8 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Accent colour</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Changes the highlight colour used throughout your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {(Object.entries(THEMES) as [ThemeKey, typeof THEMES[ThemeKey]][]).map(([key, val]) => {
                const isActive = currentTheme === key;
                return (
                  <button
                    key={key}
                    onClick={() => setAccentColor(key)}
                    className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-all"
                    style={
                      isActive
                        ? {
                            borderColor: dark ? val.darkBorder : val.border,
                            backgroundColor: dark ? val.darkBg : val.light,
                            boxShadow: `0 0 0 2px ${val.from}40`,
                          }
                        : {
                            borderColor: dark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
                            backgroundColor: "transparent",
                          }
                    }
                  >
                    <span
                      className="h-8 w-8 shrink-0 rounded-full shadow-sm"
                      style={{ background: `linear-gradient(135deg, ${val.from}, ${val.to})` }}
                    />
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{ color: isActive ? (dark ? val.darkText : val.text) : (dark ? "#E2E8F0" : "#1E293B") }}
                      >
                        {val.label}
                      </p>
                      {isActive && (
                        <p className="text-xs" style={{ color: dark ? val.darkText : val.text }}>Active</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Dashboard stat cards */}
        <Card className="rounded-3xl border border-slate-200 dark:border-white/8 shadow-sm">
          <CardContent className="p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dashboard stat cards</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Choose which summary cards appear on your dashboard.
              </p>
            </div>

            <div className="space-y-3">
              {WIDGET_META.map((w) => {
                const isVisible = prefs.widget_visibility[w.key] !== false;
                return (
                  <label
                    key={w.key}
                    className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 dark:border-white/8 bg-slate-50/60 dark:bg-white/4 px-5 py-4 transition-all hover:bg-slate-50 dark:hover:bg-white/6"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">{w.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{w.description}</p>
                    </div>
                    <div className="relative ml-4 shrink-0">
                      <input
                        type="checkbox"
                        checked={isVisible}
                        onChange={(e) => setWidgetVisibility(w.key, e.target.checked)}
                        className="sr-only"
                      />
                      <div
                        className="h-6 w-11 rounded-full transition-all duration-200"
                        style={{ backgroundColor: isVisible ? t.from : (dark ? "rgba(255,255,255,0.15)" : "#CBD5E1") }}
                      />
                      <div
                        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all duration-200"
                        style={{ left: isVisible ? "calc(100% - 1.25rem - 2px)" : "2px" }}
                      />
                    </div>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>
    </AppShell>
  );
}
