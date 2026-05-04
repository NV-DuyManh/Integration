import { useState, useEffect } from 'react';
import { FiShield, FiUser, FiCheckCircle } from 'react-icons/fi';
import { api } from '../api';

export default function AccountManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Custom Modal State
  const [confirmModal, setConfirmModal] = useState<{isOpen: boolean, userId: number | null, currentRole: string}>({ isOpen: false, userId: null, currentRole: '' });

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
    
    // Toggle between 'viewer' and 'editor'
    const newRole = confirmModal.currentRole.toLowerCase() === 'editor' ? 'viewer' : 'editor';
    const res = await api.updateUserRole(confirmModal.userId, newRole);
    
    if (!res.error) {
      await loadUsers();
      setConfirmModal({ isOpen: false, userId: null, currentRole: '' });
    } else {
      alert('Failed to update role: ' + res.error);
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
            <table className="data-table" style={{ width: '100%' }}>
              <thead className="table-header">
                <tr>
                  <th style={{ padding: 16 }}>ID</th>
                  <th style={{ padding: 16 }}>Username</th>
                  <th style={{ padding: 16 }}>Email</th>
                  <th style={{ padding: 16 }}>Current Role</th>
                  <th style={{ padding: 16, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="table-row">
                    <td className="table-cell mono" style={{ padding: 16, color: 'var(--text-muted)' }}>{u.id}</td>
                    
                    <td className="table-cell" style={{ padding: 16, fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <FiUser color="var(--accent-cyan)"/> {u.username}
                        {currentUser.username === u.username && <span style={{ fontSize: 10, background: 'rgba(74,222,128,0.15)', color: 'var(--accent-green)', padding: '2px 6px', borderRadius: 4 }}>YOU</span>}
                      </div>
                    </td>
                    <td className="table-cell" style={{ padding: 16, color: 'var(--text-secondary)' }}>{u.email}</td>
                    <td className="table-cell" style={{ padding: 16 }}>
                      <span className={`status-badge ${u.role.toLowerCase() === 'admin' ? 'online' : u.role.toLowerCase() === 'editor' ? 'warning' : 'offline'}`}
                            style={u.role.toLowerCase() === 'editor' ? { color: 'var(--accent-yellow)', border: '1px solid rgba(250,204,21,0.3)', background: 'rgba(250,204,21,0.1)' } : {}}>
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                  <td className="table-cell" style={{ padding: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button 
                        className={u.role.toLowerCase() === 'editor' ? 'btn-delete' : 'btn-primary'}
                        onClick={() => openConfirmModal(u.id, u.role)}
                        disabled={currentUser.username === u.username || u.role.toLowerCase() === 'admin'}
                        style={{ 
                          width: 170,
                          padding: '10px 0',
                          fontSize: 12, 
                          borderRadius: 8, 
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          textTransform: 'uppercase', 
                          letterSpacing: '1px', 
                          fontWeight: 700,
                          transition: 'all 0.3s ease',
                          opacity: (currentUser.username === u.username || u.role.toLowerCase() === 'admin') ? 0.5 : 1,
                          cursor: (currentUser.username === u.username || u.role.toLowerCase() === 'admin') ? 'not-allowed' : 'pointer'
                        }}
                      >
                        {u.role.toLowerCase() === 'editor' ? 'Demote to Viewer' : 'Promote to Editor'}
                      </button>
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
    </>
  );
}
