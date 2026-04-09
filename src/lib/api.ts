import type {
  AdminRecentUser,
  AdminStats,
  AdminUserActivity,
  AiAnalysisResponse,
  AiChatResponse,
  ApprovalListResponse,
  ApprovalStat,
  AuditLogResponse,
  ConflictResult,
  Contract,
  ContractsByStage,
  ContractsResponse,
  DashboardStats,
  DraftResponse,
  Template,
  TemplatesResponse,
  UserRole,
  UsersListResponse,
  ValueByType,
  Workflow,
} from "../types/api";

const API_BASE_URL =
  (import.meta as ImportMeta & { env?: Record<string, string> }).env
    ?.VITE_API_BASE_URL || "http://localhost:8000";

class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type ChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatRequestPayload = {
  question: string;
  contract_id?: string | null;
  history?: ChatHistoryMessage[];
  mode?: string;
};

function getStoredAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    return window.localStorage.getItem("clause_auth_token");
  } catch {
    return null;
  }
}

let tokenProvider: (() => Promise<string | null>) | null = null;

export function setAuthTokenProvider(
  provider: (() => Promise<string | null>) | null
) {
  tokenProvider = provider;
}

async function resolveToken(): Promise<string | null> {
  if (tokenProvider) {
    try {
      const token = await tokenProvider();
      if (token) return token;
    } catch (err) {
      console.warn("Auth token provider failed:", err);
    }
  }

  return getStoredAuthToken();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await resolveToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "detail" in data
        ? String((data as { detail?: string }).detail)
        : `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export function buildContractsQuery(
  params: Record<string, string | number | undefined | null>
) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      search.set(key, String(value));
    }
  });

  const suffix = search.toString();
  return suffix ? `?${suffix}` : "";
}

export const api = {
  health: () => request<{ status: string; database: string }>("/health"),

  syncUser: () =>
    request<{
      id?: string;
      email?: string;
      full_name?: string;
      role?: string;
      status?: string;
    }>("/api/auth/sync", { method: "POST" }),

  getMyProfile: () =>
    request<{
      id?: string;
      email?: string;
      full_name?: string;
      role?: string;
      status?: string;
    }>("/api/auth/me"),

  getDashboardStats: () => request<DashboardStats>("/api/dashboard/stats"),

  getContractsByType: () =>
    request<Array<{ type: string; count: number }>>(
      "/api/dashboard/contracts-by-type"
    ),

  getContractsByStatus: () =>
    request<Array<{ status: string; count: number }>>(
      "/api/dashboard/contracts-by-status"
    ),

  getExpiringSoon: () =>
    request<
      Array<{
        id: string;
        title: string;
        contract_type: string;
        end_date: string;
        days_remaining: number;
      }>
    >("/api/dashboard/expiring-soon"),

  getRecentActivity: () =>
    request<
      Array<{
        id: string;
        title: string;
        status: string;
        workflow_stage: string;
        updated_at: string;
      }>
    >("/api/dashboard/recent-activity"),

  listContracts: (query = "") =>
    request<ContractsResponse>(`/api/contracts/${query}`),

  getContract: (id: string) => request<Contract>(`/api/contracts/${id}`),

  createContract: (payload: Record<string, unknown>) =>
    request<Contract>("/api/contracts/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  updateContract: (id: string, payload: Record<string, unknown>) =>
    request<Contract>(`/api/contracts/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteContract: (id: string) =>
    request<{ message: string }>(`/api/contracts/${id}`, {
      method: "DELETE",
    }),

  listTemplates: (query = "") =>
    request<TemplatesResponse>(`/api/templates/${query}`),

  getTemplate: (id: string) => request<Template>(`/api/templates/${id}`),

  createWorkflow: (payload: Record<string, unknown>) =>
    request<Workflow>("/api/workflows/", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getWorkflow: (id: string) => request<Workflow>(`/api/workflows/${id}`),

  getContractWorkflows: (contractId: string) =>
    request<{ workflows: Workflow[] }>(`/api/workflows/contract/${contractId}`),

  advanceWorkflow: (id: string, comments?: string) =>
    request<Workflow>(`/api/workflows/${id}/advance`, {
      method: "POST",
      body: JSON.stringify({ comments }),
    }),

  rejectWorkflow: (id: string, reason?: string) =>
    request<Workflow>(`/api/workflows/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  getApprovalsByContract: (contractId: string) =>
    request<ApprovalListResponse>(`/api/approvals/contract/${contractId}`),

  analyzeText: (text: string) =>
    request<AiAnalysisResponse>("/api/ai/analyze/text", {
      method: "POST",
      body: JSON.stringify({ text }),
    }),

  analyzeContract: (contractId: string) =>
    request<AiAnalysisResponse>(`/api/ai/analyze/${contractId}`, {
      method: "POST",
    }),

  generateDraft: (payload: Record<string, unknown>) =>
    request<DraftResponse>("/api/ai/generate-draft", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  detectConflicts: (contractIds: string[]) =>
    request<ConflictResult>("/api/ai/conflicts", {
      method: "POST",
      body: JSON.stringify({ contract_ids: contractIds }),
    }),

  chat: (
    questionOrPayload: string | ChatRequestPayload,
    contractId?: string,
    history?: ChatHistoryMessage[],
    mode = "general"
  ) => {
    const payload: ChatRequestPayload =
      typeof questionOrPayload === "string"
        ? {
            question: questionOrPayload,
            contract_id: contractId || null,
            history: history || [],
            mode,
          }
        : {
            question: questionOrPayload.question,
            contract_id: questionOrPayload.contract_id ?? null,
            history: questionOrPayload.history || [],
            mode: questionOrPayload.mode || "general",
          };

    return request<AiChatResponse>("/api/ai/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  getAdminStats: () => request<AdminStats>("/api/admin/stats"),

  getAdminUserActivity: () =>
    request<AdminUserActivity[]>("/api/admin/user-activity"),

  getAdminContractsByStage: () =>
    request<ContractsByStage[]>("/api/admin/contracts-by-stage"),

  getAdminValueByType: () =>
    request<ValueByType[]>("/api/admin/value-by-type"),

  getAdminApprovalStats: () =>
    request<ApprovalStat[]>("/api/admin/approval-stats"),

  getAdminRecentUsers: () =>
    request<AdminRecentUser[]>("/api/admin/recent-users"),

  listUsers: (page = 1, perPage = 20) =>
    request<UsersListResponse>(
      `/api/auth/users?page=${page}&per_page=${perPage}`
    ),

  changeUserRole: (userId: string, role: UserRole) =>
    request<unknown>(
      `/api/auth/users/${userId}/role?role=${encodeURIComponent(role)}`,
      { method: "PATCH" }
    ),

  deactivateUser: (userId: string) =>
    request<unknown>(`/api/auth/users/${userId}/deactivate`, {
      method: "PATCH",
    }),

  listAuditLogs: (params: {
    resource_type?: string;
    resource_id?: string;
    user_id?: string;
    action?: string;
    page?: number;
    per_page?: number;
  } = {}) => {
    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        search.set(key, String(value));
      }
    });

    const suffix = search.toString();

    return request<AuditLogResponse>(
      `/api/audit/${suffix ? `?${suffix}` : ""}`
    );
  },
};

export {
  API_BASE_URL,
  ApiError,
  type ChatHistoryMessage,
  type ChatRequestPayload,
};