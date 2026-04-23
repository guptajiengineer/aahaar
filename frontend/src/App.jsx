import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';

// Pages
import LandingPage from './pages/Landing/LandingPage';
import LoginPage from './pages/Auth/LoginPage';
import SignupPage from './pages/Auth/SignupPage';
import VerifyEmailPage from './pages/Auth/VerifyEmailPage';
import PendingApprovalPage from './pages/Auth/PendingApprovalPage';

import DonorDashboard from './pages/Donor/DonorDashboard';
import NGODashboard from './pages/NGO/NGODashboard';
import VolunteerDashboard from './pages/Volunteer/VolunteerDashboard';
import AdminPanel from './pages/Admin/AdminPanel';
import ChatPage from './pages/Chat/ChatPage';
import SettingsPage from './pages/Settings/SettingsPage';

function RoleRouter() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner spinner-lg" />
        <p className="text-muted text-sm">Loading...</p>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/signup" element={!user ? <SignupPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/pending-approval" element={<PendingApprovalPage />} />

      {/* Dashboard redirect */}
      <Route
        path="/dashboard"
        element={
          !user ? (
            <Navigate to="/login" replace />
          ) : !user.isApproved ? (
            <Navigate to="/pending-approval" replace />
          ) : user.role === 'donor' ? (
            <Navigate to="/donor" replace />
          ) : user.role === 'ngo' ? (
            <Navigate to="/ngo" replace />
          ) : user.role === 'volunteer' ? (
            <Navigate to="/volunteer" replace />
          ) : user.role === 'admin' ? (
            <Navigate to="/admin" replace />
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Role dashboards */}
      <Route
        path="/donor/*"
        element={user?.role === 'donor' ? <DonorDashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/ngo/*"
        element={user?.role === 'ngo' ? <NGODashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/volunteer/*"
        element={user?.role === 'volunteer' ? <VolunteerDashboard /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/admin/*"
        element={user?.role === 'admin' ? <AdminPanel /> : <Navigate to="/login" replace />}
      />

      {/* Shared Routes */}
      <Route
        path="/messages/:listingId"
        element={user && (user.role === 'donor' || user.role === 'ngo') ? <ChatPage /> : <Navigate to="/login" replace />}
      />
      <Route
        path="/settings"
        element={user ? <SettingsPage /> : <Navigate to="/login" replace />}
      />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <RoleRouter />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
