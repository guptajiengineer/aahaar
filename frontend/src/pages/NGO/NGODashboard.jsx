import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Navbar from '../../components/common/Navbar';
import { ToastContainer, showToast } from '../../components/common/Toast';
import StatusBadge from '../../components/common/StatusBadge';
import Modal from '../../components/common/Modal';
import * as ngoService from '../../services/ngoService';
import MapComponent from '../../components/common/MapComponent';

function Sidebar() {
  const items = [
    { to: '/ngo', label: 'Map & Listings', icon: '🗺️', end: true },
    { to: '/ngo/collections', label: 'Collections', icon: '📦' },
    { to: '/ngo/volunteers', label: 'Volunteers', icon: '🚴' },
    { to: '/ngo/log', label: 'Distribution Log', icon: '📝' },
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

function NearbyListings() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [radius, setRadius] = useState(10);
  const [foodType, setFoodType] = useState('');
  const [coords, setCoords] = useState(null);
  const [error, setError] = useState('');
  const [claiming, setClaiming] = useState(null);

  const getLocation = useCallback(() => {
    navigator.geolocation?.getCurrentPosition(
      ({ coords: c }) => setCoords({ lat: c.latitude, lng: c.longitude }),
      () => setError('Location permission denied. Enable it to see nearby listings.')
    );
  }, []);

  useEffect(() => { getLocation(); }, [getLocation]);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    ngoService.getNearbyListings({ lat: coords.lat, lng: coords.lng, radius, foodType: foodType || undefined })
      .then(({ data }) => setListings(data.listings))
      .catch(() => setError('Failed to load listings'))
      .finally(() => setLoading(false));
  }, [coords, radius, foodType]);

  const handleClaim = async (id, foodName) => {
    setClaiming(id);
    try {
      await ngoService.claimListing(id);
      setListings((prev) => prev.filter((l) => l._id !== id));
      showToast(`"${foodName}" claimed! Assign a volunteer to get started.`, 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not claim listing', 'error');
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Food available near you</h1>
        <p className="page-subtitle">Browse and claim donations from donors in your area.</p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-5)' }}>{error}</div>}

      {/* Filters */}
      <div className="card-flat flex items-center gap-4 flex-wrap" style={{ marginBottom: 'var(--space-6)' }}>
        <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
          <label className="form-label">Radius</label>
          <select className="form-select" value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
            {[5, 10, 20, 30, 50].map((r) => <option key={r} value={r}>{r} km</option>)}
          </select>
        </div>
        <div className="form-group" style={{ flex: 1, minWidth: 160 }}>
          <label className="form-label">Food type</label>
          <select className="form-select" value={foodType} onChange={(e) => setFoodType(e.target.value)}>
            <option value="">All types</option>
            <option value="veg">Veg only</option>
            <option value="non-veg">Non-Veg only</option>
            <option value="both">Mixed</option>
          </select>
        </div>
        <button className="btn btn-outline btn-sm" style={{ marginTop: 'var(--space-5)' }} onClick={getLocation}>
          📍 Refresh location
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--space-12)' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : !coords ? (
        <div className="empty-state">
          <div className="empty-state-icon">📍</div>
          <p className="empty-state-title">Location required</p>
          <button className="btn btn-primary" onClick={getLocation}>Allow location</button>
        </div>
      ) : listings.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🍱</div>
          <p className="empty-state-title">No listings nearby</p>
          <p className="text-muted text-sm">Try increasing the radius or check back later.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 'var(--space-6)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <MapComponent center={coords} markers={listings} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            {listings.map((l) => (
              <div key={l._id} className="card">
                <div className="flex justify-between items-start gap-4">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-2)' }}>
                      <p className="font-semi text-lg">{l.foodName}</p>
                      <StatusBadge status={l.foodType} />
                    </div>
                    <p className="text-sm text-muted">{l.quantity} {l.unit}</p>
                    <p className="text-sm text-muted">📍 {l.address}</p>
                    <p className="text-sm text-muted">
                      🕐 Pickup until {new Date(l.pickupWindowEnd).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-sm" style={{ marginTop: 'var(--space-2)' }}>
                      By <strong>{l.donorId?.name}</strong>
                    </p>
                    {l.description && <p className="text-sm text-muted" style={{ marginTop: 4 }}>{l.description}</p>}
                  </div>
                  {l.photo && (
                    <img src={l.photo} alt={l.foodName} style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0 }} />
                  )}
                </div>
                <div style={{ marginTop: 'var(--space-4)', borderTop: '1px solid var(--border)', paddingTop: 'var(--space-4)' }}>
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={claiming === l._id}
                    onClick={() => handleClaim(l._id, l.foodName)}
                  >
                    {claiming === l._id ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Claim this donation'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Collections() {
  const [tab, setTab] = useState('active');
  const [collections, setCollections] = useState([]);
  const [volunteers, setVolunteers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState('');

  useEffect(() => {
    setLoading(true);
    ngoService.getMyCollections(tab).then(({ data }) => setCollections(data.listings)).finally(() => setLoading(false));
  }, [tab]);

  useEffect(() => {
    ngoService.getLinkedVolunteers().then(({ data }) => setVolunteers(data.volunteers));
  }, []);

  const handleAssign = async (listingId) => {
    if (!selectedVolunteer) return showToast('Select a volunteer first', 'warning');
    try {
      await ngoService.assignVolunteer(listingId, selectedVolunteer);
      showToast('Volunteer assigned!', 'success');
      setAssigningId(null);
      setSelectedVolunteer('');
      ngoService.getMyCollections(tab).then(({ data }) => setCollections(data.listings));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to assign volunteer', 'error');
    }
  };

  const TABS = [
    { key: 'active', label: 'Active' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My collections</h1>
      </div>
      <div className="tabs" style={{ marginBottom: 'var(--space-6)', maxWidth: 380 }}>
        {TABS.map((t) => (
          <button key={t.key} className={`tab${tab === t.key ? ' active' : ''}`} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 'var(--space-12)' }}><div className="spinner spinner-lg" /></div>
      ) : collections.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📦</div>
          <p className="empty-state-title">Nothing here yet</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {collections.map((l) => (
            <div key={l._id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semi">{l.foodName}</p>
                  <p className="text-sm text-muted">{l.quantity} {l.unit} · {l.address}</p>
                  <p className="text-sm text-muted">Donor: {l.donorId?.name} · {l.donorId?.phone}</p>
                  {l.assignedVolunteer
                    ? <p className="text-sm" style={{ color: 'var(--primary)', marginTop: 4 }}>Volunteer: {l.assignedVolunteer.name}</p>
                    : tab === 'active' && (
                      <button className="btn btn-sm btn-outline" style={{ marginTop: 'var(--space-3)' }}
                        onClick={() => setAssigningId(l._id)}>
                        Assign volunteer
                      </button>
                    )
                  }
                  <div style={{ marginTop: 'var(--space-3)' }}>
                    <Link to={`/messages/${l._id}`} className="btn btn-primary btn-sm">
                      💬 Message Donor
                    </Link>
                  </div>
                </div>
                <StatusBadge status={l.status} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!assigningId} onClose={() => { setAssigningId(null); setSelectedVolunteer(''); }} title="Assign a volunteer">
        <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
          <label className="form-label">Select volunteer</label>
          <select className="form-select" value={selectedVolunteer} onChange={(e) => setSelectedVolunteer(e.target.value)}>
            <option value="">Choose…</option>
            {volunteers.map((v) => <option key={v._id} value={v._id}>{v.name} · {v.city}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <button className="btn btn-primary flex-1" onClick={() => handleAssign(assigningId)}>Assign</button>
          <button className="btn btn-ghost" onClick={() => setAssigningId(null)}>Cancel</button>
        </div>
      </Modal>
    </div>
  );
}

function DistributionLogForm() {
  const [collections, setCollections] = useState([]);
  const [form, setForm] = useState({ listingId: '', beneficiariesCount: '', distributionLocation: '', notes: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    ngoService.getMyCollections('completed').then(({ data }) => setCollections(data.listings));
  }, []);

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await ngoService.logDistribution(form);
      setSuccess(true);
      setForm({ listingId: '', beneficiariesCount: '', distributionLocation: '', notes: '' });
      showToast('Distribution logged!', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to log', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 520 }}>
      <div className="page-header">
        <h1 className="page-title">Log a distribution</h1>
        <p className="page-subtitle">Record how many people received food from a collected donation.</p>
      </div>
      {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-5)' }}>Distribution logged successfully!</div>}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        <div className="form-group">
          <label className="form-label">Donation</label>
          <select name="listingId" className="form-select" value={form.listingId} onChange={handleChange} required>
            <option value="">Select a completed collection…</option>
            {collections.map((c) => <option key={c._id} value={c._id}>{c.foodName} · {new Date(c.updatedAt).toLocaleDateString()}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Beneficiaries count</label>
          <input name="beneficiariesCount" type="number" min="1" className="form-input" placeholder="How many people received food?" value={form.beneficiariesCount} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Distribution location</label>
          <input name="distributionLocation" className="form-input" placeholder="Where was food distributed?" value={form.distributionLocation} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Notes <span className="text-muted font-normal">(optional)</span></label>
          <textarea name="notes" className="form-textarea" placeholder="Any observations or special notes" value={form.notes} onChange={handleChange} rows={3} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save log'}
        </button>
      </form>
    </div>
  );
}

function VolunteerList() {
  const [linked, setLinked] = useState([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(null);
  const [removing, setRemoving] = useState(null);
  const [searched, setSearched] = useState(false);

  const loadLinked = () => {
    ngoService.getLinkedVolunteers().then(({ data }) => setLinked(data.volunteers || []));
  };

  useEffect(() => { loadLinked(); }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    setSearching(true);
    setSearched(true);
    try {
      const { data } = await ngoService.searchVolunteers(search);
      setResults(data.volunteers);
    } catch {
      showToast('Search failed', 'error');
    } finally {
      setSearching(false);
    }
  };

  const handleAdd = async (id) => {
    setAdding(id);
    try {
      await ngoService.addVolunteer(id);
      showToast('Volunteer added to your team!', 'success');
      loadLinked();
      setResults((prev) => prev.filter((v) => v._id !== id));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to add volunteer', 'error');
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (id, name) => {
    if (!window.confirm(`Remove ${name} from your team?`)) return;
    setRemoving(id);
    try {
      await ngoService.removeVolunteer(id);
      showToast('Volunteer removed', 'success');
      loadLinked();
    } catch {
      showToast('Failed to remove volunteer', 'error');
    } finally {
      setRemoving(null);
    }
  };

  const linkedIds = new Set(linked.map((v) => v._id));
  const filteredResults = results.filter((v) => !linkedIds.has(v._id));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Volunteers</h1>
        <p className="page-subtitle">Build your team. Search for approved volunteers and add them.</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-3" style={{ marginBottom: 'var(--space-6)' }}>
        <input
          className="form-input"
          placeholder="Search by name or city…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" className="btn btn-primary" disabled={searching}>
          {searching ? <span className="spinner" style={{ width: 16, height: 16 }} /> : '🔍 Search'}
        </button>
      </form>

      {/* Search results */}
      {searched && (
        <>
          {filteredResults.length === 0 && !searching && (
            <div className="alert" style={{ marginBottom: 'var(--space-6)', background: 'var(--surface)', border: '1px solid var(--border)' }}>
              No new volunteers found{search ? ` for "${search}"` : ''}.
            </div>
          )}
          {filteredResults.length > 0 && (
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
                Search results ({filteredResults.length})
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                {filteredResults.map((v) => (
                  <div key={v._id} className="card-flat flex items-center gap-4">
                    <div className="avatar"><span>{v.name[0].toUpperCase()}</span></div>
                    <div style={{ flex: 1 }}>
                      <p className="font-semi">{v.name}</p>
                      <p className="text-sm text-muted">{v.city} · {v.email}</p>
                    </div>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleAdd(v._id)}
                      disabled={adding === v._id}
                    >
                      {adding === v._id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '+ Add'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Team */}
      <h2 className="section-title" style={{ marginBottom: 'var(--space-4)' }}>
        Your team ({linked.length})
      </h2>
      {linked.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🚴</div>
          <p className="empty-state-title">No volunteers yet</p>
          <p className="text-muted text-sm">Use the search above to find and add approved volunteers.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {linked.map((v) => (
            <div key={v._id} className="card-flat flex items-center gap-4">
              <div className="avatar"><span>{v.name[0].toUpperCase()}</span></div>
              <div style={{ flex: 1 }}>
                <p className="font-semi">{v.name}</p>
                <p className="text-sm text-muted">{v.city} · {v.email}</p>
              </div>
              <span className={`badge ${v.isVerified ? 'badge-approved' : 'badge-pending'}`} style={{ marginRight: 'var(--space-2)' }}>
                {v.isVerified ? 'Verified' : 'Unverified'}
              </span>
              <button
                className="btn btn-sm"
                style={{ background: 'rgba(220,38,38,0.08)', color: '#dc2626', border: '1px solid rgba(220,38,38,0.2)' }}
                onClick={() => handleRemove(v._id, v.name)}
                disabled={removing === v._id}
              >
                {removing === v._id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Remove'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function NGODashboard() {
  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route index element={<NearbyListings />} />
            <Route path="collections" element={<Collections />} />
            <Route path="volunteers" element={<VolunteerList />} />
            <Route path="log" element={<DistributionLogForm />} />
          </Routes>
        </main>
      </div>
    </>
  );
}
