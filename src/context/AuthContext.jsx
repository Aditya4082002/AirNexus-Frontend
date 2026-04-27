import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../api/services';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    if (token && userId) {
      authAPI.getProfile()
        .then((res) => setUser(res.data))
        .catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('userId');
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    const res = await authAPI.login(credentials);
    const { token, userId, email, role } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    setUser({ userId, email, role, ...res.data });
    return res.data;
  };

  const googleLogin = async (idToken) => {
    const res = await authAPI.googleLogin(idToken);
    const { token, userId, email, role } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    setUser({ userId, email, role, ...res.data });
    return res.data;
  };

  const register = async (data) => {
    const res = await authAPI.register(data);
    const { token, userId, email, role } = res.data;
    localStorage.setItem('token', token);
    localStorage.setItem('userId', userId);
    setUser({ userId, email, role, ...res.data });
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    setUser(null);
  };

  const refreshUser = async () => {
    const res = await authAPI.getProfile();
    setUser(res.data);
  };

  const isAdmin = () => user?.role === 'ADMIN';
  const isStaff = () => user?.role === 'AIRLINE_STAFF';
  const isPassenger = () => !user || user?.role === 'PASSENGER';
  const isLoggedIn = () => !!user;

  return (
    <AuthContext.Provider value={{ user, loading, login, googleLogin, register, logout, refreshUser, isAdmin, isStaff, isPassenger, isLoggedIn }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
