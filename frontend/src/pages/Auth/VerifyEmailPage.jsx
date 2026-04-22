import { useState, useRef } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import * as authService from '../../services/authService';
import { useAuth } from '../../context/AuthContext';

export default function VerifyEmailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const userId = location.state?.userId;

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [resent, setResent] = useState(false);
  const inputs = useRef([]);

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length === 6) {
      setOtp(paste.split(''));
      inputs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { setError('Please enter the 6-digit code'); return; }
    setError('');
    setLoading(true);
    try {
      const { data } = await authService.verifyEmail(userId, code);
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await authService.resendOTP(userId);
      setResent(true);
      setTimeout(() => setResent(false), 5000);
    } catch (err) {
      setError('Could not resend code. Try again.');
    } finally {
      setResending(false);
    }
  };

  if (!userId) {
    return (
      <div className="loading-screen">
        <p className="text-muted">No session found. <Link to="/signup" className="text-primary">Sign up</Link></p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
        <Link to="/" className="navbar-logo" style={{ display: 'block', marginBottom: 'var(--space-8)' }}>
          aahaar<span>.</span>
        </Link>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📬</div>
        <h1 className="text-2xl font-semi" style={{ marginBottom: 'var(--space-2)' }}>Check your email</h1>
        <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-8)' }}>
          We sent a 6-digit code. Enter it below.
        </p>

        {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)', textAlign: 'left' }}>{error}</div>}
        {resent && <div className="alert alert-success" style={{ marginBottom: 'var(--space-5)', textAlign: 'left' }}>Code resent!</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'center', marginBottom: 'var(--space-6)' }} onPaste={handlePaste}>
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => (inputs.current[i] = el)}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                style={{
                  width: 48, height: 56, textAlign: 'center',
                  fontSize: 'var(--text-xl)', fontWeight: 600,
                  border: '1.5px solid var(--border)', borderRadius: 'var(--radius-md)',
                  background: 'var(--bg)', color: 'var(--text)', outline: 'none',
                  fontFamily: 'var(--font)',
                  transition: 'border-color var(--t-normal)',
                  ...(digit ? { borderColor: 'var(--primary)' } : {}),
                }}
              />
            ))}
          </div>
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Verify email'}
          </button>
        </form>

        <button
          onClick={handleResend}
          className="btn btn-ghost btn-sm"
          disabled={resending}
          style={{ marginTop: 'var(--space-4)' }}
        >
          {resending ? 'Sending…' : 'Resend code'}
        </button>
      </div>
    </div>
  );
}
