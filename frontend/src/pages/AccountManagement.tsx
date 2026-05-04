import React, { useState, useEffect } from 'react';
import { FiUser, FiMail, FiShield, FiKey, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { api } from '../api';

const AccountManagement = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modal, setModal] = useState<{type: 'role' | 'delete' | 'reset' | null, user: any | null}>({ type: null, user: null });
  const [newPass, setNewPass] = useState('');

  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('auth_user')||'{}'); } catch { return {}; } })();

  const loadUsers = async () => {
    setLoading(true);
    const res = await api.getUsers();
    if (res.data) setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleAction = async () => {
    const { type, user } = modal;
    if (!user) return;

    if (type === 'role') {
      const newRole = user.role.toLowerCase() === 'editor' ? 'viewer' : 'editor';
      const res = await api.updateUserRole(user.id, newRole);
      if (!res.error) await loadUsers();
    } else if (type === 'delete') {
      const res = await api.deleteUser(user.id);
      if (!res.error) await loadUsers();
    } else if (type === 'reset') {
      if (!newPass) return;
      const res = await api.adminResetPassword(user.id, newPass);
      if (!res.error) setNewPass('');
    }
    setModal({ type: null, user: null });
  };

  return (
    <div className="fade-in" style={{ padding: '24px' }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="glow-text" style={{ fontSize: 28, marginBottom: 8 }}>Access Control</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Manage system-wide authentication and privilege levels.</p>
      </div>

      <div className="card glass" style={{ borderRadius: 24, padding: '8px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 4px' }}>
          <thead>
            <tr style={{ color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600, width: '80px' }}>ID</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>User Identity</th>
              <th style={{ padding: '16px', textAlign: 'left', fontWeight: 600 }}>Contact info</th>
              <th style={{ padding: '16px', textAlign: 'center', fontWeight: 600, width: '120px' }}>Status</th>
              <th style={{ padding: '16px', textAlign: 'right', fontWeight: 600, width: '280px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="table-row-hover">
                <td className="mono" style={{ padding: '12px 16px', color: 'var(--accent-cyan)', fontSize: 12 }}>#{u.id}</td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ 
                      width: 42, height: 42, borderRadius: 12, 
                      background: 'rgba(0,242,254,0.05)', border: '1px solid rgba(0,242,254,0.15)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center' 
                    }}>
                      <FiUser size={20} color="var(--accent-cyan)" />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>{u.username}</div>
                      {currentUser.username === u.username && <span style={{ fontSize: 9, color: 'var(--accent-green)', fontWeight: 800 }}>CURRENT SESSION</span>}
                    </div>
                  </div>
                </td>
                <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: 13 }}>{u.email}</td>
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <span className={`status-badge ${u.role.toLowerCase() === 'admin' ? 'online' : u.role.toLowerCase() === 'editor' ? 'warning' : 'offline'}`}
                        style={{ fontSize: 10, padding: '6px 14px', borderRadius: 20, minWidth: 90, display: 'inline-block' }}>
                    {u.role.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 10 }}>
                    <button 
                      onClick={() => setModal({ type: 'reset', user: u })}
                      style={{ background: 'rgba(0,242,254,0.05)', border: '1px solid rgba(0,242,254,0.1)', color: 'var(--accent-cyan)', width: 38, height: 38, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Reset Password"
                    >
                      <FiKey size={16} />
                    </button>

                    <button 
                      className={u.role.toLowerCase() === 'editor' ? 'btn-delete' : 'btn-primary'}
                      onClick={() => setModal({ type: 'role', user: u })}
                      disabled={u.username === 'admin' || u.username === currentUser.username}
                      style={{ 
                        width: 140, height: 38, borderRadius: 10, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
                        opacity: (u.username === 'admin' || u.username === currentUser.username) ? 0.2 : 1
                      }}
                    >
                      {u.role.toLowerCase() === 'editor' ? 'DEMOTE' : 'PROMOTE'}
                    </button>

                    <button 
                      onClick={() => setModal({ type: 'delete', user: u })}
                      disabled={u.username === 'admin' || u.username === currentUser.username}
                      style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', color: '#ef4444', width: 38, height: 38, borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: (u.username === 'admin' || u.username === currentUser.username) ? 0.2 : 1 }}
                      title="Delete User"
                    >
                      <FiTrash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal.type && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div className="card glass fade-in" style={{ padding: 40, width: '100%', maxWidth: 440, borderRadius: 32, border: '1px solid rgba(255,255,255,0.12)', textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
            <div style={{ 
              width: 72, height: 72, borderRadius: 24, 
              background: modal.type === 'delete' ? 'rgba(239,68,68,0.1)' : 'rgba(0,242,254,0.1)',
              color: modal.type === 'delete' ? '#ef4444' : 'var(--accent-cyan)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', fontSize: 32
            }}>
              {modal.type === 'delete' ? <FiAlertTriangle /> : modal.type === 'reset' ? <FiKey /> : <FiShield />}
            </div>
            
            <h3 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#fff' }}>
              {modal.type === 'delete' ? 'Terminate Account' : modal.type === 'reset' ? 'Security Reset' : 'Role Update'}
            </h3>
            
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
              {modal.type === 'delete' 
                ? `This action is irreversible. All data for user "${modal.user.username}" will be wiped.`
                : modal.type === 'reset' 
                ? `Specify a new authentication key for user "${modal.user.username}".`
                : `Are you sure you want to change access permissions for "${modal.user.username}"?`
              }
            </p>

            {modal.type === 'reset' && (
              <div style={{ marginBottom: 32 }}>
                <input 
                  type="password" 
                  className="auth-input cyber-input" 
                  placeholder="NEW PASSCODE" 
                  value={newPass}
                  onChange={e => setNewPass(e.target.value)}
                  style={{ textAlign: 'center', fontSize: 20, letterSpacing: 6, borderRadius: 16, height: 56 }}
                />
              </div>
            )}

            <div style={{ display: 'flex', gap: 16 }}>
              <button 
                onClick={() => { setModal({ type: null, user: null }); setNewPass(''); }}
                style={{ flex: 1, padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}
              >
                ABORT
              </button>
              <button 
                onClick={handleAction}
                className={modal.type === 'delete' ? 'btn-delete' : 'btn-primary'}
                style={{ flex: 1, padding: '16px', borderRadius: 16, border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 14 }}
              >
                PROCEED
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountManagement;
