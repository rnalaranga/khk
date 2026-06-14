import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function Login({ onLogin, addToast }) {
  const [isLogin, setIsLogin] = useState(true);
  const [verifyMode, setVerifyMode] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '', code: '' });
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (verifyMode) {
        const res = await fetch(`/api/auth/verify-code`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, code: form.code })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Verification failed');

        if (addToast) addToast(data.message, 'success');
        localStorage.setItem('token', data.token);
        if (onLogin) onLogin(data.user);
        navigate(redirect);
        return;
      }

      if (!isLogin && form.password !== form.confirmPassword) {
        if (addToast) addToast("Passwords don't match!", 'error');
        else console.error("Passwords don't match!");
        return;
      }

      const url = isLogin ? `/api/auth/login` : `/api/auth/register`;
      const body = isLogin 
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Auth failed');

      if (!isLogin) {
        if (addToast) addToast(data.message, 'success');
        setVerifyMode(true); // Switch to verification view instead of login view
      } else {
        localStorage.setItem('token', data.token);
        if (onLogin) onLogin(data.user);
        navigate(redirect);
      }
    } catch (error) {
      if (addToast) addToast(error.message, 'error');
      else console.error(error.message);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="KHK Logo" style={{ height: '48px', width: 'auto', marginBottom: '8px' }} />
        </div>
        <h1 className="auth-title">
          {verifyMode ? 'Verify Email' : isLogin ? 'Sign In' : 'Create Account'}
        </h1>
        <p className="auth-subtitle">
          {verifyMode ? 'Enter the 6-digit code sent to your email.' : isLogin ? 'Welcome back to KHK Auto Parts' : 'Join us for premium auto parts'}
        </p>

        <form onSubmit={handleSubmit}>
          {verifyMode ? (
            <div className="form-group">
              <label className="form-label">Verification Code</label>
              <input required type="text" className="form-input" placeholder="123456" value={form.code} onChange={e => update('code', e.target.value)} style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }} />
            </div>
          ) : (
            <>
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input required type="text" className="form-input" placeholder="Kasun Perera" value={form.name} onChange={e => update('name', e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input required type="email" className="form-input" placeholder="name@example.com" value={form.email} onChange={e => update('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input required type="password" className="form-input" placeholder="••••••••" value={form.password} onChange={e => update('password', e.target.value)} />
              </div>
              {!isLogin && (
                <div className="form-group">
                  <label className="form-label">Confirm Password</label>
                  <input required type="password" className="form-input" placeholder="••••••••" value={form.confirmPassword} onChange={e => update('confirmPassword', e.target.value)} />
                </div>
              )}
            </>
          )}

          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            {verifyMode ? 'Verify & Login' : isLogin ? 'Sign In' : 'Create Account'}
            <ArrowRight size={20} />
          </button>
        </form>

        {!verifyMode && (
          <div style={{ marginTop: 24, textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <hr style={{ flex: 1, borderColor: 'var(--border)', borderTop: 'none', margin: 0 }} />
              <span style={{ color: 'var(--muted)', fontSize: '0.8rem', fontWeight: 'bold' }}>OR</span>
              <hr style={{ flex: 1, borderColor: 'var(--border)', borderTop: 'none', margin: 0 }} />
            </div>
            <button 
              type="button" 
              className="btn-outline" 
              onClick={() => setIsLogin(!isLogin)}
              style={{ width: '100%', display: 'flex', justifyContent: 'center' }}
            >
              {isLogin ? "Create New Account" : "Sign In to Existing Account"}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
