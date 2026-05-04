import { useState, useEffect } from 'react';
import { FiShield, FiUser, FiCheckCircle } from 'react-icons/fi';
import { api } from '../api';

export default function AccountManagement() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const currentUser = (() => { try { return JSON.parse(localStorage.getItem('auth_user')||'{}'); } catch { return {}; } })();

  const loadUsers = async () => {
    setLoading(true);
    const res = await api.getUsers();
    if (res.data) setUsers(res.data);
    setLoading(false);
  };

  useEffect(() => { loadUsers(); }, []);

  const handleRoleToggle = async (userId: number, currentRole: string) => {
    if (!confirm('Are you sure you want to change this user\'s permissions?')) return;
    const newRole = currentRole.toLowerCase() === 'admin' ? 'viewer' : 'admin';
    const res = await api.updateUserRole(userId, newRole);
    if (!res.error) {
      await loadUsers();
    } else {
      alert('Failed to update role: ' + res.error);
    }
  };

  if (currentUser.role?.toLowerCase() !== 'admin') {
    return <div className="card glass" style={{ padding: 40, textAlign: 'center', color: 'var(--accent-red)' }}><h3>Access Denied. Admins only.</h3></div>;
  }

  return (
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
                  <td className="table-cell" style={{ padding: 16, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FiUser color="var(--accent-cyan)"/> {u.username}
                    {currentUser.username === u.username && <span style={{ fontSize: 10, background: 'rgba(74,222,128,0.15)', color: 'var(--accent-green)', padding: '2px 6px', borderRadius: 4 }}>YOU</span>}
                  </td>
                  <td className="table-cell" style={{ padding: 16, color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td className="table-cell" style={{ padding: 16 }}>
                    <span className={`status-badge ${u.role.toLowerCase() === 'admin' ? 'online' : 'offline'}`}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td className="table-cell" style={{ padding: 16, textAlign: 'right' }}>
                    <button 
                      className={u.role.toLowerCase() === 'admin' ? 'btn-delete' : 'btn-primary'}
                      onClick={() => handleRoleToggle(u.id, u.role)}
                      disabled={currentUser.username === u.username}
                      style={{ padding: '6px 12px', fontSize: 12, borderRadius: 6, opacity: currentUser.username === u.username ? 0.5 : 1 }}
                    >
                      {u.role.toLowerCase() === 'admin' ? 'Demote to Viewer' : 'Promote to Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
