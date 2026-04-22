import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PendingApprovalPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-6)' }}>
      <div style={{ maxWidth: '480px', textAlign: 'center' }}>
        <div style={{ fontSize: '3.5rem', marginBottom: 'var(--space-5)' }}>⏳</div>
        <h1 className="text-2xl font-semi" style={{ marginBottom: 'var(--space-3)' }}>
          Your account is being reviewed
        </h1>
        <p className="text-muted" style={{ marginBottom: 'var(--space-6)', lineHeight: 1.7 }}>
          Hi <strong>{user?.name?.split(' ')[0]}</strong>, our team reviews every{' '}
          {user?.role} account before it goes live. This usually takes under 24 hours.
          You'll get an email once you're approved.
        </p>
        <div className="card-flat" style={{ marginBottom: 'var(--space-6)', textAlign: 'left' }}>
          <p className="text-sm text-muted">While you wait, make sure you have:</p>
          <ul style={{ marginTop: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {(user?.role === 'donor'
              ? ['Your business registration details ready', 'A photo of your establishment (optional but helpful)', 'Your operating hours']
              : ['Your NGO registration certificate', 'Your service area clearly defined', 'Contact details for your field coordinator']
            ).map((item) => (
              <li key={item} className="text-sm flex items-center gap-2">
                <span style={{ color: 'var(--primary)' }}>✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>
        <button onClick={handleLogout} className="btn btn-outline">
          Log out
        </button>
      </div>
    </div>
  );
}
