import { useState, useEffect, useCallback } from 'react';
import {
  FiUsers, FiDollarSign, FiSearch, FiPlus, FiEdit, FiTrash2,
  FiX, FiSave, FiDownload, FiAlertTriangle, FiLayers, FiBriefcase,
  FiGift, FiCalendar,
} from 'react-icons/fi';
import { api } from '../api';
import { exportToExcel } from '../utils/exportUtils';

// ── Shared style constants ────────────────────────────────────────
const labelStyle: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '1.5px',
};
const inputStyle: React.CSSProperties = {
  borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 14,
};
const selectStyle: React.CSSProperties = {
  ...inputStyle, appearance: 'auto' as any, cursor: 'pointer',
};

type TabId = 'employees' | 'salaries' | 'departments' | 'positions' | 'dividends' | 'attendance';

const TABS: { id: TabId; label: string; icon: React.ReactNode; color: string; accent: string }[] = [
  { id: 'employees',   label: 'Employees',   icon: <FiUsers />,     color: 'var(--accent-cyan)',   accent: 'rgba(0,242,254,0.1)' },
  { id: 'salaries',    label: 'Salaries',    icon: <FiDollarSign />,color: 'var(--accent-green)',  accent: 'rgba(74,222,128,0.1)' },
  { id: 'departments', label: 'Departments', icon: <FiLayers />,    color: 'var(--accent-purple)', accent: 'rgba(188,19,254,0.1)' },
  { id: 'positions',   label: 'Positions',   icon: <FiBriefcase />, color: 'var(--accent-yellow)', accent: 'rgba(250,204,21,0.1)' },
  { id: 'dividends',   label: 'Dividends',   icon: <FiGift />,      color: 'var(--accent-pink)',   accent: 'rgba(236,72,153,0.1)' },
  { id: 'attendance',  label: 'Attendance',  icon: <FiCalendar />,  color: 'var(--accent-cyan)',   accent: 'rgba(0,242,254,0.08)' },
];

// ── Generic Modal Wrapper ─────────────────────────────────────────
function Modal({ open, onClose, title, icon, borderColor, children }: {
  open: boolean; onClose: () => void; title: string;
  icon: React.ReactNode; borderColor: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(12px)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
    }}>
      <div className="card glass fade-in" style={{
        width: '100%', maxWidth: 560, borderRadius: 'var(--radius-xl)',
        overflow: 'hidden', border: `1px solid ${borderColor}`,
      }}>
        <div className="card-header" style={{
          background: 'linear-gradient(90deg, rgba(0,242,254,0.06), rgba(123,47,247,0.06))',
          padding: 24, borderBottom: `1px solid ${borderColor}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <h3 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            {icon} {title}
          </h3>
          <button onClick={onClose} style={{
            background: 'transparent', border: 'none',
            color: 'var(--text-muted)', cursor: 'pointer',
          }}><FiX size={20} /></button>
        </div>
        <div className="card-body" style={{ padding: 32, maxHeight: '80vh', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

// ── Reusable Table ────────────────────────────────────────────────
function DataTable({ columns, rows, onEdit, onDelete, accentColor }: {
  columns: { key: string; label: string; render?: (row: any) => React.ReactNode }[];
  rows: any[];
  onEdit: (row: any) => void;
  onDelete: (row: any) => void;
  accentColor: string;
}) {
  return (
    <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
      <table className="data-table" style={{ width: '100%' }}>
        <thead className="table-header">
          <tr>
            {columns.map(c => <th key={c.key} style={{ padding: 16 }}>{c.label}</th>)}
            <th style={{ padding: 16 }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={columns.length + 1} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No records found.</td></tr>
            : rows.map((row, i) => (
              <tr key={i} className="table-row">
                {columns.map(c => (
                  <td key={c.key} className="table-cell" style={{ padding: 16 }}>
                    {c.render ? c.render(row) : (row[c.key] ?? '—')}
                  </td>
                ))}
                <td className="table-cell" style={{ padding: 16 }}>
                  <button className="btn-edit" onClick={() => onEdit(row)}
                    style={{ padding: '6px 12px', marginRight: 8, borderRadius: 8 }} title="Edit">
                    <FiEdit size={14} />
                  </button>
                  <button className="btn-delete" onClick={() => onDelete(row)}
                    style={{ padding: '6px 12px', borderRadius: 8 }} title="Delete">
                    <FiTrash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Error Alert ───────────────────────────────────────────────────
function ErrorAlert({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div style={{
      background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
      borderRadius: 'var(--radius-md)', padding: '14px 20px', marginBottom: 20,
      display: 'flex', alignItems: 'flex-start', gap: 12, color: '#ef4444', fontSize: 14,
    }}>
      <FiAlertTriangle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0 }}>
        <FiX size={16} />
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════
export default function DataManagement() {
  const [tab, setTab] = useState<TabId>('employees');
  const [loading, setLoading] = useState(false);
  const [modalError, setModalError] = useState('');
  const [search, setSearch] = useState('');

  // Data stores
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [dividends, setDividends] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  // Modal states
  const [empModal, setEmpModal] = useState(false);
  const [salModal, setSalModal] = useState(false);
  const [deptModal, setDeptModal] = useState(false);
  const [posModal, setPosModal] = useState(false);
  const [divModal, setDivModal] = useState(false);
  const [attModal, setAttModal] = useState(false);
  const [orphanModal, setOrphanModal] = useState(false);

  // Form states
  const [empForm, setEmpForm] = useState<any>({});
  const [salForm, setSalForm] = useState<any>({});
  const [deptForm, setDeptForm] = useState<any>({});
  const [posForm, setPosForm] = useState<any>({});
  const [divForm, setDivForm] = useState<any>({});
  const [attForm, setAttForm] = useState<any>({});
  const [orphanForm, setOrphanForm] = useState<any>({
    FullName: '', DateOfBirth: '', HireDate: new Date().toISOString().split('T')[0],
  });

  const today = new Date().toISOString().split('T')[0];

  // ── Load data ─────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    setLoading(true);
    const [e, s, d, p, div, att] = await Promise.all([
      api.getEmployeesWithNames(),
      api.getPayrollTableData('salaries'),
      api.getDepartments(),
      api.getPositions(),
      api.getDividends(),
      api.getAttendance(),
    ]);
    if (e.data) setEmployees((e.data as any).data || []);
    if (s.data) setSalaries((s.data as any).data || []);
    if (d.data) setDepartments(Array.isArray(d.data) ? d.data : []);
    if (p.data) setPositions(Array.isArray(p.data) ? p.data : []);
    if (div.data) setDividends((div.data as any).data || []);
    if (att.data) setAttendance((att.data as any).data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAll(); }, [loadAll]);
  useEffect(() => { setSearch(''); setModalError(''); }, [tab]);

  // ── Helpers ───────────────────────────────────────────────────
  const openModal = (
    setter: React.Dispatch<React.SetStateAction<any>>,
    modalSetter: React.Dispatch<React.SetStateAction<boolean>>,
    defaults: any, row?: any
  ) => {
    setModalError('');
    setter(row ? { ...row } : { ...defaults });
    modalSetter(true);
  };

  const closeModal = (modalSetter: React.Dispatch<React.SetStateAction<boolean>>) => {
    modalSetter(false);
    setModalError('');
  };

  const handleDelete = async (
    confirmMsg: string,
    deleteFn: () => Promise<any>,
  ) => {
    if (!confirm(confirmMsg)) return;
    setLoading(true);
    const res = await deleteFn();
    if ((res as any)?.error) alert('Error: ' + (res as any).error);
    await loadAll();
  };

  const handleSubmit = async (
    e: React.FormEvent,
    saveFn: () => Promise<any>,
    modalSetter: React.Dispatch<React.SetStateAction<boolean>>,
  ) => {
    e.preventDefault();
    setLoading(true);
    setModalError('');
    const res = await saveFn();
    setLoading(false);
    if (res?.error) {
      const msg = res.error.replace(/^\d+:\s*/, '');
      setModalError(msg);
      return;
    }
    modalSetter(false);
    await loadAll();
  };

  const calcNet = (base: any, bonus: any, deductions: any) =>
    (Number(base) || 0) + (Number(bonus) || 0) - (Number(deductions) || 0);

  const getStatusClass = (status: string) => {
    if (!status) return 'status-danger';
    const s = status.toLowerCase();
    if (s.includes('đang làm việc') || s.includes('active')) return 'status-success';
    if (s.includes('thử việc')) return 'status-info';
    if (s.includes('thực tập')) return 'status-warning';
    return 'status-danger';
  };

  // ── Search filter helper ──────────────────────────────────────
  const filtered = (rows: any[], keys: string[]) => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r => keys.some(k => String(r[k] || '').toLowerCase().includes(q)));
  };

  // ── Tab config ────────────────────────────────────────────────
  const currentTab = TABS.find(t => t.id === tab)!;

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Header Card ──────────────────────────────────────── */}
      <div className="card glass" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="card-header" style={{
          background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(123,47,247,0.05))',
          borderBottom: '1px solid rgba(0,242,254,0.1)', padding: 24,
        }}>
          <div>
            <h3 className="glow-text2" style={{ fontSize: 20, fontWeight: 700 }}>Data Management Center</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>
              Full CRUD management across HR and Payroll databases with cross-DB sync.
            </p>
          </div>
        </div>
        <div className="card-body" style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            {TABS.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px',
                borderRadius: 999,
                border: `1px solid ${tab === t.id ? t.color : 'rgba(255,255,255,0.08)'}`,
                background: tab === t.id ? t.accent : 'rgba(15,23,42,0.6)',
                color: tab === t.id ? t.color : 'var(--text-secondary)',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', fontSize: 13,
                boxShadow: tab === t.id ? `0 0 14px ${t.accent}` : 'none',
              }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════ */}
      {/* EMPLOYEES TAB                                          */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'employees' && (
        <div className="card glass fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{
            background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(123,47,247,0.05))',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(0,242,254,0.1)', padding: '20px 24px', flexWrap: 'wrap', gap: 12,
          }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiUsers style={{ color: 'var(--accent-cyan)' }} /> Employee Directory
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <SearchBox value={search} onChange={setSearch} />
              <button className="btn-export btn-excel" onClick={() => exportToExcel(filtered(employees, ['FullName', 'EmployeeID']), 'Employees.xlsx')}>
                <FiDownload size={14} /> Export
              </button>
              <button onClick={() => { setOrphanForm({ FullName: '', DateOfBirth: '', HireDate: today }); setOrphanModal(true); setModalError(''); }} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', fontSize: 13,
                borderRadius: 999, border: '1px solid rgba(255,107,107,0.4)',
                background: 'rgba(255,107,107,0.08)', color: '#ff6b6b', fontWeight: 600, cursor: 'pointer',
              }}>
                <FiAlertTriangle size={14} /> Inject Sync Error
              </button>
              <button className="btn-primary" onClick={() => openModal(setEmpForm, setEmpModal, {
                FullName: '', DateOfBirth: '', HireDate: today, Email: '', PhoneNumber: '',
                DepartmentID: '', PositionID: '', Status: 'Đang làm việc', Gender: 'Nam',
              })} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}>
                <FiPlus style={{ marginRight: 6 }} /> Add Employee
              </button>
            </div>
          </div>
          <DataTable
            columns={[
              { key: 'EmployeeID', label: 'ID', render: r => <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{r.EmployeeID}</span> },
              { key: 'FullName', label: 'Full Name', render: r => <span style={{ fontWeight: 600 }}>{r.FullName}</span> },
              { key: 'Email', label: 'Email', render: r => <span style={{ color: 'var(--text-secondary)' }}>{r.Email || '—'}</span> },
              { key: 'PhoneNumber', label: 'Phone', render: r => <span style={{ color: 'var(--text-secondary)' }}>{r.PhoneNumber || '—'}</span> },
              { key: 'DepartmentName', label: 'Department' },
              { key: 'PositionName', label: 'Position' },
              { key: 'Status', label: 'Status', render: r => <span className={`status-badge ${getStatusClass(r.Status)}`}>● {r.Status || '—'}</span> },
            ]}
            rows={filtered(employees, ['FullName', 'Email', 'DepartmentName', 'PositionName'])}
            onEdit={r => openModal(setEmpForm, setEmpModal, {}, r)}
            onDelete={r => handleDelete(`Delete employee "${r.FullName}"? This will cascade-delete all related records.`, () => api.deleteEmployee(r.EmployeeID))}
            accentColor="var(--accent-cyan)"
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* SALARIES TAB                                           */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'salaries' && (
        <div className="card glass fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{
            background: 'linear-gradient(90deg, rgba(74,222,128,0.05), rgba(0,242,254,0.05))',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(74,222,128,0.1)', padding: '20px 24px', flexWrap: 'wrap', gap: 12,
          }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiDollarSign style={{ color: 'var(--accent-green)' }} /> Payroll Records
            </h3>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <SearchBox value={search} onChange={setSearch} />
              <button className="btn-export btn-excel" onClick={() => exportToExcel(filtered(salaries, ['EmployeeID', 'SalaryMonth']), 'Salaries.xlsx')}>
                <FiDownload size={14} /> Export
              </button>
              <button className="btn-primary" onClick={() => openModal(setSalForm, setSalModal, {
                EmployeeID: '', SalaryMonth: '', BaseSalary: '', Bonus: 0, Deductions: 0,
              })} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}>
                <FiPlus style={{ marginRight: 6 }} /> Add Salary
              </button>
            </div>
          </div>
          <DataTable
            columns={[
              { key: 'SalaryID', label: 'ID', render: r => <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{r.SalaryID}</span> },
              { key: 'EmployeeID', label: 'Emp ID', render: r => <span className="mono" style={{ fontWeight: 600, color: 'var(--accent-cyan)' }}>{r.EmployeeID}</span> },
              { key: 'SalaryMonth', label: 'Month' },
              { key: 'BaseSalary', label: 'Base', render: r => <span style={{ textAlign: 'right', display: 'block' }}>${(r.BaseSalary || 0).toLocaleString()}</span> },
              { key: 'Bonus', label: 'Bonus', render: r => <span style={{ color: 'var(--accent-green)', textAlign: 'right', display: 'block' }}>${(r.Bonus || 0).toLocaleString()}</span> },
              { key: 'Deductions', label: 'Deductions', render: r => <span style={{ color: 'var(--accent-red)', textAlign: 'right', display: 'block' }}>-${(r.Deductions || 0).toLocaleString()}</span> },
              { key: 'NetSalary', label: 'Net', render: r => <span style={{ fontWeight: 600, textAlign: 'right', display: 'block' }}>${(r.NetSalary || 0).toLocaleString()}</span> },
            ]}
            rows={filtered(salaries, ['EmployeeID', 'SalaryMonth'])}
            onEdit={r => openModal(setSalForm, setSalModal, {}, r)}
            onDelete={r => handleDelete(`Delete salary record #${r.SalaryID}?`, () => api.deleteSalary(r.SalaryID))}
            accentColor="var(--accent-green)"
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* DEPARTMENTS TAB                                         */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'departments' && (
        <div className="card glass fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{
            background: 'linear-gradient(90deg, rgba(188,19,254,0.05), rgba(123,47,247,0.05))',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(188,19,254,0.15)', padding: '20px 24px', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiLayers style={{ color: 'var(--accent-purple)' }} /> Departments
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                Synced across HUMAN_2025 ↔ PAYROLL_2026
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <SearchBox value={search} onChange={setSearch} />
              <button className="btn-export btn-excel" onClick={() => exportToExcel(filtered(departments, ['DepartmentName']), 'Departments.xlsx')}>
                <FiDownload size={14} /> Export
              </button>
              <button className="btn-primary" onClick={() => openModal(setDeptForm, setDeptModal, { DepartmentName: '' })}
                style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}>
                <FiPlus style={{ marginRight: 6 }} /> Add Department
              </button>
            </div>
          </div>
          <DataTable
            columns={[
              { key: 'DepartmentID', label: 'ID', render: r => <span className="mono" style={{ color: 'var(--accent-purple)' }}>{r.DepartmentID}</span> },
              { key: 'DepartmentName', label: 'Department Name', render: r => <span style={{ fontWeight: 600 }}>{r.DepartmentName}</span> },
              {
                key: 'sync', label: 'Sync Status', render: () => (
                  <span className="status-badge online" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(74,222,128,0.2)' }}>
                    ● Synced
                  </span>
                ),
              },
            ]}
            rows={filtered(departments, ['DepartmentName'])}
            onEdit={r => openModal(setDeptForm, setDeptModal, {}, r)}
            onDelete={r => handleDelete(`Delete department "${r.DepartmentName}"? This will also remove it from Payroll DB.`, () => api.deleteDepartment(r.DepartmentID))}
            accentColor="var(--accent-purple)"
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* POSITIONS TAB                                           */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'positions' && (
        <div className="card glass fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{
            background: 'linear-gradient(90deg, rgba(250,204,21,0.05), rgba(234,179,8,0.05))',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(250,204,21,0.15)', padding: '20px 24px', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiBriefcase style={{ color: 'var(--accent-yellow)' }} /> Positions
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                Synced across HUMAN_2025 ↔ PAYROLL_2026
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <SearchBox value={search} onChange={setSearch} />
              <button className="btn-export btn-excel" onClick={() => exportToExcel(filtered(positions, ['PositionName']), 'Positions.xlsx')}>
                <FiDownload size={14} /> Export
              </button>
              <button className="btn-primary" onClick={() => openModal(setPosForm, setPosModal, { PositionName: '' })}
                style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}>
                <FiPlus style={{ marginRight: 6 }} /> Add Position
              </button>
            </div>
          </div>
          <DataTable
            columns={[
              { key: 'PositionID', label: 'ID', render: r => <span className="mono" style={{ color: 'var(--accent-yellow)' }}>{r.PositionID}</span> },
              { key: 'PositionName', label: 'Position Name', render: r => <span style={{ fontWeight: 600 }}>{r.PositionName}</span> },
              {
                key: 'sync', label: 'Sync Status', render: () => (
                  <span className="status-badge online" style={{ background: 'rgba(74,222,128,0.1)', color: 'var(--accent-green)', border: '1px solid rgba(74,222,128,0.2)' }}>
                    ● Synced
                  </span>
                ),
              },
            ]}
            rows={filtered(positions, ['PositionName'])}
            onEdit={r => openModal(setPosForm, setPosModal, {}, r)}
            onDelete={r => handleDelete(`Delete position "${r.PositionName}"? This will also remove it from Payroll DB.`, () => api.deletePosition(r.PositionID))}
            accentColor="var(--accent-yellow)"
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* DIVIDENDS TAB                                           */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'dividends' && (
        <div className="card glass fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{
            background: 'linear-gradient(90deg, rgba(236,72,153,0.05), rgba(188,19,254,0.05))',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(236,72,153,0.15)', padding: '20px 24px', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiGift style={{ color: 'var(--accent-pink)' }} /> Dividends
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                HUMAN_2025 only — internal shareholder dividends
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <SearchBox value={search} onChange={setSearch} />
              <button className="btn-export btn-excel" onClick={() => exportToExcel(filtered(dividends, ['FullName', 'EmployeeID']), 'Dividends.xlsx')}>
                <FiDownload size={14} /> Export
              </button>
              <button className="btn-primary" onClick={() => openModal(setDivForm, setDivModal, {
                EmployeeID: '', DividendAmount: '', DividendDate: today,
              })} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}>
                <FiPlus style={{ marginRight: 6 }} /> Add Dividend
              </button>
            </div>
          </div>
          <DataTable
            columns={[
              { key: 'DividendID', label: 'ID', render: r => <span className="mono" style={{ color: 'var(--accent-pink)' }}>{r.DividendID}</span> },
              { key: 'EmployeeID', label: 'Emp ID', render: r => <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{r.EmployeeID}</span> },
              { key: 'FullName', label: 'Employee Name', render: r => <span style={{ fontWeight: 600 }}>{r.FullName || '—'}</span> },
              { key: 'DividendAmount', label: 'Amount', render: r => <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>${(r.DividendAmount || 0).toLocaleString()}</span> },
              { key: 'DividendDate', label: 'Date', render: r => <span>{r.DividendDate ? String(r.DividendDate).split('T')[0] : '—'}</span> },
            ]}
            rows={filtered(dividends, ['FullName', 'EmployeeID', 'DividendDate'])}
            onEdit={r => openModal(setDivForm, setDivModal, {}, {
              DividendID: r.DividendID,
              EmployeeID: r.EmployeeID,
              DividendAmount: r.DividendAmount,
              DividendDate: r.DividendDate ? String(r.DividendDate).split('T')[0] : '',
            })}
            onDelete={r => handleDelete(`Delete dividend #${r.DividendID} for ${r.FullName}?`, () => api.deleteDividend(r.DividendID))}
            accentColor="var(--accent-pink)"
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* ATTENDANCE TAB                                          */}
      {/* ══════════════════════════════════════════════════════ */}
      {tab === 'attendance' && (
        <div className="card glass fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{
            background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(74,222,128,0.05))',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(0,242,254,0.1)', padding: '20px 24px', flexWrap: 'wrap', gap: 12,
          }}>
            <div>
              <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
                <FiCalendar style={{ color: 'var(--accent-cyan)' }} /> Attendance Records
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
                PAYROLL_2026 only — monthly work/leave/absent tracking
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <SearchBox value={search} onChange={setSearch} />
              <button className="btn-export btn-excel" onClick={() => exportToExcel(filtered(attendance, ['FullName', 'EmployeeID', 'AttendanceMonth']), 'Attendance.xlsx')}>
                <FiDownload size={14} /> Export
              </button>
              <button className="btn-primary" onClick={() => openModal(setAttForm, setAttModal, {
                EmployeeID: '', WorkDays: '', AbsentDays: 0, LeaveDays: 0, AttendanceMonth: today,
              })} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}>
                <FiPlus style={{ marginRight: 6 }} /> Add Record
              </button>
            </div>
          </div>
          <DataTable
            columns={[
              { key: 'AttendanceID', label: 'ID', render: r => <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{r.AttendanceID}</span> },
              { key: 'EmployeeID', label: 'Emp ID', render: r => <span className="mono" style={{ color: 'var(--accent-cyan)' }}>{r.EmployeeID}</span> },
              { key: 'FullName', label: 'Employee', render: r => <span style={{ fontWeight: 600 }}>{r.FullName || '—'}</span> },
              { key: 'AttendanceMonth', label: 'Month', render: r => <span>{r.AttendanceMonth ? String(r.AttendanceMonth).split('T')[0] : '—'}</span> },
              { key: 'WorkDays', label: 'Work Days', render: r => <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{r.WorkDays}</span> },
              { key: 'AbsentDays', label: 'Absent', render: r => <span style={{ color: r.AbsentDays > 0 ? 'var(--accent-red)' : 'var(--text-secondary)' }}>{r.AbsentDays}</span> },
              { key: 'LeaveDays', label: 'Leave', render: r => <span style={{ color: r.LeaveDays > 0 ? 'var(--accent-yellow)' : 'var(--text-secondary)' }}>{r.LeaveDays}</span> },
            ]}
            rows={filtered(attendance, ['FullName', 'EmployeeID', 'AttendanceMonth'])}
            onEdit={r => openModal(setAttForm, setAttModal, {}, {
              AttendanceID: r.AttendanceID,
              EmployeeID: r.EmployeeID,
              WorkDays: r.WorkDays,
              AbsentDays: r.AbsentDays,
              LeaveDays: r.LeaveDays,
              AttendanceMonth: r.AttendanceMonth ? String(r.AttendanceMonth).split('T')[0] : '',
            })}
            onDelete={r => handleDelete(`Delete attendance record #${r.AttendanceID}?`, () => api.deleteAttendance(r.AttendanceID))}
            accentColor="var(--accent-cyan)"
          />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* MODALS                                                         */}
      {/* ══════════════════════════════════════════════════════════════ */}

      {/* ── Employee Modal ───────────────────────────────────────── */}
      <Modal
        open={empModal}
        onClose={() => closeModal(setEmpModal)}
        title={empForm.EmployeeID ? 'Edit Employee' : 'New Employee'}
        icon={<div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{empForm.EmployeeID ? <FiEdit /> : <FiPlus />}</div>}
        borderColor="rgba(0,242,254,0.15)"
      >
        {modalError && <ErrorAlert msg={modalError} onClose={() => setModalError('')} />}
        <form onSubmit={e => handleSubmit(e, async () => {
          const d = {
            FullName: empForm.FullName, DateOfBirth: empForm.DateOfBirth, HireDate: empForm.HireDate,
            Email: empForm.Email, PhoneNumber: empForm.PhoneNumber,
            DepartmentID: Number(empForm.DepartmentID) || null, PositionID: Number(empForm.PositionID) || null,
            Status: empForm.Status, Gender: empForm.Gender || 'Nam',
          };
          return empForm.EmployeeID ? api.updateEmployee(empForm.EmployeeID, d) : api.addEmployee(d);
        }, setEmpModal)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Field label="Full Name *">
            <input className="cyber-input" required value={empForm.FullName || ''} style={inputStyle}
              onChange={e => setEmpForm({ ...empForm, FullName: e.target.value })} placeholder="e.g. Nguyễn Văn A" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Field label="Date of Birth *">
              <input type="date" className="cyber-input" required value={empForm.DateOfBirth || ''} style={inputStyle}
                onChange={e => setEmpForm({ ...empForm, DateOfBirth: e.target.value })} />
            </Field>
            <Field label="Gender">
              <div className="gender-group">
                {['Nam', 'Nữ'].map(g => (
                  <div key={g} className="gender-option">
                    <input type="radio" id={`gender-${g}`} name="gender" value={g}
                      checked={empForm.Gender === g} onChange={() => setEmpForm({ ...empForm, Gender: g })} />
                    <label htmlFor={`gender-${g}`}><span className="gender-icon">{g === 'Nam' ? '♂' : '♀'}</span> {g}</label>
                  </div>
                ))}
              </div>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Field label="Email">
              <input type="email" className="cyber-input" value={empForm.Email || ''} style={inputStyle}
                onChange={e => setEmpForm({ ...empForm, Email: e.target.value })} />
            </Field>
            <Field label="Phone">
              <input className="cyber-input" value={empForm.PhoneNumber || ''} style={inputStyle}
                onChange={e => setEmpForm({ ...empForm, PhoneNumber: e.target.value })} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Field label="Department">
              <select className="cyber-input" value={empForm.DepartmentID || ''} style={selectStyle}
                onChange={e => setEmpForm({ ...empForm, DepartmentID: e.target.value })}>
                <option value="">— Select —</option>
                {departments.map((d: any) => <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName}</option>)}
              </select>
            </Field>
            <Field label="Position">
              <select className="cyber-input" value={empForm.PositionID || ''} style={selectStyle}
                onChange={e => setEmpForm({ ...empForm, PositionID: e.target.value })}>
                <option value="">— Select —</option>
                {positions.map((p: any) => <option key={p.PositionID} value={p.PositionID}>{p.PositionName}</option>)}
              </select>
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Field label="Hire Date *">
              <input type="date" className="cyber-input" required value={empForm.HireDate || ''} style={inputStyle}
                onChange={e => setEmpForm({ ...empForm, HireDate: e.target.value })} />
            </Field>
            <Field label="Status">
              <select className="cyber-input" value={empForm.Status || 'Đang làm việc'} style={selectStyle}
                onChange={e => setEmpForm({ ...empForm, Status: e.target.value })}>
                {['Đang làm việc', 'Thử việc', 'Thực tập', 'Nghỉ phép'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>
          </div>

          <ModalActions loading={loading} isEdit={!!empForm.EmployeeID} onCancel={() => closeModal(setEmpModal)} />
        </form>
      </Modal>

      {/* ── Salary Modal ─────────────────────────────────────────── */}
      <Modal
        open={salModal}
        onClose={() => closeModal(setSalModal)}
        title={salForm.SalaryID ? 'Update Salary' : 'Add Salary'}
        icon={<div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(74,222,128,0.1)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiDollarSign /></div>}
        borderColor="rgba(74,222,128,0.15)"
      >
        {modalError && <ErrorAlert msg={modalError} onClose={() => setModalError('')} />}
        <form onSubmit={e => handleSubmit(e, async () => {
          const net = calcNet(salForm.BaseSalary, salForm.Bonus, salForm.Deductions);
          const d = {
            EmployeeID: Number(salForm.EmployeeID), SalaryMonth: salForm.SalaryMonth,
            BaseSalary: Number(salForm.BaseSalary), Bonus: Number(salForm.Bonus) || 0,
            Deductions: Number(salForm.Deductions) || 0, NetSalary: net,
          };
          return salForm.SalaryID ? api.updateSalary(salForm.SalaryID, d) : api.addSalary(d);
        }, setSalModal)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Field label="Employee ID *">
            <input type="number" className="cyber-input" required value={salForm.EmployeeID || ''} style={{
              ...inputStyle, ...(salForm.SalaryID ? { opacity: 0.6, cursor: 'not-allowed' } : {}),
            }} readOnly={!!salForm.SalaryID}
              onChange={e => setSalForm({ ...salForm, EmployeeID: e.target.value })} />
          </Field>

          <Field label="Salary Month *">
            <input type="date" className="cyber-input" required value={salForm.SalaryMonth || ''} style={inputStyle}
              onChange={e => setSalForm({ ...salForm, SalaryMonth: e.target.value })} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Field label="Base Salary ($) *">
              <input type="number" className="cyber-input" required value={salForm.BaseSalary || ''} style={inputStyle}
                onChange={e => setSalForm({ ...salForm, BaseSalary: e.target.value })} />
            </Field>
            <Field label="Bonus ($)">
              <input type="number" className="cyber-input" value={salForm.Bonus || 0} style={inputStyle}
                onChange={e => setSalForm({ ...salForm, Bonus: e.target.value })} />
            </Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Field label="Deductions ($)">
              <input type="number" className="cyber-input" value={salForm.Deductions || 0} style={inputStyle}
                onChange={e => setSalForm({ ...salForm, Deductions: e.target.value })} />
            </Field>
            <Field label="Net Salary (auto)">
              <input type="number" className="cyber-input" readOnly
                value={calcNet(salForm.BaseSalary, salForm.Bonus, salForm.Deductions)}
                style={{ ...inputStyle, opacity: 0.7, cursor: 'not-allowed', borderColor: 'rgba(0,242,254,0.15)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>= Base + Bonus − Deductions</span>
            </Field>
          </div>

          <ModalActions loading={loading} isEdit={!!salForm.SalaryID} onCancel={() => closeModal(setSalModal)} />
        </form>
      </Modal>

      {/* ── Department Modal ─────────────────────────────────────── */}
      <Modal
        open={deptModal}
        onClose={() => closeModal(setDeptModal)}
        title={deptForm.DepartmentID ? 'Edit Department' : 'New Department'}
        icon={<div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(188,19,254,0.1)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiLayers /></div>}
        borderColor="rgba(188,19,254,0.2)"
      >
        {modalError && <ErrorAlert msg={modalError} onClose={() => setModalError('')} />}
        <div style={{
          background: 'rgba(188,19,254,0.05)', border: '1px solid rgba(188,19,254,0.15)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          <strong style={{ color: 'var(--accent-purple)' }}>🔄 Cross-DB Sync</strong> — Changes will be atomically synced to{' '}
          <code>PAYROLL_2026.departments_payroll</code>.
        </div>
        <form onSubmit={e => handleSubmit(e, async () => {
          const d = { DepartmentName: deptForm.DepartmentName };
          return deptForm.DepartmentID ? api.updateDepartment(deptForm.DepartmentID, d) : api.addDepartment(d);
        }, setDeptModal)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Department Name *">
            <input className="cyber-input" required value={deptForm.DepartmentName || ''} style={inputStyle}
              onChange={e => setDeptForm({ ...deptForm, DepartmentName: e.target.value })}
              placeholder="e.g. Engineering" />
          </Field>
          <ModalActions loading={loading} isEdit={!!deptForm.DepartmentID} onCancel={() => closeModal(setDeptModal)} />
        </form>
      </Modal>

      {/* ── Position Modal ───────────────────────────────────────── */}
      <Modal
        open={posModal}
        onClose={() => closeModal(setPosModal)}
        title={posForm.PositionID ? 'Edit Position' : 'New Position'}
        icon={<div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(250,204,21,0.1)', color: 'var(--accent-yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiBriefcase /></div>}
        borderColor="rgba(250,204,21,0.2)"
      >
        {modalError && <ErrorAlert msg={modalError} onClose={() => setModalError('')} />}
        <div style={{
          background: 'rgba(250,204,21,0.05)', border: '1px solid rgba(250,204,21,0.15)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontSize: 13,
          color: 'var(--text-secondary)',
        }}>
          <strong style={{ color: 'var(--accent-yellow)' }}>🔄 Cross-DB Sync</strong> — Changes will be atomically synced to{' '}
          <code>PAYROLL_2026.positions_payroll</code>.
        </div>
        <form onSubmit={e => handleSubmit(e, async () => {
          const d = { PositionName: posForm.PositionName };
          return posForm.PositionID ? api.updatePosition(posForm.PositionID, d) : api.addPosition(d);
        }, setPosModal)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Position Name *">
            <input className="cyber-input" required value={posForm.PositionName || ''} style={inputStyle}
              onChange={e => setPosForm({ ...posForm, PositionName: e.target.value })}
              placeholder="e.g. Senior Developer" />
          </Field>
          <ModalActions loading={loading} isEdit={!!posForm.PositionID} onCancel={() => closeModal(setPosModal)} />
        </form>
      </Modal>

      {/* ── Dividend Modal ───────────────────────────────────────── */}
      <Modal
        open={divModal}
        onClose={() => closeModal(setDivModal)}
        title={divForm.DividendID ? 'Edit Dividend' : 'New Dividend'}
        icon={<div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(236,72,153,0.1)', color: 'var(--accent-pink)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiGift /></div>}
        borderColor="rgba(236,72,153,0.2)"
      >
        {modalError && <ErrorAlert msg={modalError} onClose={() => setModalError('')} />}
        <form onSubmit={e => handleSubmit(e, async () => {
          const d = {
            EmployeeID: Number(divForm.EmployeeID),
            DividendAmount: Number(divForm.DividendAmount),
            DividendDate: divForm.DividendDate,
          };
          return divForm.DividendID ? api.updateDividend(divForm.DividendID, d) : api.addDividend(d);
        }, setDivModal)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Field label="Employee ID *">
            <input type="number" className="cyber-input" required value={divForm.EmployeeID || ''} style={inputStyle}
              onChange={e => setDivForm({ ...divForm, EmployeeID: e.target.value })}
              placeholder="Must exist in HUMAN_2025" />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Field label="Amount ($) *">
              <input type="number" className="cyber-input" required value={divForm.DividendAmount || ''} style={inputStyle}
                onChange={e => setDivForm({ ...divForm, DividendAmount: e.target.value })}
                placeholder="0.00" />
            </Field>
            <Field label="Date *">
              <input type="date" className="cyber-input" required value={divForm.DividendDate || ''} style={inputStyle}
                onChange={e => setDivForm({ ...divForm, DividendDate: e.target.value })} />
            </Field>
          </div>

          <ModalActions loading={loading} isEdit={!!divForm.DividendID} onCancel={() => closeModal(setDivModal)} />
        </form>
      </Modal>

      {/* ── Attendance Modal ─────────────────────────────────────── */}
      <Modal
        open={attModal}
        onClose={() => closeModal(setAttModal)}
        title={attForm.AttendanceID ? 'Edit Attendance' : 'Add Attendance'}
        icon={<div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCalendar /></div>}
        borderColor="rgba(0,242,254,0.15)"
      >
        {modalError && <ErrorAlert msg={modalError} onClose={() => setModalError('')} />}
        <form onSubmit={e => handleSubmit(e, async () => {
          const d = {
            EmployeeID: Number(attForm.EmployeeID),
            WorkDays: Number(attForm.WorkDays),
            AbsentDays: Number(attForm.AbsentDays) || 0,
            LeaveDays: Number(attForm.LeaveDays) || 0,
            AttendanceMonth: attForm.AttendanceMonth,
          };
          return attForm.AttendanceID ? api.updateAttendance(attForm.AttendanceID, d) : api.addAttendance(d);
        }, setAttModal)} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          <Field label="Employee ID *">
            <input type="number" className="cyber-input" required value={attForm.EmployeeID || ''} style={inputStyle}
              onChange={e => setAttForm({ ...attForm, EmployeeID: e.target.value })}
              placeholder="Must exist in HUMAN_2025" />
          </Field>

          <Field label="Attendance Month *">
            <input type="date" className="cyber-input" required value={attForm.AttendanceMonth || ''} style={inputStyle}
              onChange={e => setAttForm({ ...attForm, AttendanceMonth: e.target.value })} />
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Field label="Work Days *">
              <input type="number" className="cyber-input" required min="0" max="31"
                value={attForm.WorkDays || ''} style={inputStyle}
                onChange={e => setAttForm({ ...attForm, WorkDays: e.target.value })} />
            </Field>
            <Field label="Absent Days">
              <input type="number" className="cyber-input" min="0" max="31"
                value={attForm.AbsentDays || 0} style={inputStyle}
                onChange={e => setAttForm({ ...attForm, AbsentDays: e.target.value })} />
            </Field>
            <Field label="Leave Days">
              <input type="number" className="cyber-input" min="0" max="31"
                value={attForm.LeaveDays || 0} style={inputStyle}
                onChange={e => setAttForm({ ...attForm, LeaveDays: e.target.value })} />
            </Field>
          </div>

          <ModalActions loading={loading} isEdit={!!attForm.AttendanceID} onCancel={() => closeModal(setAttModal)} />
        </form>
      </Modal>

      {/* ── Orphan Employee Modal ─────────────────────────────────── */}
      <Modal
        open={orphanModal}
        onClose={() => closeModal(setOrphanModal)}
        title="Inject Sync Error"
        icon={<div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,107,107,0.12)', color: '#ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiAlertTriangle /></div>}
        borderColor="rgba(255,107,107,0.25)"
      >
        {modalError && <ErrorAlert msg={modalError} onClose={() => setModalError('')} />}
        <div style={{
          background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)',
          borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24,
          fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6,
        }}>
          <strong style={{ color: '#ff6b6b' }}>⚠ Demo Purpose Only</strong><br />
          Creates an employee in <strong>SQL Server (HR)</strong> only, skipping MySQL sync.
          The record triggers a <strong>Reconciliation Alert</strong> on the dashboard.
        </div>
        <form onSubmit={async e => {
          e.preventDefault();
          setLoading(true); setModalError('');
          const res = await api.addOrphanEmployee(orphanForm);
          setLoading(false);
          if (res.error) { setModalError(res.error.replace(/^\d+:\s*/, '')); return; }
          alert(`✅ Orphan Employee created (ID: ${(res.data as any)?.EmployeeID}). Check Reconciliation!`);
          setOrphanModal(false);
          await loadAll();
        }} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Field label="Full Name *">
            <input className="cyber-input" required value={orphanForm.FullName} style={inputStyle}
              onChange={e => setOrphanForm({ ...orphanForm, FullName: e.target.value })}
              placeholder="e.g. Ghost Employee" />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <Field label="Date of Birth *">
              <input type="date" className="cyber-input" required value={orphanForm.DateOfBirth} style={inputStyle}
                onChange={e => setOrphanForm({ ...orphanForm, DateOfBirth: e.target.value })} />
            </Field>
            <Field label="Hire Date *">
              <input type="date" className="cyber-input" required value={orphanForm.HireDate} style={inputStyle}
                onChange={e => setOrphanForm({ ...orphanForm, HireDate: e.target.value })} />
            </Field>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 8, paddingTop: 24, borderTop: '1px solid rgba(255,107,107,0.08)' }}>
            <button type="button" className="btn-delete" onClick={() => closeModal(setOrphanModal)}
              style={{ padding: '12px 24px', borderRadius: 999 }}>
              <FiX style={{ marginRight: 6 }} /> Cancel
            </button>
            <button type="submit" disabled={loading} style={{
              padding: '12px 28px', borderRadius: 999, border: '1px solid rgba(255,107,107,0.5)',
              background: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,165,0,0.1))',
              color: '#ff6b6b', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s', fontSize: 14,
            }}>
              <FiAlertTriangle /> Inject Orphan Record
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────────

function SearchBox({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ position: 'relative' }}>
      <FiSearch style={{
        position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
        color: 'var(--accent-cyan)', opacity: 0.6,
      }} size={14} />
      <input className="cyber-input" placeholder="Search..." value={value}
        onChange={e => onChange(e.target.value)}
        style={{ padding: '8px 12px 8px 34px', borderRadius: 999, width: 200, fontSize: 13 }} />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label style={{
        fontSize: 11, fontWeight: 700, color: 'var(--text-muted)',
        textTransform: 'uppercase', letterSpacing: '1.5px',
      }}>{label}</label>
      {children}
    </div>
  );
}

function ModalActions({ loading, isEdit, onCancel }: {
  loading: boolean; isEdit: boolean; onCancel: () => void;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'flex-end', gap: 16,
      marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(0,242,254,0.08)',
    }}>
      <button type="button" className="btn-delete" onClick={onCancel}
        style={{ padding: '12px 24px', borderRadius: 999 }}>
        <FiX style={{ marginRight: 6 }} /> Cancel
      </button>
      <button type="submit" className="btn-primary" disabled={loading}
        style={{ padding: '12px 32px', borderRadius: 999 }}>
        <FiSave style={{ marginRight: 6 }} />
        {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create'}
      </button>
    </div>
  );
}