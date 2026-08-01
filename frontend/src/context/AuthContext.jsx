import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/resources';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('gstprep_token');
    const cachedUser = localStorage.getItem('gstprep_user');

    if (token && cachedUser) {
      setUser(JSON.parse(cachedUser));
      // Verify the token is still valid in the background
      authApi
        .me()
        .then((res) => {
          setUser(res.data.user);
          localStorage.setItem('gstprep_user', JSON.stringify(res.data.user));
        })
        .catch(() => {
          localStorage.removeItem('gstprep_token');
          localStorage.removeItem('gstprep_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login({ email, password });
    localStorage.setItem('gstprep_token', res.data.token);
    localStorage.setItem('gstprep_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await authApi.register(payload);
    localStorage.setItem('gstprep_token', res.data.token);
    localStorage.setItem('gstprep_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const googleAuth = useCallback(async (payload) => {
    const res = await authApi.google(payload);
    localStorage.setItem('gstprep_token', res.data.token);
    localStorage.setItem('gstprep_user', JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('gstprep_token');
    localStorage.removeItem('gstprep_user');
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem('gstprep_token');
    if (!token) return null;
    try {
      const res = await authApi.me();
      setUser(res.data.user);
      localStorage.setItem('gstprep_user', JSON.stringify(res.data.user));
      return res.data.user;
    } catch {
      return null;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleAuth, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
