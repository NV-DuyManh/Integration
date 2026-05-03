import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/MainLayout';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import Employee360 from './pages/Employee360';
import Reconciliation from './pages/Reconciliation';
import Reports from './pages/Reports';
import type { AuthResponse } from './api';

export default function App() {
  /* ── Auth state ─────────────────────────────────────────────────── */
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem('auth_token')
  );
  const [user, setUser] = useState<{ username: string; role: string; email: string } | null>(
    () => {
      const stored = localStorage.getItem('auth_user');
      if (stored) {
        try { return JSON.parse(stored); } catch { /* invalid */ }
      }
      return null;
    }
  );

  const isAuthenticated = !!token && !!user;

  /* ── Sync body class for auth-mode CSS overrides ────────────────── */
  useEffect(() => {
    if (isAuthenticated) {
      document.body.classList.remove('auth-mode');
    } else {
      document.body.classList.add('auth-mode');
    }
  }, [isAuthenticated]);

  /* ── Login success handler ──────────────────────────────────────── */
  const handleLoginSuccess = (data: AuthResponse) => {
    const userData = { username: data.username, role: data.role, email: data.email };
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(userData));
    setToken(data.token);
    setUser(userData);
  };

  /* ── Logout handler (used by Header later) ──────────────────────── */
  // Will be wired properly via context in a future step

  /* ── If not authenticated, show auth page ───────────────────────── */
  if (!isAuthenticated) {
    return <AuthPage onLoginSuccess={handleLoginSuccess} />;
  }

  /* ── Authenticated layout ───────────────────────────────────────── */
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Default redirect */}
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Functional pages */}
          <Route path="/employee360" element={<Employee360 />} />
          <Route path="/reconciliation" element={<Reconciliation />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/management" element={<div className="p-10 glow-text text-3xl font-bold">Data Management — coming soon</div>} />
          <Route path="/api-explorer" element={<div className="p-10 glow-text text-3xl font-bold">API Explorer — coming soon</div>} />
          <Route path="/settings" element={<div className="p-10 glow-text text-3xl font-bold">Settings — coming soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}