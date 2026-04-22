import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { showToast } from '../../components/common/Toast';
import { ToastContainer } from '../../components/common/Toast';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (!user.isVerified) {
        navigate('/verify-email', { state: { userId: user._id } });
        return;
      }
      if (!user.isApproved) {
        navigate('/pending-approval');
        return;
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
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
          Welcome back
        </h1>
        <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-8)' }}>
          Log in to continue making an impact.
        </p>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email</label>
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

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <div style={{ textAlign: 'right' }}>
              <Link
                to="/forgot-password"
                className="text-sm text-primary"
                style={{ textDecoration: 'underline' }}
              >
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-center text-muted" style={{ marginTop: 'var(--space-6)' }}>
          Don't have an account?{' '}
          <Link to="/signup" className="text-primary font-semi">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
