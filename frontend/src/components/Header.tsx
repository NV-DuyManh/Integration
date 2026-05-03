import { useLocation } from 'react-router-dom';
import { FiRefreshCw, FiLogOut } from 'react-icons/fi';

/* ── Title / subtitle map (mirrors the old renderHeader logic) ── */
const pageMeta: Record<string, { title: string; subtitle: string }> = {
  '/employee360':    { title: 'Employee 360',           subtitle: 'Search & view integrated HR/Payroll profiles' },
  '/dashboard':      { title: 'Executive Dashboard',    subtitle: 'Intelligent middleware metrics & health' },
  '/reconciliation': { title: 'Reconciliation Center',  subtitle: 'Detect & resolve cross-database anomalies' },
  '/reports':        { title: 'Actionable Reports',     subtitle: 'Generate read-only cross-db reports' },
  '/management':     { title: 'HR & Payroll Management', subtitle: 'Add, update, and manage core records' },
  '/api-explorer':   { title: 'API Explorer',           subtitle: 'Test endpoints and view live schema data' },
  '/settings':       { title: 'Settings',               subtitle: 'System configuration and preferences' },
};

/* ── Component ──────────────────────────────────────────────────── */
export default function Header() {
  const { pathname } = useLocation();
  const meta = pageMeta[pathname] ?? { title: 'Dashboard', subtitle: '' };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    window.location.href = '/';
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <header
      className="header glass"
      style={{
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
      }}
    >
      {/* ── Left: page title ──────────────────────────────── */}
      <div className="header-left">
        <div>
          <h2
            className="glow-text2"
            style={{ fontSize: 18, fontWeight: 800 }}
          >
            {meta.title}
          </h2>
          <span
            className="breadcrumb"
            style={{ color: 'var(--text-muted)', fontSize: 12 }}
          >
            {meta.subtitle}
          </span>
        </div>
      </div>

      {/* ── Right: search + actions ───────────────────────── */}
      <div
        className="header-right"
        style={{ display: 'flex', gap: 12, alignItems: 'center' }}
      >

        <button
          className="header-btn btn-primary"
          id="btn-refresh"
          onClick={handleRefresh}
          style={{ padding: '7px 14px', fontSize: 12, letterSpacing: '0.5px' }}
        >
          <FiRefreshCw size={14} style={{ marginRight: 4 }} />
          Refresh
        </button>

        <button
          className="header-btn btn-delete"
          id="btn-logout"
          onClick={handleLogout}
          style={{ padding: '7px 14px', fontSize: 12, fontWeight: 600 }}
        >
          <FiLogOut size={14} style={{ marginRight: 4 }} />
          Logout
        </button>
      </div>
    </header>
  );
}
