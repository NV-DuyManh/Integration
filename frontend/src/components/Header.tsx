import { useLocation } from 'react-router-dom';
import { FiSearch, FiRefreshCw, FiLogOut } from 'react-icons/fi';

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
    console.log('[Header] Logout clicked — placeholder');
  };

  const handleRefresh = () => {
    console.log('[Header] Refresh clicked — placeholder');
  };

  return (
    <header
      className="header glass"
      style={{
        borderRadius: 0,
        borderLeft: 'none',
        borderRight: 'none',
        borderTop: 'none',
        background: 'rgba(10, 15, 30, 0.85)',
        boxShadow:
          '0 4px 20px rgba(0, 0, 0, 0.3), inset 0 -1px 0 rgba(0, 242, 254, 0.06)',
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
        <div className="global-search" style={{ position: 'relative' }}>
          <input
            type="text"
            id="global-search-input"
            className="cyber-input"
            placeholder="Search employees..."
            style={{
              padding: '8px 12px 8px 32px',
              borderRadius: 'var(--radius-sm)',
              width: 220,
              fontSize: 13,
            }}
          />
          <span
            style={{
              position: 'absolute',
              left: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--accent-cyan)',
              opacity: 0.6,
              width: 14,
              height: 14,
              display: 'flex',
            }}
          >
            <FiSearch size={14} />
          </span>
        </div>

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
