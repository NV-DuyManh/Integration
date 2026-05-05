import { useState, useEffect } from 'react';
import { FiDownload } from 'react-icons/fi';
import { api } from '../api';
import { exportToExcel, exportToPDF } from '../utils/exportUtils';

const REPORT_TYPES = [
  { id: 'compensation', label: 'Employee Compensation', desc: 'Detailed salary and benefits extract' },
  { id: 'department', label: 'Department Payroll', desc: 'Aggregated department budget report' },
  { id: 'exceptions', label: 'Sync Exceptions', desc: 'Discrepancy and anomaly highlights' },
];

export default function Reports() {
  const [selectedType, setSelectedType] = useState('compensation');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const handleGenerate = async (type?: string) => {
    const t = type || selectedType;
    setSelectedType(t); setLoading(true); setReportData(null); setSearch(''); setSortCol(null);
    const res = await api.getReport(t);
    setLoading(false);
    if (res.data) setReportData(res.data);
  };

  useEffect(() => {
    handleGenerate('compensation');
  }, []);

  const handleSort = (col: string) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  let displayData = reportData?.data || [];
  const headers = displayData.length > 0 ? Object.keys(displayData[0]) : [];

  if (search) {
    const q = search.toLowerCase();
    displayData = displayData.filter((row: any) => headers.some(h => String(row[h] || '').toLowerCase().includes(q)));
  }
  if (sortCol) {
    displayData = [...displayData].sort((a: any, b: any) => {
      if (a[sortCol!] < b[sortCol!]) return sortDir === 'asc' ? -1 : 1;
      if (a[sortCol!] > b[sortCol!]) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  return (
    <>
      {/* Report Type Selector */}
      <div className="card glass" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(123,47,247,0.05))', borderBottom: 'none' }}>
          <div>
            <h3 className="glow-text2" style={{ fontSize: 18 }}>Analytics & Export Center</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>Generate executive dashboards and operational data extracts.</p>
          </div>
        </div>
        <div className="card-body" style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginTop: 20 }}>
            {REPORT_TYPES.map(t => (
              <div key={t.id} onClick={() => handleGenerate(t.id)}
                className={`report-card-selector${selectedType === t.id ? ' active' : ''}`}>
                <h4 style={{ color: selectedType === t.id ? 'var(--accent-cyan)' : 'var(--text-primary)', marginBottom: 8, fontSize: 14, fontWeight: 700 }}>{t.label}</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.5 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="loading-skeleton" style={{ height: 300, marginTop: 24, borderRadius: 'var(--radius-lg)' }} />}

      {/* Report Data Table */}
      {reportData && !loading && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, overflow: 'hidden', borderRadius: 'var(--radius-lg)' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(123,47,247,0.05))', borderBottom: '1px solid rgba(0,242,254,0.1)', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h3 style={{ fontSize: 20 }}>{reportData.title}</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}><strong style={{ color: 'var(--text-primary)' }}>{displayData.length}</strong> Records</p>
            </div>
          </div>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid rgba(0,242,254,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
            <input className="cyber-input" placeholder="Search report data..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)', width: 300, fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-export btn-excel" onClick={() => exportToExcel(displayData, `${reportData?.title || 'Report'}.xlsx`)}>
                <FiDownload size={14} /> Export Excel
              </button>
              <button className="btn-export btn-pdf" onClick={() => exportToPDF(displayData, reportData?.title || 'Report', `${reportData?.title || 'Report'}.pdf`)}>
                <FiDownload size={14} /> Export PDF
              </button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflow: 'auto', maxHeight: 600 }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(10,15,30,0.95)' }}>
                <tr>
                  {headers.map(h => (
                    <th key={h} onClick={() => handleSort(h)} style={{ cursor: 'pointer', padding: '12px 16px' }}>
                      {h} <span style={{ color: 'var(--accent-cyan)' }}>{sortCol === h ? (sortDir === 'asc' ? '↑' : '↓') : ''}</span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayData.length === 0 ? (
                  <tr><td colSpan={headers.length} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No matching data</td></tr>
                ) : displayData.map((row: any, i: number) => (
                  <tr key={i}>
                    {headers.map(h => {
                      const val = row[h];
                      const isCurrency = /salary|bonus|deduction/i.test(h);
                      const isNum = typeof val === 'number';
                      return (
                        <td key={h} style={{ textAlign: isCurrency || isNum ? 'right' : 'left', padding: '12px 16px' }}>
                          {isCurrency && isNum ? <span style={{ color: 'var(--accent-green)', fontWeight: 500 }}>₫{val.toLocaleString()}</span> : (val ?? '—')}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
              {displayData.length > 0 && selectedType !== 'exceptions' && (() => {
                // Filter out columns that are non-numeric or contain 'id' in their name
                const numericCols = headers.filter(h =>
                  !h.toLowerCase().includes('id') && displayData.some((row: any) => typeof row[h] === 'number')
                );
                
                if (numericCols.length === 0) return null;
                
                return (
                  <tfoot style={{ borderTop: '3px solid #f59e0b', background: 'rgba(245, 158, 11, 0.12)' }}>
                    <tr>
                      {headers.map((h, idx) => {
                        const isCurrency = /salary|bonus|deduction/i.test(h);
                        const isNumCol = numericCols.includes(h);
                        
                        if (idx === 0) {
                          return (
                            <td key={h} style={{ padding: '18px 16px', fontWeight: 800, fontSize: 14, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              Grand Total
                            </td>
                          );
                        }
                        
                        if (isNumCol) {
                          const total = displayData.reduce((sum: number, row: any) => sum + (Number(row[h]) || 0), 0);
                          return (
                            <td key={h} style={{ textAlign: 'right', padding: '18px 16px', fontWeight: 800, fontSize: 15 }}>
                              {/* Using var(--text-primary) ensures it is White in Dark Mode and Black in Light Mode */}
                              <span style={{ color: 'var(--text-primary)' }}>
                                {isCurrency ? `₫${total.toLocaleString()}` : total.toLocaleString()}
                              </span>
                            </td>
                          );
                        }
                        return <td key={h} style={{ padding: '18px 16px' }} />;
                      })}
                    </tr>
                  </tfoot>
                );
              })()}
            </table>
          </div>
        </div>
      )}

      {!reportData && !loading && (
        <div className="card glass" style={{ marginTop: 24, padding: '48px 32px', textAlign: 'center', border: '1px dashed rgba(0,242,254,0.15)' }}>
          <h4 style={{ marginBottom: 12, fontSize: 18 }}>Select an Export Format</h4>
          <p style={{ color: 'var(--text-muted)', fontSize: 14, maxWidth: 400, margin: '0 auto' }}>Choose a reporting template above to generate a full preview.</p>
        </div>
      )}
    </>
  );
}
