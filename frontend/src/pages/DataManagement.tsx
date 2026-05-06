import { useState, useEffect } from 'react';
import { FiUsers, FiDollarSign, FiSearch, FiPlus, FiEdit, FiTrash2, FiX, FiSave, FiDownload, FiAlertTriangle, FiCalendar, FiBriefcase, FiAward, FiTrendingUp, FiCheckCircle, FiInfo } from 'react-icons/fi';
import { api } from '../api';
import { exportToExcel } from '../utils/exportUtils';

// ── Toast Notification ───────────────────────────────────────────
interface ToastProps {
  type: 'success' | 'warning' | 'danger';
  title: string;
  message: string;
  onClose: () => void;
}

function Toast({ type, title, message, onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 8000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    success: { border: 'rgba(74,222,128,0.4)', bg: 'rgba(74,222,128,0.08)', accent: 'var(--accent-green)', icon: <FiCheckCircle size={20} /> },
    warning: { border: 'rgba(250,204,21,0.4)', bg: 'rgba(250,204,21,0.08)', accent: 'var(--accent-yellow)', icon: <FiInfo size={20} /> },
    danger:  { border: 'rgba(239,68,68,0.4)',  bg: 'rgba(239,68,68,0.08)',  accent: 'var(--accent-red)',    icon: <FiAlertTriangle size={20} /> },
  }[type];

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 99999,
      maxWidth: 480, width: '100%',
      background: 'rgba(11,17,32,0.97)',
      border: `1px solid ${colors.border}`,
      borderLeft: `4px solid ${colors.accent}`,
      borderRadius: 16,
      padding: '20px 24px',
      boxShadow: `0 24px 48px rgba(0,0,0,0.5), 0 0 30px ${colors.border}`,
      backdropFilter: 'blur(20px)',
      animation: 'toastSlideIn 0.4s cubic-bezier(0.16,1,0.3,1)',
    }}>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(40px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <span style={{ color: colors.accent, flexShrink: 0, marginTop: 2 }}>{colors.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: 14, color: colors.accent, marginBottom: 6, letterSpacing: '0.3px' }}>{title}</div>
          <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{message}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, flexShrink: 0 }}>
          <FiX size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Custom Confirm Modal ─────────────────────────────────────────
interface ConfirmDeleteProps {
  employeeName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmDeleteModal({ employeeName, onConfirm, onCancel }: ConfirmDeleteProps) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(12px)',
      zIndex: 20000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div className="card glass fade-in" style={{
        width: '100%', maxWidth: 500,
        borderRadius: 28,
        border: '1px solid rgba(239,68,68,0.3)',
        padding: 40,
        boxShadow: '0 30px 60px rgba(0,0,0,0.6), 0 0 40px rgba(239,68,68,0.1)',
        textAlign: 'center',
      }}>
        {/* Icon */}
        <div style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 28px',
          boxShadow: '0 0 30px rgba(239,68,68,0.15)',
        }}>
          <FiAlertTriangle size={36} color="#ef4444" />
        </div>

        {/* Title */}
        <h3 style={{ fontSize: 22, fontWeight: 800, color: '#ef4444', marginBottom: 12, letterSpacing: '-0.5px' }}>
          ⚠️ CẢNH BÁO NGUY HIỂM
        </h3>

        {/* Employee badge */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(239,68,68,0.08)',
          border: '1px solid rgba(239,68,68,0.2)',
          borderRadius: 12,
          padding: '8px 20px',
          marginBottom: 20,
          fontSize: 15, fontWeight: 700, color: 'var(--text-primary)',
        }}>
          👤 {employeeName}
        </div>

        {/* Warning message */}
        <div style={{
          background: 'rgba(239,68,68,0.05)',
          border: '1px solid rgba(239,68,68,0.15)',
          borderRadius: 14,
          padding: '18px 20px',
          marginBottom: 32,
          textAlign: 'left',
        }}>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, margin: 0 }}>
            Việc xóa nhân viên này sẽ xóa <strong style={{ color: '#ef4444' }}>TOÀN BỘ dữ liệu liên quan</strong> ở cả 2 hệ thống:
          </p>
          <ul style={{ margin: '12px 0 0', paddingLeft: 20, fontSize: 13, color: 'var(--text-muted)', lineHeight: 2 }}>
            <li>🗄️ <strong style={{ color: 'var(--accent-yellow)' }}>MySQL (PAYROLL_2026)</strong>: Bảng lương, Chấm công</li>
            <li>🗄️ <strong style={{ color: 'var(--accent-cyan)' }}>SQL Server (HUMAN_2025)</strong>: Cổ tức, Hồ sơ nhân viên</li>
          </ul>
          <p style={{ fontSize: 13, color: '#ef4444', fontWeight: 700, marginTop: 12, marginBottom: 0 }}>
            ⚡ Thao tác này KHÔNG THỂ HOÀN TÁC!
          </p>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 16 }}>
          <button
            onClick={onCancel}
            style={{
              flex: 1, padding: '15px', borderRadius: 14,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
              cursor: 'pointer', fontWeight: 700, fontSize: 14,
              transition: 'all 0.2s',
            }}
          >
            HỦY BỎ
          </button>
          <button
            onClick={onConfirm}
            style={{
              flex: 1, padding: '15px', borderRadius: 14,
              background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.1))',
              border: '1px solid rgba(239,68,68,0.5)',
              color: '#ef4444',
              cursor: 'pointer', fontWeight: 800, fontSize: 14,
              letterSpacing: '0.5px',
              boxShadow: '0 0 20px rgba(239,68,68,0.15)',
              transition: 'all 0.2s',
            }}
          >
            XÁC NHẬN XÓA
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────
export default function DataManagement() {
  const [tab, setTab] = useState<'employees'|'salaries'|'attendance'|'departments'|'positions'|'dividends'|'overview'>('employees');
  const [employees, setEmployees] = useState<any[]>([]);
  const [salaries, setSalaries] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [dividends, setDividends] = useState<any[]>([]);
  const [empSearch, setEmpSearch] = useState('');
  const [salSearch, setSalSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [empModal, setEmpModal] = useState(false);
  const [salModal, setSalModal] = useState(false);
  const [orphanModal, setOrphanModal] = useState(false);
  const [empForm, setEmpForm] = useState<any>({});
  const [orphanForm, setOrphanForm] = useState<any>({ FullName: '', DateOfBirth: '', HireDate: new Date().toISOString().split('T')[0], Status: 'Active' });
  const [salForm, setSalForm] = useState<any>({});
  const [attModal, setAttModal] = useState(false);
  const [attForm, setAttForm] = useState<any>({});
  const [divModal, setDivModal] = useState(false);
  const [divForm, setDivForm] = useState<any>({});
  const [deptModal, setDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState<any>({});
  const [posModal, setPosModal] = useState(false);
  const [posForm, setPosForm] = useState<any>({});
  // wizard: after adding new employee, guide through salary -> attendance -> dividend
  const [wizardEmp, setWizardEmp] = useState<{ id: number; name: string } | null>(null);
  const [wizardStep, setWizardStep] = useState<'salary'|'attendance'|'dividend'|null>(null);
  const [overviewSearch, setOverviewSearch] = useState('');

  // ── Toast state ──────────────────────────────────────────────
  const [toast, setToast] = useState<{ type: 'success'|'warning'|'danger'; title: string; message: string } | null>(null);

  // ── Delete confirm state ─────────────────────────────────────
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

  const user = (() => { try { return JSON.parse(localStorage.getItem('auth_user')||'{}'); } catch { return {}; } })();
  const canEdit = ['admin', 'editor'].includes(user.role?.toLowerCase());

  const showToast = (type: 'success'|'warning'|'danger', title: string, message: string) => {
    setToast({ type, title, message });
  };

  const loadData = async () => {
    setLoading(true);
    const [e, s, d, p, att, div] = await Promise.all([
      api.getEmployeesWithNames(),
      api.getSalariesWithNames(),         // NEW: uses JOIN endpoint
      api.getDepartments(),
      api.getPositions(),
      api.getAttendanceWithNames(),        // NEW: uses JOIN endpoint
      api.getDividendsWithNames(),         // NEW: uses JOIN endpoint
    ]);
    if (e.data) setEmployees([...(( e.data as any).data || [])].sort((a: any, b: any) => a.EmployeeID - b.EmployeeID));
    if (s.data) setSalaries([...((s.data as any).data || [])].sort((a: any, b: any) => a.SalaryID - b.SalaryID));
    if (d.data) setDepartments(Array.isArray(d.data) ? [...d.data].sort((a, b) => a.DepartmentID - b.DepartmentID) : []);
    if (p.data) setPositions(Array.isArray(p.data) ? [...p.data].sort((a, b) => a.PositionID - b.PositionID) : []);
    if (att.data) {
      const attList = (att.data as any).data || [];
      setAttendance([...attList].sort((a: any, b: any) => a.AttendanceID - b.AttendanceID));
    }
    if (div.data) setDividends([...((div.data as any).data || [])].sort((a: any, b: any) => a.DividendID - b.DividendID));
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  // ── Employee CRUD ─────────────────────────────────────────────
  const openAddEmp = () => {
    setEmpForm({ FullName:'', DateOfBirth:'', HireDate: new Date().toISOString().split('T')[0], Email:'', PhoneNumber:'', DepartmentID:'', PositionID:'', Status:'Đang làm việc', Gender:'Nam' });
    setEmpModal(true);
  };
  const openEditEmp = (e: any) => { setEmpForm({ ...e }); setEmpModal(true); };

  const saveEmp = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    const d = {
      FullName: empForm.FullName,
      DateOfBirth: empForm.DateOfBirth,
      HireDate: empForm.HireDate,
      Email: empForm.Email,
      PhoneNumber: empForm.PhoneNumber,
      DepartmentID: Number(empForm.DepartmentID) || null,
      PositionID: Number(empForm.PositionID) || null,
      Status: empForm.Status,
      Gender: empForm.Gender || 'Nam',
    };

    if (empForm.EmployeeID) {
      const res = await api.updateEmployee(empForm.EmployeeID, d);
      if (res.error) {
        showToast('danger', 'Lỗi cập nhật!', res.error);
      } else {
        showToast('success', 'Cập nhật thành công!', `Thông tin nhân viên "${d.FullName}" đã được cập nhật.`);
      }
      setEmpModal(false);
      await loadData();
    } else {
      const res = await api.addEmployee(d);
      if (res.error) {
        showToast('danger', 'Thêm thất bại!', res.error);
      } else {
        const newId = (res.data as any)?.EmployeeID;
        setWizardEmp({ id: newId, name: d.FullName });
        setEmpModal(false);
        // wizard step 1: salary
        setSalForm({ EmployeeID: newId, SalaryMonth: new Date().toISOString().split('T')[0], BaseSalary: '', Bonus: 0, Deductions: 0 });
        setWizardStep('salary');
        setSalModal(true);
        showToast('success', '✅ Nhân viên đã tạo!', `"${d.FullName}" đã được tạo. Vui lòng điền thông tin Lương, Chấm công và Cổ tức.`);
        await loadData();
        return;
      }
    }
    setLoading(false);
  };

  // ── Delete with custom confirm ────────────────────────────────
  const requestDeleteEmp = (emp: any) => {
    setDeleteConfirm({ id: emp.EmployeeID, name: emp.FullName });
  };

  const confirmDeleteEmp = async () => {
    if (!deleteConfirm) return;
    setDeleteConfirm(null);
    setLoading(true);
    const res = await api.deleteEmployee(deleteConfirm.id);
    if (res.error) {
      showToast('danger', 'Xóa thất bại!', res.error);
    } else {
      showToast('warning', 'Đã xóa nhân viên', `Nhân viên "${deleteConfirm.name}" và toàn bộ dữ liệu liên quan đã bị xóa vĩnh viễn.`);
    }
    await loadData();
  };

  // ── Salary CRUD ───────────────────────────────────────────────
  const calcNet = (base: any, bonus: any, deductions: any) =>
    (Number(base) || 0) + (Number(bonus) || 0) - (Number(deductions) || 0);

  const openAddSal = () => { setSalForm({ EmployeeID:'', SalaryMonth:'', BaseSalary:'', Bonus:0, Deductions:0 }); setSalModal(true); };
  const openEditSal = (s: any) => { setSalForm({ ...s }); setSalModal(true); };
  const updateSalField = (field: string, value: any) => setSalForm((prev: any) => ({ ...prev, [field]: value }));

  const saveSal = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    const net = calcNet(salForm.BaseSalary, salForm.Bonus, salForm.Deductions);
    const d = {
      EmployeeID: Number(salForm.EmployeeID),
      SalaryMonth: salForm.SalaryMonth,
      BaseSalary: Number(salForm.BaseSalary),
      Bonus: Number(salForm.Bonus) || 0,
      Deductions: Number(salForm.Deductions) || 0,
      NetSalary: net,
    };
    if (salForm.SalaryID) await api.updateSalary(salForm.SalaryID, d);
    else await api.addSalary(d);
    // wizard: advance to attendance BEFORE loadData to avoid race condition
    if (wizardStep === 'salary' && wizardEmp) {
      setAttForm({ EmployeeID: wizardEmp.id, AttendanceMonth: new Date().toISOString().split('T')[0], WorkDays: 22, AbsentDays: 0, LeaveDays: 0 });
      setWizardStep('attendance');
      setSalModal(false);
      setAttModal(true);
    } else {
      setSalModal(false);
      setWizardStep(null);
    }
    await loadData();
    setLoading(false);
  };

  const cancelWizardSal = () => {
    setSalModal(false);
    setWizardStep(null);
    setWizardEmp(null);
    showToast('warning', 'Wizard hủy', 'Bạn đã bỏ qua phần nhập Lương.');
  };

  const delSal = async (id: number) => {
    if (!confirm('Xóa bản ghi lương này?')) return;
    await api.deleteSalary(id);
    await loadData();
  };

  // ── Attendance CRUD ──────────────────────────────────────────
  const saveAtt = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    const d = { EmployeeID: Number(attForm.EmployeeID), AttendanceMonth: attForm.AttendanceMonth, WorkDays: Number(attForm.WorkDays), AbsentDays: Number(attForm.AbsentDays)||0, LeaveDays: Number(attForm.LeaveDays)||0 };
    if (attForm.AttendanceID) await api.updateAttendance(attForm.AttendanceID, d);
    else await api.addAttendance(d);
    // wizard: advance to dividend BEFORE loadData
    if (wizardStep === 'attendance' && wizardEmp) {
      setDivForm({ EmployeeID: wizardEmp.id, DividendAmount: '', DividendDate: new Date().toISOString().split('T')[0] });
      setWizardStep('dividend');
      setAttModal(false);
      setDivModal(true);
    } else {
      setAttModal(false);
      setWizardStep(null);
    }
    await loadData();
    setLoading(false);
  };

  const cancelWizardAtt = () => {
    setAttModal(false);
    setWizardStep(null);
    setWizardEmp(null);
    showToast('warning', 'Wizard hủy', 'Bạn đã bỏ qua phần nhập Chấm công.');
  };

  const delAtt = async (id: number) => {
    if (!confirm('Xóa bản ghi chấm công này?')) return;
    await api.deleteAttendance(id);
    await loadData();
  };

  // ── Dividend CRUD ───────────────────────────────────────────
  const saveDiv = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    const d = { EmployeeID: Number(divForm.EmployeeID), DividendAmount: Number(divForm.DividendAmount), DividendDate: divForm.DividendDate };
    if (divForm.DividendID) await api.updateDividend(divForm.DividendID, d);
    else await api.addDividend(d);
    setDivModal(false);
    if (wizardStep === 'dividend' && wizardEmp) {
      showToast('success', '✅ Hoàn tất!', `Nhân viên "${wizardEmp.name}" đã được thiết lập đầy đủ Lương, Chấm công và Cổ tức.`);
      setWizardStep(null);
      setWizardEmp(null);
    }
    await loadData();
    setLoading(false);
  };

  const cancelWizardDiv = () => {
    setDivModal(false);
    setWizardStep(null);
    setWizardEmp(null);
    showToast('warning', 'Wizard hủy', 'Bạn đã bỏ qua phần nhập Cổ tức.');
  };

  const delDiv = async (id: number) => {
    if (!confirm('Xóa bản ghi cổ tức này?')) return;
    await api.deleteDividend(id);
    await loadData();
  };

  // ── Department CRUD ───────────────────────────────────────────
  const saveDept = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    if (deptForm.DepartmentID) {
      await api.updateDepartment(deptForm.DepartmentID, { DepartmentName: deptForm.DepartmentName });
    } else {
      await api.addDepartment({ DepartmentName: deptForm.DepartmentName });
    }
    setDeptModal(false);
    await loadData();
    setLoading(false);
  };

  const delDept = async (id: number) => {
    if (!confirm('Xóa phòng ban này? Nhân viên thuộc phòng ban này sẽ mất liên kết.')) return;
    await api.deleteDepartment(id);
    await loadData();
  };

  // ── Position CRUD ─────────────────────────────────────────────
  const savePos = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    if (posForm.PositionID) {
      await api.updatePosition(posForm.PositionID, { PositionName: posForm.PositionName });
    } else {
      await api.addPosition({ PositionName: posForm.PositionName });
    }
    setPosModal(false);
    await loadData();
    setLoading(false);
  };

  const delPos = async (id: number) => {
    if (!confirm('Xóa vị trí này? Nhân viên giữ vị trí này sẽ mất liên kết.')) return;
    await api.deletePosition(id);
    await loadData();
  };

  // ── Orphan inject ─────────────────────────────────────────────
  const injectOrphan = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setLoading(true);
    try {
      const res = await api.addOrphanEmployee(orphanForm);
      if (res.error) {
        showToast('danger', 'Lỗi!', res.error);
      } else {
        showToast('warning', '⚠️ Orphan injected!', `Nhân viên ID: ${(res.data as any)?.EmployeeID}. Kiểm tra Reconciliation để xem cảnh báo!`);
        setOrphanModal(false);
        await loadData();
      }
    } catch (e: any) {
      showToast('danger', 'Thất bại!', e.message);
    }
    setLoading(false);
  };

  // ── Filter ────────────────────────────────────────────────────
  let dispEmp = [...employees];
  if (empSearch) {
    const q = empSearch.toLowerCase();
    dispEmp = dispEmp.filter(e => (e.FullName||'').toLowerCase().includes(q) || String(e.EmployeeID).includes(q));
  }
  let dispSal = [...salaries];
  if (salSearch) {
    const q = salSearch.toLowerCase();
    dispSal = dispSal.filter(s =>
      String(s.EmployeeID).includes(q) ||
      String(s.SalaryID).includes(q) ||
      (s.SalaryMonth||'').includes(q) ||
      (s.FullName||'').toLowerCase().includes(q)
    );
  }

  // ── Overview: join employees with salary, attendance, dividend ──
  const overview = employees.map(emp => {
    const sal = salaries.find(s => s.EmployeeID === emp.EmployeeID);
    const att = attendance.find(a => a.EmployeeID === emp.EmployeeID);
    const div = dividends.find(d => d.EmployeeID === emp.EmployeeID);
    return {
      EmployeeID: emp.EmployeeID,
      FullName: emp.FullName,
      Department: emp.DepartmentName || '—',
      Position: emp.PositionName || '—',
      BaseSalary: sal?.BaseSalary ?? null,
      NetSalary: sal?.NetSalary ?? null,
      SalaryMonth: sal?.SalaryMonth || '—',
      WorkDays: att?.WorkDays ?? null,
      AbsentDays: att?.AbsentDays ?? null,
      DividendAmount: div?.DividendAmount ?? null,
    };
  }).filter(row => {
    if (!overviewSearch) return true;
    const q = overviewSearch.toLowerCase();
    return row.FullName.toLowerCase().includes(q) || String(row.EmployeeID).includes(q) || row.Department.toLowerCase().includes(q);
  });

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

  // ── Employee name badge helper (no ID sub-line) ─────────────
  const EmpCell = ({ fullName }: { fullName?: string; empId?: number }) => (
    <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{fullName || '—'}</span>
  );

  // ── JSX ───────────────────────────────────────────────────────
  return (
    <>
      {/* Toast */}
      {toast && (
        <Toast
          type={toast.type}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}

      {/* Custom Delete Confirm */}
      {deleteConfirm && (
        <ConfirmDeleteModal
          employeeName={deleteConfirm.name}
          onConfirm={confirmDeleteEmp}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}

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
              { id: 'dividends' as const, label: 'Dividends', icon: <FiTrendingUp size={16} /> },
              { id: 'overview' as const, label: 'Overview', icon: <FiInfo size={16} /> },
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

      {/* ── Employee Tab ──────────────────────────────────────────── */}
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
              {canEdit && (
                <button onClick={() => { setOrphanForm({ FullName: '', DateOfBirth: '', HireDate: new Date().toISOString().split('T')[0], Status: 'Active' }); setOrphanModal(true); }} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', fontSize: 13, borderRadius: 999,
                  border: '1px solid rgba(255,107,107,0.4)', background: 'rgba(255,107,107,0.08)',
                  color: '#ff6b6b', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                }}><FiAlertTriangle size={14} /> Inject Sync Error</button>
              )}
              {canEdit && (
                <button className="btn-primary" onClick={openAddEmp} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}>
                  <FiPlus style={{ marginRight: 6 }} /> Add Employee
                </button>
              )}
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header">
                <tr>
                  <th style={{ padding: 16 }}>ID</th>
                  <th style={{ padding: 16 }}>Full Name</th>
                  <th style={{ padding: 16 }}>Email</th>
                  <th style={{ padding: 16 }}>Phone</th>
                  <th style={{ padding: 16 }}>Department</th>
                  <th style={{ padding: 16 }}>Position</th>
                  <th style={{ padding: 16 }}>Status</th>
                  <th style={{ padding: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dispEmp.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No employees found.</td></tr>
                ) : dispEmp.map(e => (
                  <tr key={e.EmployeeID} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{e.EmployeeID}</td>
                    <td className="table-cell" style={{ fontWeight: 600, padding: 16 }}>{e.FullName}</td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--text-secondary)' }}>{e.Email || '—'}</td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--text-secondary)' }}>{e.PhoneNumber || '—'}</td>
                    <td className="table-cell" style={{ padding: 16 }}>{e.DepartmentName || '—'}</td>
                    <td className="table-cell" style={{ padding: 16 }}>{e.PositionName || '—'}</td>
                    <td className="table-cell" style={{ padding: 16 }}>
                      <span className={`status-badge ${getStatusClass(e.Status)}`}>● {e.Status || '—'}</span>
                    </td>
                    <td className="table-cell" style={{ padding: 16 }}>
                      {canEdit ? (
                        <>
                          <button className="btn-edit" onClick={() => openEditEmp(e)} style={{ padding: '6px 12px', marginRight: 8, borderRadius: 8 }} title="Edit"><FiEdit size={14} /></button>
                          <button className="btn-delete" onClick={() => requestDeleteEmp(e)} style={{ padding: '6px 12px', borderRadius: 8 }} title="Delete"><FiTrash2 size={14} /></button>
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

      {/* ── Salary Tab ────────────────────────────────────────────── */}
      {tab === 'salaries' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(74,222,128,0.05), rgba(0,242,254,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(74,222,128,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiDollarSign style={{ color: 'var(--accent-green)' }} /> Payroll Records</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', opacity: 0.6 }} size={14} />
                <input className="cyber-input" placeholder="Search ID, Name or Month..." value={salSearch} onChange={e => setSalSearch(e.target.value)} style={{ padding: '8px 12px 8px 34px', borderRadius: 999, width: 220, fontSize: 13 }} />
              </div>
              <button className="btn-export btn-excel" onClick={() => exportToExcel(dispSal, 'Salaries_Export.xlsx')}><FiDownload size={14} /> Export</button>
              {canEdit && (
                <button className="btn-primary" onClick={openAddSal} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}>
                  <FiPlus style={{ marginRight: 6 }} /> Add Salary
                </button>
              )}
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header">
                <tr>
                  <th style={{ padding: 16 }}>ID</th>
                  <th style={{ padding: 16 }}>Employee</th>
                  <th style={{ padding: 16 }}>Month</th>
                  <th style={{ textAlign: 'right', padding: 16 }}>Base</th>
                  <th style={{ textAlign: 'right', padding: 16 }}>Bonus</th>
                  <th style={{ textAlign: 'right', padding: 16 }}>Deductions</th>
                  <th style={{ textAlign: 'right', padding: 16 }}>Net</th>
                  <th style={{ textAlign: 'right', padding: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dispSal.length === 0 ? (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No salaries found.</td></tr>
                ) : dispSal.map(s => (
                  <tr key={s.SalaryID} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{s.SalaryID}</td>
                    <td className="table-cell" style={{ padding: 16 }}>
                      <EmpCell fullName={s.FullName} empId={s.EmployeeID} />
                    </td>
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

      {/* ── Attendance Tab ────────────────────────────────────────── */}
      {tab === 'attendance' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(74,222,128,0.05), rgba(0,242,254,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(74,222,128,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiCalendar style={{ color: 'var(--accent-green)' }} /> Attendance Records</h3>
            {canEdit && <button className="btn-primary" onClick={() => { setAttForm({ EmployeeID:'', AttendanceMonth: new Date().toISOString().split('T')[0], WorkDays:22, AbsentDays:0, LeaveDays:0 }); setAttModal(true); }} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}><FiPlus style={{ marginRight: 6 }} /> Add Record</button>}
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header">
                <tr>
                  <th style={{ padding: 16 }}>ID</th>
                  <th style={{ padding: 16 }}>Employee</th>
                  <th style={{ padding: 16 }}>Month</th>
                  <th style={{ padding: 16 }}>Work Days</th>
                  <th style={{ padding: 16 }}>Absent</th>
                  <th style={{ padding: 16 }}>Leave</th>
                  <th style={{ padding: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr><td colSpan={7} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No attendance data found.</td></tr>
                ) : attendance.map(a => (
                  <tr key={a.AttendanceID} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{a.AttendanceID}</td>
                    <td className="table-cell" style={{ padding: 16 }}><EmpCell fullName={a.FullName} /></td>
                    <td className="table-cell" style={{ padding: 16 }}>{a.AttendanceMonth}</td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--accent-green)' }}>{a.WorkDays}</td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--accent-red)' }}>{a.AbsentDays}</td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--accent-yellow)' }}>{a.LeaveDays}</td>
                    <td className="table-cell" style={{ padding: 16 }}>
                      {canEdit ? (
                        <>
                          <button className="btn-edit" onClick={() => { setAttForm({...a, AttendanceMonth: a.AttendanceMonth ? String(a.AttendanceMonth).split('T')[0] : ''}); setAttModal(true); }} style={{ padding: '6px 12px', marginRight: 8, borderRadius: 8 }} title="Edit"><FiEdit size={14} /></button>
                          <button className="btn-delete" onClick={() => delAtt(a.AttendanceID)} style={{ padding: '6px 12px', borderRadius: 8 }} title="Delete"><FiTrash2 size={14} /></button>
                        </>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Read-only</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Departments Tab ───────────────────────────────────────── */}
      {tab === 'departments' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(123,47,247,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,242,254,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiBriefcase style={{ color: 'var(--accent-cyan)' }} /> Departments (HR Sync)</h3>
            {canEdit && <button className="btn-primary" onClick={() => { setDeptForm({ DepartmentName: '' }); setDeptModal(true); }} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}><FiPlus style={{ marginRight: 6 }} /> Add Dept</button>}
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header">
                <tr><th style={{ padding: 16 }}>Dept ID</th><th style={{ padding: 16 }}>Department Name</th><th style={{ padding: 16 }}>Actions</th></tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr><td colSpan={2} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No departments found.</td></tr>
                ) : departments.map(d => (
                  <tr key={d.DepartmentID} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{d.DepartmentID}</td>
                    <td className="table-cell" style={{ padding: 16, fontWeight: 600 }}>{d.DepartmentName}</td>
                    <td className="table-cell" style={{ padding: 16 }}>
                      {canEdit ? (<>
                        <button className="btn-edit" onClick={() => { setDeptForm({ ...d }); setDeptModal(true); }} style={{ padding: '6px 12px', marginRight: 8, borderRadius: 8 }}><FiEdit size={14} /></button>
                        <button className="btn-delete" onClick={() => delDept(d.DepartmentID)} style={{ padding: '6px 12px', borderRadius: 8 }}><FiTrash2 size={14} /></button>
                      </>) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Read-only</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Positions Tab ─────────────────────────────────────────── */}
      {tab === 'positions' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(123,47,247,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,242,254,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiAward style={{ color: 'var(--accent-cyan)' }} /> Job Positions (HR Sync)</h3>
            {canEdit && <button className="btn-primary" onClick={() => { setPosForm({ PositionName: '' }); setPosModal(true); }} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}><FiPlus style={{ marginRight: 6 }} /> Add Position</button>}
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header">
                <tr><th style={{ padding: 16 }}>Pos ID</th><th style={{ padding: 16 }}>Position Title</th><th style={{ padding: 16 }}>Actions</th></tr>
              </thead>
              <tbody>
                {positions.length === 0 ? (
                  <tr><td colSpan={2} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No positions found.</td></tr>
                ) : positions.map(p => (
                  <tr key={p.PositionID} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{p.PositionID}</td>
                    <td className="table-cell" style={{ padding: 16, fontWeight: 600 }}>{p.PositionName}</td>
                    <td className="table-cell" style={{ padding: 16 }}>
                      {canEdit ? (<>
                        <button className="btn-edit" onClick={() => { setPosForm({ ...p }); setPosModal(true); }} style={{ padding: '6px 12px', marginRight: 8, borderRadius: 8 }}><FiEdit size={14} /></button>
                        <button className="btn-delete" onClick={() => delPos(p.PositionID)} style={{ padding: '6px 12px', borderRadius: 8 }}><FiTrash2 size={14} /></button>
                      </>) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Read-only</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Dividends Tab ─────────────────────────────────────────── */}
      {tab === 'dividends' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(123,47,247,0.05), rgba(250,204,21,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(123,47,247,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiTrendingUp style={{ color: 'var(--accent-purple)' }} /> Dividend Distributions</h3>
            {canEdit && <button className="btn-primary" onClick={() => { setDivForm({ EmployeeID:'', DividendAmount:'', DividendDate: new Date().toISOString().split('T')[0] }); setDivModal(true); }} style={{ padding: '8px 18px', fontSize: 13, borderRadius: 999 }}><FiPlus style={{ marginRight: 6 }} /> Add Dividend</button>}
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header">
                <tr>
                  <th style={{ padding: 16 }}>ID</th>
                  <th style={{ padding: 16 }}>Employee</th>
                  <th style={{ padding: 16 }}>Date</th>
                  <th style={{ padding: 16 }}>Amount</th>
                  <th style={{ padding: 16 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dividends.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No dividend data found.</td></tr>
                ) : dividends.map(d => (
                  <tr key={d.DividendID} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-purple)' }}>{d.DividendID}</td>
                    <td className="table-cell" style={{ padding: 16 }}><EmpCell fullName={d.FullName} /></td>
                    <td className="table-cell" style={{ padding: 16 }}>{d.DividendDate ? String(d.DividendDate).split('T')[0] : '—'}</td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--accent-yellow)', fontWeight: 600 }}>${d.DividendAmount?.toLocaleString()}</td>
                    <td className="table-cell" style={{ padding: 16 }}>
                      {canEdit ? (
                        <>
                          <button className="btn-edit" onClick={() => { setDivForm({ DividendID: d.DividendID, EmployeeID: d.EmployeeID, DividendAmount: d.DividendAmount, DividendDate: d.DividendDate ? String(d.DividendDate).split('T')[0] : '' }); setDivModal(true); }} style={{ padding: '6px 12px', marginRight: 8, borderRadius: 8 }} title="Edit"><FiEdit size={14} /></button>
                          <button className="btn-delete" onClick={() => delDiv(d.DividendID)} style={{ padding: '6px 12px', borderRadius: 8 }} title="Delete"><FiTrash2 size={14} /></button>
                        </>
                      ) : <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Read-only</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Overview Tab ──────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="card glass mt-6 fade-in" style={{ marginTop: 24, borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.05), rgba(74,222,128,0.05))', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,242,254,0.1)', padding: '20px 24px' }}>
            <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}><FiInfo style={{ color: 'var(--accent-cyan)' }} /> Employee Overview Report</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <FiSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--accent-cyan)', opacity: 0.6 }} size={14} />
                <input className="cyber-input" placeholder="Search employee, dept..." value={overviewSearch} onChange={e => setOverviewSearch(e.target.value)} style={{ padding: '8px 12px 8px 34px', borderRadius: 999, width: 220, fontSize: 13 }} />
              </div>
              <button className="btn-export btn-excel" onClick={() => exportToExcel(overview, 'Employee_Overview_Report.xlsx')}><FiDownload size={14} /> Export Report</button>
            </div>
          </div>
          <div className="card-body" style={{ padding: 0, overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header">
                <tr>
                  <th style={{ padding: 16 }}>ID</th>
                  <th style={{ padding: 16 }}>Employee</th>
                  <th style={{ padding: 16 }}>Department</th>
                  <th style={{ padding: 16 }}>Position</th>
                  <th style={{ textAlign: 'right', padding: 16 }}>Base Salary</th>
                  <th style={{ textAlign: 'right', padding: 16 }}>Net Salary</th>
                  <th style={{ textAlign: 'center', padding: 16 }}>Work Days</th>
                  <th style={{ textAlign: 'center', padding: 16 }}>Absent</th>
                  <th style={{ textAlign: 'right', padding: 16 }}>Dividend</th>
                </tr>
              </thead>
              <tbody>
                {overview.length === 0 ? (
                  <tr><td colSpan={9} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No data found.</td></tr>
                ) : overview.map(row => (
                  <tr key={row.EmployeeID} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--accent-cyan)' }}>{row.EmployeeID}</td>
                    <td className="table-cell" style={{ padding: 16, fontWeight: 600 }}>{row.FullName}</td>
                    <td className="table-cell" style={{ padding: 16 }}>{row.Department}</td>
                    <td className="table-cell" style={{ padding: 16 }}>{row.Position}</td>
                    <td className="table-cell" style={{ textAlign: 'right', padding: 16 }}>{row.BaseSalary != null ? `$${Number(row.BaseSalary).toLocaleString()}` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td className="table-cell" style={{ textAlign: 'right', padding: 16, fontWeight: 600, color: 'var(--accent-green)' }}>{row.NetSalary != null ? `$${Number(row.NetSalary).toLocaleString()}` : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>}</td>
                    <td className="table-cell" style={{ textAlign: 'center', padding: 16, color: 'var(--accent-cyan)' }}>{row.WorkDays ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td className="table-cell" style={{ textAlign: 'center', padding: 16, color: row.AbsentDays ? 'var(--accent-red)' : 'var(--text-muted)' }}>{row.AbsentDays ?? '—'}</td>
                    <td className="table-cell" style={{ textAlign: 'right', padding: 16, color: 'var(--accent-yellow)', fontWeight: 600 }}>{row.DividendAmount != null ? `$${Number(row.DividendAmount).toLocaleString()}` : <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Department Modal ──────────────────────────────────────── */}
      {deptModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ width: '100%', maxWidth: 420, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgba(0,242,254,0.15)' }}>
            <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.06), rgba(123,47,247,0.06))', padding: 24, borderBottom: '1px solid rgba(0,242,254,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiBriefcase /></div>
                {deptForm.DepartmentID ? 'Edit Department' : 'Add Department'}
              </h3>
              <button onClick={() => setDeptModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            <div className="card-body" style={{ padding: 32 }}>
              <form onSubmit={saveDept} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Department Name *</label>
                  <input className="cyber-input" required value={deptForm.DepartmentName || ''} onChange={e => setDeptForm({ ...deptForm, DepartmentName: e.target.value })} style={inputStyle} placeholder="e.g. Engineering" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 12 }}>
                  <button type="button" className="btn-delete" onClick={() => setDeptModal(false)} style={{ padding: '12px 24px', borderRadius: 999 }}><FiX style={{ marginRight: 6 }} /> Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 32px', borderRadius: 999 }}><FiSave style={{ marginRight: 6 }} /> {deptForm.DepartmentID ? 'Save Changes' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Position Modal ────────────────────────────────────────── */}
      {posModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ width: '100%', maxWidth: 420, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgba(0,242,254,0.15)' }}>
            <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.06), rgba(123,47,247,0.06))', padding: 24, borderBottom: '1px solid rgba(0,242,254,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiAward /></div>
                {posForm.PositionID ? 'Edit Position' : 'Add Position'}
              </h3>
              <button onClick={() => setPosModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            <div className="card-body" style={{ padding: 32 }}>
              <form onSubmit={savePos} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Position Title *</label>
                  <input className="cyber-input" required value={posForm.PositionName || ''} onChange={e => setPosForm({ ...posForm, PositionName: e.target.value })} style={inputStyle} placeholder="e.g. Senior Developer" />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 12 }}>
                  <button type="button" className="btn-delete" onClick={() => setPosModal(false)} style={{ padding: '12px 24px', borderRadius: 999 }}><FiX style={{ marginRight: 6 }} /> Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 32px', borderRadius: 999 }}><FiSave style={{ marginRight: 6 }} /> {posForm.PositionID ? 'Save Changes' : 'Add'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Employee Modal ────────────────────────────────────────── */}
      {empModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ width: '100%', maxWidth: 550, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgba(0,242,254,0.15)' }}>
            <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.06), rgba(123,47,247,0.06))', padding: 24, borderBottom: '1px solid rgba(0,242,254,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {empForm.EmployeeID ? <FiEdit /> : <FiPlus />}
                </div>
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Date of Birth *</label>
                    <input type="date" className="cyber-input" required value={empForm.DateOfBirth||''} onChange={e => setEmpForm({...empForm, DateOfBirth: e.target.value})} style={inputStyle} />
                  </div>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Email</label>
                    <input type="email" className="cyber-input" value={empForm.Email||''} onChange={e => setEmpForm({...empForm, Email: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Phone</label>
                    <input className="cyber-input" value={empForm.PhoneNumber||''} onChange={e => setEmpForm({...empForm, PhoneNumber: e.target.value})} style={inputStyle} />
                  </div>
                </div>
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Hire Date *</label>
                    <input type="date" className="cyber-input" required value={empForm.HireDate||''} onChange={e => setEmpForm({...empForm, HireDate: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Status</label>
                    <select className="cyber-input" value={empForm.Status||'Đang làm việc'} onChange={e => setEmpForm({...empForm, Status: e.target.value})} style={{...inputStyle, appearance: 'auto' as any, cursor: 'pointer'}}>
                      <option value="Đang làm việc">Đang làm việc</option>
                      <option value="Thử việc">Thử việc</option>
                      <option value="Thực tập">Thực tập</option>
                      <option value="Nghỉ phép">Nghỉ phép</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(0,242,254,0.08)' }}>
                  <button type="button" className="btn-delete" onClick={() => setEmpModal(false)} style={{ padding: '12px 24px', borderRadius: 999 }}><FiX style={{ marginRight: 6 }} /> Cancel</button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 32px', borderRadius: 999 }}>
                    <FiSave style={{ marginRight: 6 }} /> {empForm.EmployeeID ? 'Save Changes' : 'Create Employee'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Salary Modal ──────────────────────────────────────────── */}
      {salModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ width: '100%', maxWidth: 500, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgba(74,222,128,0.15)' }}>
            <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(74,222,128,0.06), rgba(0,242,254,0.06))', padding: 24, borderBottom: '1px solid rgba(74,222,128,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(74,222,128,0.1)', color: 'var(--accent-green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {salForm.SalaryID ? <FiEdit /> : <FiDollarSign />}
                </div>
                {salForm.SalaryID ? 'Update Salary' : 'Add Salary'}
              </h3>
              <button onClick={() => setSalModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            <div className="card-body" style={{ padding: 32 }}>
              <form onSubmit={saveSal} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Employee ID *</label>
                  <input type="number" className="cyber-input" required value={salForm.EmployeeID||''} readOnly={!!salForm.SalaryID} onChange={e => setSalForm({...salForm, EmployeeID: e.target.value})} style={{...inputStyle, ...(salForm.SalaryID ? {opacity:0.6, cursor:'not-allowed'}:{})}} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Salary Month *</label>
                  <input type="date" className="cyber-input" required value={salForm.SalaryMonth||''} onChange={e => setSalForm({...salForm, SalaryMonth: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Base Salary ($) *</label>
                    <input type="number" className="cyber-input" required value={salForm.BaseSalary||''} onChange={e => updateSalField('BaseSalary', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Bonus ($)</label>
                    <input type="number" className="cyber-input" value={salForm.Bonus||0} onChange={e => updateSalField('Bonus', e.target.value)} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Deductions ($)</label>
                    <input type="number" className="cyber-input" value={salForm.Deductions||0} onChange={e => updateSalField('Deductions', e.target.value)} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Net Salary ($)</label>
                    <input type="number" className="cyber-input" readOnly value={calcNet(salForm.BaseSalary, salForm.Bonus, salForm.Deductions)} style={{...inputStyle, opacity: 0.7, cursor: 'not-allowed', background: 'rgba(0,242,254,0.04)', borderColor: 'rgba(0,242,254,0.15)'}} />
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>= Base + Bonus − Deductions</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(74,222,128,0.08)' }}>
                  <button type="button" className="btn-delete" onClick={wizardStep === 'salary' ? cancelWizardSal : () => setSalModal(false)} style={{ padding: '12px 24px', borderRadius: 999 }}>
                    <FiX style={{ marginRight: 6 }} /> {wizardStep === 'salary' ? 'Skip (Hủy wizard)' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 32px', borderRadius: 999 }}>
                    <FiSave style={{ marginRight: 6 }} /> {salForm.SalaryID ? 'Save Changes' : 'Add Salary'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Orphan Employee Modal ─────────────────────────────────── */}
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
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Date of Birth *</label>
                    <input type="date" className="cyber-input" required value={orphanForm.DateOfBirth} onChange={e => setOrphanForm({...orphanForm, DateOfBirth: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Hire Date *</label>
                    <input type="date" className="cyber-input" required value={orphanForm.HireDate} onChange={e => setOrphanForm({...orphanForm, HireDate: e.target.value})} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(255,107,107,0.08)' }}>
                  <button type="button" className="btn-delete" onClick={() => setOrphanModal(false)} style={{ padding: '12px 24px', borderRadius: 999 }}><FiX style={{ marginRight: 6 }} /> Cancel</button>
                  <button type="submit" disabled={loading} style={{
                    padding: '12px 28px', borderRadius: 999, border: '1px solid rgba(255,107,107,0.5)',
                    background: 'linear-gradient(135deg, rgba(255,107,107,0.15), rgba(255,165,0,0.1))',
                    color: '#ff6b6b', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                    transition: 'all 0.2s', fontSize: 14,
                  }}>
                    <FiAlertTriangle /> Inject Orphan Record
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Attendance Modal ──────────────────────────────────────── */}
      {attModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ width: '100%', maxWidth: 480, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgba(0,242,254,0.15)' }}>
            <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(0,242,254,0.06), rgba(74,222,128,0.06))', padding: 24, borderBottom: '1px solid rgba(0,242,254,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiCalendar /></div>
                {wizardStep === 'attendance' ? '✨ Bước 2/3 — Chấm công' : (attForm.AttendanceID ? 'Edit Attendance' : 'Add Attendance')}
              </h3>
              <button onClick={wizardStep === 'attendance' ? cancelWizardAtt : () => setAttModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            {wizardStep === 'attendance' && wizardEmp && (
              <div style={{ background: 'rgba(0,242,254,0.05)', borderBottom: '1px solid rgba(0,242,254,0.08)', padding: '10px 24px', fontSize: 12, color: 'var(--accent-cyan)' }}>
                👤 Nhân viên: <strong>{wizardEmp.name}</strong> (ID: {wizardEmp.id})
              </div>
            )}
            <div className="card-body" style={{ padding: 32 }}>
              <form onSubmit={saveAtt} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Employee ID *</label>
                  <input type="number" className="cyber-input" required value={attForm.EmployeeID||''} readOnly={!!wizardStep} onChange={e => setAttForm({...attForm, EmployeeID: e.target.value})} style={{...inputStyle, ...(wizardStep ? {opacity:0.6,cursor:'not-allowed'}:{})}} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Attendance Month *</label>
                  <input type="date" className="cyber-input" required value={attForm.AttendanceMonth||''} onChange={e => setAttForm({...attForm, AttendanceMonth: e.target.value})} style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Work Days *</label>
                    <input type="number" className="cyber-input" required min="0" max="31" value={attForm.WorkDays||''} onChange={e => setAttForm({...attForm, WorkDays: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Absent Days</label>
                    <input type="number" className="cyber-input" min="0" max="31" value={attForm.AbsentDays||0} onChange={e => setAttForm({...attForm, AbsentDays: e.target.value})} style={inputStyle} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Leave Days</label>
                    <input type="number" className="cyber-input" min="0" max="31" value={attForm.LeaveDays||0} onChange={e => setAttForm({...attForm, LeaveDays: e.target.value})} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(0,242,254,0.08)' }}>
                  <button type="button" className="btn-delete" onClick={wizardStep === 'attendance' ? cancelWizardAtt : () => setAttModal(false)} style={{ padding: '12px 24px', borderRadius: 999 }}>
                    <FiX style={{ marginRight: 6 }} /> {wizardStep === 'attendance' ? 'Skip (Hủy wizard)' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 32px', borderRadius: 999 }}>
                    <FiSave style={{ marginRight: 6 }} /> {attForm.AttendanceID ? 'Save Changes' : (wizardStep === 'attendance' ? 'Lưu & Tiếp theo →' : 'Add Record')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Dividend Modal ────────────────────────────────────────── */}
      {divModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ width: '100%', maxWidth: 440, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid rgba(123,47,247,0.2)' }}>
            <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(123,47,247,0.06), rgba(250,204,21,0.04))', padding: 24, borderBottom: '1px solid rgba(123,47,247,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(123,47,247,0.1)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><FiTrendingUp /></div>
                {wizardStep === 'dividend' ? '✨ Bước 3/3 — Cổ tức' : (divForm.DividendID ? 'Edit Dividend' : 'Add Dividend')}
              </h3>
              <button onClick={wizardStep === 'dividend' ? cancelWizardDiv : () => setDivModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><FiX size={20} /></button>
            </div>
            {wizardStep === 'dividend' && wizardEmp && (
              <div style={{ background: 'rgba(123,47,247,0.05)', borderBottom: '1px solid rgba(123,47,247,0.08)', padding: '10px 24px', fontSize: 12, color: 'var(--accent-purple)' }}>
                👤 Nhân viên: <strong>{wizardEmp.name}</strong> (ID: {wizardEmp.id})
              </div>
            )}
            <div className="card-body" style={{ padding: 32 }}>
              <form onSubmit={saveDiv} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <label style={labelStyle}>Employee ID *</label>
                  <input type="number" className="cyber-input" required value={divForm.EmployeeID||''} readOnly={!!wizardStep} onChange={e => setDivForm({...divForm, EmployeeID: e.target.value})} style={{...inputStyle, ...(wizardStep ? {opacity:0.6,cursor:'not-allowed'}:{})}} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Amount ($) *</label>
                    <input type="number" className="cyber-input" required value={divForm.DividendAmount||''} onChange={e => setDivForm({...divForm, DividendAmount: e.target.value})} style={inputStyle} placeholder="0.00" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <label style={labelStyle}>Date *</label>
                    <input type="date" className="cyber-input" required value={divForm.DividendDate||''} onChange={e => setDivForm({...divForm, DividendDate: e.target.value})} style={inputStyle} />
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 16, marginTop: 24, paddingTop: 24, borderTop: '1px solid rgba(123,47,247,0.08)' }}>
                  <button type="button" className="btn-delete" onClick={wizardStep === 'dividend' ? cancelWizardDiv : () => setDivModal(false)} style={{ padding: '12px 24px', borderRadius: 999 }}>
                    <FiX style={{ marginRight: 6 }} /> {wizardStep === 'dividend' ? 'Skip (Hủy wizard)' : 'Cancel'}
                  </button>
                  <button type="submit" className="btn-primary" disabled={loading} style={{ padding: '12px 32px', borderRadius: 999 }}>
                    <FiSave style={{ marginRight: 6 }} /> {divForm.DividendID ? 'Save Changes' : (wizardStep === 'dividend' ? 'Hoàn tất ✅' : 'Add Dividend')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}