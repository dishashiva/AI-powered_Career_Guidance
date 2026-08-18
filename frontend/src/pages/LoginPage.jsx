import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../api/client';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Brain, AlertCircle, KeyRound, CheckCircle2, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Forgot password modal state
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [sendingReset, setSendingReset] = useState(false);
  const [resetSentInfo, setResetSentInfo] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const loggedUser = await login(form.email.trim().toLowerCase(), form.password.trim());
      toast.success('Welcome back!');
      if (loggedUser?.is_admin) {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSendReset = async (e) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      toast.error('Please enter your email address');
      return;
    }
    setSendingReset(true);
    try {
      const res = await authAPI.forgotPassword(forgotEmail.trim());
      setResetSentInfo(res.data);
      toast.success('Password reset link generated!');
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to send reset link';
      toast.error(msg);
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: 420, padding: '32px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 'var(--radius-md)',
            background: 'var(--accent)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 4px 12px rgba(79,70,229,0.3)',
          }}>
            <Brain size={22} color="#fff" />
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Welcome back</h1>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Sign in to your career intelligence account</p>
        </div>

        {errorMsg && (
          <div style={{
            padding: '12px 14px',
            borderRadius: 8,
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#991b1b',
            fontSize: 13,
            lineHeight: 1.4,
            marginBottom: 16,
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
          }}>
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1, color: '#dc2626' }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{errorMsg}</div>
              {errorMsg.toLowerCase().includes('password') && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotEmail(form.email);
                    setForgotModal(true);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: '6px 0 0 0',
                    color: '#2563eb',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  Click here to reset your password via email link
                </button>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="input-group">
            <label className="input-label">Email Address *</label>
            <div style={{ position: 'relative' }}>
              <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                style={{ paddingLeft: 36 }}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <label className="input-label" style={{ margin: 0 }}>Password *</label>
              <button
                type="button"
                onClick={() => {
                  setForgotEmail(form.email);
                  setForgotModal(true);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--accent)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Forgot password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                className="input"
                type={showPw ? 'text' : 'password'}
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                style={{ paddingLeft: 36, paddingRight: 36 }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4, width: '100%' }}>
            {loading ? <><div className="spinner" /> Signing in...</> : <>Sign in <ArrowRight size={15} /></>}
          </button>
        </form>

        <div className="divider" />
        <p style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-secondary)', margin: 0 }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: 'var(--accent)', fontWeight: 600 }}>Create one</Link>
        </p>
      </div>

      {/* Forgot Password Modal */}
      {forgotModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
        }}>
          <div className="card" style={{ maxWidth: 440, width: '100%', padding: 26, background: '#fff' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ padding: 8, borderRadius: 8, background: '#e0e7ff', color: '#4338ca' }}>
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Reset Your Password</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, marginTop: 2 }}>
                    We'll send a password reset link to your email
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setForgotModal(false); setResetSentInfo(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
              >
                <X size={18} />
              </button>
            </div>

            {resetSentInfo ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center', padding: '10px 0' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: '50%', background: '#ecfdf5', color: '#059669',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto',
                }}>
                  <CheckCircle2 size={26} />
                </div>
                <div>
                  <h4 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px 0', color: '#065f46' }}>
                    Password Reset Email Sent
                  </h4>
                  <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                    If an account exists for <strong>{forgotEmail}</strong>, we have sent a secure password reset link to your email inbox.
                  </p>
                </div>
                <div style={{ padding: 12, borderRadius: 8, background: '#f8fafc', border: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)' }}>
                  📩 <strong>Check your email inbox</strong> and click the reset link to choose a new password.
                </div>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => { setForgotModal(false); setResetSentInfo(null); }}
                  style={{ marginTop: 4 }}
                >
                  Done & Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendReset} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>
                    Registered Email Address *
                  </label>
                  <input
                    className="input"
                    type="email"
                    placeholder="Enter your registered email address"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setForgotModal(false)}
                    disabled={sendingReset}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm"
                    disabled={sendingReset}
                    style={{ gap: 6 }}
                  >
                    {sendingReset ? <div className="spinner" /> : <Mail size={14} />}
                    {sendingReset ? 'Sending Reset Link...' : 'Send Password Reset Link'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
