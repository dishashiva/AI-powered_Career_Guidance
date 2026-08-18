import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, usersAPI } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = localStorage.getItem('access_token');
    if (!token) { setLoading(false); return; }
    try {
      const res = await usersAPI.getMe();
      setUser(res.data);
    } catch {
      localStorage.removeItem('access_token');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadUser(); }, [loadUser]);

  const login = async (email, password) => {
    const res = await authAPI.login(email, password);
    localStorage.setItem('access_token', res.data.access_token);
    const userRes = await usersAPI.getMe();
    setUser(userRes.data);
    return userRes.data;
  };

  const register = async (data) => {
    await authAPI.register(data);
    await login(data.email, data.password);
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
