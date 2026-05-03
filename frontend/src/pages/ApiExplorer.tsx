import { useState } from 'react';
import { FiCode, FiPlay } from 'react-icons/fi';

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
  const [selected, setSelected] = useState(ENDPOINTS[0].path);
  const [response, setResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const runQuery = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}${selected}`);
      const data = await res.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponse(`Error: ${err}`);
    }
    setLoading(false);
  };

  return (
    <div className="card glass fade-in" style={{ borderRadius: 'var(--radius-lg)' }}>
      <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(74,222,128,0.06), rgba(0,242,254,0.06))', borderBottom: '1px solid rgba(74,222,128,0.1)' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiCode style={{ color: 'var(--accent-green)' }} /> Interactive API Explorer</h3>
        <span className="card-badge sql-server" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(74,222,128,0.2)' }}>Developer Tools</span>
      </div>
      <div className="card-body" style={{ display: 'flex', gap: 32, padding: 32, flexWrap: 'wrap' }}>
        {/* Endpoint List */}
        <div style={{ flex: 1, minWidth: 250, borderRight: '1px solid rgba(0,242,254,0.08)', paddingRight: 32 }}>
          <h4 style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Available Endpoints</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {ENDPOINTS.map(ep => (
              <button key={ep.path} onClick={() => setSelected(ep.path)} className="secondary-btn"
                style={{ textAlign: 'left', padding: 12, fontFamily: 'var(--mono)', fontSize: 12, borderLeft: `3px solid ${selected === ep.path ? 'var(--accent-cyan)' : 'transparent'}`, background: selected === ep.path ? 'rgba(0,242,254,0.06)' : 'transparent', cursor: 'pointer', border: 'none', color: 'var(--text-primary)' }}>
                <span style={{ color: 'var(--accent-green)', fontWeight: 'bold', marginRight: 8 }}>{ep.method}</span>{ep.path}
              </button>
            ))}
          </div>
        </div>

        {/* Query Panel */}
        <div style={{ flex: 2, minWidth: 400 }}>
          <h4 style={{ marginBottom: 16, fontSize: 14 }}>Endpoint Configuration</h4>
          <div style={{ background: 'rgba(15,23,42,0.6)', padding: 24, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,242,254,0.08)', marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--mono)', color: 'var(--accent-cyan)', fontSize: 16, marginBottom: 20, background: 'rgba(10,15,30,0.6)', padding: 12, borderRadius: 6, border: '1px solid rgba(0,242,254,0.08)' }}>
              GET <span style={{ color: 'var(--text-primary)' }}>{selected}</span>
            </div>
            <button className="btn-primary" onClick={runQuery} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiPlay /> {loading ? 'Running...' : 'Run Test Query'}
            </button>
          </div>
          <h4 style={{ marginBottom: 16, fontSize: 14 }}>Response Output</h4>
          <pre style={{ background: 'rgba(10,15,30,0.8)', padding: 24, borderRadius: 'var(--radius-sm)', border: '1px solid rgba(0,242,254,0.08)', fontFamily: 'var(--mono)', fontSize: 13, overflowX: 'auto', color: 'var(--accent-green)', lineHeight: 1.6, minHeight: 200, maxHeight: 500 }}>
            {response || 'Click "Run Test Query" to see response.'}
          </pre>
        </div>
      </div>
    </div>
  );
}
