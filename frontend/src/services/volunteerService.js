import api from './api';

export const getAssignedTasks = () => api.get('/volunteer/tasks/assigned');
export const getOpenTasks = (params) => api.get('/volunteer/tasks/open', { params });
export const updateTaskStatus = (taskId, status, photo) => {
  const formData = new FormData();
  formData.append('status', status);
  if (photo) formData.append('photo', photo);
  return api.put(`/volunteer/tasks/${taskId}/status`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};
export const toggleAvailability = () => api.put('/volunteer/availability');
export const getVolunteerProfile = () => api.get('/volunteer/profile');
export const getLeaderboard = () => api.get('/volunteer/leaderboard');
