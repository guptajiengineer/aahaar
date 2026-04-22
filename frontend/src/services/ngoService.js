import api from './api';

export const getNearbyListings = (params) => api.get('/ngo/listings/nearby', { params });
export const claimListing = (id) => api.put(`/ngo/listings/${id}/claim`);
export const assignVolunteer = (listingId, volunteerId) =>
  api.put(`/ngo/listings/${listingId}/assign-volunteer`, { volunteerId });
export const getMyCollections = (tab) => api.get('/ngo/collections', { params: { tab } });
export const getLinkedVolunteers = () => api.get('/ngo/volunteers');
export const logDistribution = (data) => api.post('/ngo/distribution-log', data);
export const getNGOStats = () => api.get('/ngo/stats');
