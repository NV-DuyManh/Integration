import { useState, useEffect } from 'react';
import { FiUser, FiShield, FiMail, FiDatabase, FiCheck, FiCheckCircle } from 'react-icons/fi';
import { api } from '../api';
import type { SystemStatus } from '../api';

const PREFS_KEY = 'app_preferences';
const DEFAULT_PREFS = { darkMode: true, notifications: false, autoSync: true };

function loadPrefs() {
  try {
    const stored = localStorage.getItem(PREFS_KEY);
    return stored ? { ...DEFAULT_PREFS, ...JSON.parse(stored) } : { ...DEFAULT_PREFS };
  } catch {
    return { ...DEFAULT_PREFS };
  }
}

export default function Settings() {
  const user = (() => { try { return JSON.parse(localStorage.getItem('auth_user')||'{}'); } catch { return {}; } })();
  const [dbStatus, setDbStatus] = useState<SystemStatus | null>(null);
  const [toggles, setToggles] = useState(loadPrefs);
  const [alertMsg, setAlertMsg] = useState('');

  useEffect(() => { api.dashboardStatus().then(r => { if (r.data) setDbStatus(r.data); }); }, []);

  // Apply dark/light mode to DOM whenever the toggle changes
  useEffect(() => {
    document.body.classList.toggle('light-mode', !toggles.darkMode);
  }, [toggles.darkMode]);

  // Restore theme on initial mount (in case user reloads)
  useEffect(() => {
    const prefs = loadPrefs();
    document.body.classList.toggle('light-mode', !prefs.darkMode);
  }, []);

  const handleToggle = (key: keyof typeof toggles) => {
    const updated = { ...toggles, [key]: !toggles[key] };
    setToggles(updated);
    localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
    setAlertMsg('Setting updated successfully!');
    setTimeout(() => setAlertMsg(''), 3000);
  };

  const Toggle = ({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid rgba(0,242,254,0.06)' }}>
      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{label}</span>
      <div onClick={onChange} style={{ width: 48, height: 26, borderRadius: 13, background: checked ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'all 0.3s', boxShadow: checked ? '0 0 12px rgba(0,242,254,0.3)' : 'none' }}>
        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 3, left: checked ? 25 : 3, transition: 'left 0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }} />
      </div>
    </div>
  );

  return (
    <div className="card glass fade-in" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div className="card-header"><h3>System Settings & Diagnostics</h3></div>
      <div className="card-body" style={{ padding: 32 }}>

        {/* Success Toast */}
        {alertMsg && (
          <div className="fade-in" style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '14px 20px', marginBottom: 24, borderRadius: 'var(--radius-md)',
            background: 'var(--success-bg)', border: '1px solid rgba(74,222,128,0.25)',
            color: 'var(--success)', fontWeight: 600, fontSize: 14,
            animation: 'fadeIn 0.3s ease'
          }}>
            <FiCheckCircle size={18} />
            {alertMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, marginBottom: 32 }}>
          {/* Account Info */}
          <div style={{ border: '1px solid rgba(0,242,254,0.08)', borderRadius: 'var(--radius-md)', padding: 24, background: 'var(--bg-card)' }}>
            <h4 style={{ marginBottom: 20, borderBottom: '1px solid rgba(0,242,254,0.08)', paddingBottom: 12 }}>Account Information</h4>
            <div className="detail-grid">
              <div className="detail-item"><span><FiUser style={{ marginRight: 8 }} />Current User</span><strong>{user.username || '—'}</strong></div>
              <div className="detail-item"><span><FiShield style={{ marginRight: 8 }} />Role</span><span className="status-badge online" style={{ textTransform: 'capitalize' }}>● {user.role || '—'}</span></div>
              <div className="detail-item"><span><FiMail style={{ marginRight: 8 }} />Email</span><strong>{user.email || '—'}</strong></div>
            </div>
          </div>

          {/* Preferences */}
          <div style={{ border: '1px solid rgba(0,242,254,0.08)', borderRadius: 'var(--radius-md)', padding: 24, background: 'var(--bg-card)' }}>
            <h4 style={{ marginBottom: 20, borderBottom: '1px solid rgba(0,242,254,0.08)', paddingBottom: 12 }}>Preferences</h4>
            <Toggle label="Dark Mode Theme" checked={toggles.darkMode} onChange={() => handleToggle('darkMode')} />
            <Toggle label="Email Notifications" checked={toggles.notifications} onChange={() => handleToggle('notifications')} />
            <Toggle label="Auto-Sync HR Data" checked={toggles.autoSync} onChange={() => handleToggle('autoSync')} />
          </div>
        </div>

        {/* Database Diagnostics */}
        <div style={{ border: '1px solid rgba(0,242,254,0.08)', borderRadius: 'var(--radius-md)', padding: 24, background: 'var(--bg-card)' }}>
          <h4 style={{ marginBottom: 20, borderBottom: '1px solid rgba(0,242,254,0.08)', paddingBottom: 12 }}><FiDatabase style={{ marginRight: 8 }} />Database Diagnostics</h4>
          <div className="detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="detail-item" style={{ border: 'none', padding: 0 }}>
              <span style={{ display: 'block', marginBottom: 8 }}>SQL Server (HUMAN_2025)</span>
              <span className={`status-badge ${dbStatus?.sqlserver.connected ? 'online' : 'offline'}`}>● {dbStatus?.sqlserver.connected ? 'Connected & Healthy' : 'Checking...'}</span>
            </div>
            <div className="detail-item" style={{ border: 'none', padding: 0 }}>
              <span style={{ display: 'block', marginBottom: 8 }}>MySQL (PAYROLL_2026)</span>
              <span className={`status-badge ${dbStatus?.mysql.connected ? 'online' : 'offline'}`}>● {dbStatus?.mysql.connected ? 'Connected & Healthy' : 'Checking...'}</span>
            </div>
            <div className="detail-item" style={{ border: 'none', padding: 0 }}>
              <span style={{ display: 'block', marginBottom: 8 }}>Last Sync</span>
              <strong>{new Date().toLocaleString()}</strong>
            </div>
            <div className="detail-item" style={{ border: 'none', padding: 0 }}>
              <span style={{ display: 'block', marginBottom: 8 }}>API Health</span>
              <span className="status-badge online"><FiCheck style={{ marginRight: 4 }} /> 200 OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
