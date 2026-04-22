import api from './api';

export const register = (data) => api.post('/auth/register', data);
export const verifyEmail = (userId, otp) => api.post('/auth/verify-email', { userId, otp });
export const resendOTP = (userId) => api.post('/auth/resend-otp', { userId });
export const login = (email, password) => api.post('/auth/login', { email, password });
export const logout = () => api.post('/auth/logout');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const resetPassword = (token, password) => api.put(`/auth/reset-password/${token}`, { password });
