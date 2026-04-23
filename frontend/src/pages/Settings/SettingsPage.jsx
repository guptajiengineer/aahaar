import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { showToast, ToastContainer } from '../../components/common/Toast';
import Navbar from '../../components/common/Navbar';
import * as userService from '../../services/userService';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({ name: '', phone: '', city: '', address: '' });
  const [loading, setLoading] = useState(false);
  const [photoLoading, setPhotoLoading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        address: user.address || '',
      });
    }
  }, [user]);

  const handleChange = (e) => setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await userService.updateMe(formData);
      updateUser(data.user);
      showToast('Profile updated successfully', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fd = new FormData();
    fd.append('photo', file);
    setPhotoLoading(true);
    try {
      const { data } = await userService.uploadProfilePhoto(fd);
      updateUser(data.user);
      showToast('Profile photo updated!', 'success');
    } catch (err) {
      const msg = err.response?.data?.message || '';
      if (msg.toLowerCase().includes('cloudinary') || err.response?.status === 500) {
        showToast('Photo upload is not configured yet. Contact support.', 'error');
      } else {
        showToast(msg || 'Failed to upload photo', 'error');
      }
    } finally {
      setPhotoLoading(false);
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="page-header">
            <h1 className="page-title">Settings &amp; Profile</h1>
            <p className="page-subtitle">Update your personal and contact details.</p>
          </div>

          {/* ── Profile photo ── */}
          <div className="card" style={{ marginBottom: 'var(--space-5)', display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
            {/* Avatar */}
            <div
              style={{
                width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, border: '3px solid var(--border)',
              }}
            >
              {user?.profilePhoto ? (
                <img src={user.profilePhoto} alt={user.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: '#fff', fontWeight: 700, fontSize: '1.4rem' }}>{initials}</span>
              )}
            </div>

            <div style={{ flex: 1 }}>
              <p className="font-semi" style={{ marginBottom: 4 }}>Profile Photo</p>
              <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-3)' }}>JPG, PNG or WebP. Max 3 MB.</p>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" style={{ display: 'none' }} onChange={handlePhotoChange} />
              <button
                className="btn btn-outline btn-sm"
                onClick={() => fileRef.current?.click()}
                disabled={photoLoading}
              >
                {photoLoading ? <span className="spinner" style={{ width: 14, height: 14 }} /> : '📷 Change photo'}
              </button>
            </div>
          </div>

          {/* ── Profile form ── */}
          <div className="card">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input id="name" name="name" type="text" className="form-input" value={formData.name} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input id="phone" name="phone" type="tel" className="form-input" value={formData.phone} onChange={handleChange} />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="city">City</label>
                <input id="city" name="city" type="text" className="form-input" value={formData.city} onChange={handleChange} required />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="address">Address</label>
                <textarea id="address" name="address" className="form-textarea" rows={3} value={formData.address} onChange={handleChange} />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 'var(--space-4)' }}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Changes'}
              </button>
            </form>
          </div>

          {/* ── Account info ── */}
          <div className="card-flat" style={{ marginTop: 'var(--space-5)', display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Email</span>
              <span className="text-sm font-semi">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Role</span>
              <span className="text-sm font-semi" style={{ textTransform: 'capitalize' }}>{user?.role}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted">Account status</span>
              <span className={`badge ${user?.isApproved ? 'badge-approved' : 'badge-pending'}`}>
                {user?.isApproved ? 'Approved' : 'Pending Review'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
