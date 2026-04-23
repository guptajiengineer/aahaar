import { useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { resetPassword } from '../../services/authService';
import { ToastContainer } from '../../components/common/Toast';

export default function ResetPasswordPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, form.password);
      navigate('/login', { state: { message: 'Password reset successfully. Please log in.' } });
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired reset link. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-6)',
      }}
    >
      <ToastContainer />
      <div style={{ width: '100%', maxWidth: '420px' }}>
        <Link to="/" className="navbar-logo" style={{ display: 'block', marginBottom: 'var(--space-8)' }}>
          aahaar<span>.</span>
        </Link>

        <h1 className="text-2xl font-semi" style={{ marginBottom: 'var(--space-2)' }}>
          Set new password
        </h1>
        <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-8)' }}>
          Choose a strong password — at least 8 characters.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
            {error}{' '}
            {error.includes('expired') && (
              <Link to="/forgot-password" className="text-primary font-semi">
                Request a new link →
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="password">New password</label>
            <input
              id="password"
              name="password"
              type="password"
              className="form-input"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={handleChange}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="confirm">Confirm new password</label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              className="form-input"
              placeholder="Repeat your new password"
              value={form.confirm}
              onChange={handleChange}
              required
              autoComplete="new-password"
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Reset password'}
          </button>
        </form>

        <p className="text-sm text-center text-muted" style={{ marginTop: 'var(--space-6)' }}>
          <Link to="/login" className="text-primary font-semi">← Back to log in</Link>
        </p>
      </div>
    </div>
  );
}
