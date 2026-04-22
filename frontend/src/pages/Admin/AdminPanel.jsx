import { useState, useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import Navbar from '../../components/common/Navbar';
import { ToastContainer, showToast } from '../../components/common/Toast';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import * as adminService from '../../services/adminService';

function Sidebar() {
  const items = [
    { to: '/admin', label: 'Stats', icon: '📊', end: true },
    { to: '/admin/queue', label: 'Approvals', icon: '⏳' },
    { to: '/admin/users', label: 'Users', icon: '👥' },
    { to: '/admin/activity', label: 'Activity', icon: '⚡' },
    { to: '/admin/announce', label: 'Announce', icon: '📢' },
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

function PlatformStats() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    adminService.getPlatformStats().then(({ data }) => setStats(data.stats));
  }, []);

  if (!stats) return <div className="flex justify-center" style={{ padding: 'var(--space-12)' }}><div className="spinner spinner-lg" /></div>;

  const cards = [
    { label: 'Total users', value: stats.totalUsers },
    { label: 'Donors', value: stats.totalDonors },
    { label: 'NGOs', value: stats.totalNGOs },
    { label: 'Volunteers', value: stats.totalVolunteers },
    { label: 'Total listings', value: stats.totalListings },
    { label: 'Delivered', value: stats.totalDelivered },
    { label: 'Active now', value: stats.activeListings },
    { label: 'Meals estimated', value: stats.totalMealsEstimate.toLocaleString() },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Platform overview</h1>
      </div>
      <div className="grid-4" style={{ marginBottom: 'var(--space-8)' }}>
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <span className="stat-value">{c.value}</span>
            <span className="stat-label">{c.label}</span>
          </div>
        ))}
      </div>
      {stats.recentRegistrations?.length > 0 && (
        <>
          <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Registrations — last 30 days</h2>
          <div className="card-flat">
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
              {stats.recentRegistrations.map((d) => {
                const max = Math.max(...stats.recentRegistrations.map((r) => r.count));
                return (
                  <div key={d._id} title={`${d._id}: ${d.count}`} style={{
                    flex: 1, background: 'var(--primary)', borderRadius: '3px 3px 0 0', opacity: 0.7,
                    height: `${(d.count / max) * 100}%`, minHeight: 4, transition: 'height var(--t-slow)',
                  }} />
                );
              })}
            </div>
            <p className="text-xs text-muted" style={{ marginTop: 'var(--space-2)' }}>
              {stats.recentRegistrations[0]?._id} → {stats.recentRegistrations[stats.recentRegistrations.length - 1]?._id}
            </p>
          </div>
        </>
      )}
    </div>
  );
}

function VerificationQueue() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);

  const load = () => {
    adminService.getVerificationQueue().then(({ data }) => setQueue(data.queue)).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (userId, approved) => {
    setProcessing(true);
    try {
      await adminService.approveUser(userId, approved, reason);
      showToast(`User ${approved ? 'approved' : 'rejected'}`, approved ? 'success' : 'warning');
      setSelected(null);
      setReason('');
      load();
    } catch {
      showToast('Action failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="flex justify-center" style={{ padding: 'var(--space-12)' }}><div className="spinner spinner-lg" /></div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Verification queue</h1>
        <p className="page-subtitle">{queue.length} pending {queue.length === 1 ? 'application' : 'applications'}</p>
      </div>

      {queue.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">✅</div><p className="empty-state-title">All clear! No pending applications.</p></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {queue.map(({ user, profile }) => (
            <div key={user._id} className="card">
              <div className="flex justify-between items-start gap-4">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-2)' }}>
                    <p className="font-semi text-lg">{user.name}</p>
                    <span className="badge badge-pending">{user.role}</span>
                  </div>
                  <p className="text-sm text-muted">{user.email} · {user.phone}</p>
                  <p className="text-sm text-muted">City: {user.city}</p>
                  {profile && (
                    <>
                      {profile.businessName && <p className="text-sm">Business: {profile.businessName} ({profile.businessType})</p>}
                      {profile.organisationName && <p className="text-sm">Organisation: {profile.organisationName}</p>}
                      {profile.registrationNumber && <p className="text-sm text-muted">Reg. No: {profile.registrationNumber}</p>}
                      {profile.licenseNumber && <p className="text-sm text-muted">License: {profile.licenseNumber}</p>}
                      {profile.verificationDocument && (
                        <a href={profile.verificationDocument} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-3)', display: 'inline-flex' }}>
                          📄 View document
                        </a>
                      )}
                    </>
                  )}
                  <p className="text-xs text-muted" style={{ marginTop: 'var(--space-2)' }}>
                    Applied {new Date(user.createdAt).toLocaleDateString('en-IN', { dateStyle: 'long' })}
                  </p>
                </div>
              </div>
              <div className="flex gap-3" style={{ marginTop: 'var(--space-5)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                <button className="btn btn-primary btn-sm" onClick={() => handleAction(user._id, true)} disabled={processing}>
                  ✓ Approve
                </button>
                <button className="btn btn-sm btn-danger" onClick={() => setSelected(user)} disabled={processing}>
                  ✕ Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!selected} onClose={() => { setSelected(null); setReason(''); }} title="Reject application">
        <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-4)' }}>
          Provide a reason so {selected?.name} knows what to fix.
        </p>
        <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
          <label className="form-label">Reason (optional)</label>
          <textarea className="form-textarea" rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Documents unclear, please re-upload" />
        </div>
        <div className="flex gap-3">
          <button className="btn btn-danger flex-1" onClick={() => handleAction(selected?._id, false)} disabled={processing}>
            {processing ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Confirm rejection'}
          </button>
          <button className="btn btn-ghost" onClick={() => setSelected(null)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = () => {
    setLoading(true);
    adminService.getAllUsers({ search, role, page, limit: 15 })
      .then(({ data }) => { setUsers(data.users); setTotalPages(data.pages); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [search, role, page]);

  const handleSuspend = async (id, isSuspended) => {
    try {
      await adminService.suspendUser(id);
      showToast(isSuspended ? 'User reinstated' : 'User suspended', 'success');
      load();
    } catch { showToast('Action failed', 'error'); }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">User management</h1>
      </div>
      <div className="flex gap-4 flex-wrap" style={{ marginBottom: 'var(--space-6)' }}>
        <input className="form-input" placeholder="Search by name or email…" value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }} style={{ maxWidth: 280 }} />
        <select className="form-select" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }} style={{ maxWidth: 160 }}>
          <option value="">All roles</option>
          {['donor', 'ngo', 'volunteer', 'admin'].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th><th>Email</th><th>Role</th><th>City</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 'var(--space-8)' }}><div className="spinner" style={{ margin: '0 auto' }} /></td></tr>
            ) : users.map((u) => (
              <tr key={u._id}>
                <td className="font-semi">{u.name}</td>
                <td className="text-muted">{u.email}</td>
                <td><span className="badge badge-pending">{u.role}</span></td>
                <td className="text-muted">{u.city || '—'}</td>
                <td>
                  {u.isSuspended ? <span className="badge badge-rejected">Suspended</span>
                    : u.isApproved ? <span className="badge badge-approved">Active</span>
                    : <span className="badge badge-pending">Pending</span>}
                </td>
                <td>
                  <button
                    className={`btn btn-sm ${u.isSuspended ? 'btn-outline' : ''}`}
                    style={!u.isSuspended ? { background: 'var(--error-lt)', color: 'var(--error)' } : {}}
                    onClick={() => handleSuspend(u._id, u.isSuspended)}
                  >
                    {u.isSuspended ? 'Reinstate' : 'Suspend'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <div className="flex justify-center gap-3" style={{ marginTop: 'var(--space-5)' }}>
          <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>← Prev</button>
          <span className="text-sm text-muted">Page {page} of {totalPages}</span>
          <button className="btn btn-ghost btn-sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}

function LiveActivity() {
  const [data, setData] = useState(null);

  useEffect(() => {
    const load = () => adminService.getLiveActivity().then(({ data }) => setData(data));
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return <div className="flex justify-center" style={{ padding: 'var(--space-12)' }}><div className="spinner spinner-lg" /></div>;

  return (
    <div>
      <div className="page-header flex justify-between items-start">
        <div>
          <h1 className="page-title">Live activity</h1>
          <p className="page-subtitle">Auto-refreshes every 30 seconds.</p>
        </div>
        <span className="badge badge-active" style={{ animation: 'none' }}>● Live</span>
      </div>

      <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Active listings ({data.activeListings.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-8)' }}>
        {data.activeListings.map((l) => (
          <div key={l._id} className="card-flat flex justify-between items-center gap-4">
            <div>
              <p className="font-semi">{l.foodName}</p>
              <p className="text-sm text-muted">Donor: {l.donorId?.name} · {l.donorId?.city}</p>
            </div>
            <StatusBadge status={l.status} />
          </div>
        ))}
      </div>

      <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>Active tasks ({data.activeTasks.length})</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {data.activeTasks.map((t) => (
          <div key={t._id} className="card-flat flex justify-between items-center gap-4">
            <div>
              <p className="font-semi">{t.listingId?.foodName}</p>
              <p className="text-sm text-muted">Volunteer: {t.volunteerId?.name}</p>
            </div>
            <StatusBadge status={t.status} />
          </div>
        ))}
      </div>
    </div>
  );
}

function Announcements() {
  const [message, setMessage] = useState('');
  const [targetRoles, setTargetRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState('');

  const toggleRole = (r) => setTargetRoles((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setLoading(true);
    try {
      const { data } = await adminService.sendAnnouncement(message, targetRoles);
      setSent(data.message);
      setMessage('');
      setTargetRoles([]);
    } catch { showToast('Failed to send announcement', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: 560 }}>
      <div className="page-header">
        <h1 className="page-title">Send announcement</h1>
        <p className="page-subtitle">Push a message to users on the platform.</p>
      </div>
      {sent && <div className="alert alert-success" style={{ marginBottom: 'var(--space-5)' }}>{sent}</div>}
      <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="form-group">
          <label className="form-label">Message</label>
          <textarea className="form-textarea" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your announcement here…" required />
        </div>
        <div className="form-group">
          <label className="form-label">Send to</label>
          <div className="flex gap-3 flex-wrap">
            {['donor', 'ngo', 'volunteer'].map((r) => (
              <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                <input type="checkbox" checked={targetRoles.includes(r)} onChange={() => toggleRole(r)} />
                <span className="text-sm font-semi" style={{ textTransform: 'capitalize' }}>{r}</span>
              </label>
            ))}
            <span className="text-sm text-muted">(empty = all users)</span>
          </div>
        </div>
        <button type="submit" className="btn btn-accent" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : '📢 Send announcement'}
        </button>
      </form>
    </div>
  );
}

export default function AdminPanel() {
  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route index element={<PlatformStats />} />
            <Route path="queue" element={<VerificationQueue />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="activity" element={<LiveActivity />} />
            <Route path="announce" element={<Announcements />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
