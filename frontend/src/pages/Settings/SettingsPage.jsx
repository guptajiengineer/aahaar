import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { showToast, ToastContainer } from '../../components/common/Toast';
import Navbar from '../../components/common/Navbar';
import * as userService from '../../services/userService';

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    address: '',
  });
  const [loading, setLoading] = useState(false);

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

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

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

  return (
    <>
      <Navbar />
      <ToastContainer />
      <div className="container" style={{ padding: 'var(--space-8) var(--space-4)' }}>
        <div style={{ maxWidth: 600, margin: '0 auto' }}>
          <div className="page-header">
            <h1 className="page-title">Settings & Profile</h1>
            <p className="page-subtitle">Update your personal and contact details.</p>
          </div>

          <div className="card">
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="phone">Phone Number</label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="city">City</label>
                <input
                  id="city"
                  name="city"
                  type="text"
                  className="form-input"
                  value={formData.city}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="address">Address</label>
                <textarea
                  id="address"
                  name="address"
                  className="form-textarea"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 'var(--space-4)' }}>
                {loading ? <span className="spinner" style={{ width: 18, height: 18 }} /> : 'Save Changes'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
