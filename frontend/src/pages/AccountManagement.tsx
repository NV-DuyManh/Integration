import { useState, useEffect } from 'react';
import { FiShield, FiUser, FiCheckCircle, FiKey, FiTrash2 } from 'react-icons/fi';
import { api } from '../api';

export default function AccountManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, userId: number | null, currentRole: string}>({ isOpen: false, userId: null, currentRole: '' });
  const [resetModal, setResetModal] = useState<{isOpen: boolean, userId: number | null, username: string, newPass: string}>({ isOpen: false, userId: null, username: '', newPass: '' });

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('auth_user')||'{}'); } catch { return {}; } })();

  const loadUsers = async () => {
    setLoading(true);
    const res = await api.getUsers();
    if (res.data) setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const openConfirmModal = (userId: number, currentRole: string) => {
    if (currentRole.toLowerCase() === 'admin') {
      alert("Cannot modify the Root Admin account.");
      return;
    }
    setConfirmModal({ isOpen: true, userId, currentRole });
  };

  const executeRoleChange = async () => {
    if (!confirmModal.userId) return;
    const newRole = confirmModal.currentRole.toLowerCase() === 'editor' ? 'viewer' : 'editor';
    const res = await api.updateUserRole(confirmModal.userId, newRole);
    if (!res.error) {
      await loadUsers();
      setConfirmModal({ isOpen: false, userId: null, currentRole: '' });
    } else {
      alert('Failed to update role: ' + res.error);
    }
  };

  const handleDelete = async (id: number, username: string) => {
    if (username === 'admin') return alert("Cannot delete Root Admin");
    if (!confirm(`Permanently delete user ${username}?`)) return;
    const res = await api.deleteUser(id);
    if (!res.error) loadUsers();
  };

  const handleAdminReset = (id: number, username: string) => {
    setResetModal({ isOpen: true, userId: id, username, newPass: '' });
  };

  const executePasswordReset = async () => {
    if (!resetModal.userId || !resetModal.newPass) return;
    const res = await api.adminResetPassword(resetModal.userId, resetModal.newPass);
    if (!res.error) {
      setResetModal({ isOpen: false, userId: null, username: '', newPass: '' });
    } else {
      alert("Error: " + res.error);
    }
  };

  if (currentUser.role?.toLowerCase() !== 'admin') {
    return <div className="card glass" style={{ padding: 40, textAlign: 'center', color: 'var(--accent-red)' }}><h3>Access Denied. Admins only.</h3></div>;
  }

  return (
    <>
      <div className="card glass fade-in" style={{ borderRadius: 'var(--radius-lg)' }}>
        <div className="card-header" style={{ background: 'linear-gradient(90deg, rgba(188,19,254,0.06), rgba(0,242,254,0.06))', borderBottom: '1px solid rgba(188,19,254,0.1)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiShield style={{ color: 'var(--accent-purple)' }}/> Account & Permissions Management</h3>
          <span className="card-badge" style={{ background: 'rgba(188,19,254,0.1)', color: 'var(--accent-purple)' }}>Admin Portal</span>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? <div className="loading-skeleton" style={{ height: 200 }} /> : (
            <table className="management-table" style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px' }}>
              <thead>
                <tr>
                  <th style={{ padding: '12px 16px', textAlign: 'left', width: '60px', color: 'var(--accent-cyan)', fontSize: 12 }}>ID</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12 }}>IDENTIFIER</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12 }}>CONTACT</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', width: '120px', fontSize: 12 }}>STATUS</th>
                  <th style={{ padding: '12px 16px', textAlign: 'center', width: '260px', fontSize: 12 }}>PRIVILEGES & ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="table-row" style={{ background: 'rgba(255,255,255,0.02)' }}>
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--text-muted)', fontSize: 12 }}>#{u.id}</td>
                    <td className="table-cell" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, rgba(0,242,254,0.1), rgba(0,242,254,0.05))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(0,242,254,0.1)' }}>
                          <FiUser size={18} color="var(--accent-cyan)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14 }}>{u.username}</div>
                          {currentUser.username === u.username && <span style={{ fontSize: 9, color: 'var(--accent-green)', letterSpacing: 1 }}>ACTIVE SESSION</span>}
                        </div>
                      </div>
                    </td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                    <td className="table-cell" style={{ padding: 16, textAlign: 'center' }}>
                      <span className={`status-badge ${u.role.toLowerCase() === 'admin' ? 'online' : u.role.toLowerCase() === 'editor' ? 'warning' : 'offline'}`}
                            style={{ fontSize: 10, padding: '4px 10px', minWidth: 80, display: 'inline-block' }}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td className="table-cell" style={{ padding: 16 }}>
                      <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0,0,0,0.2)', padding: '4px 8px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.05)', gap: 4 }}>
                          <button 
                            className="action-icon-btn"
                            onClick={() => handleAdminReset(u.id, u.username)}
                            style={{ padding: 8, background: 'none', border: 'none', color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex' }}
                            title="Reset Password"
                          >
                            <FiKey size={16} />
                          </button>
                          
                          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

                          <button 
                            className={u.role.toLowerCase() === 'editor' ? 'btn-delete' : 'btn-primary'}
                            onClick={() => openConfirmModal(u.id, u.role)}
                            disabled={currentUser.username === u.username || u.role.toLowerCase() === 'admin'}
                            style={{ 
                              width: 120, fontSize: 10, borderRadius: 6, height: 28,
                              opacity: (currentUser.username === u.username || u.role.toLowerCase() === 'admin') ? 0.3 : 1
                            }}
                          >
                            {u.role.toLowerCase() === 'editor' ? 'DEMOTE' : 'PROMOTE'}
                          </button>

                          <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />

                          <button 
                            className="action-icon-btn"
                            onClick={() => handleDelete(u.id, u.username)}
                            disabled={u.username === 'admin' || u.username === currentUser.username}
                            style={{ padding: 8, background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', opacity: (u.username === 'admin' || u.username === currentUser.username) ? 0.3 : 1 }}
                            title="Delete User"
                          >
                            <FiTrash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── CUSTOM CONFIRMATION MODAL ──────────────────────────────── */}
      {confirmModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ padding: 32, width: '100%', maxWidth: 400, borderRadius: 'var(--radius-xl)', border: '1px solid rgba(0,242,254,0.15)', textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: confirmModal.currentRole.toLowerCase() === 'editor' ? 'rgba(239,68,68,0.1)' : 'rgba(0,242,254,0.1)', color: confirmModal.currentRole.toLowerCase() === 'editor' ? 'var(--accent-red)' : 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 24 }}>
              <FiShield />
            </div>
            <h3 style={{ fontSize: 20, marginBottom: 12 }}>Confirm Role Change</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.5 }}>
              Are you sure you want to {confirmModal.currentRole.toLowerCase() === 'editor' ? <strong style={{ color: 'var(--accent-red)' }}>DEMOTE</strong> : <strong style={{ color: 'var(--accent-cyan)' }}>PROMOTE</strong>} this user? 
              <br/>This will instantly change their access permissions.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <button 
                onClick={() => setConfirmModal({ isOpen: false, userId: null, currentRole: '' })}
                style={{ padding: '10px 20px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                onClick={executeRoleChange}
                className={confirmModal.currentRole.toLowerCase() === 'editor' ? 'btn-delete' : 'btn-primary'}
                style={{ padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, border: 'none' }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CUSTOM RESET PASSWORD MODAL ──────────────────────────────── */}
      {resetModal.isOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(15px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div className="card glass fade-in" style={{ padding: 32, width: '100%', maxWidth: 400, borderRadius: 24, border: '1px solid rgba(0,242,254,0.3)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: 28, border: '1px solid rgba(0,242,254,0.2)' }}>
                <FiKey />
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Security Override</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Updating credentials for <span style={{ color: 'var(--accent-cyan)' }}>{resetModal.username}</span></p>
            </div>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 11, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 8, marginLeft: 4 }}>New Password</label>
              <input 
                type="password" 
                className="auth-input cyber-input" 
                placeholder="••••••••" 
                autoFocus
                value={resetModal.newPass} 
                onChange={e => setResetModal({...resetModal, newPass: e.target.value})}
                style={{ textAlign: 'center', fontSize: 18, letterSpacing: 4 }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setResetModal({ isOpen: false, userId: null, username: '', newPass: '' })}
                style={{ flex: 1, padding: '12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}
              >
                Cancel
              </button>
              <button 
                onClick={executePasswordReset}
                className="btn-primary"
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}
              >
                Update Key
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
