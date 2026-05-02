import { NavLink } from 'react-router-dom';
import {
  FiUsers,
  FiGrid,
  FiRepeat,
  FiFileText,
  FiDatabase,
  FiTerminal,
  FiSettings,
  FiZap,
} from 'react-icons/fi';

/* ── Navigation structure ───────────────────────────────────────── */
const mainNavItems = [
  { to: '/employee360', label: 'Employee 360', icon: <FiUsers /> },
  { to: '/dashboard',   label: 'Dashboard',    icon: <FiGrid /> },
  { to: '/reconciliation', label: 'Reconciliation', icon: <FiRepeat /> },
  { to: '/reports',     label: 'Reports',      icon: <FiFileText /> },
  { to: '/management',  label: 'Data Management', icon: <FiDatabase /> },
];

const devNavItems = [
  { to: '/api-explorer', label: 'API Explorer', icon: <FiTerminal /> },
  { to: '/settings',     label: 'Settings',     icon: <FiSettings /> },
];

/* ── Component ──────────────────────────────────────────────────── */
export default function Sidebar() {
  // TODO: Wire these to real API status once the context/store is set up
  const sqlStatus = true;
  const mysqlStatus = true;
  const authUser = { username: 'manh', role: 'VIEWER' };

  return (
    <aside
      className="sidebar glass"
      id="sidebar"
      style={{
        borderRadius: 0,
        borderTop: 'none',
        borderBottom: 'none',
        borderLeft: 'none',
        background: 'rgba(10, 15, 30, 0.92)',
        boxShadow:
          'inset -1px 0 0 rgba(0, 242, 254, 0.06), 4px 0 24px rgba(0, 0, 0, 0.3)',
      }}
    >
      {/* ── Brand ─────────────────────────────────────────── */}
      <div className="sidebar-brand">
        <div
          className="brand-icon"
          style={{
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
            boxShadow: '0 4px 16px rgba(0, 242, 254, 0.3)',
          }}
        >
          <FiZap />
        </div>
        <div>
          <h1
            className="glow-text"
            style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.05em' }}
          >
            NexusBridge
          </h1>
          <span
            className="subtitle"
            style={{ color: 'var(--text-muted)', fontSize: 11 }}
          >
            HR &amp; Payroll Middleware
          </span>
        </div>
      </div>

      {/* ── Navigation ────────────────────────────────────── */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          {mainNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="nav-section">
          <div
            className="nav-section-title"
            style={{ color: 'var(--accent-cyan)', opacity: 0.6 }}
          >
            Developer
          </div>
          {devNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `nav-item${isActive ? ' active' : ''}`
              }
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── Footer (DB status + user) ─────────────────────── */}
      <div
        className="sidebar-footer"
        style={{
          background: 'rgba(10, 15, 30, 0.95)',
          borderTop: '1px solid rgba(0, 242, 254, 0.08)',
        }}
      >
        <div className="connection-indicator">
          <span
            className={`dot ${
              sqlStatus === undefined
                ? 'checking'
                : sqlStatus
                ? 'connected'
                : 'disconnected'
            }`}
          />
          <span className="db-name">HUMAN_2025</span>
          <span
            className="db-engine"
            style={{ color: 'var(--accent-cyan)', opacity: 0.7 }}
          >
            SQL Server
          </span>
        </div>
        <div className="connection-indicator">
          <span
            className={`dot ${
              mysqlStatus === undefined
                ? 'checking'
                : mysqlStatus
                ? 'connected'
                : 'disconnected'
            }`}
          />
          <span className="db-name">PAYROLL_2026</span>
          <span
            className="db-engine"
            style={{ color: 'var(--accent-yellow)', opacity: 0.7 }}
          >
            MySQL
          </span>
        </div>

        {authUser && (
          <div
            className="sidebar-user"
            style={{
              borderTop: '1px solid rgba(0, 242, 254, 0.08)',
              marginTop: 8,
              paddingTop: 12,
            }}
          >
            <div
              className="user-avatar"
              style={{
                background:
                  'linear-gradient(135deg, var(--accent-cyan), var(--accent-purple))',
                boxShadow: '0 2px 10px rgba(0, 242, 254, 0.25)',
              }}
            >
              {authUser.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <span className="user-name" style={{ color: '#e2e8f0' }}>
                {authUser.username}
              </span>
              <span
                className="user-role"
                style={{
                  color: 'var(--accent-cyan)',
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {authUser.role}
              </span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
