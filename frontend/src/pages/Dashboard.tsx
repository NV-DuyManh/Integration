import { useEffect, useState } from 'react';
import { FiHeart, FiRepeat, FiAlertCircle, FiUsers, FiDatabase } from 'react-icons/fi';
import { api } from '../api';
import type { SystemStatus, SchemaResponse } from '../api';

/* ── Component ───────────────────────────────────────────────────── */
export default function Dashboard() {
  const [dbStatus, setDbStatus] = useState<SystemStatus | null>(null);
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [reconData, setReconData] = useState<any>(null);
  const [hrSchema, setHrSchema] = useState<SchemaResponse | null>(null);
  const [payrollSchema, setPayrollSchema] = useState<SchemaResponse | null>(null);

  /* ── Fetch data on mount ────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      const [statusRes, qualityRes, reconRes, hrRes, prRes] = await Promise.all([
        api.dashboardStatus(),
        api.getDataQuality(),
        api.getReconciliation(),
        api.hrSchema(),
        api.payrollSchema(),
      ]);
      if (statusRes.data) setDbStatus(statusRes.data);
      if (qualityRes.data) setDataQuality(qualityRes.data);
      if (reconRes.data) setReconData(reconRes.data);
      if (hrRes.data) setHrSchema(hrRes.data);
      if (prRes.data) setPayrollSchema(prRes.data);
    })();
  }, []);

  /* ── Derived values ─────────────────────────────────────────────── */
  const healthScore = dataQuality?.health_score ?? '—';
  const reconAlerts =
    (reconData?.summary?.missing_in_hr_count || 0) +
    (reconData?.summary?.missing_in_payroll_count || 0);
  const anomalies = dataQuality?.salary_anomalies ?? 0;
  const totalEmployees = reconData?.summary?.total_hr ?? '—';

  const sqlConnected = dbStatus?.sqlserver.connected;
  const mysqlConnected = dbStatus?.mysql.connected;

  /* ── Schema card helper ─────────────────────────────────────────── */
  const SchemaCard = ({
    title,
    badge,
    schema,
  }: {
    title: string;
    badge: 'sql-server' | 'mysql';
    schema: SchemaResponse | null;
  }) => {
    const badgeStyle =
      badge === 'sql-server'
        ? { background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', border: '1px solid rgba(0,242,254,0.2)' }
        : { background: 'rgba(250,204,21,0.1)', color: 'var(--accent-yellow)', border: '1px solid rgba(250,204,21,0.2)' };

    if (!schema) {
      return (
        <div className="card glass" style={{ overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.06), rgba(123,47,247,0.06))', borderBottom: '1px solid rgba(0,242,254,0.1)' }}>
            <h3 style={{ color: 'var(--text-primary)' }}>{title}</h3>
            <span className={`card-badge ${badge}`} style={badgeStyle}>{badge === 'sql-server' ? 'SQL Server' : 'MySQL'}</span>
          </div>
          <div className="card-body">
            <div className="loading-skeleton" style={{ height: 120 }} />
          </div>
        </div>
      );
    }

    const tableEntries = Object.entries(schema.tables).slice(0, 8);

    return (
      <div className="card glass" style={{ overflow: 'hidden' }}>
        <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.06), rgba(123,47,247,0.06))', borderBottom: '1px solid rgba(0,242,254,0.1)' }}>
          <h3 style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{title} — {schema.table_count} tables</h3>
          <span className={`card-badge ${badge}`} style={badgeStyle}>{schema.engine}</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          <div className="table-wrapper" style={{ borderRadius: 0, boxShadow: 'none', padding: 0 }}>
            <div className="table-container" style={{ borderRadius: 0, border: 'none' }}>
              <table className="data-table" style={{ width: '100%' }}>
                <thead className="table-header">
                  <tr>
                    <th>Table</th>
                    <th>Columns</th>
                    <th>Rows</th>
                  </tr>
                </thead>
                <tbody>
                  {tableEntries.length === 0 ? (
                    <tr><td colSpan={3} className="table-cell" style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)' }}>No tables discovered</td></tr>
                  ) : (
                    tableEntries.map(([name, info]) => {
                      const { columns, row_count } = info as { columns: unknown[]; row_count: number };
                      return (
                        <tr key={name}>
                          <td className="mono">{name}</td>
                          <td>{columns.length}</td>
                          <td>{(row_count || 0).toLocaleString()}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /* ── JSX ────────────────────────────────────────────────────────── */
  return (
    <>
      {/* ── Top 4 Stat Cards ─────────────────────────────────────── */}
      <div className="stats-grid">
        {/* Integration Health */}
        <div className="stat-card glass" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--accent-cyan), var(--accent-green))' }} />
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: 11, fontWeight: 700 }}>Integration Health</span>
            <span className="stat-icon" style={{ width: 20, height: 20, color: 'var(--accent-green)', filter: 'drop-shadow(0 0 4px rgba(74, 222, 128, 0.5))' }}><FiHeart /></span>
          </div>
          <div className="stat-value glow-text" style={{ fontSize: 32, fontWeight: 800 }}>{healthScore}%</div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${healthScore}%`, background: 'linear-gradient(90deg, var(--accent-green), var(--accent-cyan))', borderRadius: 2, transition: 'width 1.5s var(--spring)', boxShadow: '0 0 8px rgba(74, 222, 128, 0.4)' }} />
          </div>
          <div className="stat-change" style={{ color: 'var(--accent-green)', fontSize: 11 }}>System Sync Quality</div>
        </div>

        {/* Reconciliation Alerts */}
        <div className="stat-card glass" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--accent-red), var(--accent-yellow))' }} />
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: 11, fontWeight: 700 }}>Reconciliation Alerts</span>
            <span className="stat-icon" style={{ width: 20, height: 20, color: reconAlerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)', filter: `drop-shadow(0 0 4px ${reconAlerts > 0 ? 'rgba(239,68,68,0.5)' : 'rgba(74,222,128,0.5)'})` }}><FiRepeat /></span>
          </div>
          <div className="stat-value" style={{ fontSize: 32, fontWeight: 800, color: reconAlerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)', textShadow: `0 0 10px ${reconAlerts > 0 ? 'rgba(239,68,68,0.4)' : 'rgba(74,222,128,0.4)'}` }}>{reconAlerts}</div>
          <div style={{ height: 24, display: 'flex', alignItems: 'flex-end', gap: 4, marginBottom: 12 }}>
            {[4, 8, 3, 10, 5, 2, reconAlerts].map((val, i) => (
              <div key={i} style={{ flex: 1, background: reconAlerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)', height: `${Math.max(10, val * 5)}%`, borderRadius: 2, opacity: 0.6, transition: 'height 0.5s ease' }} />
            ))}
          </div>
          <div className="stat-change" style={{ color: reconAlerts > 0 ? 'var(--accent-red)' : 'var(--accent-green)', fontSize: 11 }}>Missing Cross-Records</div>
        </div>

        {/* Data Quality Index */}
        <div className="stat-card glass" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--accent-yellow), var(--accent-pink))' }} />
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: 11, fontWeight: 700 }}>Data Quality Index</span>
            <span className="stat-icon" style={{ width: 20, height: 20, color: 'var(--accent-yellow)', filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))' }}><FiAlertCircle /></span>
          </div>
          <div className="stat-value" style={{ fontSize: 32, fontWeight: 800, color: anomalies > 0 ? 'var(--accent-yellow)' : 'var(--accent-green)', textShadow: `0 0 10px ${anomalies > 0 ? 'rgba(250,204,21,0.4)' : 'rgba(74,222,128,0.4)'}` }}>{anomalies} Issues</div>
          <div style={{ height: 24, display: 'flex', alignItems: 'center', marginBottom: 12, position: 'relative' }}>
            <svg viewBox="0 0 100 20" style={{ width: '100%', height: '100%', overflow: 'visible', stroke: 'var(--accent-yellow)', strokeWidth: 2, fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round', filter: 'drop-shadow(0 0 3px rgba(250,204,21,0.3))' }}>
              <path d="M 0,10 L 20,15 L 40,5 L 60,18 L 80,8 L 100,12" style={{ strokeDasharray: 200, strokeDashoffset: 0 }} />
            </svg>
          </div>
          <div className="stat-change" style={{ color: 'var(--accent-yellow)', fontSize: 11 }}>Suspicious anomalies</div>
        </div>

        {/* Unified Employee Count */}
        <div className="stat-card glass" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))' }} />
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: 11, fontWeight: 700 }}>Unified Employee Count</span>
            <span className="stat-icon" style={{ width: 20, height: 20, color: 'var(--accent-cyan)', filter: 'drop-shadow(0 0 4px rgba(0, 242, 254, 0.5))' }}><FiUsers /></span>
          </div>
          <div className="stat-value glow-text" style={{ fontSize: 32, fontWeight: 800 }}>{totalEmployees}</div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginBottom: 12, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, var(--accent-purple), var(--accent-cyan))', borderRadius: 2, transition: 'width 1.5s var(--spring)', boxShadow: '0 0 8px rgba(0, 242, 254, 0.4)' }} />
          </div>
          <div className="stat-change" style={{ color: 'var(--accent-cyan)', fontSize: 11 }}>Master Records</div>
        </div>
      </div>

      {/* ── DB Connection Status ──────────────────────────────────── */}
      <div className="stats-grid" style={{ marginTop: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <div className="stat-card glass" style={{ borderLeft: '3px solid var(--accent-cyan)', boxShadow: 'inset 4px 0 12px rgba(0, 242, 254, 0.05)' }}>
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: 11, fontWeight: 700 }}>SQL Server (HUMAN_2025)</span>
            <span className="stat-icon" style={{ width: 20, height: 20, color: 'var(--accent-cyan)', filter: 'drop-shadow(0 0 4px rgba(0, 242, 254, 0.5))' }}><FiDatabase /></span>
          </div>
          <div className="stat-value">
            <span className={`status-badge ${sqlConnected ? 'online' : 'offline'}`} style={sqlConnected ? { boxShadow: '0 0 12px rgba(74, 222, 128, 0.2)' } : {}}>● {sqlConnected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
        <div className="stat-card glass" style={{ borderLeft: '3px solid var(--accent-yellow)', boxShadow: 'inset 4px 0 12px rgba(250, 204, 21, 0.05)' }}>
          <div className="stat-header">
            <span className="stat-label" style={{ color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1.5px', fontSize: 11, fontWeight: 700 }}>MySQL (PAYROLL_2026)</span>
            <span className="stat-icon" style={{ width: 20, height: 20, color: 'var(--accent-yellow)', filter: 'drop-shadow(0 0 4px rgba(250, 204, 21, 0.5))' }}><FiDatabase /></span>
          </div>
          <div className="stat-value">
            <span className={`status-badge ${mysqlConnected ? 'online' : 'offline'}`} style={mysqlConnected ? { boxShadow: '0 0 12px rgba(74, 222, 128, 0.2)' } : {}}>● {mysqlConnected ? 'Connected' : 'Offline'}</span>
          </div>
        </div>
      </div>

      {/* ── Schema Tables ─────────────────────────────────────────── */}
      <div className="content-grid mt-6">
        <SchemaCard title="HUMAN_2025" badge="sql-server" schema={hrSchema} />
        <SchemaCard title="PAYROLL_2026" badge="mysql" schema={payrollSchema} />
      </div>
    </>
  );
}
