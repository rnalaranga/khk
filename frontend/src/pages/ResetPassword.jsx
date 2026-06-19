import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function ResetPassword({ addToast }) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const id = searchParams.get('id');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      if (addToast) addToast("Passwords do not match", "error");
      return;
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error resetting password');
      
      if (addToast) addToast("Password reset successfully. You can now login.", "success");
      navigate('/login');
    } catch (err) {
      if (addToast) addToast(err.message, "error");
    }
  };

  if (!token || !id) {
    return (
      <section className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1 className="auth-title">Invalid Link</h1>
          <p className="auth-subtitle">The reset link is malformed or missing parameters.</p>
          <button onClick={() => navigate('/login')} className="btn-primary" style={{ marginTop: '1rem' }}>Go to Login</button>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <img src="/logo.png" alt="KHK Logo" style={{ height: '48px', width: 'auto', marginBottom: '8px' }} />
        </div>
        <h1 className="auth-title">Set New Password</h1>
        <p className="auth-subtitle">Please enter your new password below.</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input required type="password" className="form-input" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm New Password</label>
            <input required type="password" className="form-input" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8 }}>
            Reset Password <ArrowRight size={20} />
          </button>
        </form>
      </div>
    </section>
  );
}
