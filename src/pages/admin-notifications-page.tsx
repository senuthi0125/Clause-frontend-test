import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  CalendarClock,
  CheckCircle2,
  History,
  Loader2,
  Mail,
  Send,
  Settings,
  ShieldAlert,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { AppShell } from "@/components/layout/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/lib/api";
import { formatLabel as fmt, statusBadgeClass as badgeClass } from "@/lib/utils";
import type { Contract } from "@/types/api";

// ── Email settings panel ───────────────────────────────────────────────────

function EmailSettingsPanel() {
  const { user } = useUser();
  const [smtpConfigured,   setSmtpConfigured]   = useState<boolean | null>(null);
  const [smtpEmail,        setSmtpEmail]         = useState<string | null>(null);
  const [testTarget,       setTestTarget]        = useState("");
  const [sendingTest,      setSendingTest]       = useState(false);
  const [testResult,       setTestResult]        = useState<{ ok: boolean; msg: string } | null>(null);
  const [scanLoading,      setScanLoading]       = useState(false);
  const [scanResult,       setScanResult]        = useState<{ sent: number; skipped: number; errors: number } | null>(null);
  const [scanDryRun,       setScanDryRun]        = useState(false);

  useEffect(() => {
    api.getEmailConfig()
      .then((r) => { setSmtpConfigured(r.configured); setSmtpEmail(r.smtp_email); })
      .catch(() => setSmtpConfigured(false));
    // pre-fill test target with the user's own email
    const email = String(user?.primaryEmailAddress?.emailAddress || "");
    if (email) setTestTarget(email);
  }, [user]);

  async function handleTestEmail() {
    if (!testTarget.trim()) return;
    setSendingTest(true);
    setTestResult(null);
    try {
      await api.sendTestEmail(testTarget.trim());
      setTestResult({ ok: true, msg: `Test email sent to ${testTarget}` });
    } catch (e) {
      setTestResult({ ok: false, msg: e instanceof Error ? e.message : "Failed to send." });
    } finally {
      setSendingTest(false);
    }
  }

  async function handleScanAlerts() {
    setScanLoading(true);
    setScanResult(null);
    try {
      const r = await api.sendExpiryAlerts(scanDryRun);
      setScanResult(r);
    } catch (e) {
      setScanResult({ sent: 0, skipped: 0, errors: 1 });
    } finally {
      setScanLoading(false);
    }
  }

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-slate-500" /> Email Notifications
        </CardTitle>
        <p className="text-sm text-slate-500">
          Gmail SMTP — set <code className="rounded bg-slate-100 px-1 text-xs">SMTP_EMAIL</code> and{" "}
          <code className="rounded bg-slate-100 px-1 text-xs">SMTP_PASSWORD</code> in your <code className="rounded bg-slate-100 px-1 text-xs">.env</code>.
        </p>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* SMTP status */}
        <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
          smtpConfigured ? "border-green-200 bg-green-50" : "border-amber-200 bg-amber-50"
        }`}>
          {smtpConfigured
            ? <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
            : <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
          }
          <div>
            <p className={`text-sm font-semibold ${smtpConfigured ? "text-green-800" : "text-amber-800"}`}>
              {smtpConfigured ? `Configured — sending from ${smtpEmail}` : "Not configured"}
            </p>
            {!smtpConfigured && (
              <p className="mt-0.5 text-xs text-amber-700">
                Add SMTP_EMAIL + SMTP_PASSWORD to .env. Use a Gmail App Password (not your main password).
              </p>
            )}
          </div>
        </div>

        {/* What emails are sent */}
        <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Automatic alerts sent to contract owners</p>
          {[
            { label: "90 days before expiry",   color: "bg-blue-500" },
            { label: "30 days before expiry",   color: "bg-amber-500" },
            { label: "7 days before expiry",    color: "bg-red-500" },
            { label: "Approval request votes",  color: "bg-violet-500" },
            { label: "Workflow stage updates",  color: "bg-green-500" },
          ].map(({ label, color }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-slate-600">
              <div className={`h-2 w-2 rounded-full shrink-0 ${color}`} />
              {label}
            </div>
          ))}
        </div>

        {/* Test email */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Send Test Email</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={testTarget}
              onChange={(e) => setTestTarget(e.target.value)}
              placeholder="email@example.com"
              className="h-10 flex-1 rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-violet-400"
            />
            <Button size="sm" className="rounded-xl" onClick={handleTestEmail} disabled={sendingTest || !testTarget.trim() || !smtpConfigured}>
              {sendingTest ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              <span className="ml-1.5">Send</span>
            </Button>
          </div>
          {testResult && (
            <p className={`text-xs ${testResult.ok ? "text-green-600" : "text-red-600"}`}>
              {testResult.ok ? "✓" : "✗"} {testResult.msg}
            </p>
          )}
        </div>

        {/* Scan & send expiry alerts */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Manual Expiry Alert Scan</p>
          <p className="text-xs text-slate-500">
            Checks all contracts and sends emails to owners whose contracts hit the 90/30/7-day threshold. Deduplication prevents repeat sends.
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input type="checkbox" checked={scanDryRun} onChange={(e) => setScanDryRun(e.target.checked)}
                className="rounded" />
              Dry run (count only, no emails)
            </label>
            <Button size="sm" variant="outline" className="rounded-xl" onClick={handleScanAlerts}
              disabled={scanLoading || !smtpConfigured}>
              {scanLoading ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Zap className="mr-1.5 h-3.5 w-3.5" />}
              Run Scan
            </Button>
          </div>
          {scanResult && (
            <div className="grid grid-cols-3 gap-2 text-center">
              {[
                { label: "Sent",    value: scanResult.sent,    color: "text-green-700 bg-green-50" },
                { label: "Skipped", value: scanResult.skipped, color: "text-slate-600 bg-slate-50" },
                { label: "Errors",  value: scanResult.errors,  color: "text-red-700 bg-red-50" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl py-2 ${color}`}>
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-[11px]">{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>

      </CardContent>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminNotificationsPage() {
  const [contracts,       setContracts]       = useState<Contract[]>([]);
  const [expiringSoon,    setExpiringSoon]    = useState<Array<{ id: string; title: string; contract_type: string; days_remaining: number }>>([]);
  const [recentActivity,  setRecentActivity]  = useState<Array<{ id: string; title: string; status: string; workflow_stage: string; updated_at: string }>>([]);
  const [loading,         setLoading]         = useState(true);
  const [error,           setError]           = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const [contractsRes, expiringRes, recentRes] = await Promise.all([
        api.listContracts("?per_page=100"),
        api.getExpiringSoon().catch(() => []),
        api.getRecentActivity().catch(() => []),
      ]);
      setContracts(Array.isArray(contractsRes?.contracts) ? contractsRes.contracts : []);
      setExpiringSoon(Array.isArray(expiringRes) ? expiringRes : []);
      setRecentActivity(Array.isArray(recentRes) ? recentRes : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadNotifications(); }, []);

  const contractGroups = useMemo(() => {
    const counts = new Map<string, number>();
    contracts.forEach((c) => { const t = c.contract_type || "other"; counts.set(t, (counts.get(t) || 0) + 1); });
    return Array.from(counts.entries()).map(([name, count]) => ({ name: fmt(name), count }));
  }, [contracts]);

  const highRiskContracts = useMemo(() =>
    contracts.filter((c) => (c.risk_level || "").toLowerCase() === "high").slice(0, 6),
  [contracts]);

  return (
    <AppShell
      title="Notifications & Alerts"
      subtitle="Contract alerts, email notifications, and activity feed."
      contractGroups={contractGroups}
    >
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Top row: expiring + high risk */}
      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarClock className="h-5 w-5 text-slate-500" /> Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
            ) : expiringSoon.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
                <p className="text-sm text-slate-500">No contracts expiring soon.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {expiringSoon.map((item) => (
                  <Link key={item.id} to={`/contracts/${item.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{item.title}</p>
                      <p className="text-xs text-slate-500">{fmt(item.contract_type)}</p>
                    </div>
                    <Badge className={`shrink-0 text-xs ${
                      item.days_remaining <= 7  ? "bg-red-100 text-red-700" :
                      item.days_remaining <= 30 ? "bg-amber-100 text-amber-700" :
                      "bg-blue-100 text-blue-700"
                    }`}>
                      {item.days_remaining}d left
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-slate-500" /> High Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
            ) : highRiskContracts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-8 text-center">
                <CheckCircle2 className="h-8 w-8 text-green-400" />
                <p className="text-sm text-slate-500">No high-risk contracts found.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {highRiskContracts.map((contract) => (
                  <Link key={contract.id} to={`/contracts/${contract.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-slate-900">{contract.title}</p>
                      <p className="mt-0.5 text-xs text-slate-500 truncate">{contract.description || "No description."}</p>
                    </div>
                    <Badge className={`shrink-0 ${badgeClass(contract.risk_level)}`}>
                      {fmt(contract.risk_level)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Email settings */}
      <div className="mt-6">
        <EmailSettingsPanel />
      </div>

      {/* Recent activity */}
      <Card className="mt-6 border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-slate-500" /> Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" /> Loading…</div>
          ) : recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No recent activity found.</p>
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <Link key={item.id} to={`/contracts/${item.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 p-3 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900 truncate">{item.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {fmt(item.status)} · {fmt(item.workflow_stage)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 text-slate-400">
                    <Bell className="h-3.5 w-3.5" />
                    <span className="text-xs">{new Date(item.updated_at).toLocaleDateString()}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
