import { useState, useEffect } from 'react';
import { FiUsers, FiDollarSign, FiSearch, FiPlus, FiEdit, FiTrash2, FiX, FiSave, FiDownload } from 'react-icons/fi';
import { api } from '../api';
import { exportToExcel } from '../utils/exportUtils';

export default function DataManagement() {
  const [tab, setTab] = useState<'employees'|'salaries'>('employees');
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [salSearch, setSalSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [empModal, setEmpModal] = useState(false);
  const [salModal, setSalModal] = useState(false);
  const [empForm, setEmpForm] = useState<any>({});
  const [salForm, setSalForm] = useState<any>({});

  const loadData = async () => {
    setLoading(true);
    const [e, s] = await Promise.all([api.getHrTableData('Employees'), api.getPayrollTableData('salaries')]);
    if (e.data) setEmployees((e.data as any).data || []);
    if (s.data) setSalaries((s.data as any).data || []);
    setLoading(false);
  };
  useEffect(() => { loadData(); }, []);

  // Employee CRUD
  const openAddEmp = () => { setEmpForm({ FullName:'', DateOfBirth:'', HireDate: new Date().toISOString().split('T')[0], Email:'', PhoneNumber:'', DepartmentID:'', PositionID:'', Status:'Active' }); setEmpModal(true); };
  const openEditEmp = (e: any) => { setEmpForm({ ...e }); setEmpModal(true); };
  const saveEmp = async (ev: React.FormEvent) => {
    ev.preventDefault(); setLoading(true);
    const d = { FullName: empForm.FullName, DateOfBirth: empForm.DateOfBirth, HireDate: empForm.HireDate, Email: empForm.Email, PhoneNumber: empForm.PhoneNumber, DepartmentID: Number(empForm.DepartmentID)||null, PositionID: Number(empForm.PositionID)||null, Status: empForm.Status };
    if (empForm.EmployeeID) await api.updateEmployee(empForm.EmployeeID, d);
    else await api.addEmployee(d);
    setEmpModal(false); await loadData();
  };
  const delEmp = async (id: number) => { if (!confirm('Delete this employee?')) return; await api.deleteEmployee(id); await loadData(); };

  // Salary CRUD
  const openAddSal = () => { setSalForm({ EmployeeID:'', SalaryMonth:'', BaseSalary:'', Bonus:0, Deductions:0, NetSalary:'' }); setSalModal(true); };
  const openEditSal = (s: any) => { setSalForm({ ...s }); setSalModal(true); };
  const saveSal = async (ev: React.FormEvent) => {
    ev.preventDefault(); setLoading(true);
    const d = { EmployeeID: Number(salForm.EmployeeID), SalaryMonth: salForm.SalaryMonth, BaseSalary: Number(salForm.BaseSalary), Bonus: Number(salForm.Bonus)||0, Deductions: Number(salForm.Deductions)||0, NetSalary: Number(salForm.NetSalary) };
    if (salForm.SalaryID) await api.updateSalary(salForm.SalaryID, d);
    else await api.addSalary(d);
    setSalModal(false); await loadData();
  };
  const delSal = async (id: number) => { if (!confirm('Delete this salary record?')) return; await api.deleteSalary(id); await loadData(); };

  // Filter
  let dispEmp = employees;
  if (empSearch) { const q = empSearch.toLowerCase(); dispEmp = dispEmp.filter(e => (e.FullName||'').toLowerCase().includes(q) || String(e.EmployeeID).includes(q)); }
  let dispSal = salaries;
  if (salSearch) { const q = salSearch.toLowerCase(); dispSal = dispSal.filter(s => String(s.EmployeeID).includes(q) || String(s.SalaryID).includes(q) || (s.SalaryMonth||'').includes(q)); }

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '1.5px' };
  const inputStyle = { borderRadius: 'var(--radius-md)', padding: '12px 16px', fontSize: 14 };

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
          <div style={{ display: 'flex', gap: 16, marginTop: 24, marginBottom: 8 }}>
            {[{ id: 'employees' as const, label: 'Employees', icon: <FiUsers /> }, { id: 'salaries' as const, label: 'Salaries', icon: <FiDollarSign /> }].map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '14px 28px', borderRadius: 999,
                border: `1px solid ${tab === t.id ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`,
                background: tab === t.id ? 'rgba(0,242,254,0.1)' : 'rgba(15,23,42,0.6)',
                color: tab === t.id ? 'var(--accent-cyan)' : 'var(--text-primary)',
                fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s', boxShadow: tab === t.id ? '0 0 15px rgba(0,242,254,0.15)' : 'none',
              }}>{t.icon} {t.label}</button>
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
              <button className="secondary-btn" onClick={() => exportToExcel(dispEmp, 'Employees_Export.xlsx')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, borderRadius: 999 }}><FiDownload size={14} /> Export</button>
              <button className="btn-primary" onClick={openAddEmp} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}><FiPlus style={{ marginRight: 6 }} /> Add Employee</button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header"><tr>
                <th style={{ padding: 16 }}>ID</th><th style={{ padding: 16 }}>Full Name</th><th style={{ padding: 16 }}>Email</th>
                <th style={{ padding: 16 }}>Dept ID</th><th style={{ padding: 16 }}>Status</th><th style={{ textAlign: 'right', padding: 16 }}>Actions</th>
              </tr></thead>
              <tbody>
                {dispEmp.length === 0 ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No employees found.</td></tr> :
                  dispEmp.map(e => (
                    <tr key={e.EmployeeID} className="table-row">
                      <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{e.EmployeeID}</td>
                      <td className="table-cell" style={{ fontWeight: 600, padding: 16 }}>{e.FullName}</td>
                      <td className="table-cell" style={{ padding: 16, color: 'var(--text-secondary)' }}>{e.Email || '—'}</td>
                      <td className="table-cell" style={{ padding: 16 }}>{e.DepartmentID || '—'}</td>
                      <td className="table-cell" style={{ padding: 16 }}><span className={`status-badge ${e.Status === 'Active' ? 'online' : 'offline'}`}>● {e.Status || '—'}</span></td>
                      <td className="table-cell" style={{ textAlign: 'right', padding: 16 }}>
                        <button className="btn-edit" onClick={() => openEditEmp(e)} style={{ padding: '6px 12px', marginRight: 8, borderRadius: 8 }} title="Edit"><FiEdit size={14} /></button>
                        <button className="btn-delete" onClick={() => delEmp(e.EmployeeID)} style={{ padding: '6px 12px', borderRadius: 8 }} title="Delete"><FiTrash2 size={14} /></button>
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
              <button className="secondary-btn" onClick={() => exportToExcel(dispSal, 'Salaries_Export.xlsx')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, borderRadius: 999 }}><FiDownload size={14} /> Export</button>
              <button className="btn-primary" onClick={openAddSal} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}><FiPlus style={{ marginRight: 6 }} /> Add Salary</button>
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
                        <button className="btn-edit" onClick={() => openEditSal(s)} style={{ padding: '6px 12px', marginRight: 8, borderRadius: 8 }} title="Edit"><FiEdit size={14} /></button>
                        <button className="btn-delete" onClick={() => delSal(s.SalaryID)} style={{ padding: '6px 12px', borderRadius: 8 }} title="Delete"><FiTrash2 size={14} /></button>
                      </td>
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
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Full Name *</label>
                  <input className="cyber-input" required value={empForm.FullName||''} onChange={e => setEmpForm({...empForm, FullName: e.target.value})} style={inputStyle} placeholder="e.g. John Doe" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Date of Birth *</label><input type="date" className="cyber-input" required value={empForm.DateOfBirth||''} onChange={e => setEmpForm({...empForm, DateOfBirth: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Hire Date *</label><input type="date" className="cyber-input" required value={empForm.HireDate||''} onChange={e => setEmpForm({...empForm, HireDate: e.target.value})} style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Email</label><input type="email" className="cyber-input" value={empForm.Email||''} onChange={e => setEmpForm({...empForm, Email: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Phone</label><input className="cyber-input" value={empForm.PhoneNumber||''} onChange={e => setEmpForm({...empForm, PhoneNumber: e.target.value})} style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Department ID</label><input type="number" className="cyber-input" value={empForm.DepartmentID||''} onChange={e => setEmpForm({...empForm, DepartmentID: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Position ID</label><input type="number" className="cyber-input" value={empForm.PositionID||''} onChange={e => setEmpForm({...empForm, PositionID: e.target.value})} style={inputStyle} /></div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Status</label>
                  <select className="cyber-input" value={empForm.Status||'Active'} onChange={e => setEmpForm({...empForm, Status: e.target.value})} style={{...inputStyle, appearance: 'auto' as any, cursor: 'pointer'}}>
                    <option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Terminated">Terminated</option>
                  </select>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Base Salary ($) *</label><input type="number" className="cyber-input" required value={salForm.BaseSalary||''} onChange={e => setSalForm({...salForm, BaseSalary: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Bonus ($)</label><input type="number" className="cyber-input" value={salForm.Bonus||0} onChange={e => setSalForm({...salForm, Bonus: e.target.value})} style={inputStyle} /></div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Deductions ($)</label><input type="number" className="cyber-input" value={salForm.Deductions||0} onChange={e => setSalForm({...salForm, Deductions: e.target.value})} style={inputStyle} /></div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}><label style={labelStyle}>Net Salary ($) *</label><input type="number" className="cyber-input" required value={salForm.NetSalary||''} onChange={e => setSalForm({...salForm, NetSalary: e.target.value})} style={inputStyle} /></div>
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
    </>
  );
}
