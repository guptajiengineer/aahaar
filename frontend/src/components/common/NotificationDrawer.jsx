import { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
import * as userService from '../../services/userService';

export default function NotificationDrawer({ isOpen, onClose }) {
  const { notifications: liveNotifications, clearUnread } = useSocket();
  const [dbNotifications, setDbNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      userService.getMyNotifications({ limit: 20 })
        .then(({ data }) => setDbNotifications(data.notifications))
        .finally(() => setLoading(false));
      clearUnread();
    }
  }, [isOpen, clearUnread]);

  if (!isOpen) return null;

  // Combine live notifications (since mount) with DB notifications, removing duplicates by ID
  const allNotifs = [...liveNotifications, ...dbNotifications].reduce((acc, curr) => {
    if (!acc.find(n => n._id === curr._id)) acc.push(curr);
    return acc;
  }, []);

  return (
    <div style={{
      position: 'absolute',
      top: 'calc(100% + 8px)',
      right: 0,
      width: 360,
      maxHeight: '80vh',
      overflowY: 'auto',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      zIndex: 200,
      display: 'flex',
      flexDirection: 'column'
    }}>
      <div style={{
        padding: 'var(--space-4)',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'var(--bg)',
        position: 'sticky',
        top: 0,
        zIndex: 1
      }}>
        <h3 className="font-semi">Notifications</h3>
        <button className="btn-icon" onClick={onClose} style={{ padding: 4 }}>✕</button>
      </div>

      <div style={{ padding: 'var(--space-3)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
        {loading && allNotifs.length === 0 ? (
          <div className="flex justify-center" style={{ padding: 'var(--space-6)' }}>
            <span className="spinner"></span>
          </div>
        ) : allNotifs.length === 0 ? (
          <p className="text-center text-muted text-sm" style={{ padding: 'var(--space-6) 0' }}>
            No notifications yet
          </p>
        ) : (
          allNotifs.map(n => (
            <div key={n._id} style={{
              padding: 'var(--space-3)',
              background: n.isRead ? 'transparent' : 'var(--bg)',
              borderRadius: 'var(--radius-md)',
              border: n.isRead ? '1px solid transparent' : '1px solid var(--border)',
              display: 'flex',
              gap: 'var(--space-3)',
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '1.2rem', marginTop: 2 }}>
                {n.type === 'LISTING_CLAIMED' ? '🤝' : n.type === 'TASK_ASSIGNED' ? '🚴' : n.type === 'LISTING_COLLECTED' ? '📦' : '🔔'}
              </span>
              <div>
                <p className="text-sm font-semi">{n.title}</p>
                <p className="text-sm text-muted" style={{ marginTop: 2 }}>{n.message}</p>
                <p className="text-xs text-muted" style={{ marginTop: 4 }}>
                  {new Date(n.createdAt).toLocaleString('en-IN', { timeStyle: 'short', dateStyle: 'medium' })}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
