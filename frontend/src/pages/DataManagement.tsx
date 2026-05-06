import { useState, useEffect } from 'react';
import { FiUsers, FiDollarSign, FiSearch, FiPlus, FiEdit, FiTrash2, FiX, FiSave, FiDownload, FiAlertTriangle, FiCalendar, FiBriefcase, FiAward } from 'react-icons/fi';
import { api } from '../api';
import { exportToExcel } from '../utils/exportUtils';

export default function DataManagement() {
  const [tab, setTab] = useState<'employees'|'salaries'|'attendance'|'departments'|'positions'>('employees');
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);

  const [empSearch, setEmpSearch] = useState('');
  const [salSearch, setSalSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [empModal, setEmpModal] = useState(false);
  const [salModal, setSalModal] = useState(false);
  const [orphanModal, setOrphanModal] = useState(false);
  const [empForm, setEmpForm] = useState<any>({});
  const [orphanForm, setOrphanForm] = useState<any>({ FullName: '', DateOfBirth: '', HireDate: new Date().toISOString().split('T')[0], Status: 'Active' });
  const [salForm, setSalForm] = useState<any>({});

  const user = (() => { try { return JSON.parse(localStorage.getItem('auth_user')||'{}'); } catch { return {}; } })();
  const canEdit = ['admin', 'editor'].includes(user.role?.toLowerCase());

  const loadData = async () => {
    setLoading(true);
    const [e, s, d, p, att] = await Promise.all([
      api.getEmployeesWithNames(),
      api.getPayrollTableData('salaries'),
      api.getDepartments(),
      api.getPositions(),
      api.getPayrollTableData('attendance'),
    ]);
    if (e.data) setEmployees((e.data as any).data || []);
    if (s.data) setSalaries((s.data as any).data || []);
    if (d.data) setDepartments(Array.isArray(d.data) ? [...d.data].sort((a, b) => a.DepartmentID - b.DepartmentID) : []);
    if (p.data) setPositions(Array.isArray(p.data) ? [...p.data].sort((a, b) => a.PositionID - b.PositionID) : []);
    if (att.data) {
      const attList = (att.data as any).data || [];
      setAttendance([...attList].sort((a, b) => {
        if (a.AttendanceMonth > b.AttendanceMonth) return -1;
        if (a.AttendanceMonth < b.AttendanceMonth) return 1;
        return a.EmployeeID - b.EmployeeID;
      }));
    }

    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  // Employee CRUD
  const openAddEmp = () => { setEmpForm({ FullName:'', DateOfBirth:'', HireDate: new Date().toISOString().split('T')[0], Email:'', PhoneNumber:'', DepartmentID:'', PositionID:'', Status:'Đang làm việc', Gender:'Nam' }); setEmpModal(true); };
  const openEditEmp = (e: any) => { setEmpForm({ ...e }); setEmpModal(true); };
  const saveEmp = async (ev: React.FormEvent) => {
    ev.preventDefault(); setLoading(true);
    const d = { FullName: empForm.FullName, DateOfBirth: empForm.DateOfBirth, HireDate: empForm.HireDate, Email: empForm.Email, PhoneNumber: empForm.PhoneNumber, DepartmentID: Number(empForm.DepartmentID)||null, PositionID: Number(empForm.PositionID)||null, Status: empForm.Status, Gender: empForm.Gender || 'Nam' };
    if (empForm.EmployeeID) await api.updateEmployee(empForm.EmployeeID, d);
    else await api.addEmployee(d);
    setEmpModal(false); await loadData();
  };
  const delEmp = async (id: number) => { if (!confirm('Delete this employee?')) return; await api.deleteEmployee(id); await loadData(); };

  // Salary CRUD
  // Helper: compute net salary
  const calcNet = (base: any, bonus: any, deductions: any) => (Number(base) || 0) + (Number(bonus) || 0) - (Number(deductions) || 0);

  const openAddSal = () => { setSalForm({ EmployeeID:'', SalaryMonth:'', BaseSalary:'', Bonus:0, Deductions:0 }); setSalModal(true); };
  const openEditSal = (s: any) => { setSalForm({ ...s }); setSalModal(true); };
  const updateSalField = (field: string, value: any) => {
    setSalForm((prev: any) => ({ ...prev, [field]: value }));
  };
  const saveSal = async (ev: React.FormEvent) => {
    ev.preventDefault(); setLoading(true);
    const net = calcNet(salForm.BaseSalary, salForm.Bonus, salForm.Deductions);
    const d = { EmployeeID: Number(salForm.EmployeeID), SalaryMonth: salForm.SalaryMonth, BaseSalary: Number(salForm.BaseSalary), Bonus: Number(salForm.Bonus)||0, Deductions: Number(salForm.Deductions)||0, NetSalary: net };
    if (salForm.SalaryID) await api.updateSalary(salForm.SalaryID, d);
    else await api.addSalary(d);
    setSalModal(false); await loadData();
  };
  const delSal = async (id: number) => { if (!confirm('Delete this salary record?')) return; await api.deleteSalary(id); await loadData(); };

  // Orphan employee injection for demo
  const injectOrphan = async (ev: React.FormEvent) => {
    ev.preventDefault(); setLoading(true);
    try {
      const res = await api.addOrphanEmployee(orphanForm);
      if (res.error) { alert('Error: ' + res.error); }
      else { alert(`✅ Orphan Employee created (ID: ${(res.data as any)?.EmployeeID}). Check Reconciliation to see the anomaly!`); setOrphanModal(false); await loadData(); }
    } catch (e: any) { alert('Failed: ' + e.message); }
    setLoading(false);
  };

  // Filter
  let dispEmp = employees;
  if (empSearch) { const q = empSearch.toLowerCase(); dispEmp = dispEmp.filter(e => (e.FullName||'').toLowerCase().includes(q) || String(e.EmployeeID).includes(q)); }
  let dispSal = salaries;
  if (salSearch) { const q = salSearch.toLowerCase(); dispSal = dispSal.filter(s => String(s.EmployeeID).includes(q) || String(s.SalaryID).includes(q) || (s.SalaryMonth||'').includes(q)); }

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '1.5px' };
  const inputStyle = { borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 14 };

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
      {/* Header Card */}
      <div className="card glass" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(123,47,247,0.05))', borderBottom: '1px solid rgba(0,242,254,0.1)', padding: 24 }}>
          <div>
            <h3 className="glow-text2" style={{ fontSize: 20, fontWeight: 700 }}>Data Management Center</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: 14, marginTop: 6 }}>Add, update, and manage core HR and Payroll records.</p>
          </div>
        </div>
        <div className="card-body" style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 20, marginBottom: 8 }}>
            {[
              { id: 'employees' as const, label: 'Employees', icon: <FiUsers size={16} /> }, 
              { id: 'salaries' as const, label: 'Salaries', icon: <FiDollarSign size={16} /> },
              { id: 'attendance' as const, label: 'Attendance', icon: <FiCalendar size={16} /> },
              { id: 'departments' as const, label: 'Departments', icon: <FiBriefcase size={16} /> },
              { id: 'positions' as const, label: 'Positions', icon: <FiAward size={16} /> },

            ].map(t => (
              <div key={t.id} onClick={() => setTab(t.id)}
                className={`report-card-selector${tab === t.id ? ' active' : ''}`}
                style={{ padding: '12px 24px', minHeight: 'auto', display: 'flex', alignItems: 'center', gap: 10, width: 'auto' }}
              >
                <div style={{ color: tab === t.id ? 'var(--accent-cyan)' : 'var(--text-muted)', display: 'flex' }}>{t.icon}</div>
                <h4 style={{ color: tab === t.id ? 'var(--accent-cyan)' : 'var(--text-primary)', fontSize: 14, fontWeight: 700, margin: 0 }}>{t.label}</h4>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Employee Tab */}
      {tab === 'employees' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(123,47,247,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,242,254,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiUsers style={{ color: 'var(--accent-cyan)' }} /> Employee Directory</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', opacity: 0.6 }} size={14} />
                <input className="cyber-input" placeholder="Search employees..." value={empSearch} onChange={e => setEmpSearch(e.target.value)} style={{ padding: '8px 12px 8px 34px', borderRadius: 999, width: 200, fontSize: 13 }} />
              </div>
              <button className="btn-export btn-excel" onClick={() => exportToExcel(dispEmp, 'Employees_Export.xlsx')}><FiDownload size={14} /> Export</button>
              {canEdit && <button onClick={() => { setOrphanForm({ FullName: '', DateOfBirth: '', HireDate: new Date().toISOString().split('T')[0], Status: 'Active' }); setOrphanModal(true); }} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, borderRadius: 999,
                border: '1px solid rgba(255,107,107,0.4)', background: 'rgba(255,107,107,0.08)',
                color: '#ff6b6b', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
              }}><FiAlertTriangle size={14} /> Inject Sync Error</button>}
              {canEdit && <button className="btn-primary" onClick={openAddEmp} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}><FiPlus style={{ marginRight: 6 }} /> Add Employee</button>}
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header"><tr>
                <th style={{ padding: 16 }}>ID</th><th style={{ padding: 16 }}>Full Name</th><th style={{ padding: 16 }}>Email</th><th style={{ padding: 16 }}>Phone</th>
                <th style={{ padding: 16 }}>Department</th><th style={{ padding: 16 }}>Position</th><th style={{ padding: 16 }}>Status</th><th style={{ padding: 16 }}>Actions</th>
              </tr></thead>
              <tbody>
                {dispEmp.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No employees found.</td></tr> :
                  dispEmp.map(e => (
                    <tr key={e.EmployeeID} className="table-row">
                      <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{e.EmployeeID}</td>
                      <td className="table-cell" style={{ fontWeight: 600, padding: 16 }}>{e.FullName}</td>
                      <td className="table-cell" style={{ padding: 16, color: 'var(--text-secondary)' }}>{e.Email || '—'}</td>
                      <td className="table-cell" style={{ padding: 16, color: 'var(--text-secondary)' }}>{e.PhoneNumber || '—'}</td>
                      <td className="table-cell" style={{ padding: 16 }}>{e.DepartmentName || '—'}</td>
                      <td className="table-cell" style={{ padding: 16 }}>{e.PositionName || '—'}</td>
                      <td className="table-cell" style={{ padding: 16 }}><span className={`status-badge ${getStatusClass(e.Status)}`}>● {e.Status || '—'}</span></td>
                      <td className="table-cell" style={{ padding: 16 }}>
                        {canEdit ? (
                          <>
                            <button className="btn-edit" onClick={() => openEditEmp(e)} style={{ padding: '6px 12px', marginRight: 8, borderRadius: 8 }} title="Edit"><FiEdit size={14} /></button>
                            <button className="btn-delete" onClick={() => delEmp(e.EmployeeID)} style={{ padding: '6px 12px', borderRadius: 8 }} title="Delete"><FiTrash2 size={14} /></button>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Read-only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Salary Tab */}
      {tab === 'salaries' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(74,222,128,0.05), rgba(0,242,254,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(74,222,128,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiDollarSign style={{ color: 'var(--accent-green)' }} /> Payroll Records</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', opacity: 0.6 }} size={14} />
                <input className="cyber-input" placeholder="Search ID or Month..." value={salSearch} onChange={e => setSalSearch(e.target.value)} style={{ padding: '8px 12px 8px 34px', borderRadius: 999, width: 200, fontSize: 13 }} />
              </div>
              <button className="btn-export btn-excel" onClick={() => exportToExcel(dispSal, 'Salaries_Export.xlsx')}><FiDownload size={14} /> Export</button>
              {canEdit && <button className="btn-primary" onClick={openAddSal} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}><FiPlus style={{ marginRight: 6 }} /> Add Salary</button>}
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header"><tr>
                <th style={{ padding: 16 }}>ID</th><th style={{ padding: 16 }}>Emp ID</th><th style={{ padding: 16 }}>Month</th>
                <th style={{ textAlign: 'right', padding: 16 }}>Base</th><th style={{ textAlign: 'right', padding: 16 }}>Bonus</th>
                <th style={{ textAlign: 'right', padding: 16 }}>Deductions</th><th style={{ textAlign: 'right', padding: 16 }}>Net</th>
                <th style={{ textAlign: 'right', padding: 16 }}>Actions</th>
              </tr></thead>
              <tbody>
                {dispSal.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No salaries found.</td></tr> :
                  dispSal.map(s => (
                    <tr key={s.SalaryID} className="table-row">
                      <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{s.SalaryID}</td>
                      <td className="table-cell mono" style={{ padding: 16, fontWeight: 600, color: 'var(--accent-cyan)' }}>{s.EmployeeID}</td>
                      <td className="table-cell" style={{ padding: 16 }}>{s.SalaryMonth}</td>
                      <td className="table-cell" style={{ textAlign: 'right', padding: 16 }}>${s.BaseSalary?.toLocaleString()||0}</td>
                      <td className="table-cell" style={{ textAlign: 'right', padding: 16, color: 'var(--accent-green)' }}>${s.Bonus?.toLocaleString()||0}</td>
                      <td className="table-cell" style={{ textAlign: 'right', padding: 16, color: 'var(--accent-red)' }}>-${s.Deductions?.toLocaleString()||0}</td>
                      <td className="table-cell" style={{ textAlign: 'right', padding: 16, fontWeight: 600 }}>${s.NetSalary?.toLocaleString()||0}</td>
                      <td className="table-cell" style={{ textAlign: 'right', padding: 16 }}>
                        {canEdit ? (
                          <>
                            <button className="btn-edit" onClick={() => openEditSal(s)} style={{ padding: '6px 12px', marginRight: 8, borderRadius: 8 }} title="Edit"><FiEdit size={14} /></button>
                            <button className="btn-delete" onClick={() => delSal(s.SalaryID)} style={{ padding: '6px 12px', borderRadius: 8 }} title="Delete"><FiTrash2 size={14} /></button>
                          </>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Read-only</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {tab === 'attendance' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(74,222,128,0.05), rgba(0,242,254,0.05))', borderBottom: '1px solid rgba(74,222,128,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiCalendar style={{ color: 'var(--accent-green)' }} /> Attendance Records</h3>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header"><tr><th style={{ padding: 16 }}>ID</th><th style={{ padding: 16 }}>Employee</th><th style={{ padding: 16 }}>Month</th><th style={{ padding: 16 }}>Work Days</th><th style={{ padding: 16 }}>Absent</th><th style={{ padding: 16 }}>Leave</th></tr></thead>
              <tbody>
                {attendance.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No attendance data found.</td></tr> : attendance.map(a => (
                  <tr key={a.AttendanceID} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{a.AttendanceID}</td>
                    <td className="table-cell" style={{ padding: 16, fontWeight: 600 }}>
                      {a.FullName ? a.FullName : `Employee #${a.EmployeeID}`}
                    </td>
                    <td className="table-cell" style={{ padding: 16 }}>{a.AttendanceMonth}</td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--accent-green)' }}>{a.WorkDays}</td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--accent-red)' }}>{a.AbsentDays}</td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--accent-yellow)' }}>{a.LeaveDays}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Departments Tab */}
      {tab === 'departments' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(123,47,247,0.05))', borderBottom: '1px solid rgba(0,242,254,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiBriefcase style={{ color: 'var(--accent-cyan)' }} /> Departments (HR Sync)</h3>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header"><tr><th style={{ padding: 16 }}>Dept ID</th><th style={{ padding: 16 }}>Department Name</th></tr></thead>
              <tbody>
                {departments.length === 0 ? <tr><td colSpan={2} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No departments found.</td></tr> : departments.map(d => (
                  <tr key={d.DepartmentID} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{d.DepartmentID}</td>
                    <td className="table-cell" style={{ padding: 16, fontWeight: 600 }}>{d.DepartmentName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Positions Tab */}
      {tab === 'positions' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(123,47,247,0.05))', borderBottom: '1px solid rgba(0,242,254,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiAward style={{ color: 'var(--accent-cyan)' }} /> Job Positions (HR Sync)</h3>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header"><tr><th style={{ padding: 16 }}>Pos ID</th><th style={{ padding: 16 }}>Position Title</th></tr></thead>
              <tbody>
                {positions.length === 0 ? <tr><td colSpan={2} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No positions found.</td></tr> : positions.map(p => (
                  <tr key={p.PositionID} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{p.PositionID}</td>
                    <td className="table-cell" style={{ padding: 16, fontWeight: 600 }}>{p.PositionName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* Employee Modal */}
      {empModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ width: '100%', maxWidth: 550, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgba(0,242,254,0.15)' }}>
            <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.06), rgba(123,47,247,0.06))', padding: 24, borderBottom: '1px solid rgba(0,242,254,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{empForm.EmployeeID ? <FiEdit /> : <FiPlus />}</div>
                {empForm.EmployeeID ? 'Edit Employee' : 'New Employee'}
              </h3>
              <button onClick={() => setEmpModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            <div className="card-body" style={{ padding: 32, maxHeight: '80vh', overflowY: 'auto' }}>
              <form onSubmit={saveEmp} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Row 1: Full Name (full width) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input className="cyber-input" required value={empForm.FullName||''} onChange={e => setEmpForm({...empForm, FullName: e.target.value})} style={inputStyle} placeholder="e.g. John Doe" />
                </div>
                {/* Row 2: Date of Birth | Gender */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Date of Birth *</label><input type="date" className="cyber-input" required value={empForm.DateOfBirth||''} onChange={e => setEmpForm({...empForm, DateOfBirth: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Gender</label>
                    <div className="gender-group">
                      <div className="gender-option">
                        <input type="radio" id="gender-nam" name="gender" value="Nam" checked={empForm.Gender === 'Nam'} onChange={() => setEmpForm({...empForm, Gender: 'Nam'})} />
                        <label htmlFor="gender-nam"><span className="gender-icon">♂</span> Nam</label>
                      </div>
                      <div className="gender-option">
                        <input type="radio" id="gender-nu" name="gender" value="Nữ" checked={empForm.Gender === 'Nữ'} onChange={() => setEmpForm({...empForm, Gender: 'Nữ'})} />
                        <label htmlFor="gender-nu"><span className="gender-icon">♀</span> Nữ</label>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Row 3: Email | Phone */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Email</label><input type="email" className="cyber-input" value={empForm.Email||''} onChange={e => setEmpForm({...empForm, Email: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Phone</label><input className="cyber-input" value={empForm.PhoneNumber||''} onChange={e => setEmpForm({...empForm, PhoneNumber: e.target.value})} style={inputStyle} /></div>
                </div>
                {/* Row 4: Department | Position */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Department</label>
                    <select className="cyber-input" value={empForm.DepartmentID||''} onChange={e => setEmpForm({...empForm, DepartmentID: e.target.value})} style={{...inputStyle, appearance: 'auto' as any, cursor: 'pointer'}}>
                      <option value="">— Select Department —</option>
                      {departments.map((d: any) => <option key={d.DepartmentID} value={d.DepartmentID}>{d.DepartmentName}</option>)}
                    </select>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Position</label>
                    <select className="cyber-input" value={empForm.PositionID||''} onChange={e => setEmpForm({...empForm, PositionID: e.target.value})} style={{...inputStyle, appearance: 'auto' as any, cursor: 'pointer'}}>
                      <option value="">— Select Position —</option>
                      {positions.map((p: any) => <option key={p.PositionID} value={p.PositionID}>{p.PositionName}</option>)}
                    </select>
                  </div>
                </div>
                {/* Row 5: Hire Date | Status */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Hire Date *</label><input type="date" className="cyber-input" required value={empForm.HireDate||''} onChange={e => setEmpForm({...empForm, HireDate: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Status</label>
                    <select className="cyber-input" value={empForm.Status||'Đang làm việc'} onChange={e => setEmpForm({...empForm, Status: e.target.value})} style={{...inputStyle, appearance: 'auto' as any, cursor: 'pointer'}}>
                      <option value="Đang làm việc">Đang làm việc</option><option value="Thử việc">Thử việc</option><option value="Thực tập">Thực tập</option><option value="Nghỉ phép">Nghỉ phép</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(0,242,254,0.08)' }}>
                  <button type="button" className="btn-delete" onClick={() => setEmpModal(false)} style={{ padding: '12px 24px', borderRadius: 999 }}><FiX style={{ marginRight: 6 }} /> Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 32px', borderRadius: 999 }}><FiSave style={{ marginRight: 6 }} /> {empForm.EmployeeID ? 'Save Changes' : 'Create Employee'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Salary Modal */}
      {salModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ width: '100%', maxWidth: 500, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgba(74,222,128,0.15)' }}>
            <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(74,222,128,0.06), rgba(0,242,254,0.06))', padding: 24, borderBottom: '1px solid rgba(74,222,128,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(74,222,128,0.1)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{salForm.SalaryID ? <FiEdit /> : <FiDollarSign />}</div>
                {salForm.SalaryID ? 'Update Salary' : 'Add Salary'}
              </h3>
              <button onClick={() => setSalModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            <div className="card-body" style={{ padding: 32 }}>
              <form onSubmit={saveSal} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Employee ID *</label><input type="number" className="cyber-input" required value={salForm.EmployeeID||''} readOnly={!!salForm.SalaryID} onChange={e => setSalForm({...salForm, EmployeeID: e.target.value})} style={{...inputStyle, ...(salForm.SalaryID ? {opacity:0.6, cursor:'not-allowed'}:{})}} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Salary Month *</label><input type="date" className="cyber-input" required value={salForm.SalaryMonth||''} onChange={e => setSalForm({...salForm, SalaryMonth: e.target.value})} style={inputStyle} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Base Salary ($) *</label><input type="number" className="cyber-input" required value={salForm.BaseSalary||''} onChange={e => updateSalField('BaseSalary', e.target.value)} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Bonus ($)</label><input type="number" className="cyber-input" value={salForm.Bonus||0} onChange={e => updateSalField('Bonus', e.target.value)} style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Deductions ($)</label><input type="number" className="cyber-input" value={salForm.Deductions||0} onChange={e => updateSalField('Deductions', e.target.value)} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Net Salary ($) <span style={{ color: 'var(--accent-cyan)', fontWeight: 400, fontSize: 10, letterSpacing: '0.5px' }}></span></label>
                    <input type="number" className="cyber-input" readOnly value={calcNet(salForm.BaseSalary, salForm.Bonus, salForm.Deductions)} style={{...inputStyle, opacity: 0.7, cursor: 'not-allowed', background: 'rgba(0,242,254,0.04)', borderColor: 'rgba(0,242,254,0.15)' }} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>= Base + Bonus − Deductions</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(74,222,128,0.08)' }}>
                  <button type="button" className="btn-delete" onClick={() => setSalModal(false)} style={{ padding: '12px 24px', borderRadius: 999 }}><FiX style={{ marginRight: 6 }} /> Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 32px', borderRadius: 999 }}><FiSave style={{ marginRight: 6 }} /> {salForm.SalaryID ? 'Save Changes' : 'Add Salary'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Orphan Employee Modal (Inject Sync Error) */}
      {orphanModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ width: '100%', maxWidth: 480, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgba(255,107,107,0.25)' }}>
            <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(255,107,107,0.08), rgba(255,165,0,0.06))', padding: 24, borderBottom: '1px solid rgba(255,107,107,0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,107,107,0.12)', color: '#ff6b6b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiAlertTriangle /></div>
                Inject Sync Error
              </h3>
              <button onClick={() => setOrphanModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            <div className="card-body" style={{ padding: 32 }}>
              <div style={{ background: 'rgba(255,107,107,0.06)', border: '1px solid rgba(255,107,107,0.15)', borderRadius: 'var(--radius-md)', padding: 16, marginBottom: 24, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                <strong style={{ color: '#ff6b6b' }}>⚠ Demo Purpose Only</strong><br />
                This creates an employee in <strong>SQL Server (HR)</strong> only, without syncing to <strong>MySQL (Payroll)</strong>. The orphan record will trigger a <strong>Reconciliation Alert</strong> on the dashboard.
              </div>
              <form onSubmit={injectOrphan} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input className="cyber-input" required value={orphanForm.FullName} onChange={e => setOrphanForm({...orphanForm, FullName: e.target.value})} style={inputStyle} placeholder="e.g. Ghost Employee" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Date of Birth *</label><input type="date" className="cyber-input" required value={orphanForm.DateOfBirth} onChange={e => setOrphanForm({...orphanForm, DateOfBirth: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Hire Date *</label><input type="date" className="cyber-input" required value={orphanForm.HireDate} onChange={e => setOrphanForm({...orphanForm, HireDate: e.target.value})} style={inputStyle} /></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,107,107,0.08)' }}>
                  <button type="button" className="btn-delete" onClick={() => setOrphanModal(false)} style={{ padding: '12px 24px', borderRadius: 999 }}><FiX style={{ marginRight: 6 }} /> Cancel</button>
                  <button type="submit" disabled={loading} style={{
                    padding: '12px 28px', borderRadius: 999, border: '1px solid rgba(255,107,107,0.5)',
                    background: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,165,0,0.1))',
                    color: '#ff6b6b', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s', fontSize: 14,
                  }}><FiAlertTriangle /> Inject Orphan Record</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
