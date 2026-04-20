import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import {
  SignIn,
  SignUp,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";
import LandingPage from "./pages/landing-page";
import DashboardPage from "./pages/dashboard-page";
import CalendarPage from "./pages/calendar-page";
import ContractsPage from "./pages/contracts-page";
import ContractTemplatePage from "./pages/contract-template-page";
import CreateContractPage from "./pages/create-contract-page";
import ContractDetailsPage from "./pages/contract-details-page";
import ConflictDetectionPage from "./pages/conflict-detection-page";
import AIAnalysisPage from "./pages/ai-analysis-page";
import RiskAnalysisPage from "./pages/risk-analysis-page";
import AdminOverviewPage from "./pages/admin-overview-page";
import AdminUsersPage from "./pages/admin-users-page";
import AdminAuditPage from "./pages/admin-audit-page";
import AdminApprovalsPage from "./pages/admin-approvals-page";
import AdminNotificationsPage from "./pages/admin-notifications-page";
import WorkflowsPage from "./pages/workflows-page";
import WorkflowDetailPage from "./pages/workflow-detail-page";
import UploadPipelinePage from "./pages/upload-pipeline-page";
import { AuthBridge } from "./components/auth-bridge";
import { ThemeProvider } from "./components/theme-provider";

const AUTH_FEATURES = [
  { icon: "📄", text: "Centralise all your contracts in one place" },
  { icon: "🤖", text: "AI-powered risk analysis and clause extraction" },
  { icon: "✅", text: "Streamlined approval workflows" },
  { icon: "🔔", text: "Automated expiry alerts via email" },
];

function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full">
      {/* Left branding panel */}
      <div className="relative hidden lg:flex lg:w-[52%] flex-col justify-between overflow-hidden bg-gradient-to-br from-violet-700 via-indigo-700 to-blue-800 p-12 text-white">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-0 h-[32rem] w-[32rem] rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 h-64 w-64 rounded-full bg-violet-500/20 blur-2xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm ring-1 ring-white/20">
            <span className="text-lg font-bold text-white">C</span>
          </div>
          <span className="text-xl font-semibold tracking-tight">Clause</span>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Contract management,
              <br />
              <span className="text-violet-200">made intelligent.</span>
            </h1>
            <p className="mt-4 text-base text-white/70 leading-relaxed max-w-sm">
              Clause brings your entire contract lifecycle into one place — from creation and
              approval to monitoring and renewal.
            </p>
          </div>

          <ul className="space-y-3">
            {AUTH_FEATURES.map((f) => (
              <li key={f.text} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm backdrop-blur-sm">
                  {f.icon}
                </span>
                <span className="text-sm text-white/80">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom quote */}
        <div className="relative z-10">
          <p className="text-xs text-white/40">
            © {new Date().getFullYear()} Clause · Secure · Private · AI-assisted
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center bg-white px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-600">
            <span className="text-base font-bold text-white">C</span>
          </div>
          <span className="text-lg font-semibold text-slate-800">Clause</span>
        </div>

        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/sign-in/*"
            element={
              <AuthLayout>
                <SignIn
                  routing="path"
                  path="/sign-in"
                  signUpUrl="/sign-up"
                  fallbackRedirectUrl="/dashboard"
                />
              </AuthLayout>
            }
          />

          <Route
            path="/sign-up/*"
            element={
              <AuthLayout>
                <SignUp
                  routing="path"
                  path="/sign-up"
                  signInUrl="/sign-in"
                  fallbackRedirectUrl="/dashboard"
                />
              </AuthLayout>
            }
          />

          <Route
            path="/*"
            element={
              <>
                <SignedIn>
                  <AuthBridge />
                  <Routes>
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/contracts" element={<ContractsPage />} />
                    <Route path="/upload" element={<UploadPipelinePage />} />
                    <Route path="/contracts/new" element={<ContractTemplatePage />} />
                    <Route path="/contracts/create" element={<CreateContractPage />} />
                    <Route path="/contracts/:id" element={<ContractDetailsPage />} />
                    <Route path="/ai-analysis" element={<AIAnalysisPage />} />
                    <Route path="/conflict-detection" element={<ConflictDetectionPage />} />
                    <Route path="/calendar" element={<CalendarPage />} />
                    <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
                    <Route path="/workflows" element={<WorkflowsPage />} />
                    <Route path="/workflows/:id" element={<WorkflowDetailPage />} />
                    <Route path="/admin" element={<AdminOverviewPage />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/admin/approvals" element={<AdminApprovalsPage />} />
                    <Route path="/admin/audit" element={<AdminAuditPage />} />
                    <Route path="/admin/notifications" element={<AdminNotificationsPage />} />
                    <Route path="/admin/workflows" element={<WorkflowsPage />} />
                    <Route path="/admin/workflows/:id" element={<WorkflowDetailPage />} />
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="*" element={<Navigate to="/dashboard" replace />} />
                  </Routes>
                </SignedIn>

                <SignedOut>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </SignedOut>
              </>
            }
          />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}