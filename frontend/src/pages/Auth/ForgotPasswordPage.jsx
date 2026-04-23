import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../../services/authService';
import { ToastContainer } from '../../components/common/Toast';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
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

        {sent ? (
          <div>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-4)' }}>📬</div>
            <h1 className="text-2xl font-semi" style={{ marginBottom: 'var(--space-2)' }}>
              Check your inbox
            </h1>
            <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-6)' }}>
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
              Check your spam folder if you don't see it within a few minutes.
            </p>
            <Link to="/login" className="btn btn-primary btn-full">
              Back to log in
            </Link>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-semi" style={{ marginBottom: 'var(--space-2)' }}>
              Forgot password?
            </h1>
            <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-8)' }}>
              Enter your email and we'll send you a reset link.
            </p>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Send reset link'}
              </button>
            </form>

            <p className="text-sm text-center text-muted" style={{ marginTop: 'var(--space-6)' }}>
              Remember it?{' '}
              <Link to="/login" className="text-primary font-semi">Log in</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
