// frontend/src/main.ts
// ─────────────────────────────────────────────────────────────────
//  HR & Payroll Middleware Dashboard — Main Entry
// ─────────────────────────────────────────────────────────────────
import './style.css';
import { api } from './api.ts';
import type { SystemStatus, SchemaResponse } from './api.ts';

// ── State ───────────────────────────────────────────────────────
let currentView = 'dashboard';
let dbStatus: SystemStatus | null = null;
let hrSchema: SchemaResponse | null = null;
let payrollSchema: SchemaResponse | null = null;

// ── Render ──────────────────────────────────────────────────────
function render(): void {
  const app = document.querySelector<HTMLDivElement>('#app')!;
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

  return `
    <header class="header">
      <div class="header-left">
        <h2>${titles[currentView] || 'Dashboard'}</h2>
      </div>
      <div class="header-right">
        <button class="header-btn" id="btn-refresh">🔄 Refresh</button>
        <button class="header-btn" id="btn-api-docs">
          📖 API Docs
        </button>
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

  // Calculate total rows
  let hrTotalRows = 0;
  let payrollTotalRows = 0;
  if (hrSchema?.tables) {
    for (const t of Object.values(hrSchema.tables)) {
      hrTotalRows += t.row_count || 0;
    }
  }
  if (payrollSchema?.tables) {
    for (const t of Object.values(payrollSchema.tables)) {
      payrollTotalRows += t.row_count || 0;
    }
  }

  return `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">SQL Server Status</span>
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
          <span class="stat-label">MySQL Status</span>
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
          <span class="stat-label">HR Tables</span>
          <span class="stat-icon">📋</span>
        </div>
        <div class="stat-value">${hrTableCount}</div>
        <div class="stat-change positive">${hrTotalRows.toLocaleString()} total rows</div>
      </div>

      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Payroll Tables</span>
          <span class="stat-icon">💳</span>
        </div>
        <div class="stat-value">${payrollTableCount}</div>
        <div class="stat-change positive">${payrollTotalRows.toLocaleString()} total rows</div>
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
        <div class="card-header">
          <h3>Loading ${title} schema...</h3>
        </div>
        <div class="card-body">
          <div class="loading-skeleton" style="height: 200px;"></div>
        </div>
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
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Nullable</th>
              </tr>
            </thead>
            <tbody>${colRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }).join('');

  return tableCards || '<p style="color: var(--text-muted);">No tables found.</p>';
}

function renderSyncView(): string {
  return `
    <div class="card">
      <div class="card-header">
        <h3>Cross-Database Sync Status</h3>
        <span class="card-badge sql-server">Read-Only</span>
      </div>
      <div class="card-body">
        <p style="color: var(--text-secondary); margin-bottom: 16px;">
          The sync checker compares schemas between HUMAN_2025 and PAYROLL_2026 to detect discrepancies.
          No data is modified — this is a read-only diagnostic tool.
        </p>
        <div class="stats-grid" style="margin-bottom: 0;">
          <div class="stat-card">
            <div class="stat-label">HR Tables</div>
            <div class="stat-value">${hrSchema?.table_count ?? '—'}</div>
          </div>
          <div class="stat-card">
            <div class="stat-label">Payroll Tables</div>
            <div class="stat-value">${payrollSchema?.table_count ?? '—'}</div>
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
            <div class="action">Auth module initialized (demo mode)</div>
            <div class="time">Startup</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Event Listeners ─────────────────────────────────────────────
function attachEventListeners(): void {
  // Nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = (item as HTMLElement).dataset.view;
      if (view) {
        currentView = view;
        render();
      }
    });
  });

  // Refresh button
  document.getElementById('btn-refresh')?.addEventListener('click', () => {
    loadAllData();
  });

  // API Docs button
  document.getElementById('btn-api-docs')?.addEventListener('click', () => {
    window.open('http://localhost:8000/docs', '_blank');
  });
}

// ── Data Loading ────────────────────────────────────────────────
async function loadAllData(): Promise<void> {
  // Load in parallel
  const [statusResult, hrResult, payrollResult] = await Promise.all([
    api.dashboardStatus(),
    api.hrSchema(),
    api.payrollSchema(),
  ]);

  if (statusResult.data) dbStatus = statusResult.data;
  if (hrResult.data) hrSchema = hrResult.data;
  if (payrollResult.data) payrollSchema = payrollResult.data;

  render();
}

// ── Initialize ──────────────────────────────────────────────────
render();
loadAllData();
