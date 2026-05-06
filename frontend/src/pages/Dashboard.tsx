import { useEffect, useState } from 'react';
import { FiHeart, FiRepeat, FiAlertCircle, FiUsers, FiDatabase, FiClock, FiActivity, FiRefreshCw } from 'react-icons/fi';
import { api } from '../api';
import type { SystemStatus, SchemaResponse, AuditLog } from '../api';

/* ── Helper: humanise action names ──────────────────────────────── */
const ACTION_META: Record<string, { icon: string; color: string; gradient: string }> = {
  CREATE:       { icon: '＋', color: 'var(--accent-green)',  gradient: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.05))' },
  INSERT:       { icon: '＋', color: 'var(--accent-green)',  gradient: 'linear-gradient(135deg, rgba(74,222,128,0.2), rgba(74,222,128,0.05))' },
  UPDATE:       { icon: '✎', color: 'var(--accent-cyan)',   gradient: 'linear-gradient(135deg, rgba(0,242,254,0.2), rgba(0,242,254,0.05))' },
  DELETE:       { icon: '✕', color: 'var(--accent-red)',    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))' },
  READ:         { icon: '⊙', color: 'var(--accent-purple)', gradient: 'linear-gradient(135deg, rgba(123,47,247,0.2), rgba(123,47,247,0.05))' },
  QUERY:        { icon: '⊙', color: 'var(--accent-purple)', gradient: 'linear-gradient(135deg, rgba(123,47,247,0.2), rgba(123,47,247,0.05))' },
  AUTO_SCAN:    { icon: '⟳', color: 'var(--accent-purple)', gradient: 'linear-gradient(135deg, rgba(123,47,247,0.2), rgba(123,47,247,0.05))' },
  RAW_SQL:      { icon: '⌘', color: 'var(--accent-yellow)', gradient: 'linear-gradient(135deg, rgba(250,204,21,0.2), rgba(250,204,21,0.05))' },
  TEST_ANOMALY: { icon: '⚠', color: 'var(--accent-red)',    gradient: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))' },
  DEFAULT:      { icon: '•', color: 'var(--text-muted)',     gradient: 'linear-gradient(135deg, rgba(100,116,139,0.2), rgba(100,116,139,0.05))' },
};

function getMeta(action: string) {
  const key = action.toUpperCase();
  return ACTION_META[key] || ACTION_META.DEFAULT;
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return 'just now';
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* ── Component ───────────────────────────────────────────────────── */
export default function Dashboard() {
  const [dbStatus, setDbStatus] = useState<SystemStatus | null>(null);
  const [dataQuality, setDataQuality] = useState<any>(null);
  const [reconData, setReconData] = useState<any>(null);
  const [hrSchema, setHrSchema] = useState<SchemaResponse | null>(null);
  const [payrollSchema, setPayrollSchema] = useState<SchemaResponse | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logTab, setLogTab] = useState<'user' | 'system'>('user');

  /* ── Fetch data on mount ────────────────────────────────────────── */
  useEffect(() => {
    (async () => {
      const [statusRes, qualityRes, reconRes, hrRes, prRes, logsRes] = await Promise.all([
        api.dashboardStatus(),
        api.getDataQuality(),
        api.getReconciliation(),
        api.hrSchema(),
        api.payrollSchema(),
        api.getAuditLogs(20),
      ]);
      if (statusRes.data) setDbStatus(statusRes.data);
      if (qualityRes.data) setDataQuality(qualityRes.data);
      if (reconRes.data) setReconData(reconRes.data);
      if (hrRes.data) setHrSchema(hrRes.data);
      if (prRes.data) setPayrollSchema(prRes.data);
      if (logsRes.data) setAuditLogs(logsRes.data);
      setLogsLoading(false);
    })();
  }, []);

  const refreshLogs = async () => {
    setLogsLoading(true);
    const res = await api.getAuditLogs(20);
    if (res.data) setAuditLogs(res.data);
    setLogsLoading(false);
  };

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

  /* ── Filtered logs: hide LOGIN/LOGOUT, split by tab ────────────── */
  const USER_ACTIONS = ['CREATE', 'UPDATE', 'DELETE', 'INSERT', 'RAW_SQL', 'TEST_ANOMALY'];
  const filteredLogs = auditLogs.filter(log => {
    const act = log.action.toUpperCase();
    if (act === 'LOGIN' || act === 'LOGOUT') return false;
    const isUserAction = USER_ACTIONS.includes(act);
    return logTab === 'user' ? isUserAction : !isUserAction;
  });

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

      {/* ── Recent Activity Timeline ──────────────────────────────── */}
      <div className="card glass activity-timeline-card" style={{ marginTop: '1.5rem', overflow: 'hidden' }}>
        <div className="card-header" style={{
          background: 'linear-gradient(90deg, rgba(0,242,254,0.06), rgba(123,47,247,0.06))',
          borderBottom: '1px solid rgba(0,242,254,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <FiActivity style={{ color: 'var(--accent-cyan)', fontSize: 18, filter: 'drop-shadow(0 0 6px rgba(0,242,254,0.4))' }} />
              <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: 0 }}>Audit Trail</h3>
            </div>
            
            {/* Custom Tabs inside Header */}
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: 4, borderRadius: 8, border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setLogTab('user')}
                style={{ 
                  padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: logTab === 'user' ? 'rgba(0,242,254,0.15)' : 'transparent',
                  color: logTab === 'user' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}>
                User Actions
              </button>
              <button 
                onClick={() => setLogTab('system')}
                style={{ 
                  padding: '4px 12px', fontSize: 12, fontWeight: 600, borderRadius: 6, border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  background: logTab === 'system' ? 'rgba(123,47,247,0.15)' : 'transparent',
                  color: logTab === 'system' ? 'var(--accent-purple)' : 'var(--text-muted)'
                }}>
                System Logs
              </button>
            </div>
          </div>
          
          <button
            onClick={refreshLogs}
            className="header-btn"
            style={{ padding: '6px 12px', fontSize: 12, gap: 6, display: 'flex', alignItems: 'center' }}
            title="Refresh logs"
          >
            <FiRefreshCw style={{ fontSize: 14, animation: logsLoading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
        
        <div className="card-body" style={{ padding: 0 }}>
          {logsLoading && filteredLogs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <FiClock style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }} />
              <p style={{ fontSize: 13 }}>Loading audit logs…</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>
              <FiClock style={{ fontSize: 28, marginBottom: 8, opacity: 0.5 }} />
              <p style={{ fontSize: 13, fontWeight: 500 }}>No activity found</p>
              <p style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>No records match the current filter.</p>
            </div>
          ) : (
            <div className="activity-timeline" style={{ maxHeight: 420, overflowY: 'auto' }}>
              {filteredLogs.map((log, idx) => {
                const meta = getMeta(log.action);
                return (
                  <div
                    key={log.id}
                    className="activity-item"
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      padding: '14px 24px',
                      borderBottom: idx < filteredLogs.length - 1 ? '1px solid var(--border-light)' : 'none',
                      transition: 'background 0.2s ease',
                      cursor: 'default',
                      animationDelay: `${idx * 40}ms`,
                    }}
                  >
                    {/* Timeline connector */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 38 }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 10,
                        background: meta.gradient,
                        border: `1px solid ${meta.color}`,
                        borderColor: meta.color.replace(')', ',0.25)').replace('var(', ''),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 16, fontWeight: 700, color: meta.color,
                        boxShadow: `0 0 12px ${meta.color.replace(')', ',0.15)').replace('var(', '')}`,
                        flexShrink: 0,
                      }}>
                        {meta.icon}
                      </div>
                      {idx < filteredLogs.length - 1 && (
                        <div style={{
                          width: 2, flex: 1, minHeight: 8,
                          background: 'linear-gradient(180deg, var(--border) 0%, transparent 100%)',
                        }} />
                      )}
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <span style={{
                          fontSize: 12, fontWeight: 800,
                          textTransform: 'uppercase', letterSpacing: '0.8px',
                          color: meta.color,
                        }}>
                          {log.action}
                        </span>
                        
                        <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                          by <span style={{ color: 'var(--accent-cyan)' }}>{log.user}</span>
                        </span>

                        <span style={{
                          fontSize: 10, color: 'var(--text-muted)', fontWeight: 500,
                          marginLeft: 'auto', whiteSpace: 'nowrap',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <FiClock style={{ fontSize: 10 }} />
                          {timeAgo(log.timestamp)}
                        </span>
                      </div>

                      {log.details && (
                        <p style={{
                          fontSize: 13, color: 'var(--text-secondary)',
                          lineHeight: 1.5, margin: '4px 0 0 0',
                        }}>
                          {log.details}
                        </p>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                        {log.table_name && (
                          <span className="mono" style={{
                            fontSize: 10, color: 'var(--accent-cyan)',
                            background: 'rgba(0,242,254,0.06)',
                            padding: '2px 8px', borderRadius: 4,
                            border: '1px solid rgba(0,242,254,0.1)',
                          }}>
                            Target: {log.table_name}
                          </span>
                        )}
                        <span style={{
                          fontSize: 10, color: 'var(--text-muted)',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <FiDatabase style={{ fontSize: 10 }} />
                          {log.target_db}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
