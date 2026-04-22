import { useState, useEffect, useRef } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { ToastContainer, showToast } from '../../components/common/Toast';
import StatusBadge from '../../components/common/StatusBadge';
import * as volunteerService from '../../services/volunteerService';

function Sidebar() {
  const items = [
    { to: '/volunteer', label: 'Task Feed', icon: '📋', end: true },
    { to: '/volunteer/profile', label: 'My Profile', icon: '⭐' },
    { to: '/volunteer/leaderboard', label: 'Leaderboard', icon: '🏆' },
  ];
  return (
    <aside className="sidebar">
      {items.map((item) => (
        <NavLink key={item.to} to={item.to} end={item.end}
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}>
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}

const STATUS_STEPS = {
  assigned: { next: 'in-progress', label: 'Start Pickup', nextLabel: 'Mark as In Progress', requiresPhoto: false },
  'in-progress': { next: 'collected', label: 'Collected', nextLabel: 'I\'ve Collected the Food', requiresPhoto: true },
  collected: { next: 'delivered', label: 'Delivered', nextLabel: 'Mark as Delivered', requiresPhoto: true },
};

function TaskCard({ task, onUpdate }) {
  const [expanding, setExpanding] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef(null);

  const listing = task.listingId;
  const step = STATUS_STEPS[task.status];
  if (!listing) return null;

  const handleUpdate = async () => {
    if (step.requiresPhoto && !photo) {
      showToast('Please upload a photo for this step', 'warning');
      fileRef.current?.click();
      return;
    }
    setLoading(true);
    try {
      await volunteerService.updateTaskStatus(task._id, step.next, photo);
      showToast(
        step.next === 'delivered' ? 'Delivered! Great work 🎉' : 'Status updated',
        'success'
      );
      onUpdate();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update', 'error');
    } finally {
      setLoading(false);
      setPhoto(null);
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-start gap-4" style={{ marginBottom: 'var(--space-4)' }}>
        <div style={{ flex: 1 }}>
          <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-2)' }}>
            <p className="font-semi text-lg">{listing.foodName}</p>
            <StatusBadge status={task.status} />
          </div>
          <p className="text-sm text-muted">{listing.quantity} {listing.unit}</p>
          <p className="text-sm text-muted">📍 {listing.address}</p>
          {listing.donorId && <p className="text-sm">Donor: <strong>{listing.donorId.name}</strong> · {listing.donorId.phone}</p>}
          <p className="text-sm text-muted">
            Pickup window: {new Date(listing.pickupWindowStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        </div>
      </div>

      {/* Step progress bar */}
      <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)' }}>
        {['assigned', 'in-progress', 'collected', 'delivered'].map((s, i) => {
          const stepOrder = ['assigned', 'in-progress', 'collected', 'delivered'];
          const currentIdx = stepOrder.indexOf(task.status);
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <div key={s} className="flex items-center" style={{ flex: 1 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: done ? 'var(--primary)' : active ? 'var(--accent)' : 'var(--border)',
                color: done || active ? '#fff' : 'var(--text-muted)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-xs)', fontWeight: 600, transition: 'background var(--t-normal)',
              }}>
                {done ? '✓' : i + 1}
              </div>
              {i < 3 && <div style={{ flex: 1, height: 2, background: done ? 'var(--primary)' : 'var(--border)', transition: 'background var(--t-normal)' }} />}
            </div>
          );
        })}
      </div>

      {step && task.status !== 'delivered' && (
        <div style={{ borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
          {step.requiresPhoto && (
            <div style={{ marginBottom: 'var(--space-3)' }}>
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                onChange={(e) => setPhoto(e.target.files[0])} />
              <button className="btn btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                {photo ? `✓ Photo selected: ${photo.name.slice(0, 20)}…` : '📷 Add photo proof'}
              </button>
            </div>
          )}
          <div className="flex gap-3">
            <button className="btn btn-primary" onClick={handleUpdate} disabled={loading}>
              {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : step.nextLabel}
            </button>
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(listing.address)}`}
              target="_blank" rel="noreferrer"
              className="btn btn-outline btn-sm"
            >
              🗺 Navigate
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskFeed() {
  const [tasks, setTasks] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = () => {
    Promise.all([
      volunteerService.getAssignedTasks(),
      volunteerService.getVolunteerProfile(),
    ]).then(([taskRes, profileRes]) => {
      setTasks(taskRes.data.tasks);
      setProfile(profileRes.data);
    }).finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const handleToggleAvailability = async () => {
    try {
      const { data } = await volunteerService.toggleAvailability();
      setProfile((p) => ({ ...p, profile: { ...p.profile, availability: data.availability } }));
      showToast(data.message, 'success');
    } catch {
      showToast('Failed to update availability', 'error');
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'delivered');
  const completedTasks = tasks.filter((t) => t.status === 'delivered');

  return (
    <div>
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Task feed</h1>
          <p className="page-subtitle">Your assigned pickups and deliveries.</p>
        </div>
        {profile?.profile && (
          <div className="availability-toggle" onClick={handleToggleAvailability} style={{ cursor: 'pointer' }}>
            <div>
              <p className="font-semi text-sm">{profile.profile.availability ? 'Available' : 'Unavailable'}</p>
              <p className="text-xs text-muted">Tap to toggle</p>
            </div>
            <div className={`toggle-pill${profile.profile.availability ? ' on' : ''}`}>
              <div className="toggle-knob" />
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--space-12)' }}><div className="spinner spinner-lg" /></div>
      ) : (
        <>
          {activeTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🚴</div>
              <p className="empty-state-title">No tasks yet</p>
              <p className="text-muted text-sm">Your NGO will assign tasks here.</p>
            </div>
          ) : (
            <>
              {activeTasks.length > 0 && (
                <>
                  <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Active tasks ({activeTasks.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-8)' }}>
                    {activeTasks.map((t) => <TaskCard key={t._id} task={t} onUpdate={loadData} />)}
                  </div>
                </>
              )}
              {completedTasks.length > 0 && (
                <>
                  <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Completed ({completedTasks.length})</h2>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                    {completedTasks.map((t) => (
                      <div key={t._id} className="card-flat flex justify-between items-center">
                        <div>
                          <p className="font-semi">{t.listingId?.foodName}</p>
                          <p className="text-sm text-muted">Completed {new Date(t.completedAt).toLocaleDateString('en-IN')}</p>
                        </div>
                        <StatusBadge status="delivered" />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

function MyProfile() {
  const [data, setData] = useState(null);

  useEffect(() => {
    volunteerService.getVolunteerProfile().then(({ data }) => setData(data));
  }, []);

  if (!data) return <div className="flex justify-center" style={{ padding: 'var(--space-12)' }}><div className="spinner spinner-lg" /></div>;

  const { profile, leaderboardRank } = data;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My profile</h1>
      </div>

      <div className="grid-3" style={{ marginBottom: 'var(--space-8)' }}>
        <div className="stat-card">
          <span className="stat-value">{profile.totalDeliveries}</span>
          <span className="stat-label">Deliveries</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">{profile.points}</span>
          <span className="stat-label">Points earned</span>
        </div>
        <div className="stat-card">
          <span className="stat-value">#{leaderboardRank}</span>
          <span className="stat-label">Leaderboard rank</span>
        </div>
      </div>

      {profile.badges.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Badges</h2>
          <div className="flex flex-wrap gap-3" style={{ marginBottom: 'var(--space-8)' }}>
            {profile.badges.map((b) => (
              <div key={b.name} className="card-flat text-center" style={{ padding: 'var(--space-4)', minWidth: 100 }}>
                <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>{b.icon}</div>
                <p className="text-sm font-semi">{b.name}</p>
                <p className="text-xs text-muted">{new Date(b.earnedAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Leaderboard() {
  const [board, setBoard] = useState([]);

  useEffect(() => {
    volunteerService.getLeaderboard().then(({ data }) => setBoard(data.leaderboard));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Leaderboard</h1>
        <p className="page-subtitle">Top volunteers this month.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {board.map((entry, i) => (
          <div key={entry._id} className="card-flat flex items-center gap-4">
            <span style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 600, fontSize: 'var(--text-sm)', flexShrink: 0,
              background: i === 0 ? '#FEF08A' : i === 1 ? '#E2E8F0' : i === 2 ? '#FED7AA' : 'var(--surface)',
              color: i < 3 ? 'var(--text)' : 'var(--text-muted)',
            }}>
              {i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1}
            </span>
            <div className="avatar">
              {entry.userId?.profilePhoto
                ? <img src={entry.userId.profilePhoto} alt={entry.userId.name} />
                : <span>{entry.userId?.name?.[0]?.toUpperCase()}</span>
              }
            </div>
            <div style={{ flex: 1 }}>
              <p className="font-semi">{entry.userId?.name}</p>
              <p className="text-sm text-muted">{entry.userId?.city}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="font-semi text-primary">{entry.points} pts</p>
              <p className="text-xs text-muted">{entry.totalDeliveries} deliveries</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function VolunteerDashboard() {
  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route index element={<TaskFeed />} />
            <Route path="profile" element={<MyProfile />} />
            <Route path="leaderboard" element={<Leaderboard />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
