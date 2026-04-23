import api from './api';

export const getVerificationQueue = () => api.get('/admin/verification-queue');
export const approveUser = (id, approved, reason) =>
  api.put(`/admin/users/${id}/approve`, { approved, reason });
export const getAllUsers = (params) => api.get('/admin/users', { params });
export const suspendUser = (id) => api.put(`/admin/users/${id}/suspend`);
export const getPlatformStats = () => api.get('/admin/stats');
export const sendAnnouncement = (message, targetRoles) =>
  api.post('/admin/announcement', { message, targetRoles });
export const getLiveActivity = () => api.get('/admin/activity');

// Listing Management
export const getPendingListings = () => api.get('/admin/listings/pending');
export const approveListing = (id, approved) => api.put(`/admin/listings/${id}/approve`, { approved });
export const assignListingToNGO = (id, ngoId) => api.put(`/admin/listings/${id}/assign-ngo`, { ngoId });
export const assignListingToVolunteer = (id, volunteerId) => api.put(`/admin/listings/${id}/assign-volunteer`, { volunteerId });
