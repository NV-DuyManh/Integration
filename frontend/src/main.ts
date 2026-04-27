// frontend/src/main.ts
// ─────────────────────────────────────────────────────────────────
//  HR & Payroll Middleware Dashboard — Main Entry
// ─────────────────────────────────────────────────────────────────
import './style.css';
import './auth-theme.css';
import { api } from './api.ts';
import type { SystemStatus, SchemaResponse, AuthResponse } from './api.ts';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ── State ───────────────────────────────────────────────────────
let currentView = 'employee360';
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

// API explorer state
let apiExplorerQuery = '/api/dashboard/status';
let apiExplorerResponse: any = null;
let apiExplorerLoading = false;

// Global Search state

// Report state
let reportSearchQuery = '';
let reportSortColumn: string | null = null;
let reportSortDir: 'asc' | 'desc' = 'asc';

// ── Icons ───────────────────────────────────────────────────────
const ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>`,
  employee360: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
  reconciliation: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v18"></path><path d="M3 10l4-4 4 4"></path><path d="M7 6v15"></path><path d="M21 14l-4 4-4-4"></path><path d="M17 4v14"></path></svg>`,
  reports: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
  api_explorer: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 17 10 11 4 5"></polyline><line x1="12" y1="19" x2="20" y2="19"></line></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
  database: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"></path><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
  heart: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  user: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
  lock: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
  mail: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`
};

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

// ── Theme State ─────────────────────────────────────────────────
let currentTheme = localStorage.getItem('app_theme') || 'light-aurora';
function applyTheme(theme: string) {
  currentTheme = theme;
  localStorage.setItem('app_theme', theme);
  document.documentElement.setAttribute('data-theme', theme);
}
applyTheme(currentTheme);

// ── Export Utilities ────────────────────────────────────────────
(window as any).exportToExcel = function (btnElement: HTMLElement) {
  if (!reportData || !reportData.data || reportData.data.length === 0) return;
  const originalText = btnElement.innerHTML;
  btnElement.innerHTML = `<span style="margin-right:8px; animation: spin 1s linear infinite;">↻</span> Compiling...`;
  btnElement.style.pointerEvents = 'none';
  btnElement.style.opacity = '0.8';

  setTimeout(() => {
    const data = reportData.data;
    const worksheet = XLSX.utils.json_to_sheet(data);
    
    XLSX.utils.decode_range(worksheet['!ref'] || "A1:A1");
    worksheet['!autofilter'] = { ref: worksheet['!ref']! };
    
    const colWidths = Object.keys(data[0]).map(k => ({ wch: Math.max(k.length + 5, 15) }));
    worksheet['!cols'] = colWidths;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Report Data');
    
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const filename = `Employee_Compensation_Report_${dateStr}.xlsx`;
    
    XLSX.writeFile(workbook, filename, { bookType: 'xlsx', compression: true });

    btnElement.innerHTML = `<span style="margin-right:8px; color: var(--success);">✓</span> Exported`;
    setTimeout(() => {
      btnElement.innerHTML = originalText;
      btnElement.style.pointerEvents = 'auto';
      btnElement.style.opacity = '1';
    }, 2000);
  }, 500);
};

(window as any).exportToPDF = async function (btnElement: HTMLElement) {
  if (!reportData || !reportData.data || reportData.data.length === 0) return;
  const originalText = btnElement.innerHTML;
  btnElement.innerHTML = `<span style="margin-right:8px; animation: spin 1s linear infinite;">↻</span> Generating...`;
  btnElement.style.pointerEvents = 'none';
  btnElement.style.opacity = '0.8';

  try {
    const doc = new jsPDF('landscape');
    
    // Embed Roboto fonts for Vietnamese Unicode support
    const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    };

    const [regRes, boldRes] = await Promise.all([
      fetch('/Roboto-Regular.ttf'),
      fetch('/Roboto-Bold.ttf')
    ]);
    
    if (regRes.ok && boldRes.ok) {
      const regBuf = await regRes.arrayBuffer();
      const boldBuf = await boldRes.arrayBuffer();
      doc.addFileToVFS('Roboto-Regular.ttf', arrayBufferToBase64(regBuf));
      doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
      doc.addFileToVFS('Roboto-Bold.ttf', arrayBufferToBase64(boldBuf));
      doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');
      doc.setFont('Roboto');
    }

    const data = reportData.data;
    const headers = Object.keys(data[0]);
    // Normalize strings to prevent mojibake/double encoding
    const rows = data.map((row: any) => headers.map(h => row[h] !== null && row[h] !== undefined ? String(row[h]).normalize('NFC') : '—'));

    // Design: Executive Header
    doc.setFillColor(30, 41, 59); // Dark blue header bg
    doc.rect(0, 0, 297, 40, 'F');
    
    // Logo / Branding
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('Roboto', 'bold');
    doc.text('NexusBridge', 14, 22);
    
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('HR & PAYROLL MIDDLEWARE PLATFORM', 14, 30);

    // Report Title & Meta
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(18);
    doc.setFont('Roboto', 'bold');
    doc.text(String(reportData.title).normalize('NFC'), 14, 55);
    
    doc.setFontSize(10);
    doc.setFont('Roboto', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 62);
    
    // Summary Cards
    doc.setFillColor(241, 245, 249);
    doc.rect(14, 68, 60, 20, 'F');
    doc.setTextColor(71, 85, 105);
    doc.setFontSize(9);
    doc.text('TOTAL RECORDS', 18, 76);
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('Roboto', 'bold');
    doc.text(String(data.length), 18, 83);

    // Table
    autoTable(doc, {
      startY: 95,
      head: [headers],
      body: rows,
      theme: 'grid',
      styles: { font: 'Roboto', fontStyle: 'normal', fontSize: 9, cellPadding: 4, textColor: [51, 65, 85] },
      headStyles: { font: 'Roboto', fontStyle: 'bold', fillColor: [79, 70, 229], textColor: 255 },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index > 0) {
           const headerText = headers[data.column.index].toLowerCase();
           if (headerText.includes('salary') || headerText.includes('bonus') || headerText.includes('deduction') || !isNaN(Number(data.cell.raw))) {
              data.cell.styles.halign = 'right';
              const num = Number(data.cell.raw);
              if (!isNaN(num) && (headerText.includes('salary') || headerText.includes('bonus') || headerText.includes('deduction'))) {
                 data.cell.text = ['₫ ' + num.toLocaleString()];
              }
           }
        }
      },
      didDrawPage: function (data) {
        doc.setFontSize(8);
        doc.setFont('Roboto', 'normal');
        doc.setTextColor(148, 163, 184);
        doc.text(
          'NexusBridge Enterprise Reporting • Page ' + (doc as any).internal.getNumberOfPages(),
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      }
    });

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    doc.save(`NexusBridge_Report_${dateStr}.pdf`);

    btnElement.innerHTML = `<span style="margin-right:8px; color: var(--success);">✓</span> Downloaded`;
  } catch (error) {
    console.error("PDF Export error:", error);
    btnElement.innerHTML = `<span style="margin-right:8px; color: var(--danger);">✗</span> Failed`;
  } finally {
    setTimeout(() => {
      btnElement.innerHTML = originalText;
      btnElement.style.pointerEvents = 'auto';
      btnElement.style.opacity = '1';
    }, 2000);
  }
};

(window as any).sortReport = function(column: string) {
  if (reportSortColumn === column) {
    reportSortDir = reportSortDir === 'asc' ? 'desc' : 'asc';
  } else {
    reportSortColumn = column;
    reportSortDir = 'asc';
  }
  const pageContent = document.querySelector('.page-content');
  if (pageContent) {
    pageContent.innerHTML = renderPage();
    (window as any)._attachReportListeners();
  }
};

(window as any).searchReport = function(query: string) {
  reportSearchQuery = query.toLowerCase();
  const pageContent = document.querySelector('.page-content');
  if (pageContent) {
    pageContent.innerHTML = renderPage();
    (window as any)._attachReportListeners();
    // Maintain focus
    setTimeout(() => {
       const input = document.getElementById('report-search-input') as HTMLInputElement;
       if (input) {
         input.focus();
         input.setSelectionRange(input.value.length, input.value.length);
       }
    }, 0);
  }
};



// ── Render ──────────────────────────────────────────────────────
function render(): void {
  const app = document.querySelector<HTMLDivElement>('#app')!;

  if (!authToken || !authUser) {
    document.body.classList.add('auth-mode');
    app.innerHTML = renderAuthPage();
    attachAuthListeners();
    return;
  }
  
  document.body.classList.remove('auth-mode');

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
    <div class="auth-split-layout">
      
      <!-- LEFT HERO SECTION -->
      <div class="auth-hero">
        <div class="auth-hero-bg">
           <div class="auth-hero-orb auth-hero-orb-1"></div>
           <div class="auth-hero-orb auth-hero-orb-2"></div>
        </div>
        
        <div class="auth-hero-content">
          <div class="auth-hero-logo">${ICONS.bolt} NexusBridge</div>
          <h1 class="auth-hero-title">Unified HR & Payroll Intelligence</h1>
          <p class="auth-hero-subtitle">Connect HR and Payroll data into one intelligent workspace.</p>
          
          <div class="auth-hero-features">
            <div class="auth-feature">
              <span class="auth-feature-icon">${ICONS.user}</span>
              <span class="auth-feature-text">Employee 360 Analytics</span>
            </div>
            <div class="auth-feature">
              <span class="auth-feature-icon">${ICONS.database}</span>
              <span class="auth-feature-text">Reconciliation Intelligence</span>
            </div>
            <div class="auth-feature">
              <span class="auth-feature-icon">${ICONS.reports}</span>
              <span class="auth-feature-text">Executive Reporting</span>
            </div>
          </div>
          
          <div class="auth-hero-badges">
            <span class="auth-badge">SQL Server</span>
            <span class="auth-badge">MySQL</span>
            <span class="auth-badge">Secure Auth</span>
          </div>
        </div>
      </div>

      <!-- RIGHT AUTH PANEL -->
      <div class="auth-panel">
        <div class="auth-card">
          <div class="auth-header">
            <h2 class="auth-title">Welcome back</h2>
            <p class="auth-subtitle">Sign in to your account to continue</p>
          </div>

          <div class="auth-tabs">
            <button class="auth-tab ${authTab === 'login' ? 'active' : ''}" id="tab-login">Sign In</button>
            <button class="auth-tab ${authTab === 'register' ? 'active' : ''}" id="tab-register">Create Account</button>
          </div>

          ${authError ? `<div class="auth-alert error"><span>⚠</span> ${authError}</div>` : ''}
          ${authSuccess ? `<div class="auth-alert success"><span>✓</span> ${authSuccess}</div>` : ''}

          ${authTab === 'login' ? renderLoginForm() : renderRegisterForm()}
        </div>
      </div>

    </div>
  `;
}

function renderLoginForm(): string {
  return `
    <form id="auth-form" class="auth-form" autocomplete="off">
      <div class="auth-group">
        <label class="auth-label" for="login-username">Username</label>
        <div class="auth-input-wrap">
          <input type="text" id="login-username" class="auth-input" placeholder="Enter username" autocomplete="username" required />
        </div>
      </div>

      <div class="auth-group">
        <div class="auth-label-row">
          <label class="auth-label" for="login-password">Password</label>
          <a href="#" class="auth-link-small" id="link-forgot-password">Forgot password?</a>
        </div>
        <div class="auth-input-wrap">
          <input type="password" id="login-password" class="auth-input" placeholder="Enter password" autocomplete="current-password" required />
          <button type="button" class="auth-toggle-pwd" tabindex="-1">👁</button>
        </div>
      </div>

      <div class="auth-options">
        <label class="auth-checkbox">
          <input type="checkbox" id="login-remember" />
          <span>Remember me for 30 days</span>
        </label>
      </div>

      <button type="submit" class="auth-btn" id="auth-submit" ${authLoading ? 'disabled' : ''}>
        ${authLoading ? '<span class="auth-spinner"></span>' : ''} ${authLoading ? 'Signing in...' : 'Sign in'}
      </button>
    </form>
  `;
}

function renderRegisterForm(): string {
  return `
    <form id="auth-form" class="auth-form" autocomplete="off">
      <div class="auth-group">
        <label class="auth-label" for="reg-username">Username</label>
        <div class="auth-input-wrap">
          <input type="text" id="reg-username" class="auth-input" placeholder="Choose a username" autocomplete="username" required minlength="3" maxlength="32" />
        </div>
      </div>

      <div class="auth-group">
        <label class="auth-label" for="reg-email">Work Email</label>
        <div class="auth-input-wrap">
          <input type="email" id="reg-email" class="auth-input" placeholder="name@company.com" autocomplete="email" required />
        </div>
      </div>

      <div class="auth-group">
        <label class="auth-label" for="reg-password">Password</label>
        <div class="auth-input-wrap">
          <input type="password" id="reg-password" class="auth-input" placeholder="Create a password" autocomplete="new-password" required minlength="6" />
          <button type="button" class="auth-toggle-pwd" tabindex="-1">👁</button>
        </div>
        <div class="auth-strength">
           <div class="auth-strength-bar" id="str-1"></div>
           <div class="auth-strength-bar" id="str-2"></div>
           <div class="auth-strength-bar" id="str-3"></div>
           <div class="auth-strength-bar" id="str-4"></div>
        </div>
        <div class="auth-strength-text" id="str-text">Password strength</div>
      </div>

      <div class="auth-group">
        <label class="auth-label" for="reg-confirm">Confirm Password</label>
        <div class="auth-input-wrap">
          <input type="password" id="reg-confirm" class="auth-input" placeholder="Repeat password" autocomplete="new-password" required minlength="6" />
        </div>
      </div>

      <button type="submit" class="auth-btn" id="auth-submit" ${authLoading ? 'disabled' : ''}>
        ${authLoading ? '<span class="auth-spinner"></span>' : ''} ${authLoading ? 'Creating account...' : 'Create Account'}
      </button>

      <p class="auth-terms">
        By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
      </p>
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
    authSuccess = 'Password reset instructions have been sent to your email (Simulated).';
    render();
  });

  // Toggle password visibility
  document.querySelectorAll('.auth-toggle-pwd').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const input = (e.currentTarget as HTMLElement).previousElementSibling as HTMLInputElement;
      if (input && input.tagName === 'INPUT') {
        if (input.type === 'password') {
          input.type = 'text';
          (e.currentTarget as HTMLElement).textContent = '🙈';
        } else {
          input.type = 'password';
          (e.currentTarget as HTMLElement).textContent = '👁';
        }
      }
    });
  });

  // Password strength indicator
  const pwdInput = document.getElementById('reg-password') as HTMLInputElement;
  if (pwdInput) {
    pwdInput.addEventListener('input', (e) => {
      const val = (e.target as HTMLInputElement).value;
      let strength = 0;
      if (val.length >= 6) strength++;
      if (val.match(/[A-Z]/)) strength++;
      if (val.match(/[0-9]/)) strength++;
      if (val.match(/[^a-zA-Z0-9]/)) strength++;

      const bars = [
        document.getElementById('str-1'),
        document.getElementById('str-2'),
        document.getElementById('str-3'),
        document.getElementById('str-4')
      ];
      const strText = document.getElementById('str-text');
      
      const colors = ['#ef4444', '#f59e0b', '#22c55e', '#10b981'];
      const labels = ['Weak', 'Fair', 'Good', 'Strong'];

      bars.forEach((bar, i) => {
        if (bar) {
          bar.style.background = i < strength ? colors[i] : '#e2e8f0';
        }
      });
      if (strText) {
        strText.textContent = val.length === 0 ? 'Password strength' : labels[Math.max(0, strength-1)];
        strText.style.color = val.length === 0 ? 'var(--auth-text-muted)' : colors[Math.max(0, strength-1)];
      }
    });
  }
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
  if (password !== confirm) {
    authError = 'Passwords do not match'; render(); return;
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
    authError = null; 
    authSuccess = 'Account created successfully! Loading dashboard...';
    render(); 
    
    // Short delay so user can see the success message
    setTimeout(() => {
      loadAllData();
    }, 1500);
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
        <div class="brand-icon">${ICONS.bolt}</div>
        <div>
          <h1>NexusBridge</h1>
          <span class="subtitle">HR & Payroll Middleware</span>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div class="nav-section">
          <div class="nav-item ${currentView === 'employee360' ? 'active' : ''}" data-view="employee360">
            <span class="nav-icon">${ICONS.employee360}</span> Employee 360
          </div>
          <div class="nav-item ${currentView === 'dashboard' ? 'active' : ''}" data-view="dashboard">
            <span class="nav-icon">${ICONS.dashboard}</span> Dashboard
          </div>
          <div class="nav-item ${currentView === 'reconciliation' ? 'active' : ''}" data-view="reconciliation">
            <span class="nav-icon">${ICONS.reconciliation}</span> Reconciliation
          </div>
          <div class="nav-item ${currentView === 'reports' ? 'active' : ''}" data-view="reports">
            <span class="nav-icon">${ICONS.reports}</span> Reports
          </div>
        </div>

        <div class="nav-section">
          <div class="nav-section-title">Developer</div>
          <div class="nav-item ${currentView === 'api_explorer' ? 'active' : ''}" data-view="api_explorer">
            <span class="nav-icon">${ICONS.api_explorer}</span> API Explorer
          </div>
          <div class="nav-item ${currentView === 'settings' ? 'active' : ''}" data-view="settings">
            <span class="nav-icon">${ICONS.settings}</span> Settings
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
    employee360: 'Employee 360',
    dashboard: 'Executive Dashboard',
    reconciliation: 'Reconciliation Center',
    reports: 'Actionable Reports',
    api_explorer: 'API Explorer',
    settings: 'Settings'
  };
  const subtitles: Record<string, string> = {
    employee360: 'Search & view integrated HR/Payroll profiles',
    dashboard: 'Intelligent middleware metrics & health',
    reconciliation: 'Detect & resolve cross-database anomalies',
    reports: 'Generate read-only cross-db reports',
    api_explorer: 'Test endpoints and view live schema data',
    settings: 'System configuration and preferences'
  };

  return `
    <header class="header">
      <div class="header-left">
        <div>
          <h2>${titles[currentView] || 'Dashboard'}</h2>
          <span class="breadcrumb">${subtitles[currentView] || ''}</span>
        </div>
      </div>
      <div class="header-right" style="display: flex; gap: 16px; align-items: center;">
        <div class="global-search" style="position: relative;">
          <input type="text" id="global-search-input" placeholder="Search employees..." style="background: var(--bg-card-solid); border: 1px solid var(--border); padding: 8px 12px 8px 32px; border-radius: var(--radius-sm); color: var(--text-primary); width: 220px; font-size: 13px;">
          <span style="position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--text-muted); width: 14px; height: 14px;">${ICONS.search}</span>
        </div>
        <button class="header-btn" id="btn-refresh"><span style="width: 14px; height: 14px">${ICONS.refresh}</span> Refresh</button>
        <button class="header-btn header-btn-logout" id="btn-logout"><span style="width: 14px; height: 14px">${ICONS.logout}</span> Logout</button>
      </div>
    </header>
  `;
}

function renderPage(): string {
  switch (currentView) {
    case 'employee360': return renderEmployee360();
    case 'dashboard': return renderDashboard();
    case 'reconciliation': return renderReconciliation();
    case 'reports': return renderReports();
    case 'api_explorer': return renderApiExplorer();
    case 'settings': return renderSettings();
    default: return renderEmployee360();
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
          <span class="stat-icon" style="width:20px;height:20px">${ICONS.heart}</span>
        </div>
        <div class="stat-value ${healthScore >= 90 ? 'positive-text' : 'negative-text'}">${healthScore}%</div>
        <div style="height: 4px; background: var(--border-light); border-radius: 2px; margin-bottom: 12px; overflow: hidden;">
           <div style="height: 100%; width: ${healthScore}%; background: var(--success); border-radius: 2px; transition: width 1.5s var(--spring);"></div>
        </div>
        <div class="stat-change ${healthScore >= 90 ? 'positive' : 'negative'}">System Sync Quality</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Reconciliation Alerts</span>
          <span class="stat-icon" style="width:20px;height:20px">${ICONS.reconciliation}</span>
        </div>
        <div class="stat-value ${reconAlerts > 0 ? 'negative-text' : 'positive-text'}">${reconAlerts}</div>
        <div style="height: 24px; display: flex; align-items: flex-end; gap: 4px; margin-bottom: 12px;">
           ${[4, 8, 3, 10, 5, 2, reconAlerts].map(val => `<div style="flex: 1; background: ${reconAlerts > 0 ? 'var(--danger)' : 'var(--success)'}; height: ${Math.max(10, val * 5)}%; border-radius: 2px; opacity: 0.8; transition: height 0.5s ease;"></div>`).join('')}
        </div>
        <div class="stat-change ${reconAlerts > 0 ? 'negative' : 'positive'}">Missing Cross-Records</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Data Quality Index</span>
          <span class="stat-icon" style="width:20px;height:20px">${ICONS.alert}</span>
        </div>
        <div class="stat-value ${anomalies > 0 ? 'negative-text' : 'positive-text'}">${anomalies} Issues</div>
        <div style="height: 24px; display: flex; align-items: center; margin-bottom: 12px; position: relative;">
          <svg viewBox="0 0 100 20" style="width: 100%; height: 100%; overflow: visible; stroke: var(--warning); stroke-width: 2; fill: none; stroke-linecap: round; stroke-linejoin: round;">
            <path d="M 0,10 L 20,15 L 40,5 L 60,18 L 80,8 L 100,12" style="stroke-dasharray: 200; stroke-dashoffset: 0; animation: draw 2s ease-out forwards;"></path>
          </svg>
        </div>
        <div class="stat-change ${anomalies > 0 ? 'negative' : 'positive'}">Suspicious anomalies</div>
      </div>
      <div class="stat-card">
        <div class="stat-header">
          <span class="stat-label">Unified Employee Count</span>
          <span class="stat-icon" style="width:20px;height:20px">${ICONS.user}</span>
        </div>
        <div class="stat-value">${totalEmployees}</div>
        <div style="height: 4px; background: var(--border-light); border-radius: 2px; margin-bottom: 12px; overflow: hidden;">
           <div style="height: 100%; width: 100%; background: var(--info); border-radius: 2px; transition: width 1.5s var(--spring);"></div>
        </div>
        <div class="stat-change positive">Master Records</div>
      </div>
    </div>
    
    <div class="stats-grid" style="margin-top: 1.5rem; display: grid; grid-template-columns: repeat(2, 1fr);">
      <div class="stat-card" style="border-left: 4px solid var(--sql-color)">
        <div class="stat-header">
          <span class="stat-label">SQL Server (HUMAN_2025)</span>
          <span class="stat-icon" style="width:20px;height:20px">${ICONS.database}</span>
        </div>
        <div class="stat-value"><span class="status-badge ${sqlConnected ? 'online' : 'offline'}">● ${sqlConnected ? 'Connected' : 'Offline'}</span></div>
      </div>
      <div class="stat-card" style="border-left: 4px solid var(--mysql-color)">
        <div class="stat-header">
          <span class="stat-label">MySQL (PAYROLL_2026)</span>
          <span class="stat-icon" style="width:20px;height:20px">${ICONS.database}</span>
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
      <td>${(info as { columns: unknown[] }).columns.length}</td>
      <td>${((info as { row_count: number }).row_count || 0).toLocaleString()}</td>
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

// ── Intelligence Platform Views ─────────────────────────────────

function renderEmployee360(): string {
  const searchUI = `
    <div class="hero-section card" style="background: var(--bg-card); border: 1px solid var(--border-accent); padding: 56px 32px; text-align: center; position: relative; overflow: hidden; margin-bottom: 32px; box-shadow: var(--shadow-glow); border-radius: var(--radius-xl);">
      <div style="position: absolute; top: 0; left: 0; right: 0; height: 6px; background: var(--gradient-accent);"></div>
      <div style="position: relative; z-index: 10;">
        <div style="width: 72px; height: 72px; background: var(--accent-glow); color: var(--accent); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; font-size: 32px; box-shadow: 0 0 24px var(--accent-glow);">
           <span style="width: 36px; height: 36px;">${ICONS.search}</span>
        </div>
        <h2 style="font-size: 36px; margin-bottom: 16px; font-weight: 800; letter-spacing: -0.03em; color: var(--text-primary); text-shadow: 0 2px 10px rgba(0,0,0,0.05);">Employee Intelligence 360</h2>
        <p style="font-size: 17px; color: var(--text-secondary); margin-bottom: 40px; max-width: 640px; margin-left: auto; margin-right: auto; line-height: 1.6;">
          Instantly retrieve unified HR and Payroll records across systems. Enter an ID, Name, or Department to begin your search.
        </p>
        <div class="search-container" style="max-width: 680px; margin: 0 auto; display: flex; gap: 12px; background: var(--bg-card-solid); padding: 10px; border-radius: 999px; border: 1px solid var(--border-accent); box-shadow: var(--shadow-md); transition: all var(--transition);">
          <input type="text" id="emp-search-input" class="search-input" style="border: none; background: transparent; font-size: 16px; padding: 12px 24px; border-radius: 999px;" placeholder="Search across all systems..." value="${employeeSearchQuery}">
          <button class="primary-btn" id="btn-emp-search" style="padding: 12px 36px; font-size: 16px; border-radius: 999px;">${isSearching ? 'Searching...' : 'Search Employee'}</button>
        </div>
        <div class="search-suggestions" style="margin-top: 24px; font-size: 14px; color: var(--text-muted);">
          <span style="margin-right: 8px;">Suggested queries:</span>
          <span class="suggestion-tag" style="cursor: pointer; padding: 6px 16px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 999px; margin: 0 4px; transition: all 0.2s; font-weight: 500;" onmouseover="this.style.background='var(--accent-glow)';this.style.color='var(--accent)';this.style.borderColor='var(--accent-border)';" onmouseout="this.style.background='var(--bg-primary)';this.style.color='var(--text-muted)';this.style.borderColor='var(--border)';" onclick="document.getElementById('emp-search-input').value='Smith'; document.getElementById('btn-emp-search').click()">Smith</span>
          <span class="suggestion-tag" style="cursor: pointer; padding: 6px 16px; background: var(--bg-primary); border: 1px solid var(--border); border-radius: 999px; margin: 0 4px; transition: all 0.2s; font-weight: 500;" onmouseover="this.style.background='var(--accent-glow)';this.style.color='var(--accent)';this.style.borderColor='var(--accent-border)';" onmouseout="this.style.background='var(--bg-primary)';this.style.color='var(--text-muted)';this.style.borderColor='var(--border)';" onclick="document.getElementById('emp-search-input').value='Engineering'; document.getElementById('btn-emp-search').click()">Engineering Department</span>
        </div>
      </div>
    </div>
  `;

  let resultsUI = '';
  if (employeeSearchResults) {
    if (employeeSearchResults.length === 0) {
      resultsUI = `<div class="empty-state">No employees found matching "${employeeSearchQuery}".</div>`;
    } else {
      resultsUI = `
        <div class="card fade-in">
          <div class="card-header">
            <h3>Search Results</h3>
            <span class="card-badge sql-server">${employeeSearchResults.length} found</span>
          </div>
          <div class="card-body" style="padding: 0;">
            <table class="data-table">
              <thead>
                <tr><th>Employee ID</th><th>Full Name</th><th>Department</th><th>Status</th><th>Payroll Sync</th><th>Action</th></tr>
              </thead>
              <tbody>
                ${employeeSearchResults.map(e => `
                  <tr>
                    <td class="mono">${e.EmployeeID}</td>
                    <td style="font-weight: 600;">${e.FullName}</td>
                    <td>${e.DepartmentName || '—'}</td>
                    <td><span class="status-badge ${e.Status === 'Active' ? 'online' : 'offline'}">● ${e.Status || 'Unknown'}</span></td>
                    <td>
                      ${e.HasPayroll ? `<span class="status-badge online">● Synced ($${e.NetSalary})</span>` : `<span class="status-badge offline">● Missing Data</span>`}
                    </td>
                    <td><button class="secondary-btn btn-view-emp" data-id="${e.EmployeeID}">View 360 Profile</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;
    }
  }

  let profileUI = '';
  if (selectedEmployee) {
    const hr = selectedEmployee.hr;
    const pr = selectedEmployee.payroll;
    profileUI = `
      <div class="profile-card mt-6 fade-in" style="margin-top: 32px; border: 1px solid var(--border); box-shadow: var(--shadow-lg);">
        <div class="profile-header" style="background: linear-gradient(135deg, rgba(99,102,241,0.05) 0%, rgba(139,92,246,0.05) 100%); border-bottom: 1px solid var(--border); padding: 32px;">
          <div class="profile-avatar" style="width: 80px; height: 80px; font-size: 32px;">${hr.FullName?.charAt(0) || '?'}</div>
          <div class="profile-title-area">
            <h2 style="font-size: 24px; font-weight: 800; color: var(--text-primary);">${hr.FullName}</h2>
            <p style="font-size: 15px; color: var(--text-secondary);">${hr.PositionName || '—'} • ${hr.DepartmentName || '—'}</p>
          </div>
          <div class="profile-badge-area">
             <span class="card-badge sql-server" style="background: rgba(99,102,241,0.1); border-color: var(--accent); color: var(--accent-hover);">Master Record Connected</span>
          </div>
        </div>
        <div class="profile-body content-grid" style="grid-template-columns: 1fr 1fr; gap: 0; padding: 0;">
          <div class="profile-section hr-section" style="padding: 32px; border-right: 1px solid var(--border);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
               <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--info-bg); color: var(--info); display: flex; align-items: center; justify-content: center;">
                 <span style="width: 16px; height: 16px;">${ICONS.database}</span>
               </div>
               <h3 style="margin:0; font-size: 1.1rem;">HR Master Data</h3>
               <span class="card-badge sql-server" style="margin-left: auto;">HUMAN_2025</span>
            </div>
            <div class="detail-grid">
              <div class="detail-item"><span>Employee ID</span><strong class="mono">${hr.EmployeeID}</strong></div>
              <div class="detail-item"><span>Hire Date</span><strong>${hr.HireDate || '—'}</strong></div>
              <div class="detail-item"><span>Email</span><strong>${hr.Email || '—'}</strong></div>
              <div class="detail-item"><span>Phone</span><strong>${hr.PhoneNumber || '—'}</strong></div>
              <div class="detail-item"><span>Status</span><span class="status-badge ${hr.Status === 'Active' ? 'online' : 'offline'}">● ${hr.Status || '—'}</span></div>
            </div>
          </div>
          <div class="profile-section pr-section" style="padding: 32px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
               <div style="width: 32px; height: 32px; border-radius: 8px; background: var(--warning-bg); color: var(--warning); display: flex; align-items: center; justify-content: center;">
                 <span style="width: 16px; height: 16px;">${ICONS.database}</span>
               </div>
               <h3 style="margin:0; font-size: 1.1rem;">Payroll & Compensation</h3>
               <span class="card-badge mysql" style="margin-left: auto;">PAYROLL_2026</span>
            </div>
            ${!pr || !pr.SalaryMonth ? `
              <div class="empty-state" style="background: rgba(248,113,113,0.05); color: var(--danger); border: 1px dashed rgba(248,113,113,0.2);">
                <div style="font-size: 24px; margin-bottom: 12px;">⚠️</div>
                No payroll record found for this employee.
              </div>
            ` : `
              <div class="detail-grid">
                <div class="detail-item"><span>Payroll Month</span><strong>${pr.SalaryMonth}</strong></div>
                <div class="detail-item"><span>Base Salary</span><strong style="color: var(--text-primary);">$${pr.BaseSalary?.toLocaleString() || 0}</strong></div>
                <div class="detail-item"><span>Bonus</span><strong style="color: var(--success);">$${pr.Bonus?.toLocaleString() || 0}</strong></div>
                <div class="detail-item"><span>Deductions</span><strong style="color: var(--danger);">-$${pr.Deductions?.toLocaleString() || 0}</strong></div>
                <div class="detail-item" style="border-top: 1px solid var(--border); margin-top: 8px; padding-top: 16px;">
                   <span style="font-size: 15px; font-weight: 600; color: var(--text-primary);">Net Salary</span>
                   <strong style="font-size: 20px; color: var(--success);">$${pr.NetSalary?.toLocaleString() || 0}</strong>
                </div>
              </div>
            `}
          </div>
        </div>
      </div>
    `;
  }

  return `
    ${searchUI}
    ${resultsUI}
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
        <div class="stat-header"><span class="stat-label">Total in HR</span><span class="stat-icon" style="width:20px;height:20px">${ICONS.user}</span></div>
        <div class="stat-value">${sum.total_hr}</div>
      </div>
      <div class="stat-card">
        <div class="stat-header"><span class="stat-label">Total in Payroll</span><span class="stat-icon" style="width:20px;height:20px">${ICONS.database}</span></div>
        <div class="stat-value">${sum.total_payroll}</div>
      </div>
      <div class="stat-card">
        <div class="stat-header"><span class="stat-label">Missing in Payroll</span><span class="stat-icon" style="width:20px;height:20px">${ICONS.alert}</span></div>
        <div class="stat-value ${sum.missing_in_payroll_count > 0 ? 'negative-text' : 'positive-text'}">${sum.missing_in_payroll_count}</div>
      </div>
      <div class="stat-card">
        <div class="stat-header"><span class="stat-label">Missing in HR</span><span class="stat-icon" style="width:20px;height:20px">${ICONS.alert}</span></div>
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

function renderReports(): string {
  const tabs = [
    { id: 'compensation', label: 'Employee Compensation', desc: 'Detailed salary and benefits extract' },
    { id: 'department', label: 'Department Payroll', desc: 'Aggregated department budget report' },
    { id: 'exceptions', label: 'Sync Exceptions', desc: 'Discrepancy and anomaly highlights' }
  ];

  let reportDataHtml = '';
  if (reportData && reportData.data) {
    let displayData = reportData.data;
    let headers = displayData.length > 0 ? Object.keys(displayData[0]) : [];
    
    if (displayData.length > 0) {
      if (reportSearchQuery) {
        displayData = displayData.filter((row: any) => 
          headers.some(h => String(row[h] || '').toLowerCase().includes(reportSearchQuery))
        );
      }
      if (reportSortColumn) {
        displayData = [...displayData].sort((a: any, b: any) => {
          const valA = a[reportSortColumn as string];
          const valB = b[reportSortColumn as string];
          if (valA < valB) return reportSortDir === 'asc' ? -1 : 1;
          if (valA > valB) return reportSortDir === 'asc' ? 1 : -1;
          return 0;
        });
      }
    }

    reportDataHtml = `
      <div class="card mt-6 fade-in" style="margin-top: 24px; box-shadow: var(--shadow-lg);">
        <div class="card-header" style="background: var(--gradient-header); border-bottom: 1px solid var(--border-light); flex-wrap: wrap; gap: 16px;">
          <div>
            <h3 style="font-size: 20px;">${reportData.title}</h3>
            <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Generated on ${new Date().toLocaleDateString()} • <strong style="color: var(--text-primary);">${displayData.length}</strong> Records</p>
          </div>
          <div style="display: flex; gap: 8px;">
             <button class="primary-btn btn-export-excel" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: none; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2); transition: transform 0.2s;"><span style="margin-right: 6px;">⬇</span> Export Excel</button>
             <button class="primary-btn btn-export-pdf" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); border: none; box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2); transition: transform 0.2s;"><span style="margin-right: 6px;">⬇</span> Export PDF</button>
          </div>
        </div>
        
        <div style="padding: 16px 24px; border-bottom: 1px solid var(--border-light); background: var(--bg-card-solid); display: flex; justify-content: space-between; align-items: center;">
          <div class="search-container" style="display: flex; gap: 8px; width: 300px;">
            <input type="text" id="report-search-input" class="search-input" style="border: 1px solid var(--border); background: var(--bg-primary); padding: 8px 12px; border-radius: var(--radius-sm); width: 100%; font-size: 13px;" placeholder="Search report data..." value="${reportSearchQuery}">
            <button class="secondary-btn" id="btn-report-search" onclick="window.searchReport(document.getElementById('report-search-input').value)">Search</button>
          </div>
        </div>

        <div class="card-body" style="padding:0; overflow: auto; max-height: 600px;">
          <table class="data-table" style="position: relative; margin: 0; width: 100%;">
            <thead style="position: sticky; top: 0; z-index: 10; background: var(--bg-card-solid); box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
              <tr>
                ${headers.map(h => `
                  <th style="cursor: pointer; user-select: none; background: var(--bg-card-solid); padding: 12px 16px;" onclick="window.sortReport('${h}')">
                    ${h} <span style="color: var(--accent);">${reportSortColumn === h ? (reportSortDir === 'asc' ? '↑' : '↓') : ''}</span>
                  </th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              ${displayData.length === 0 ? '<tr><td colspan="100%" class="text-center" style="padding: 32px;">No matching data available</td></tr>' :
        displayData.map((row: any) => `
                  <tr>
                    ${headers.map(h => {
                      const val = row[h];
                      const isCurrency = String(h).toLowerCase().includes('salary') || String(h).toLowerCase().includes('bonus') || String(h).toLowerCase().includes('deduction');
                      const isNumber = typeof val === 'number';
                      
                      let displayVal = val !== null && val !== undefined ? val : '—';
                      if (isCurrency && isNumber) {
                        displayVal = '<span style="color: var(--success); font-weight: 500;">₫' + val.toLocaleString() + '</span>';
                      } else if (isNumber) {
                        displayVal = val.toLocaleString();
                      }
                      
                      const align = (isCurrency || isNumber) ? 'right' : 'left';
                      return `<td style="text-align: ${align}; padding: 12px 16px;">${displayVal}</td>`;
                    }).join('')}
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } else {
    reportDataHtml = `
      <div class="content-grid" style="margin-top: 24px;">
        <div class="card" style="padding: 48px 32px; text-align: center; background: var(--bg-card-solid); border: 1px dashed var(--border-accent); box-shadow: var(--shadow-md);">
           <div style="width: 64px; height: 64px; background: var(--info-bg); color: var(--info); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style="width:32px;height:32px;"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2"></path></svg>
           </div>
           <h4 style="margin-bottom: 12px; font-size: 18px;">Select an Export Format</h4>
           <p style="color: var(--text-muted); font-size: 14px; max-width: 400px; margin: 0 auto;">Choose a reporting template above to generate a full preview and access advanced export options for Excel and PDF.</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="card" style="box-shadow: var(--shadow-md);">
      <div class="card-header" style="background: var(--bg-card-solid); border-bottom: none;">
        <div>
          <h3 style="font-size: 18px;">Analytics & Export Center</h3>
          <p style="color: var(--text-muted); font-size: 13px; margin-top: 4px;">Generate executive dashboards and operational data extracts.</p>
        </div>
      </div>
      <div class="card-body" style="padding: 0 24px 24px 24px;">
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px;">
          ${tabs.map(t => `
            <div class="card report-tab ${currentReportType === t.id ? 'active' : ''}" data-type="${t.id}" style="cursor: pointer; padding: 20px; text-align: left; transition: all var(--transition); border: 2px solid ${currentReportType === t.id ? 'var(--accent)' : 'var(--border-light)'}; background: ${currentReportType === t.id ? 'var(--accent-glow)' : 'var(--bg-card)'};">
              <h4 style="color: ${currentReportType === t.id ? 'var(--accent)' : 'var(--text-primary)'}; margin-bottom: 8px; font-size: 14px;">${t.label}</h4>
              <p style="color: var(--text-muted); font-size: 12px; line-height: 1.4;">${t.desc}</p>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
    ${reportDataHtml}
  `;
}

function renderApiExplorer(): string {
  const endpoints = [
    { method: 'GET', path: '/api/dashboard/status', label: 'System Status' },
    { method: 'GET', path: '/api/dashboard/overview', label: 'Schema Overview' },
    { method: 'GET', path: '/api/dashboard/quality', label: 'Data Quality' },
    { method: 'GET', path: '/api/dashboard/reconciliation', label: 'Reconciliation' },
    { method: 'GET', path: '/api/hr/schema', label: 'HR Schema' },
    { method: 'GET', path: '/api/payroll/schema', label: 'Payroll Schema' },
  ];

  return `
    <div class="card fade-in">
      <div class="card-header" style="background: var(--success-bg); border-bottom: 1px solid var(--border-light);">
        <h3>Interactive API Explorer</h3>
        <span class="card-badge sql-server" style="background: var(--success-bg); color: var(--success); border-color: var(--success);">Developer Tools</span>
      </div>
      <div class="card-body" style="display: flex; gap: 32px; padding: 32px; flex-wrap: wrap;">
        <div style="flex: 1; min-width: 250px; border-right: 1px solid var(--border); padding-right: 32px;">
          <h4 style="margin-bottom: 16px; color: var(--text-muted); font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Available Endpoints</h4>
          <div class="api-endpoint-list" style="display: flex; flex-direction: column; gap: 8px;">
            ${endpoints.map(ep => `
              <button class="secondary-btn api-ep-btn" data-path="${ep.path}" style="text-align: left; padding: 12px; font-family: var(--mono); font-size: 12px; border-left: 3px solid ${apiExplorerQuery === ep.path ? 'var(--info)' : 'transparent'}; background: ${apiExplorerQuery === ep.path ? 'var(--info-bg)' : ''}">
                <span style="color: var(--success); font-weight: bold; margin-right: 8px;">${ep.method}</span>
                ${ep.path}
              </button>
            `).join('')}
          </div>
        </div>
        <div style="flex: 2; min-width: 400px;">
          <h4 style="margin-bottom: 16px; font-size: 14px;">Endpoint Configuration</h4>
          <div style="background: var(--bg-card-solid); padding: 24px; border-radius: var(--radius-sm); border: 1px solid var(--border); margin-bottom: 24px;">
             <div style="font-family: var(--mono); color: var(--info); font-size: 16px; margin-bottom: 20px; background: var(--bg-card); padding: 12px; border-radius: 6px; border: 1px solid var(--border-light);">GET <span style="color: var(--text-primary);">${apiExplorerQuery}</span></div>
             <div style="display: flex; gap: 12px;">
               <button class="primary-btn" id="btn-run-query">${apiExplorerLoading ? 'Running...' : 'Run Test Query'}</button>
             </div>
          </div>
          <h4 style="margin-bottom: 16px; font-size: 14px;">Response Output</h4>
          <pre id="api-response" style="background: var(--bg-sidebar-solid); padding: 24px; border-radius: var(--radius-sm); border: 1px solid var(--border); font-family: var(--mono); font-size: 13px; overflow-x: auto; color: var(--success); box-shadow: inset 0 2px 10px rgba(0,0,0,0.05); line-height: 1.6; min-height: 200px;">${apiExplorerResponse ? JSON.stringify(apiExplorerResponse, null, 2) : 'Click "Run Test Query" to see response.'}</pre>
        </div>
      </div>
    </div>
  `;
}

function renderSettings(): string {
  const sqlConnected = dbStatus?.sqlserver.connected;
  const mysqlConnected = dbStatus?.mysql.connected;

  return `
    <div class="card fade-in">
      <div class="card-header">
        <h3>System Settings & Diagnostics</h3>
      </div>
      <div class="card-body" style="padding: 32px;">
        <div class="content-grid" style="grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px;">
          <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 24px; background: var(--bg-card);">
            <h4 style="margin-bottom: 20px; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 12px;">Account Information</h4>
            <div class="detail-grid">
               <div class="detail-item"><span>Current User</span><strong style="color: var(--text-primary);">${authUser?.username || '—'}</strong></div>
               <div class="detail-item"><span>Role</span><span class="status-badge online" style="text-transform: capitalize;">● ${authUser?.role || '—'}</span></div>
               <div class="detail-item"><span>Email</span><strong style="color: var(--text-primary);">${authUser?.email || '—'}</strong></div>
            </div>
          </div>
          
          <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 24px; background: var(--bg-card);">
            <h4 style="margin-bottom: 20px; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 12px;">Appearance</h4>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
               <button class="theme-btn ${currentTheme === 'light-aurora' ? 'active' : ''}" data-theme="light-aurora">Aurora Light</button>
               <button class="theme-btn ${currentTheme === 'ocean-breeze' ? 'active' : ''}" data-theme="ocean-breeze">Ocean Breeze</button>
               <button class="theme-btn ${currentTheme === 'sunrise-gradient' ? 'active' : ''}" data-theme="sunrise-gradient">Sunrise Gradient</button>
               <button class="theme-btn ${currentTheme === 'executive-dark' ? 'active' : ''}" data-theme="executive-dark">Executive Dark</button>
            </div>
            <p style="font-size: 11px; color: var(--text-muted); margin-top: 12px;">Changes are saved automatically to your browser.</p>
          </div>
        </div>

        <div style="border: 1px solid var(--border); border-radius: var(--radius-md); padding: 24px; background: var(--bg-card);">
           <h4 style="margin-bottom: 20px; color: var(--text-primary); border-bottom: 1px solid var(--border); padding-bottom: 12px;">Database Diagnostics</h4>
           <div class="detail-grid" style="grid-template-columns: 1fr 1fr; gap: 24px;">
              <div class="detail-item" style="border: none; padding: 0;">
                 <span style="display: block; margin-bottom: 8px;">SQL Server Connection (HUMAN_2025)</span>
                 <span class="status-badge ${sqlConnected ? 'online' : 'offline'}">● ${sqlConnected ? 'Connected & Healthy' : 'Connection Failed'}</span>
              </div>
              <div class="detail-item" style="border: none; padding: 0;">
                 <span style="display: block; margin-bottom: 8px;">MySQL Connection (PAYROLL_2026)</span>
                 <span class="status-badge ${mysqlConnected ? 'online' : 'offline'}">● ${mysqlConnected ? 'Connected & Healthy' : 'Connection Failed'}</span>
              </div>
              <div class="detail-item" style="border: none; padding: 0;">
                 <span style="display: block; margin-bottom: 8px;">Last Sync Timestamp</span>
                 <strong style="color: var(--text-primary);">${new Date().toLocaleString()}</strong>
              </div>
              <div class="detail-item" style="border: none; padding: 0;">
                 <span style="display: block; margin-bottom: 8px;">API Health Check</span>
                 <span class="status-badge online">● 200 OK</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  `;
}

function attachEventListeners(): void {
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const view = (item as HTMLElement).dataset.view;
      if (view) { currentView = view; render(); }
    });
  });

  document.getElementById('btn-refresh')?.addEventListener('click', () => { loadAllData(); });
  document.getElementById('btn-api-docs')?.addEventListener('click', () => {
    currentView = 'api_explorer';
    render();
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

  // Global search event
  const globalSearchInput = document.getElementById('global-search-input') as HTMLInputElement;
  if (globalSearchInput) {
    globalSearchInput.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const val = globalSearchInput.value.trim();
        if (val) {
          employeeSearchQuery = val;
          currentView = 'employee360';
          isSearching = true;
          render();

          // Re-find input after render
          const newInput = document.getElementById('emp-search-input') as HTMLInputElement;
          if (newInput) newInput.value = val;

          const res = await api.searchEmployees(val);
          employeeSearchResults = res.data || [];
          isSearching = false;
          render();
        }
      }
    });
  }

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

  (window as any)._attachReportListeners = function() {
    document.querySelectorAll('.btn-export-excel').forEach(btn => {
      btn.addEventListener('click', (e) => {
        (window as any).exportToExcel(e.currentTarget as HTMLElement);
      });
    });

    document.querySelectorAll('.btn-export-pdf').forEach(btn => {
      btn.addEventListener('click', (e) => {
        (window as any).exportToPDF(e.currentTarget as HTMLElement);
      });
    });
    
    const searchInput = document.getElementById('report-search-input');
    if (searchInput) {
      searchInput.addEventListener('keydown', (e: any) => {
        if (e.key === 'Enter') {
           (window as any).searchReport(e.target.value);
        }
      });
    }
  };
  (window as any)._attachReportListeners();

  // API Explorer Events
  document.querySelectorAll('.api-ep-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const path = (e.currentTarget as HTMLElement).dataset.path;
      if (path) {
        apiExplorerQuery = path;
        apiExplorerResponse = null;
        render();
      }
    });
  });

  document.getElementById('btn-run-query')?.addEventListener('click', async () => {
    apiExplorerLoading = true;
    render();
    try {
      const res = await fetch(`http://localhost:8000${apiExplorerQuery}`);
      const data = await res.json();
      apiExplorerResponse = data;
    } catch (e) {
      apiExplorerResponse = { error: String(e) };
    }
    apiExplorerLoading = false;
    render();
  });

  // Theme switcher events
  document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const theme = (e.currentTarget as HTMLElement).dataset.theme;
      if (theme) {
        applyTheme(theme);
        render();
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
