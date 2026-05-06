import { useState } from 'react';
import { FiCode, FiPlay, FiDatabase, FiAlertTriangle, FiLock } from 'react-icons/fi';
import { api } from '../api';

const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

const ENDPOINTS = [
  { method: 'GET', path: '/api/dashboard/status', label: 'System Status' },
  { method: 'GET', path: '/api/dashboard/overview', label: 'Schema Overview' },
  { method: 'GET', path: '/api/dashboard/quality', label: 'Data Quality' },
  { method: 'GET', path: '/api/dashboard/reconciliation', label: 'Reconciliation' },
  { method: 'GET', path: '/api/hr/schema', label: 'HR Schema' },
  { method: 'GET', path: '/api/payroll/schema', label: 'Payroll Schema' },
];

export default function ApiExplorer() {
  const user = (() => { try { return JSON.parse(localStorage.getItem('auth_user')||'{}'); } catch { return {}; } })();
  const isAdmin = user.role?.toLowerCase() === 'admin';

  const [activeTab, setActiveTab] = useState<'api' | 'sql'>('api');
  
  // API Tab State
  const [selected, setSelected] = useState(ENDPOINTS[0].path);
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  // SQL Tab State
  const [selectedDb, setSelectedDb] = useState<'sqlserver' | 'mysql'>('sqlserver');
  const [sqlQuery, setSqlQuery] = useState('SELECT * FROM dbo.Employees;');
  const [sqlResponse, setSqlResponse] = useState<any>(null);
  const [sqlLoading, setSqlLoading] = useState(false);

  const runApiQuery = async () => {
    setApiLoading(true);
    try {
      const res = await fetch(`${API_BASE}${selected}`);
      const data = await res.json();
      setApiResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setApiResponse(`Error: ${err}`);
    }
    setApiLoading(false);
  };

  const runSqlQuery = async () => {
    if (!sqlQuery.trim()) return;
    setSqlLoading(true);
    setSqlResponse(null);
    const res = await api.executeRawSql(selectedDb, sqlQuery);
    setSqlResponse(res.data || { error: res.error });
    setSqlLoading(false);
  };

  return (
    <div className="card glass fade-in" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(74,222,128,0.06), rgba(0,242,254,0.06))', borderBottom: '1px solid rgba(74,222,128,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <FiCode style={{ color: 'var(--accent-green)' }} /> Developer Console
        </h3>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={() => setActiveTab('api')} className={`secondary-btn ${activeTab === 'api' ? 'active' : ''}`} style={{ border: activeTab === 'api' ? '1px solid var(--accent-green)' : 'none', background: activeTab === 'api' ? 'rgba(74,222,128,0.1)' : 'transparent', color: activeTab === 'api' ? 'var(--accent-green)' : 'var(--text-muted)' }}>API Endpoints</button>
          {isAdmin && (
            <button onClick={() => setActiveTab('sql')} className={`secondary-btn ${activeTab === 'sql' ? 'active' : ''}`} style={{ border: activeTab === 'sql' ? '1px solid var(--accent-red)' : 'none', background: activeTab === 'sql' ? 'rgba(239,68,68,0.1)' : 'transparent', color: activeTab === 'sql' ? 'var(--accent-red)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <FiDatabase /> Raw DB Terminal
            </button>
          )}
        </div>
      </div>

      <div className="card-body" style={{ padding: 32 }}>
        {activeTab === 'api' ? (
          <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 250, borderRight: '1px solid var(--border)', paddingRight: 32 }}>
              <h4 style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Available Endpoints</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {ENDPOINTS.map(ep => (
                  <button key={ep.path} onClick={() => setSelected(ep.path)} className="secondary-btn"
                    style={{ textAlign: 'left', padding: 12, fontFamily: 'var(--mono)', fontSize: 12, borderLeft: `3px solid ${selected === ep.path ? 'var(--accent-cyan)' : 'transparent'}`, background: selected === ep.path ? 'rgba(0,242,254,0.06)' : 'transparent', cursor: 'pointer', borderTop: 'none', borderRight: 'none', borderBottom: 'none', color: 'var(--text-primary)' }}>
                    <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', marginRight: 8 }}>{ep.method}</span>{ep.path}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ flex: 2, minWidth: 400 }}>
              <h4 style={{ marginBottom: 16, fontSize: 14 }}>Endpoint Configuration</h4>
              <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', marginBottom: 24 }}>
                <div style={{ fontFamily: 'var(--mono)', color: 'var(--accent-cyan)', fontSize: 16, marginBottom: 20, background: 'var(--bg-card-solid)', padding: 12, borderRadius: 6, border: '1px solid var(--border)' }}>
                  GET <span style={{ color: 'var(--text-primary)' }}>{selected}</span>
                </div>
                <button className="btn-primary" onClick={runApiQuery} disabled={apiLoading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FiPlay /> {apiLoading ? 'Running...' : 'Run Test Query'}
                </button>
              </div>
              <h4 style={{ marginBottom: 16, fontSize: 14 }}>Response Output</h4>
              <pre style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', fontFamily: 'var(--mono)', fontSize: 13, overflowX: 'auto', color: 'var(--text-secondary)', lineHeight: 1.6, minHeight: 200, maxHeight: 500 }}>
                {apiResponse || 'Click "Run Test Query" to see response.'}
              </pre>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {!isAdmin ? (
               <div style={{ padding: 40, textAlign: 'center', color: 'var(--accent-red)', background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-md)' }}>
                 <FiLock size={40} style={{ margin: '0 auto 16px' }} />
                 <h3 style={{ marginBottom: 8 }}>Access Denied</h3>
                 <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>You do not have the required administrative privileges to access the raw database terminal.</p>
               </div>
            ) : (
              <>
                <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', padding: 16, borderRadius: 'var(--radius-md)', display: 'flex', gap: 12, color: 'var(--accent-red)' }}>
                  <FiAlertTriangle size={24} style={{ flexShrink: 0 }} />
                  <div>
                    <strong style={{ display: 'block', marginBottom: 4 }}>DANGER ZONE: Direct Database Execution</strong>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Queries executed here run directly against the live schemas. UPDATE and DELETE operations are permanent and bypass application logic.</span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <select className="cyber-input" value={selectedDb} onChange={e => setSelectedDb(e.target.value as any)} style={{ padding: '12px 16px', borderRadius: 8, width: 250, cursor: 'pointer' }}>
                    <option value="sqlserver">SQL Server (HUMAN_2025)</option>
                    <option value="mysql">MySQL (PAYROLL_2026)</option>
                  </select>
                </div>

                <textarea 
                  className="cyber-input mono" 
                  value={sqlQuery} 
                  onChange={e => setSqlQuery(e.target.value)}
                  placeholder="SELECT * FROM dbo.Employees WHERE EmployeeID = 1;"
                  style={{ width: '100%', height: 150, padding: 16, borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                />

                <div>
                  <button className="btn-delete" onClick={runSqlQuery} disabled={sqlLoading} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 32px' }}>
                    <FiPlay /> {sqlLoading ? 'Executing...' : 'Execute Raw SQL'}
                  </button>
                </div>

                {sqlResponse && (
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ marginBottom: 12, fontSize: 14 }}>Execution Result</h4>
                    <div style={{ background: 'var(--bg-secondary)', padding: 24, borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)', overflowX: 'auto' }}>
                      {!sqlResponse.success ? (
                        <div style={{ color: 'var(--accent-red)', fontFamily: 'var(--mono)' }}>ERROR: {sqlResponse.error}</div>
                      ) : sqlResponse.type === 'mutate' ? (
                        <div style={{ color: 'var(--accent-green)', fontFamily: 'var(--mono)' }}>SUCCESS: {sqlResponse.affected_rows} row(s) affected.</div>
                      ) : (
                        <div>
                          <div style={{ color: 'var(--accent-cyan)', fontFamily: 'var(--mono)', marginBottom: 16 }}>SUCCESS: {sqlResponse.count} row(s) returned.</div>
                          {sqlResponse.count > 0 && (
                            <table className="data-table" style={{ width: '100%', fontSize: 13 }}>
                              <thead>
                                <tr>
                                  {Object.keys(sqlResponse.data[0]).map(k => <th key={k} style={{ padding: 12 }}>{k}</th>)}
                                </tr>
                              </thead>
                              <tbody>
                                {sqlResponse.data.slice(0, 100).map((row: any, i: number) => (
                                  <tr key={i}>
                                    {Object.values(row).map((v: any, j: number) => <td key={j} style={{ padding: 12 }}>{String(v)}</td>)}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
