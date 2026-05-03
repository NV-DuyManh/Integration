import { useState } from 'react';
import { FiSearch, FiDatabase, FiUser } from 'react-icons/fi';
import { api } from '../api';

export default function Employee360() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true); setError(''); setResult(null);
    const res = await api.searchEmployees(q);
    setLoading(false);
    if (res.error) { setError(res.error); return; }
    if (!res.data || res.data.length === 0) { setError(`No employees found matching "${q}".`); return; }
    // Load full 360 for first match
    const detail = await api.getEmployee360(res.data[0].EmployeeID);
    if (detail.data) setResult(detail.data);
    else setError('Could not load employee profile.');
  };

  const hr = result?.hr;
  const pr = result?.payroll;

  const getStatusClass = (status: string) => {
    if (!status) return 'status-danger';
    const s = status.toLowerCase();
    if (s.includes('đang làm việc') || s.includes('active')) return 'status-success';
    if (s.includes('thử việc')) return 'status-info';
    if (s.includes('thực tập')) return 'status-warning';
    if (s.includes('nghỉ phép') || s.includes('inactive') || s.includes('terminated')) return 'status-danger';
    return 'status-danger';
  };

  return (
    <>
      {/* Search Hero */}
      <div className="card glass page-hero" style={{ padding: '56px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden', marginBottom: 32 }}>
        <div style={{ width: 72, height: 72, background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', color: '#fff', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 32, boxShadow: '0 0 30px rgba(0,242,254,0.3), 0 0 60px rgba(188,19,254,0.15)', transition: 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.3s' }}>
          <FiSearch size={36} />
        </div>
        <h2 className="glow-text" style={{ fontSize: 36, marginBottom: 16, fontWeight: 800 }}>Employee Intelligence 360</h2>
        <p style={{ fontSize: 17, color: 'var(--text-secondary)', marginBottom: 40, maxWidth: 640, margin: '0 auto 40px' }}>
          Instantly retrieve unified HR and Payroll records across systems.
        </p>
        <div className="search-wrapper" style={{ maxWidth: 680, margin: '0 auto' }}>
          <input className="cyber-input" placeholder="Search by name, ID, or department..." value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()} />
          <button onClick={handleSearch} disabled={loading}>
            {loading ? 'Searching...' : 'Search Employee'}
          </button>
        </div>
      </div>

      {error && <div className="card glass" style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>{error}</div>}

      {hr && (
        <div className="profile-card fade-in" style={{ marginTop: 32, border: '1px solid rgba(0,242,254,0.1)', borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
          {/* Profile Header */}
          <div style={{ background: 'linear-gradient(135deg, rgba(0,242,254,0.05), rgba(188,19,254,0.05))', borderBottom: '1px solid rgba(0,242,254,0.08)', padding: 32, display: 'flex', alignItems: 'center', gap: 24 }}>
            <div className="user-avatar" style={{ width: 80, height: 80, fontSize: 32, background: 'linear-gradient(135deg, var(--neon-cyan), var(--neon-purple))', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, boxShadow: '0 0 24px rgba(0,242,254,0.35), 0 0 48px rgba(188,19,254,0.15)' }}>
              {hr.FullName?.charAt(0) || '?'}
            </div>
            <div>
              <h2 className="glow-text2" style={{ fontSize: 24, fontWeight: 800 }}>{hr.FullName}</h2>
              <p style={{ fontSize: 15, color: 'var(--text-secondary)' }}>{hr.PositionName || '—'} • {hr.DepartmentName || '—'}</p>
            </div>
          </div>

          {/* Two-Column Detail */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
            {/* HR Card */}
            <div style={{ padding: 32, borderRight: '1px solid rgba(0,242,254,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiDatabase size={16} /></div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>HR Master Data</h3>
                <span className="card-badge sql-server" style={{ marginLeft: 'auto' }}>HUMAN_2025</span>
              </div>
              <div className="detail-grid">
                <div className="detail-item"><span>Employee ID</span><strong className="mono">{hr.EmployeeID}</strong></div>
                <div className="detail-item"><span>Hire Date</span><strong>{hr.HireDate || '—'}</strong></div>
                <div className="detail-item"><span>Email</span><strong>{hr.Email || '—'}</strong></div>
                <div className="detail-item"><span>Phone</span><strong>{hr.PhoneNumber || '—'}</strong></div>
                <div className="detail-item"><span>Status</span><span className={`status-badge ${getStatusClass(hr.Status)}`}>● {hr.Status || '—'}</span></div>
              </div>
            </div>

            {/* Payroll Card */}
            <div style={{ padding: 32 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(250,204,21,0.1)', color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiUser size={16} /></div>
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Payroll & Compensation</h3>
                <span className="card-badge mysql" style={{ marginLeft: 'auto' }}>PAYROLL_2026</span>
              </div>
              {!pr || !pr.SalaryMonth ? (
                <div style={{ background: 'rgba(248,113,113,0.05)', color: 'var(--accent-red)', border: '1px dashed rgba(248,113,113,0.2)', padding: 24, borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: 24, marginBottom: 12 }}>⚠️</div>
                  No payroll record found for this employee.
                </div>
              ) : (
                <div className="detail-grid">
                  <div className="detail-item"><span>Payroll Month</span><strong>{pr.SalaryMonth}</strong></div>
                  <div className="detail-item"><span>Base Salary</span><strong>${pr.BaseSalary?.toLocaleString() || 0}</strong></div>
                  <div className="detail-item"><span>Bonus</span><strong style={{ color: 'var(--accent-green)' }}>${pr.Bonus?.toLocaleString() || 0}</strong></div>
                  <div className="detail-item"><span>Deductions</span><strong style={{ color: 'var(--accent-red)' }}>-${pr.Deductions?.toLocaleString() || 0}</strong></div>
                  <div className="detail-item" style={{ borderTop: '1px solid rgba(0,242,254,0.08)', marginTop: 8, paddingTop: 16 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>Net Salary</span>
                    <strong style={{ fontSize: 20, color: 'var(--accent-green)' }}>${pr.NetSalary?.toLocaleString() || 0}</strong>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
