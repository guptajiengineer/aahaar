import { createContext, useContext, useState, useCallback } from 'react';
// ─── DEMO MODE ────────────────────────────────────────────────────────────────
// Real auth (loginApi, logoutApi, getMe) is bypassed entirely.
// Login just sets a fake user object in memory — no backend needed.
// To restore: uncomment the real imports below and swap the login/logout/useEffect back.
// import { login as loginApi, logout as logoutApi } from '../services/authService';
// import { getMe } from '../services/userService';
// ─────────────────────────────────────────────────────────────────────────────

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading] = useState(false); // no async init needed in demo mode

  // ── DEMO login: just build a fake user from name + role, no API call ──
  const login = useCallback(async (name, role) => {
    const fakeUser = {
      _id: 'demo-user-001',
      name: name || 'Demo User',
      email: `${(name || 'demo').toLowerCase().replace(/\s+/g, '.')}@demo.com`,
      role: role || 'donor',
      isVerified: true,
      isApproved: true,
      isSuspended: false,
      city: 'Demo City',
      profilePhoto: null,
    };
    setUser(fakeUser);
    return fakeUser;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
  }, []);

  const updateUser = useCallback((updates) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
