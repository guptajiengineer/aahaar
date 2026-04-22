import api from './api';

export const getMyListings = (params) => api.get('/donor/listings', { params });
export const getListingById = (id) => api.get(`/donor/listings/${id}`);
export const createListing = (formData) =>
  api.post('/donor/listings', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateListing = (id, formData) =>
  api.put(`/donor/listings/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const closeListing = (id) => api.put(`/donor/listings/${id}/close`);
export const getDonorStats = () => api.get('/donor/stats');
