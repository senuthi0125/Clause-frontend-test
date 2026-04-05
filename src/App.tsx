import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardPage from "./pages/dashboard-page";
import CalendarPage from "./pages/calendar-page";
import ContractsPage from "./pages/contracts-page";

function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-2xl border border-slate-200 bg-white px-8 py-6 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-2 text-slate-500">This page will be built next.</p>
      </div>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/ai-analysis" element={<PlaceholderPage title="AI Analysis" />} />
        <Route
          path="/conflict-detection"
          element={<PlaceholderPage title="Conflict Detection" />}
        />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/workflows" element={<PlaceholderPage title="Workflows" />} />
        <Route path="/admin" element={<PlaceholderPage title="Admin" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;