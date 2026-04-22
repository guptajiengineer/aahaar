import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import NotificationDrawer from './NotificationDrawer';

export default function Navbar({ showNav = true }) {
  const { user, logout } = useAuth();
  const { unreadCount } = useSocket();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const bellRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    if (showNotifications) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const dashboardLink = user
    ? `/${user.role === 'donor' ? 'donor' : user.role === 'ngo' ? 'ngo' : user.role}`
    : '/dashboard';

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to={user ? dashboardLink : '/'} className="navbar-logo">
          aahaar<span>.</span>
        </Link>

        <div className="navbar-actions">
          {!user ? (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Sign up</Link>
            </>
          ) : (
            <>
              <div ref={bellRef} style={{ position: 'relative' }}>
                <button
                  className="btn-icon"
                  style={{ position: 'relative', background: 'transparent', border: 'none', fontSize: '1.2rem', padding: 'var(--space-2)' }}
                  onClick={() => setShowNotifications(p => !p)}
                  aria-label="Notifications"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 2, right: 2,
                        background: 'var(--accent)',
                        color: '#fff',
                        borderRadius: 'var(--radius-full)',
                        padding: '0 4px',
                        fontSize: '0.65rem',
                        fontWeight: 600,
                        minWidth: 16, textAlign: 'center'
                      }}
                    >
                      {unreadCount}
                    </span>
                  )}
                </button>
                <NotificationDrawer isOpen={showNotifications} onClose={() => setShowNotifications(false)} />
              </div>
              <span className="text-muted text-sm" style={{ display: 'none' }}>
                {/* Mobile: handled by sidebar */}
              </span>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">
                Log out
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
