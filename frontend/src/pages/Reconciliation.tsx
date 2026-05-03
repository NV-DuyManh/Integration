import { useEffect, useState } from 'react';
import { FiUsers, FiDatabase, FiAlertCircle } from 'react-icons/fi';
import { api } from '../api';

export default function Reconciliation() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const res = await api.getReconciliation();
      if (res.data) setData(res.data);
    })();
  }, []);

  if (!data) return <div className="loading-skeleton" style={{ height: 400, borderRadius: 'var(--radius-lg)' }} />;

  const s = data.summary;
  const missingPr = data.missing_in_payroll || [];
  const missingHr = data.missing_in_hr || [];

  return (
    <>
      {/* Stat Cards */}
      <div className="stats-grid">
        {[
          { label: 'Total in HR', value: s.total_hr, icon: <FiUsers />, color: 'var(--accent-cyan)' },
          { label: 'Total in Payroll', value: s.total_payroll, icon: <FiDatabase />, color: 'var(--accent-green)' },
          { label: 'Missing in Payroll', value: s.missing_in_payroll_count, icon: <FiAlertCircle />, color: s.missing_in_payroll_count > 0 ? 'var(--accent-red)' : 'var(--accent-green)' },
          { label: 'Missing in HR', value: s.missing_in_hr_count, icon: <FiAlertCircle />, color: s.missing_in_hr_count > 0 ? 'var(--accent-red)' : 'var(--accent-green)' },
        ].map((c, i) => (
          <div key={i} className="stat-card glass" style={{ position: 'relative', overflow: 'hidden' }}>
            <div className="stat-header">
              <span className="stat-label" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: 11, fontWeight: 700 }}>{c.label}</span>
              <span className="stat-icon" style={{ width: 20, height: 20, color: c.color }}>{c.icon}</span>
            </div>
            <div className="stat-value" style={{ fontSize: 32, fontWeight: 800, color: c.color }}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Tables */}
      <div className="content-grid mt-6">
        <div className="card glass" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.06), rgba(123,47,247,0.06))', borderBottom: '1px solid rgba(0,242,254,0.1)' }}>
            <h3>Found in HR, Missing in Payroll</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead><tr><th>ID</th><th>Name</th><th>Status</th></tr></thead>
              <tbody>
                {missingPr.length === 0
                  ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No discrepancies</td></tr>
                  : missingPr.map((e: any) => (
                    <tr key={e.EmployeeID}><td>{e.EmployeeID}</td><td>{e.FullName}</td><td>{e.Status}</td></tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card glass" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(250,204,21,0.06), rgba(239,68,68,0.06))', borderBottom: '1px solid rgba(250,204,21,0.1)' }}>
            <h3>Found in Payroll, Missing in HR</h3>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead><tr><th>ID</th><th>Name</th><th>Status</th></tr></thead>
              <tbody>
                {missingHr.length === 0
                  ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}>No discrepancies</td></tr>
                  : missingHr.map((e: any) => (
                    <tr key={e.EmployeeID}><td>{e.EmployeeID}</td><td>{e.FullName}</td><td>{e.Status}</td></tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
