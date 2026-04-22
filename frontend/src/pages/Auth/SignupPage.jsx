import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import * as authService from '../../services/authService';
import { ToastContainer } from '../../components/common/Toast';

const ROLES = [
  { value: 'donor', label: 'Donor', emoji: '🍱', desc: 'Restaurant, hotel, household, or event with surplus food' },
  { value: 'ngo', label: 'NGO', emoji: '🤝', desc: 'Organisation that collects and distributes food' },
  { value: 'volunteer', label: 'Volunteer', emoji: '🚴', desc: 'Individual who picks up and delivers food' },
];

export default function SignupPage() {
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1); // 1 = role, 2 = form
  const [role, setRole] = useState(searchParams.get('role') || '');
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', city: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (r) => {
    setRole(r);
    setStep(2);
  };

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authService.register({ ...form, role });

      // Auto-login the user since email verification is disabled
      localStorage.setItem('accessToken', data.accessToken);
      setUser(data.user);

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
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
      <div style={{ width: '100%', maxWidth: step === 1 ? '600px' : '420px' }}>
        <Link to="/" className="navbar-logo" style={{ display: 'block', marginBottom: 'var(--space-8)' }}>
          aahaar<span>.</span>
        </Link>

        {step === 1 ? (
          <>
            <h1 className="text-2xl font-semi" style={{ marginBottom: 'var(--space-2)' }}>
              I am a…
            </h1>
            <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-6)' }}>
              Choose how you'd like to participate.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              {ROLES.map((r) => (
                <button
                  key={r.value}
                  onClick={() => handleRoleSelect(r.value)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-5)',
                    padding: 'var(--space-5) var(--space-6)',
                    background: 'var(--surface)',
                    border: '1.5px solid var(--border)',
                    borderRadius: 'var(--radius-xl)',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'border-color var(--t-normal), box-shadow var(--t-normal)',
                    width: '100%',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
                >
                  <span style={{ fontSize: '2rem' }}>{r.emoji}</span>
                  <div>
                    <p className="font-semi">{r.label}</p>
                    <p className="text-sm text-muted">{r.desc}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-sm text-center text-muted" style={{ marginTop: 'var(--space-6)' }}>
              Already have an account?{' '}
              <Link to="/login" className="text-primary font-semi">Log in</Link>
            </p>
          </>
        ) : (
          <>
            <button
              onClick={() => setStep(1)}
              className="btn btn-ghost btn-sm"
              style={{ marginBottom: 'var(--space-4)', paddingLeft: 0 }}
            >
              ← Back
            </button>
            <h1 className="text-2xl font-semi" style={{ marginBottom: 'var(--space-2)' }}>
              Create your account
            </h1>
            <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-6)' }}>
              Joining as a{' '}
              <span className="font-semi text-primary">
                {ROLES.find((r) => r.value === role)?.label}
              </span>
            </p>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}
            >
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full name</label>
                <input
                  id="name" name="name" type="text"
                  className="form-input" placeholder="Your name"
                  value={form.name} onChange={handleChange} required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  id="email" name="email" type="email"
                  className="form-input" placeholder="you@example.com"
                  value={form.email} onChange={handleChange} required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone <span className="text-muted font-normal">(optional)</span></label>
                <input
                  id="phone" name="phone" type="tel"
                  className="form-input" placeholder="+91 98765 43210"
                  value={form.phone} onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="city">City</label>
                <input
                  id="city" name="city" type="text"
                  className="form-input" placeholder="Your city"
                  value={form.city} onChange={handleChange} required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  id="password" name="password" type="password"
                  className="form-input" placeholder="At least 8 characters"
                  value={form.password} onChange={handleChange} required
                  minLength={8}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading
                  ? <span className="spinner" style={{ width: 18, height: 18 }} />
                  : 'Create account'}
              </button>
            </form>

            <p className="text-xs text-muted text-center" style={{ marginTop: 'var(--space-4)' }}>
              {role === 'donor' || role === 'ngo'
                ? 'Your account will be reviewed by our team before you go live.'
                : 'You can start using Aahaar right away.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
