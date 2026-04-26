// frontend/src/api.ts
// ─────────────────────────────────────────────────────────────────
//  API client for the FastAPI backend
// ─────────────────────────────────────────────────────────────────

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

interface ApiResponse<T = unknown> {
  data: T | null;
  error: string | null;
}

async function fetchApi<T>(endpoint: string): Promise<ApiResponse<T>> {
  try {
    const resp = await fetch(`${API_BASE}${endpoint}`);
    if (!resp.ok) {
      const errorText = await resp.text();
      return { data: null, error: `${resp.status}: ${errorText}` };
    }
    const data = await resp.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: `Network error: ${err}` };
  }
}

async function postApi<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const resp = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!resp.ok) {
      // Try to extract detail from JSON error response
      try {
        const errJson = await resp.json();
        const detail = errJson.detail || JSON.stringify(errJson);
        return { data: null, error: `${resp.status}: ${detail}` };
      } catch {
        const errorText = await resp.text();
        return { data: null, error: `${resp.status}: ${errorText}` };
      }
    }
    const data = await resp.json();
    return { data, error: null };
  } catch (err) {
    return { data: null, error: `Network error: ${err}` };
  }
}

// ── Type Definitions ────────────────────────────────────────────

export interface HealthResponse {
  status: string;
  databases: {
    sqlserver: string;
    mysql: string;
  };
}

export interface SystemStatus {
  sqlserver: { database: string; connected: boolean };
  mysql: { database: string; connected: boolean };
}

export interface SchemaResponse {
  database: string;
  engine: string;
  table_count: number;
  tables: Record<string, { columns: unknown[]; row_count: number }>;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  confirm_password: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
  role: string;
  message: string;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

// ── API Client ──────────────────────────────────────────────────

export const api = {
  // Health & Dashboard
  health: () => fetchApi<HealthResponse>('/health'),
  dashboardStatus: () => fetchApi<SystemStatus>('/api/dashboard/status'),
  dashboardOverview: () => fetchApi<unknown>('/api/dashboard/overview'),

  // Schema
  hrSchema: () => fetchApi<SchemaResponse>('/api/hr/schema'),
  payrollSchema: () => fetchApi<SchemaResponse>('/api/payroll/schema'),

  // Dashboard Features
  searchEmployees: (q: string) => fetchApi<any>(`/api/dashboard/employees/search?q=${encodeURIComponent(q)}`),
  getEmployee360: (id: number) => fetchApi<any>(`/api/dashboard/employee/${id}`),
  getReconciliation: () => fetchApi<any>('/api/dashboard/reconciliation'),
  getDataQuality: () => fetchApi<any>('/api/dashboard/quality'),
  getReport: (type: string) => fetchApi<any>(`/api/dashboard/reports/${type}`),

  // Auth
  register: (data: RegisterRequest) => postApi<AuthResponse>('/api/auth/register', data),
  login: (creds: LoginRequest) => postApi<AuthResponse>('/api/auth/login', creds),
  logout: (token: string) => postApi<{ message: string }>(`/api/auth/logout?token=${token}`, {}),
  me: (token: string) => fetchApi<UserInfo>(`/api/auth/me?token=${token}`),
};
