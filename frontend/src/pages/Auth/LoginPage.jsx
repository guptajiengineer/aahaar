import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// Real email/password login is replaced with a name + role picker.
// No API calls are made. To restore real auth, revert this file and AuthContext.jsx.
// ──────────────────────────────────────────────────────────────────────────────

const ROLES = [
  { value: 'donor',     label: '🍱 Donor',     desc: 'Donate surplus food' },
  { value: 'ngo',       label: '🏢 NGO',        desc: 'Collect & distribute food' },
  { value: 'volunteer', label: '🙋 Volunteer',  desc: 'Help with deliveries' },
  { value: 'admin',     label: '⚙️ Admin',      desc: 'Manage the platform' },
];

export default function LoginPage() {
  const [name, setName]   = useState('');
  const [role, setRole]   = useState('donor');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await login(name.trim() || 'Demo User', role);
    navigate('/dashboard');
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
      <div style={{ width: '100%', maxWidth: '420px' }}>
        {/* Logo */}
        <Link to="/" className="navbar-logo" style={{ display: 'block', marginBottom: 'var(--space-8)' }}>
          aahaar<span>.</span>
        </Link>

        <h1 className="text-2xl font-semi" style={{ marginBottom: 'var(--space-2)' }}>
          Demo Login
        </h1>
        <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-8)' }}>
          Enter any name and pick a role to explore the platform.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          {/* Name field */}
          <div className="form-group">
            <label className="form-label" htmlFor="demo-name">Your Name</label>
            <input
              id="demo-name"
              type="text"
              className="form-input"
              placeholder="e.g. Arjun Gupta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              autoComplete="off"
            />
          </div>

          {/* Role picker */}
          <div className="form-group">
            <label className="form-label">Login As</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {ROLES.map((r) => (
                <label
                  key={r.value}
                  htmlFor={`role-${r.value}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3) var(--space-4)',
                    borderRadius: 'var(--radius-md)',
                    border: `2px solid ${role === r.value ? 'var(--color-primary)' : 'var(--color-border)'}`,
                    background: role === r.value ? 'var(--color-primary-subtle, rgba(var(--color-primary-rgb, 210,105,30), 0.08))' : 'transparent',
                    cursor: 'pointer',
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  <input
                    id={`role-${r.value}`}
                    type="radio"
                    name="role"
                    value={r.value}
                    checked={role === r.value}
                    onChange={() => setRole(r.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '1.25rem' }}>{r.label.split(' ')[0]}</span>
                  <span>
                    <strong style={{ display: 'block', fontSize: '0.875rem' }}>{r.label.split(' ').slice(1).join(' ')}</strong>
                    <span className="text-muted" style={{ fontSize: '0.75rem' }}>{r.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading}
          >
            {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Enter Demo →'}
          </button>
        </form>

        {/* Subtle note */}
        <p className="text-sm text-center text-muted" style={{ marginTop: 'var(--space-6)' }}>
          🔒 Auth is disabled for demo. No data is saved.
        </p>
      </div>
    </div>
  );
}
