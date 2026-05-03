import { useState } from 'react';
import { FiZap, FiUser, FiDatabase, FiFileText } from 'react-icons/fi';
import { api } from '../api';
import type { AuthResponse } from '../api';

/* ── Types ───────────────────────────────────────────────────────── */
interface AuthPageProps {
  onLoginSuccess: (data: AuthResponse) => void;
}

/* ── Component ───────────────────────────────────────────────────── */
export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Login fields
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [loginUserErr, setLoginUserErr] = useState('');
  const [loginPassErr, setLoginPassErr] = useState('');

  // Register fields
  const [regUser, setRegUser] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass, setRegPass] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [regUserErr, setRegUserErr] = useState('');
  const [regEmailErr, setRegEmailErr] = useState('');
  const [regPassErr, setRegPassErr] = useState('');
  const [regConfirmErr, setRegConfirmErr] = useState('');

  // Password visibility
  const [showLoginPwd, setShowLoginPwd] = useState(false);
  const [showRegPwd, setShowRegPwd] = useState(false);

  /* ── Password strength ─────────────────────────────────────────── */
  const getStrength = (val: string) => {
    let s = 0;
    if (val.length >= 6) s++;
    if (/[A-Z]/.test(val)) s++;
    if (/[0-9]/.test(val)) s++;
    if (/[^a-zA-Z0-9]/.test(val)) s++;
    return s;
  };
  const strengthColors = ['#ef4444', '#f59e0b', '#22c55e', '#10b981'];
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong'];
  const strength = getStrength(regPass);

  /* ── Clear helpers ─────────────────────────────────────────────── */
  const clearLoginErrors = () => { setLoginUserErr(''); setLoginPassErr(''); setError(null); };
  const clearRegErrors = () => { setRegUserErr(''); setRegEmailErr(''); setRegPassErr(''); setRegConfirmErr(''); setError(null); };

  /* ── Login ─────────────────────────────────────────────────────── */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginErrors();
    let hasErr = false;
    if (!loginUser.trim()) { setLoginUserErr('Vui lòng nhập tên người dùng'); hasErr = true; }
    if (!loginPass) { setLoginPassErr('Vui lòng nhập mật khẩu'); hasErr = true; }
    if (hasErr) return;

    setLoading(true);
    const result = await api.login({ username: loginUser.trim(), password: loginPass });
    setLoading(false);

    if (result.error) {
      if (result.error.includes('User not found')) {
        setLoginUserErr('Tên người dùng không tồn tại');
      } else if (result.error.includes('Incorrect password') || result.error.includes('401')) {
        setLoginPassErr('Mật khẩu không chính xác');
      } else {
        setError('Connection failed. Is the backend running?');
      }
      return;
    }
    if (result.data) onLoginSuccess(result.data);
  };

  /* ── Register ──────────────────────────────────────────────────── */
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearRegErrors();
    let hasErr = false;

    if (!regUser.trim()) { setRegUserErr('Vui lòng nhập tên người dùng'); hasErr = true; }
    else if (regUser.trim().length < 3) { setRegUserErr('Tên người dùng tối thiểu 3 ký tự'); hasErr = true; }
    else if (!/^[a-zA-Z0-9_.-]+$/.test(regUser.trim())) { setRegUserErr('Tên người dùng chỉ chứa chữ cái, số, gạch dưới, chấm, gạch ngang'); hasErr = true; }

    if (!regEmail.trim()) { setRegEmailErr('Vui lòng nhập email'); hasErr = true; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(regEmail.trim())) { setRegEmailErr('Vui lòng nhập email hợp lệ'); hasErr = true; }

    if (!regPass) { setRegPassErr('Vui lòng nhập mật khẩu'); hasErr = true; }
    else if (regPass.length < 6) { setRegPassErr('Mật khẩu tối thiểu 6 ký tự'); hasErr = true; }

    if (!regConfirm) { setRegConfirmErr('Vui lòng xác nhận mật khẩu'); hasErr = true; }
    else if (regPass !== regConfirm) { setRegConfirmErr('Mật khẩu xác nhận không khớp'); hasErr = true; }

    if (hasErr) return;

    setLoading(true);
    const result = await api.register({
      username: regUser.trim(),
      email: regEmail.trim(),
      password: regPass,
      confirm_password: regConfirm,
    });
    setLoading(false);

    if (result.error) {
      if (result.error.includes('409') || result.error.includes('exists') || result.error.includes('registered')) {
        if (result.error.includes('email') || result.error.includes('Email')) {
          setRegEmailErr('Email đã được sử dụng');
        } else {
          setRegUserErr('Tên người dùng đã tồn tại');
        }
      } else if (result.error.includes('400')) {
        setRegConfirmErr('Mật khẩu xác nhận không khớp');
      } else {
        setError('Connection failed. Is the backend running?');
      }
      return;
    }

    if (result.data) {
      setSuccess('Account created successfully! Loading dashboard...');
      setTimeout(() => onLoginSuccess(result.data!), 1500);
    }
  };

  /* ── Field error component ─────────────────────────────────────── */
  const FieldError = ({ msg }: { msg: string }) =>
    msg ? (
      <div className="auth-field-error" style={{ display: 'flex' }}>
        <svg style={{ width: 14, height: 14 }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>{' '}{msg}
      </div>
    ) : null;

  /* ── Tab switch ─────────────────────────────────────────────────── */
  const switchTab = (login: boolean) => {
    setIsLogin(login);
    setError(null);
    setSuccess(null);
    clearLoginErrors();
    clearRegErrors();
  };

  /* ── JSX ────────────────────────────────────────────────────────── */
  return (
    <div className="auth-split-layout">
      {/* ── LEFT HERO ──────────────────────────────────────────── */}
      <div className="auth-hero">
        <div className="auth-hero-bg">
          <div className="auth-hero-orb auth-hero-orb-1" />
          <div className="auth-hero-orb auth-hero-orb-2" />
        </div>

        <div className="auth-hero-content">
          <div className="auth-hero-logo">
            <FiZap /> <span className="glow-text">NexusBridge</span>
          </div>
          <h1 className="auth-hero-title">Unified HR &amp; Payroll Intelligence</h1>
          <p className="auth-hero-subtitle">
            Connect HR and Payroll data into one intelligent workspace.
          </p>

          <div className="auth-hero-features">
            <div className="auth-feature">
              <span className="auth-feature-icon"><FiUser /></span>
              <span className="auth-feature-text">Employee 360 Analytics</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon"><FiDatabase /></span>
              <span className="auth-feature-text">Reconciliation Intelligence</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon"><FiFileText /></span>
              <span className="auth-feature-text">Executive Reporting</span>
            </div>
          </div>

          <div className="auth-hero-badges">
            <span className="auth-badge">SQL Server</span>
            <span className="auth-badge">MySQL</span>
            <span className="auth-badge">Secure Auth</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT AUTH PANEL ───────────────────────────────────── */}
      <div className="auth-panel">
        <div
          className="auth-card glass"
          style={{
            padding: 40,
            boxShadow: '0 0 25px rgba(0, 242, 254, 0.08), 0 10px 40px rgba(0, 0, 0, 0.4)',
          }}
        >
          <div className="auth-header">
            <h2 className="auth-title glow-text2" style={{ fontSize: 28 }}>
              Welcome back
            </h2>
            <p className="auth-subtitle">Sign in to your account to continue</p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            <button
              className={`auth-tab ${isLogin ? 'active' : ''}`}
              onClick={() => switchTab(true)}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => switchTab(false)}
            >
              Create Account
            </button>
          </div>

          {/* Alerts */}
          {error && <div className="auth-alert error"><span>⚠</span> {error}</div>}
          {success && <div className="auth-alert success"><span>✓</span> {success}</div>}

          {/* ── LOGIN FORM ─────────────────────────────────────── */}
          {isLogin ? (
            <form className="auth-form" autoComplete="off" noValidate onSubmit={handleLogin}>
              <div className="auth-group">
                <label
                  className="auth-label"
                  htmlFor="login-username"
                  style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}
                >
                  Username
                </label>
                <div className="auth-input-wrap">
                  <input
                    type="text"
                    id="login-username"
                    className={`auth-input cyber-input ${loginUserErr ? 'invalid' : loginUser ? 'valid' : ''}`}
                    placeholder="Enter username"
                    autoComplete="username"
                    value={loginUser}
                    onChange={(e) => { setLoginUser(e.target.value); setLoginUserErr(''); }}
                  />
                </div>
                <FieldError msg={loginUserErr} />
              </div>

              <div className="auth-group">
                <div className="auth-label-row">
                  <label
                    className="auth-label"
                    htmlFor="login-password"
                    style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}
                  >
                    Password
                  </label>
                  <a
                    href="#"
                    className="auth-link-small"
                    style={{ color: 'var(--accent-cyan)', transition: 'all 0.2s' }}
                    onClick={(e) => {
                      e.preventDefault();
                      setSuccess('Password reset instructions have been sent to your email (Simulated).');
                    }}
                  >
                    Forgot password?
                  </a>
                </div>
                <div className="auth-input-wrap">
                  <input
                    type={showLoginPwd ? 'text' : 'password'}
                    id="login-password"
                    className={`auth-input cyber-input ${loginPassErr ? 'invalid' : loginPass ? 'valid' : ''}`}
                    placeholder="Enter password"
                    autoComplete="current-password"
                    value={loginPass}
                    onChange={(e) => { setLoginPass(e.target.value); setLoginPassErr(''); }}
                  />
                  <button
                    type="button"
                    className="auth-toggle-pwd"
                    tabIndex={-1}
                    onClick={() => setShowLoginPwd(!showLoginPwd)}
                  >
                    {showLoginPwd ? '🙈' : '👁'}
                  </button>
                </div>
                <FieldError msg={loginPassErr} />
              </div>

              <div className="auth-options">
                <label className="auth-checkbox">
                  <input type="checkbox" /> <span>Remember me for 30 days</span>
                </label>
              </div>

              <button
                type="submit"
                className="auth-btn btn-primary"
                disabled={loading}
                style={{ width: '100%', padding: 16, borderRadius: 12, fontSize: 15, letterSpacing: 2 }}
              >
                {loading && <span className="auth-spinner" />}{' '}
                {loading ? 'SIGNING IN...' : 'SIGN IN'}
              </button>
            </form>
          ) : (
            /* ── REGISTER FORM ─────────────────────────────────── */
            <form className="auth-form" autoComplete="off" noValidate onSubmit={handleRegister}>
              <div className="auth-group">
                <label className="auth-label" htmlFor="reg-username" style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>Username</label>
                <div className="auth-input-wrap">
                  <input type="text" id="reg-username" className={`auth-input cyber-input ${regUserErr ? 'invalid' : regUser ? 'valid' : ''}`} placeholder="Choose a username" autoComplete="username" value={regUser} onChange={(e) => { setRegUser(e.target.value); setRegUserErr(''); }} />
                </div>
                <FieldError msg={regUserErr} />
              </div>

              <div className="auth-group">
                <label className="auth-label" htmlFor="reg-email" style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>Work Email</label>
                <div className="auth-input-wrap">
                  <input type="email" id="reg-email" className={`auth-input cyber-input ${regEmailErr ? 'invalid' : regEmail ? 'valid' : ''}`} placeholder="name@company.com" autoComplete="email" value={regEmail} onChange={(e) => { setRegEmail(e.target.value); setRegEmailErr(''); }} />
                </div>
                <FieldError msg={regEmailErr} />
              </div>

              <div className="auth-group">
                <label className="auth-label" htmlFor="reg-password" style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>Password</label>
                <div className="auth-input-wrap">
                  <input type={showRegPwd ? 'text' : 'password'} id="reg-password" className={`auth-input cyber-input ${regPassErr ? 'invalid' : regPass ? 'valid' : ''}`} placeholder="Create a password" autoComplete="new-password" value={regPass} onChange={(e) => { setRegPass(e.target.value); setRegPassErr(''); }} />
                  <button type="button" className="auth-toggle-pwd" tabIndex={-1} onClick={() => setShowRegPwd(!showRegPwd)}>{showRegPwd ? '🙈' : '👁'}</button>
                </div>
                <FieldError msg={regPassErr} />
                <div className="auth-strength">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="auth-strength-bar" style={{ background: i < strength ? strengthColors[i] : '#e2e8f0' }} />
                  ))}
                </div>
                <div className="auth-strength-text" style={{ color: regPass.length === 0 ? 'var(--auth-text-muted)' : strengthColors[Math.max(0, strength - 1)] }}>
                  {regPass.length === 0 ? 'Password strength' : strengthLabels[Math.max(0, strength - 1)]}
                </div>
              </div>

              <div className="auth-group">
                <label className="auth-label" htmlFor="reg-confirm" style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, fontSize: 12 }}>Confirm Password</label>
                <div className="auth-input-wrap">
                  <input type="password" id="reg-confirm" className={`auth-input cyber-input ${regConfirmErr ? 'invalid' : regConfirm ? 'valid' : ''}`} placeholder="Repeat password" autoComplete="new-password" value={regConfirm} onChange={(e) => { setRegConfirm(e.target.value); setRegConfirmErr(''); }} />
                </div>
                <FieldError msg={regConfirmErr} />
              </div>

              <button type="submit" className="auth-btn btn-primary" disabled={loading} style={{ width: '100%', padding: 16, borderRadius: 12, fontSize: 15, letterSpacing: 2 }}>
                {loading && <span className="auth-spinner" />}{' '}
                {loading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
              </button>

              <p className="auth-terms">
                By signing up, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
