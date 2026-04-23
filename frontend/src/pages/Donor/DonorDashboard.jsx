import { useState, useEffect } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import { ToastContainer, showToast } from '../../components/common/Toast';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import * as donorService from '../../services/donorService';

function Sidebar() {
  const items = [
    { to: '/donor', label: 'Overview', icon: '📊', end: true },
    { to: '/donor/listings', label: 'My Listings', icon: '📋' },
    { to: '/donor/post', label: 'Donate Food', icon: '➕' },
  ];
  return (
    <aside className="sidebar">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `sidebar-item${isActive ? ' active' : ''}`}
        >
          <span className="icon">{item.icon}</span>
          <span>{item.label}</span>
        </NavLink>
      ))}
    </aside>
  );
}

function Overview() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [listings, setListings] = useState([]);

  useEffect(() => {
    donorService.getDonorStats().then(({ data }) => setStats(data.stats));
    donorService.getMyListings({ status: 'active', limit: 5 }).then(({ data }) => setListings(data.listings));
  }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="page-subtitle">Here's your impact at a glance.</p>
      </div>

      {stats && (
        <div className="grid-3" style={{ marginBottom: 'var(--space-8)' }}>
          <div className="stat-card">
            <span className="stat-value">{stats.totalDonations}</span>
            <span className="stat-label">Total donations</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.totalMealsEstimate.toLocaleString()}</span>
            <span className="stat-label">Meals estimated</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{stats.delivered}</span>
            <span className="stat-label">Successfully delivered</span>
          </div>
        </div>
      )}

      <div className="section-header">
        <h2 className="section-title">Active listings</h2>
        <NavLink to="/donor/listings" className="btn btn-ghost btn-sm">See all →</NavLink>
      </div>

      {listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍱</div>
          <p className="empty-state-title">No active listings</p>
          <p style={{ color: 'var(--text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
            Post your first donation to get started.
          </p>
          <NavLink to="/donor/post" className="btn btn-primary">Donate food</NavLink>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {listings.map((l) => (
            <div key={l._id} className="card-flat flex items-center justify-between gap-4">
              <div>
                <p className="font-semi">{l.foodName}</p>
                <p className="text-sm text-muted">{l.quantity} {l.unit} · {l.address}</p>
              </div>
              <StatusBadge status={l.status} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostDonation({ onSuccess }) {
  const [form, setForm] = useState({
    foodName: '', quantity: '', unit: 'portions', foodType: 'veg',
    description: '', pickupWindowStart: '', pickupWindowEnd: '',
    address: '', latitude: '', longitude: '',
  });
  const [photo, setPhoto] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords }) => {
        setForm((p) => ({ ...p, latitude: coords.latitude.toString(), longitude: coords.longitude.toString() }));
        showToast('Location captured', 'success');
      },
      () => showToast('Could not get location', 'error')
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.latitude || !form.longitude) {
      setError('Please capture your location first');
      return;
    }
    setError('');
    setLoading(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    if (photo) fd.append('photo', photo);
    try {
      await donorService.createListing(fd);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post donation');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 600 }}>
        <div className="empty-state" style={{ paddingTop: 'var(--space-12)' }}>
          <div className="empty-state-icon">✅</div>
          <p className="empty-state-title">Listing submitted for review!</p>
          <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-6)', maxWidth: 360, margin: '0 auto var(--space-6)' }}>
            Your donation is in the admin review queue. Once approved it will be visible to NGOs nearby.
            You'll be notified when it goes live — usually within a few hours.
          </p>
          <div className="flex gap-3 justify-center">
            <NavLink to="/donor/listings" className="btn btn-primary">View my listings</NavLink>
            <button className="btn btn-ghost" onClick={() => setSuccess(false)}>Post another</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600 }}>
      <div className="page-header">
        <h1 className="page-title">Donate food</h1>
        <p className="page-subtitle">Takes about 60 seconds.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="form-group">
          <label className="form-label">What food are you donating?</label>
          <input name="foodName" className="form-input" placeholder="e.g. Biryani, Roti, Dal" value={form.foodName} onChange={handleChange} required />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input name="quantity" type="number" min="1" className="form-input" placeholder="e.g. 20" value={form.quantity} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Unit</label>
            <select name="unit" className="form-select" value={form.unit} onChange={handleChange}>
              {['portions', 'kg', 'litres', 'packets', 'boxes', 'items'].map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Food type</label>
          <div className="flex gap-3">
            {['veg', 'non-veg', 'both'].map((t) => (
              <label key={t} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer' }}>
                <input type="radio" name="foodType" value={t} checked={form.foodType === t} onChange={handleChange} />
                <span className="text-sm">{t === 'veg' ? '🌿 Veg' : t === 'non-veg' ? '🍖 Non-Veg' : '🍱 Both'}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Description <span className="text-muted font-normal">(optional)</span></label>
          <textarea name="description" className="form-textarea" placeholder="Any details about packaging, freshness, etc." value={form.description} onChange={handleChange} rows={3} />
        </div>

        <div className="grid-2">
          <div className="form-group">
            <label className="form-label">Pickup window — From</label>
            <input name="pickupWindowStart" type="datetime-local" className="form-input" value={form.pickupWindowStart} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label className="form-label">Pickup window — Until</label>
            <input name="pickupWindowEnd" type="datetime-local" className="form-input" value={form.pickupWindowEnd} onChange={handleChange} required />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Pickup address</label>
          <input name="address" className="form-input" placeholder="Full address" value={form.address} onChange={handleChange} required />
          <div className="flex items-center gap-3" style={{ marginTop: 'var(--space-2)' }}>
            <button type="button" className="btn btn-outline btn-sm" onClick={useMyLocation}>
              📍 Use my location
            </button>
            {form.latitude && (
              <span className="text-sm text-muted">
                ✓ Location captured ({parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)})
              </span>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Photo <span className="text-muted font-normal">(optional)</span></label>
          <input type="file" accept="image/*" className="form-input" onChange={(e) => setPhoto(e.target.files[0])} style={{ padding: 'var(--space-2)' }} />
          <p className="form-hint">A photo helps NGOs make quicker decisions.</p>
        </div>

        <button type="submit" className="btn btn-primary btn-lg btn-full" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 20, height: 20 }} /> : '🍱 Post donation'}
        </button>
      </form>
    </div>
  );
}

function MyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    const params = filter ? { status: filter } : {};
    donorService.getMyListings(params)
      .then(({ data }) => setListings(data.listings))
      .finally(() => setLoading(false));
  }, [filter]);

  const handleClose = async (id) => {
    if (!window.confirm('Close this listing?')) return;
    try {
      await donorService.closeListing(id);
      setListings((prev) => prev.map((l) => l._id === id ? { ...l, status: 'closed' } : l));
      showToast('Listing closed', 'success');
    } catch {
      showToast('Could not close listing', 'error');
    }
  };

  const statuses = ['', 'active', 'claimed', 'collected', 'delivered', 'closed'];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My listings</h1>
      </div>

      <div className="tabs" style={{ marginBottom: 'var(--space-6)', maxWidth: 500 }}>
        {statuses.map((s) => (
          <button key={s} className={`tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--space-12)' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📋</div>
          <p className="empty-state-title">No listings found</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {listings.map((l) => (
            <div key={l._id} className="card" style={{ cursor: 'default' }}>
              <div className="flex justify-between items-start gap-4">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-2)' }}>
                    <p className="font-semi text-lg">{l.foodName}</p>
                    <StatusBadge status={!l.isApproved && l.status === 'active' ? 'pending-approval' : l.status} />
                    <StatusBadge status={l.foodType} />
                  </div>
                  <p className="text-sm text-muted">{l.quantity} {l.unit} · {l.address}</p>
                  <p className="text-sm text-muted">
                    Pickup: {new Date(l.pickupWindowStart).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  {l.claimedBy && <p className="text-sm" style={{ color: 'var(--primary)', marginTop: 4 }}>Claimed by {l.claimedBy.name}</p>}
                </div>
                {l.photo && (
                  <img src={l.photo} alt={l.foodName} style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                )}
              </div>
              <div className="flex gap-3" style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                {l.status === 'active' && (
                  <button className="btn btn-sm" style={{ color: 'var(--error)', background: 'var(--error-lt)' }} onClick={() => handleClose(l._id)}>
                    Close listing
                  </button>
                )}
                {l.claimedBy && (
                  <Link to={`/messages/${l._id}`} className="btn btn-primary btn-sm">
                    💬 Message NGO
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DonorDashboard() {
  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route index element={<Overview />} />
            <Route path="listings" element={<MyListings />} />
            <Route path="post" element={<PostDonation />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
