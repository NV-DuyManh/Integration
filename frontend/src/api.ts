// frontend/src/api.ts
// ─────────────────────────────────────────────────────────────────
//  API client for the FastAPI backend
// ─────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8000';

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

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  username: string;
  role: string;
  expires_at: string;
}

export interface SessionInfo {
  username: string;
  role: string;
  created: string;
}

async function postApi<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  try {
    const resp = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
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

export const api = {
  health: () => fetchApi<HealthResponse>('/health'),
  dashboardStatus: () => fetchApi<SystemStatus>('/api/dashboard/status'),
  dashboardOverview: () => fetchApi<unknown>('/api/dashboard/overview'),
  hrSchema: () => fetchApi<SchemaResponse>('/api/hr/schema'),
  payrollSchema: () => fetchApi<SchemaResponse>('/api/payroll/schema'),
  login: (creds: LoginRequest) => postApi<LoginResponse>('/api/auth/login', creds),
  logout: (token: string) => postApi<{ message: string }>(`/api/auth/logout?token=${token}`, {}),
  me: (token: string) => fetchApi<SessionInfo>(`/api/auth/me?token=${token}`),
};
