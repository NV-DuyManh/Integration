// frontend/src/main.ts
// ─────────────────────────────────────────────────────────────────
//  HR & Payroll Middleware Dashboard — Main Entry
// ─────────────────────────────────────────────────────────────────
import './style.css';
import { api } from './api.ts';
import type { SystemStatus, SchemaResponse, AuthResponse } from './api.ts';

// ── State ───────────────────────────────────────────────────────
let currentView = 'dashboard';
let dbStatus: SystemStatus | null = null;
let hrSchema: SchemaResponse | null = null;
let payrollSchema: SchemaResponse | null = null;

let dataQuality: any = null;
let reconciliationData: any = null;
let reportData: any = null;
let currentReportType: string = 'compensation';
let employeeSearchQuery = '';
let employeeSearchResults: any[] | null = null;
let selectedEmployee: any = null;
let isSearching = false;

// ── Auth State ──────────────────────────────────────────────────
let authToken: string | null = localStorage.getItem('auth_token');
let authUser: { username: string; role: string; email: string } | null = null;
let authTab: 'login' | 'register' = 'login';
let authError: string | null = null;
let authSuccess: string | null = null;
let authLoading = false;

function saveAuth(data: AuthResponse): void {
  authToken = data.token;
  authUser = { username: data.username, role: data.role, email: data.email };
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('auth_user', JSON.stringify(authUser));
}

function clearAuth(): void {
  authToken = null;
  authUser = null;
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

// Restore user from localStorage
const storedUser = localStorage.getItem('auth_user');
if (storedUser) {
  try { authUser = JSON.parse(storedUser); } catch { clearAuth(); }
}

// ── Render ──────────────────────────────────────────────────────
function render(): void {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  if (!authToken || !authUser) {
    app.innerHTML = renderAuthPage();
    attachAuthListeners();
    return;
  }

  app.innerHTML = `
    ${renderSidebar()}
    <div class="main-content">
      ${renderHeader()}
      <div class="page-content">
        ${renderPage()}
      </div>
    </div>
  `;
  attachEventListeners();
}

// ══════════════════════════════════════════════════════════════════
//  AUTH PAGE (Login / Register Tabs)
// ══════════════════════════════════════════════════════════════════
function renderAuthPage(): string {
  return `
    <div class="login-wrapper">
      <div class="login-bg-orb login-bg-orb-1"></div>
      <div class="login-bg-orb login-bg-orb-2"></div>
      <div class="login-bg-orb login-bg-orb-3"></div>

      <div class="login-card">
        <div class="login-header">
          <div class="login-brand-icon">⚡</div>
          <h1 class="login-title">NexusBridge</h1>
          <p class="login-subtitle">HR & Payroll Middleware Dashboard</p>
        </div>

        <div class="auth-tabs">
          <button class="auth-tab ${authTab === 'login' ? 'active' : ''}" id="tab-login">Sign In</button>
          <button class="auth-tab ${authTab === 'register' ? 'active' : ''}" id="tab-register">Create Account</button>
        </div>

        ${authError ? `<div class="login-error" id="auth-error"><span>⚠</span> ${authError}</div>` : ''}
        ${authSuccess ? `<div class="auth-success" id="auth-success"><span>✓</span> ${authSuccess}</div>` : ''}

        ${authTab === 'login' ? renderLoginForm() : renderRegisterForm()}

        <div class="login-trust-note">
          <span class="trust-icon">🔒</span>
          <span>Secured with encrypted authentication. Your credentials are never stored in plain text.</span>
        </div>
      </div>
    </div>
  `;
}

function renderLoginForm(): string {
  return `
    <form id="auth-form" class="login-form" autocomplete="off">
      <div class="form-group">
        <label class="form-label" for="login-username">Username</label>
        <div class="input-wrapper">
          <span class="input-icon">👤</span>
          <input type="text" id="login-username" class="form-input" placeholder="Enter username" autocomplete="username" required />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="login-password">Password</label>
        <div class="input-wrapper">
          <span class="input-icon">🔒</span>
          <input type="password" id="login-password" class="form-input" placeholder="Enter password" autocomplete="current-password" required />
        </div>
      </div>

      <button type="submit" class="login-btn" id="auth-submit" ${authLoading ? 'disabled' : ''}>
        ${authLoading ? '<span class="login-spinner"></span> Signing in...' : 'Sign In'}
      </button>

      <div class="login-actions">
        <a href="#" class="login-action-link" id="link-forgot-password">
          <span class="login-action-icon">🔑</span>
          Forgot password?
        </a>
      </div>
    </form>
  `;
}

function renderRegisterForm(): string {
  return `
    <form id="auth-form" class="login-form" autocomplete="off">
      <div class="form-group">
        <label class="form-label" for="reg-username">Username</label>
        <div class="input-wrapper">
          <span class="input-icon">👤</span>
          <input type="text" id="reg-username" class="form-input" placeholder="Choose a username" autocomplete="username" required minlength="3" maxlength="32" />
        </div>
        <span class="form-hint">3–32 characters, letters, numbers, underscores</span>
      </div>

      <div class="form-group">
        <label class="form-label" for="reg-email">Email</label>
        <div class="input-wrapper">
          <span class="input-icon">✉️</span>
          <input type="email" id="reg-email" class="form-input" placeholder="your@email.com" autocomplete="email" required />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="reg-password">Password</label>
        <div class="input-wrapper">
          <span class="input-icon">🔒</span>
          <input type="password" id="reg-password" class="form-input" placeholder="Min 6 characters" autocomplete="new-password" required minlength="6" />
        </div>
      </div>

      <div class="form-group">
        <label class="form-label" for="reg-confirm">Confirm Password</label>
        <div class="input-wrapper">
          <span class="input-icon">🔒</span>
          <input type="password" id="reg-confirm" class="form-input" placeholder="Repeat password" autocomplete="new-password" required />
        </div>
      </div>

      <button type="submit" class="login-btn" id="auth-submit" ${authLoading ? 'disabled' : ''}>
        ${authLoading ? '<span class="login-spinner"></span> Creating account...' : 'Create Account'}
      </button>
    </form>
  `;
}

function attachAuthListeners(): void {
  // Tab switching
  document.getElementById('tab-login')?.addEventListener('click', () => {
    authTab = 'login'; authError = null; authSuccess = null; render();
  });
  document.getElementById('tab-register')?.addEventListener('click', () => {
    authTab = 'register'; authError = null; authSuccess = null; render();
  });

  // Form submit
  const form = document.getElementById('auth-form');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (authTab === 'login') {
      await handleLogin();
    } else {
      await handleRegister();
    }
  });

  // Forgot password
  document.getElementById('link-forgot-password')?.addEventListener('click', (e) => {
    e.preventDefault();
    authError = null;
    authSuccess = 'Password reset is not available in this version. Please contact an administrator.';
    render();
  });
}

async function handleLogin(): Promise<void> {
  const username = (document.getElementById('login-username') as HTMLInputElement)?.value.trim();
  const password = (document.getElementById('login-password') as HTMLInputElement)?.value;

  if (!username || !password) {
    authError = 'Please enter both username and password';
    render(); return;
  }

  authLoading = true; authError = null; authSuccess = null; render();

  const result = await api.login({ username, password });
  authLoading = false;

  if (result.error) {
    authError = result.error.includes('401') ? 'Invalid username or password' : 'Connection failed. Is the backend running?';
    render(); return;
  }

  if (result.data) {
    saveAuth(result.data);
    authError = null; authSuccess = null;
    render(); loadAllData();
  }
}

async function handleRegister(): Promise<void> {
  const username = (document.getElementById('reg-username') as HTMLInputElement)?.value.trim();
  const email = (document.getElementById('reg-email') as HTMLInputElement)?.value.trim();
  const password = (document.getElementById('reg-password') as HTMLInputElement)?.value;
  const confirm = (document.getElementById('reg-confirm') as HTMLInputElement)?.value;

  // Client-side validation
  if (!username || !email || !password || !confirm) {
    authError = 'Please fill in all fields'; render(); return;
  }
  if (username.length < 3) {
    authError = 'Username must be at least 3 characters'; render(); return;
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(username)) {
    authError = 'Username can only contain letters, numbers, underscores, dots, hyphens'; render(); return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    authError = 'Please enter a valid email address'; render(); return;
  }
  if (password.length < 6) {
    authError = 'Password must be at least 6 characters'; render(); return;
  }
  if (password !== confirm) {
    authError = 'Passwords do not match'; render(); return;
  }

  authLoading = true; authError = null; authSuccess = null; render();

  const result = await api.register({ username, email, password, confirm_password: confirm });
  authLoading = false;

  if (result.error) {
    // Extract meaningful error
    if (result.error.includes('409')) {
      authError = result.error.includes('email') ? 'Email already registered' :
                  result.error.includes('Username') ? 'Username already exists' :
                  'Account already exists';
    } else if (result.error.includes('400')) {
      authError = 'Passwords do not match';
    } else if (result.error.includes('422')) {
      authError = 'Please check your input and try again';
    } else {
      authError = 'Connection failed. Is the backend running?';
    }
    render(); return;
  }

  if (result.data) {
    saveAuth(result.data);
    authError = null; authSuccess = null;
    render(); loadAllData();
  }
}

// ══════════════════════════════════════════════════════════════════
//  SIDEBAR
// ══════════════════════════════════════════════════════════════════
function renderSidebar(): string {
  const sqlStatus = dbStatus?.sqlserver.connected;
  const mysqlStatus = dbStatus?.mysql.connected;

  return `
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-brand">
        <div class="brand-icon">⚡</div>
        <div>
          <h1>NexusBridge</h1>
          <span class="subtitle">HR & Payroll Middleware</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-section-title">Overview</div>
          <div class="nav-item ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
            <span class="nav-icon">📊</span> Dashboard
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Databases</div>
          <div class="nav-item ${currentView === 'hr' ? 'active' : ''}" data-view="hr">
            <span class="nav-icon">👥</span> HR — HUMAN_2025
          </div>
          <div class="nav-item ${currentView === 'payroll' ? 'active' : ''}" data-view="payroll">
            <span class="nav-icon">💰</span> Payroll — PAYROLL_2026
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Tools</div>
          <div class="nav-item ${currentView === 'sync' ? 'active' : ''}" data-view="sync">
            <span class="nav-icon">🔄</span> Sync Status
          </div>
          <div class="nav-item ${currentView === 'activity' ? 'active' : ''}" data-view="activity">
            <span class="nav-icon">📋</span> Activity Log
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Intelligence</div>
          <div class="nav-item ${currentView === 'employee360' ? 'active' : ''}" data-view="employee360">
            <span class="nav-icon">🔍</span> Employee 360
          </div>
          <div class="nav-item ${currentView === 'reconciliation' ? 'active' : ''}" data-view="reconciliation">
            <span class="nav-icon">⚖️</span> Reconciliation
          </div>
          <div class="nav-item ${currentView === 'quality' ? 'active' : ''}" data-view="quality">
            <span class="nav-icon">🛡️</span> Data Quality
          </div>
          <div class="nav-item ${currentView === 'reports' ? 'active' : ''}" data-view="reports">
            <span class="nav-icon">📑</span> Reports
          </div>
        </div>
      </nav>

      <div class="sidebar-footer">
        <div class="connection-indicator">
          <span class="dot ${sqlStatus === undefined ? 'checking' : sqlStatus ? 'connected' : 'disconnected'}"></span>
          <span class="db-name">HUMAN_2025</span>
          <span class="db-engine">SQL Server</span>
        </div>
        <div class="connection-indicator">
          <span class="dot ${mysqlStatus === undefined ? 'checking' : mysqlStatus ? 'connected' : 'disconnected'}"></span>
          <span class="db-name">PAYROLL_2026</span>
          <span class="db-engine">MySQL</span>
        </div>
        ${authUser ? `
        <div class="sidebar-user">
          <div class="user-avatar">${authUser.username.charAt(0).toUpperCase()}</div>
          <div class="user-info">
            <span class="user-name">${authUser.username}</span>
            <span class="user-role">${authUser.role}</span>
          </div>
        </div>
        ` : ''}
      </div>
    </aside>
  `;
}

function renderHeader(): string {
  const titles: Record<string, string> = {
    dashboard: 'Executive Dashboard',
    hr: 'HUMAN_2025 — SQL Server',
    payroll: 'PAYROLL_2026 — MySQL',
    sync: 'Sync Status',
    activity: 'Activity Log',
    employee360: 'Unified Employee 360',
    reconciliation: 'Reconciliation Center',
    quality: 'Data Quality Monitor',
    reports: 'Actionable Reports'
  };
  const subtitles: Record<string, string> = {
    dashboard: 'Intelligent middleware metrics & health',
    hr: 'Schema explorer for HR database',
    payroll: 'Schema explorer for Payroll database',
    sync: 'Cross-database comparison',
    activity: 'Recent middleware operations',
    employee360: 'Search & view integrated HR/Payroll profiles',
    reconciliation: 'Detect & resolve cross-database anomalies',
    quality: 'Platform data integrity & sync score',
    reports: 'Generate read-only cross-db reports'
  };

  return `
    <header class="header">
      <div class="header-left">
        <div>
          <h2>${titles[currentView] || 'Dashboard'}</h2>
          <span class="breadcrumb">${subtitles[currentView] || ''}</span>
        </div>
      </div>
      <div class="header-right">
        <button class="header-btn" id="btn-refresh">🔄 Refresh</button>
        <button class="header-btn" id="btn-api-docs">📖 API Docs</button>
        <button class="header-btn header-btn-logout" id="btn-logout">🚪 Logout</button>
      </div>
    </header>
  `;
}

function renderPage(): string {
  switch (currentView) {
    case 'dashboard': return renderDashboard();
    case 'hr': return renderSchemaView('hr');
    case 'payroll': return renderSchemaView('payroll');
    case 'sync': return renderSyncView();
    case 'activity': return renderActivityView();
    case 'employee360': return renderEmployee360();
    case 'reconciliation': return renderReconciliation();
    case 'quality': return renderQuality();
    case 'reports': return renderReports();
    default: return renderDashboard();
  }
}

function renderDashboard(): string {
  const sqlConnected = dbStatus?.sqlserver.connected;
  const mysqlConnected = dbStatus?.mysql.connected;
  
  const healthScore = dataQuality?.health_score ?? '—';
  const reconAlerts = (reconciliationData?.summary?.missing_in_hr_count || 0) + (reconciliationData?.summary?.missing_in_payroll_count || 0);
  const anomalies = dataQuality?.salary_anomalies ?? 0;
  const totalEmployees = reconciliationData?.summary?.total_hr ?? '—';

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Integration Health</span>
          <span class="stat-icon">❤️</span>
        </div>
        <div class="stat-value ${healthScore >= 90 ? 'positive-text' : 'negative-text'}">${healthScore}%</div>
        <div class="stat-change ${healthScore >= 90 ? 'positive' : 'negative'}">System Sync Quality</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Reconciliation Alerts</span>
          <span class="stat-icon">⚖️</span>
        </div>
        <div class="stat-value ${reconAlerts > 0 ? 'negative-text' : 'positive-text'}">${reconAlerts}</div>
        <div class="stat-change ${reconAlerts > 0 ? 'negative' : 'positive'}">Missing Cross-Records</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Data Quality Index</span>
          <span class="stat-icon">🛡️</span>
        </div>
        <div class="stat-value ${anomalies > 0 ? 'negative-text' : 'positive-text'}">${anomalies} Issues</div>
        <div class="stat-change ${anomalies > 0 ? 'negative' : 'positive'}">Suspicious anomalies</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Unified Employee Count</span>
          <span class="stat-icon">👥</span>
        </div>
        <div class="stat-value">${totalEmployees}</div>
        <div class="stat-change positive">Master Records</div>
      </div>
    </div>
    
    <div class="stats-grid" style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(2, 1fr);">
      <div class="stat-card" style="border-left: 4px solid var(--sql-color)">
        <div class="stat-header">
          <span class="stat-label">SQL Server (HUMAN_2025)</span>
          <span class="stat-icon">🗄️</span>
        </div>
        <div class="stat-value"><span class="status-badge ${sqlConnected ? 'online' : 'offline'}">● ${sqlConnected ? 'Connected' : 'Offline'}</span></div>
      </div>
      <div class="stat-card" style="border-left: 4px solid var(--mysql-color)">
        <div class="stat-header">
          <span class="stat-label">MySQL (PAYROLL_2026)</span>
          <span class="stat-icon">🐬</span>
        </div>
        <div class="stat-value"><span class="status-badge ${mysqlConnected ? 'online' : 'offline'}">● ${mysqlConnected ? 'Connected' : 'Offline'}</span></div>
      </div>
    </div>
    
    <div class="content-grid mt-6">
      ${renderSchemaCard('HUMAN_2025', 'sql-server', hrSchema)}
      ${renderSchemaCard('PAYROLL_2026', 'mysql', payrollSchema)}
    </div>
  `;
}

function renderSchemaCard(title: string, badge: string, schema: SchemaResponse | null): string {
  if (!schema) {
    return `
      <div class="card">
        <div class="card-header">
          <h3>${title}</h3>
          <span class="card-badge ${badge}">${badge === 'sql-server' ? 'SQL Server' : 'MySQL'}</span>
        </div>
        <div class="card-body">
          <div class="loading-skeleton" style="height: 120px;"></div>
        </div>
      </div>
    `;
  }

  const tableEntries = Object.entries(schema.tables).slice(0, 8);
  const tableRows = tableEntries.map(([name, info]) => `
    <tr>
      <td class="mono">${name}</td>
      <td>${(info as {columns: unknown[]}).columns.length}</td>
      <td>${((info as {row_count: number}).row_count || 0).toLocaleString()}</td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <div class="card-header">
        <h3>${title} — ${schema.table_count} tables</h3>
        <span class="card-badge ${badge}">${schema.engine}</span>
      </div>
      <div class="card-body" style="padding: 0;">
        <table class="data-table">
          <thead>
            <tr>
              <th>Table</th>
              <th>Columns</th>
              <th>Rows</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows || '<tr><td colspan="3" style="text-align:center; padding:20px; color: var(--text-muted);">No tables discovered</td></tr>'}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderSchemaView(db: 'hr' | 'payroll'): string {
  const schema = db === 'hr' ? hrSchema : payrollSchema;
  const title = db === 'hr' ? 'HUMAN_2025' : 'PAYROLL_2026';
  const badge = db === 'hr' ? 'sql-server' : 'mysql';

  if (!schema) {
    return `
      <div class="card">
        <div class="card-header"><h3>Loading ${title} schema...</h3></div>
        <div class="card-body"><div class="loading-skeleton" style="height: 200px;"></div></div>
      </div>
    `;
  }

  const tableCards = Object.entries(schema.tables).map(([name, info]) => {
    const typedInfo = info as { columns: Array<{COLUMN_NAME: string; DATA_TYPE: string; IS_NULLABLE: string}>; row_count: number };
    const colRows = typedInfo.columns.map(c => `
      <tr>
        <td class="mono">${c.COLUMN_NAME || (c as unknown as Record<string,string>)['COLUMN_NAME'] || '—'}</td>
        <td>${c.DATA_TYPE || (c as unknown as Record<string,string>)['DATA_TYPE'] || '—'}</td>
        <td>${c.IS_NULLABLE || (c as unknown as Record<string,string>)['IS_NULLABLE'] || '—'}</td>
      </tr>
    `).join('');

    return `
      <div class="card" style="margin-bottom: 16px;">
        <div class="card-header">
          <h3 class="mono">${name}</h3>
          <span class="card-badge ${badge}">${typedInfo.row_count?.toLocaleString() || 0} rows</span>
        </div>
        <div class="card-body" style="padding: 0;">
          <table class="data-table">
            <thead><tr><th>Column</th><th>Type</th><th>Nullable</th></tr></thead>
            <tbody>${colRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  return tableCards || '<p style="color: var(--text-muted);">No tables found.</p>';
}

function renderSyncView(): string {
  const bothConnected = dbStatus?.sqlserver.connected && dbStatus?.mysql.connected;
  const syncLabel = bothConnected ? 'Both Online' : 'Degraded';
  const syncBadgeClass = bothConnected ? 'online' : 'offline';

  return `
    <div class="card">
      <div class="card-header">
        <h3>Cross-Database Sync Status</h3>
        <span class="card-badge sql-server">Read-Only</span>
      </div>
      <div class="card-body">
        <p style="color: var(--text-secondary); margin-bottom: 20px; line-height: 1.7;">
          The sync checker compares schemas between HUMAN_2025 and PAYROLL_2026 to detect discrepancies.
          No data is modified — this is a read-only diagnostic tool.
        </p>
        <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
          <span class="status-badge ${syncBadgeClass}">● ${syncLabel}</span>
        </div>
        <div class="stats-grid" style="margin-bottom: 0; grid-template-columns: repeat(2, 1fr);">
          <div class="stat-card">
            <div class="stat-header"><span class="stat-label">HR Tables</span><span class="stat-icon">🗄️</span></div>
            <div class="stat-value">${hrSchema?.table_count ?? '—'}</div>
            <div class="stat-change positive">HUMAN_2025</div>
          </div>
          <div class="stat-card">
            <div class="stat-header"><span class="stat-label">Payroll Tables</span><span class="stat-icon">🐬</span></div>
            <div class="stat-value">${payrollSchema?.table_count ?? '—'}</div>
            <div class="stat-change positive">PAYROLL_2026</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderActivityView(): string {
  return `
    <div class="card">
      <div class="card-header">
        <h3>Recent API Activity</h3>
        <span class="card-badge sql-server">Middleware</span>
      </div>
      <div class="card-body">
        <div class="activity-item">
          <div class="activity-icon read">📖</div>
          <div class="activity-text">
            <div class="action">Dashboard loaded — schema discovery executed</div>
            <div class="time">Just now</div>
          </div>
        </div>
        <div class="activity-item">
          <div class="activity-icon sync">🔄</div>
          <div class="activity-text">
            <div class="action">Database connection status checked</div>
            <div class="time">On page load</div>
          </div>
        </div>
        <div class="activity-item">
          <div class="activity-icon auth">🔑</div>
          <div class="activity-text">
            <div class="action">Auth module initialized</div>
            <div class="time">Startup</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Intelligence Platform Views ─────────────────────────────────

function renderEmployee360(): string {
  const searchUI = `
    <div class="search-container">
      <input type="text" id="emp-search-input" class="search-input" placeholder="Search by Name, ID, or Department..." value="${employeeSearchQuery}">
      <button class="primary-btn" id="btn-emp-search">${isSearching ? 'Searching...' : 'Search'}</button>
    </div>
  `;

  let resultsUI = '';
  if (employeeSearchResults) {
    if (employeeSearchResults.length === 0) {
      resultsUI = `<div class="empty-state">No employees found.</div>`;
    } else {
      resultsUI = `
        <table class="data-table mt-4">
          <thead>
            <tr><th>ID</th><th>Name</th><th>Department</th><th>Status</th><th>Payroll Sync</th><th>Action</th></tr>
          </thead>
          <tbody>
            ${employeeSearchResults.map(e => `
              <tr>
                <td>${e.EmployeeID}</td>
                <td>${e.FullName}</td>
                <td>${e.DepartmentName || '—'}</td>
                <td><span class="status-badge ${e.Status === 'Active' ? 'online' : 'offline'}">${e.Status || 'Unknown'}</span></td>
                <td>
                  ${e.HasPayroll ? `<span class="status-badge online">Synced ($${e.NetSalary})</span>` : `<span class="status-badge offline">Missing</span>`}
                </td>
                <td><button class="secondary-btn btn-view-emp" data-id="${e.EmployeeID}">View 360</button></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `;
    }
  }

  let profileUI = '';
  if (selectedEmployee) {
    const hr = selectedEmployee.hr;
    const pr = selectedEmployee.payroll;
    profileUI = `
      <div class="profile-card mt-6 fade-in">
        <div class="profile-header">
          <div class="profile-avatar">${hr.FullName?.charAt(0) || '?'}</div>
          <div class="profile-title-area">
            <h2>${hr.FullName}</h2>
            <p>${hr.PositionName || '—'} | ${hr.DepartmentName || '—'}</p>
          </div>
          <div class="profile-badge-area">
             <span class="card-badge sql-server">Integrated Profile</span>
          </div>
        </div>
        <div class="profile-body content-grid" style="grid-template-columns: 1fr 1fr; gap: 24px; padding: 24px;">
          <div class="profile-section hr-section card">
            <div class="card-header"><h3 style="margin:0; font-size: 1rem;">HR Data (HUMAN_2025)</h3></div>
            <div class="card-body">
              <div class="detail-grid">
                <div class="detail-item"><span>Employee ID</span><strong>${hr.EmployeeID}</strong></div>
                <div class="detail-item"><span>Hire Date</span><strong>${hr.HireDate || '—'}</strong></div>
                <div class="detail-item"><span>Email</span><strong>${hr.Email || '—'}</strong></div>
                <div class="detail-item"><span>Phone</span><strong>${hr.PhoneNumber || '—'}</strong></div>
                <div class="detail-item"><span>Status</span><strong>${hr.Status || '—'}</strong></div>
              </div>
            </div>
          </div>
          <div class="profile-section pr-section card">
            <div class="card-header"><h3 style="margin:0; font-size: 1rem;">Payroll Data (PAYROLL_2026)</h3></div>
            <div class="card-body">
              ${!pr || !pr.SalaryMonth ? `<div class="empty-state">No payroll data found</div>` : `
              <div class="detail-grid">
                <div class="detail-item"><span>Month</span><strong>${pr.SalaryMonth}</strong></div>
                <div class="detail-item"><span>Base Salary</span><strong>$${pr.BaseSalary}</strong></div>
                <div class="detail-item"><span>Bonus</span><strong>$${pr.Bonus}</strong></div>
                <div class="detail-item"><span>Deductions</span><strong>$${pr.Deductions}</strong></div>
                <div class="detail-item"><span>Net Salary</span><strong class="highlight" style="color: var(--primary)">$${pr.NetSalary}</strong></div>
              </div>
              `}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  return `
    <div class="card">
      <div class="card-header">
        <h3>Employee Directory</h3>
      </div>
      <div class="card-body">
        ${searchUI}
        ${resultsUI}
      </div>
    </div>
    ${profileUI}
  `;
}

function renderReconciliation(): string {
  if (!reconciliationData) return `<div class="loading-spinner">Loading...</div>`;
  
  const sum = reconciliationData.summary;
  const missingHr = reconciliationData.missing_in_hr;
  const missingPr = reconciliationData.missing_in_payroll;
  
  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header"><span class="stat-label">Total in HR</span><span class="stat-icon">👥</span></div>
        <div class="stat-value">${sum.total_hr}</div>
      </div>
      <div class="stat-card">
        <div class="stat-header"><span class="stat-label">Total in Payroll</span><span class="stat-icon">💰</span></div>
        <div class="stat-value">${sum.total_payroll}</div>
      </div>
      <div class="stat-card">
        <div class="stat-header"><span class="stat-label">Missing in Payroll</span><span class="stat-icon">⚠️</span></div>
        <div class="stat-value ${sum.missing_in_payroll_count > 0 ? 'negative-text' : 'positive-text'}">${sum.missing_in_payroll_count}</div>
      </div>
      <div class="stat-card">
        <div class="stat-header"><span class="stat-label">Missing in HR</span><span class="stat-icon">⚠️</span></div>
        <div class="stat-value ${sum.missing_in_hr_count > 0 ? 'negative-text' : 'positive-text'}">${sum.missing_in_hr_count}</div>
      </div>
    </div>
    
    <div class="content-grid mt-6">
      <div class="card">
        <div class="card-header"><h3>Found in HR, Missing in Payroll</h3></div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Status</th></tr></thead>
            <tbody>
              ${missingPr.length === 0 ? '<tr><td colspan="3" class="text-center">No discrepancies</td></tr>' : 
                missingPr.map((e: any) => `<tr><td>${e.EmployeeID}</td><td>${e.FullName}</td><td>${e.Status}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
      <div class="card">
        <div class="card-header"><h3>Found in Payroll, Missing in HR</h3></div>
        <div class="card-body" style="padding:0">
          <table class="data-table">
            <thead><tr><th>ID</th><th>Name</th><th>Status</th></tr></thead>
            <tbody>
              ${missingHr.length === 0 ? '<tr><td colspan="3" class="text-center">No discrepancies</td></tr>' : 
                missingHr.map((e: any) => `<tr><td>${e.EmployeeID}</td><td>${e.FullName}</td><td>${e.Status}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderQuality(): string {
  if (!dataQuality) return `<div class="loading-spinner">Loading...</div>`;
  const anomalies = dataQuality.anomalies_list;
  
  return `
    <div class="card mb-6">
      <div class="card-body" style="text-align: center; padding: 40px;">
        <h2 style="font-size: 3rem; color: ${dataQuality.health_score >= 90 ? 'var(--success)' : 'var(--danger)'}; margin-bottom: 10px;">
          ${dataQuality.health_score}%
        </h2>
        <p style="color: var(--text-muted); font-size: 1.1rem;">Overall Data Quality Score</p>
      </div>
    </div>
    
    <div class="card">
      <div class="card-header">
        <h3>Suspicious Salary Outliers</h3>
        <span class="card-badge mysql">${anomalies.length} Found</span>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr><th>Employee ID</th><th>Month</th><th>Base Salary</th><th>Bonus</th><th>Deductions</th><th>Net Salary</th></tr>
          </thead>
          <tbody>
            ${anomalies.length === 0 ? '<tr><td colspan="6" class="text-center">No anomalies detected</td></tr>' : 
              anomalies.map((a: any) => `
                <tr>
                  <td>${a.EmployeeID}</td><td>${a.SalaryMonth}</td>
                  <td>$${a.BaseSalary}</td><td>$${a.Bonus}</td>
                  <td>$${a.Deductions}</td><td style="color:var(--danger); font-weight:bold">$${a.NetSalary}</td>
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function renderReports(): string {
  const tabs = [
    { id: 'compensation', label: 'Employee Compensation' },
    { id: 'exceptions', label: 'Sync Exceptions' }
  ];

  const reportDataHtml = reportData ? `
    <div class="card mt-6 fade-in">
      <div class="card-header">
        <h3>${reportData.title}</h3>
        <button class="secondary-btn" onclick="window.print()">Print Report</button>
      </div>
      <div class="card-body" style="padding:0">
        <table class="data-table">
          <thead>
            <tr>
              ${Object.keys(reportData.data[0] || {}).map(k => `<th>${k}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            ${reportData.data.length === 0 ? '<tr><td colspan="100%" class="text-center">No data available</td></tr>' : 
              reportData.data.map((row: any) => `
                <tr>
                  ${Object.values(row).map(v => `<td>${v !== null ? v : '—'}</td>`).join('')}
                </tr>
              `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  ` : `<div class="empty-state mt-6">Select a report to generate</div>`;

  return `
    <div class="card">
      <div class="card-header"><h3>Report Generator</h3></div>
      <div class="card-body">
        <div style="display:flex; gap:16px;">
          ${tabs.map(t => `
            <button class="primary-btn report-tab ${currentReportType === t.id ? 'active' : ''}" data-type="${t.id}" style="${currentReportType !== t.id ? 'background:var(--bg-lighter); color:var(--text-main); border:1px solid var(--border-color)' : ''}">
              Generate ${t.label} Report
            </button>
          `).join('')}
        </div>
      </div>
    </div>
    ${reportDataHtml}
  `;
}

// ── Event Listeners ─────────────────────────────────────────────
function attachEventListeners(): void {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = (item as HTMLElement).dataset.view;
      if (view) { currentView = view; render(); }
    });
  });

  document.getElementById('btn-refresh')?.addEventListener('click', () => { loadAllData(); });
  document.getElementById('btn-api-docs')?.addEventListener('click', () => {
    window.open('http://localhost:8000/docs', '_blank');
  });

  document.getElementById('btn-logout')?.addEventListener('click', async () => {
    if (authToken) { await api.logout(authToken); }
    clearAuth();
    dbStatus = null; hrSchema = null; payrollSchema = null;
    currentView = 'dashboard'; authTab = 'login';
    render();
  });
  
  // Intelligence Events
  document.getElementById('btn-emp-search')?.addEventListener('click', async () => {
    const input = document.getElementById('emp-search-input') as HTMLInputElement;
    if (input) {
      employeeSearchQuery = input.value;
      isSearching = true;
      render();
      const res = await api.searchEmployees(employeeSearchQuery);
      employeeSearchResults = res.data || [];
      isSearching = false;
      render();
    }
  });
  
  document.querySelectorAll('.btn-view-emp').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const id = (e.currentTarget as HTMLElement).dataset.id;
      if (id) {
        const res = await api.getEmployee360(parseInt(id, 10));
        if (res.data) {
          selectedEmployee = res.data;
          render();
        }
      }
    });
  });
  
  document.querySelectorAll('.report-tab').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const type = (e.currentTarget as HTMLElement).dataset.type;
      if (type) {
        currentReportType = type;
        const res = await api.getReport(type);
        if (res.data) {
          reportData = res.data;
          render();
        }
      }
    });
  });
}

// ── Data Loading ────────────────────────────────────────────────
async function loadAllData(): Promise<void> {
  const [statusResult, hrResult, payrollResult, reconResult, qualityResult] = await Promise.all([
    api.dashboardStatus(), api.hrSchema(), api.payrollSchema(),
    api.getReconciliation(), api.getDataQuality()
  ]);
  
  if (statusResult.data) dbStatus = statusResult.data;
  if (hrResult.data) hrSchema = hrResult.data;
  if (payrollResult.data) payrollSchema = payrollResult.data;
  if (reconResult.data) reconciliationData = reconResult.data;
  if (qualityResult.data) dataQuality = qualityResult.data;
  
  if (currentView === 'reports') {
    const reportRes = await api.getReport(currentReportType);
    if (reportRes.data) reportData = reportRes.data;
  }
  
  render();
}

// ── Initialize ──────────────────────────────────────────────────
async function initApp(): Promise<void> {
  if (authToken) {
    const result = await api.me(authToken);
    if (result.error) { clearAuth(); render(); return; }
    if (result.data) {
      authUser = { username: result.data.username, role: result.data.role, email: result.data.email };
    }
    render(); loadAllData();
  } else {
    render();
  }
}

initApp();
