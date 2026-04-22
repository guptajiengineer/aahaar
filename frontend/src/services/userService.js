import api from './api';

export const getMyNotifications = (params) => api.get('/notifications', { params });
export const markAsRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllAsRead = () => api.put('/notifications/read-all');

export const getThread = (listingId) => api.get(`/messages/${listingId}`);
export const sendMessage = (listingId, content) =>
  api.post(`/messages/${listingId}`, { content });

export const getMe = () => api.get('/users/me');
export const updateMe = (data) => api.put('/users/me', data);
export const uploadProfilePhoto = (formData) =>
  api.put('/users/me/photo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
