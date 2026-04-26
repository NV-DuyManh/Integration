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
          <h1 class="login-title">Integration</h1>
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
          <h1>Integration</h1>
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
    dashboard: 'Dashboard Overview',
    hr: 'HUMAN_2025 — SQL Server',
    payroll: 'PAYROLL_2026 — MySQL',
    sync: 'Sync Status',
    activity: 'Activity Log',
  };
  const subtitles: Record<string, string> = {
    dashboard: 'System health & database metrics',
    hr: 'Schema explorer for HR database',
    payroll: 'Schema explorer for Payroll database',
    sync: 'Cross-database comparison',
    activity: 'Recent middleware operations',
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
    default: return renderDashboard();
  }
}

function renderDashboard(): string {
  const hrTableCount = hrSchema?.table_count ?? '—';
  const payrollTableCount = payrollSchema?.table_count ?? '—';
  const sqlConnected = dbStatus?.sqlserver.connected;
  const mysqlConnected = dbStatus?.mysql.connected;

  let hrTotalRows = 0;
  let payrollTotalRows = 0;
  if (hrSchema?.tables) {
    for (const t of Object.values(hrSchema.tables)) { hrTotalRows += t.row_count || 0; }
  }
  if (payrollSchema?.tables) {
    for (const t of Object.values(payrollSchema.tables)) { payrollTotalRows += t.row_count || 0; }
  }

  const totalTables = (hrSchema?.table_count ?? 0) + (payrollSchema?.table_count ?? 0);

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">SQL Server</span>
          <span class="stat-icon">🗄️</span>
        </div>
        <div class="stat-value">
          <span class="status-badge ${sqlConnected === undefined ? 'checking' : sqlConnected ? 'online' : 'offline'}">
            ● ${sqlConnected === undefined ? 'Checking...' : sqlConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
        <div class="stat-change positive">HUMAN_2025</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">MySQL</span>
          <span class="stat-icon">🐬</span>
        </div>
        <div class="stat-value">
          <span class="status-badge ${mysqlConnected === undefined ? 'checking' : mysqlConnected ? 'online' : 'offline'}">
            ● ${mysqlConnected === undefined ? 'Checking...' : mysqlConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
        <div class="stat-change positive">PAYROLL_2026</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Total Tables</span>
          <span class="stat-icon">📋</span>
        </div>
        <div class="stat-value">${totalTables || '—'}</div>
        <div class="stat-change positive">${hrTableCount} HR · ${payrollTableCount} Payroll</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Total Records</span>
          <span class="stat-icon">💎</span>
        </div>
        <div class="stat-value">${(hrTotalRows + payrollTotalRows).toLocaleString()}</div>
        <div class="stat-change positive">${hrTotalRows.toLocaleString()} HR · ${payrollTotalRows.toLocaleString()} Payroll</div>
      </div>
    </div>
    <div class="content-grid">
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
}

// ── Data Loading ────────────────────────────────────────────────
async function loadAllData(): Promise<void> {
  const [statusResult, hrResult, payrollResult] = await Promise.all([
    api.dashboardStatus(), api.hrSchema(), api.payrollSchema(),
  ]);
  if (statusResult.data) dbStatus = statusResult.data;
  if (hrResult.data) hrSchema = hrResult.data;
  if (payrollResult.data) payrollSchema = payrollResult.data;
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
