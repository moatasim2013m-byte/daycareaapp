import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const ROLES = {
  ADMIN: 'ADMIN',
  RECEPTION: 'RECEPTION',
  STAFF: 'STAFF',
  PARENT: 'PARENT'
};

export const getRoleHomePath = (role) => {
  const normalized = role?.toUpperCase?.() || '';
  switch (normalized) {
    case ROLES.PARENT:
      return '/parent/dashboard';
    case ROLES.STAFF:
    case ROLES.RECEPTION:
      return '/checkin';
    case ROLES.ADMIN:
      return '/';
    default:
      return '/login';
  }
};

const normalizeRole = (role) => role?.toUpperCase?.() || role;

const extractAuthData = (payload) => {
  const token = payload?.access_token || payload?.token;
  const rawUser = payload?.user || payload;
  const normalizedUser = rawUser
    ? {
        ...rawUser,
        role: normalizeRole(rawUser?.role || rawUser?.user_role),
      }
    : null;

  if (!token || !normalizedUser?.role) {
    throw new Error('Invalid authentication response');
  }

  return { token, user: normalizedUser };
};

const persistAuthSession = ({ token, user: userData }) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(userData));
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser({ ...parsedUser, role: normalizeRole(parsedUser?.role) });
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      } catch (e) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const authData = extractAuthData(response.data);

    persistAuthSession(authData);
    setUser(authData.user);
    return authData.user;
  };

  const demoLogin = ({ token, user: userData }) => {
    const authData = extractAuthData({ token, user: userData });
    persistAuthSession(authData);
    setUser(authData.user);
    return authData.user;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    const authData = extractAuthData(response.data);

    persistAuthSession(authData);
    setUser(authData.user);
    return authData.user;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    demoLogin,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === ROLES.ADMIN,
    isStaff: [ROLES.ADMIN, ROLES.RECEPTION, ROLES.STAFF].includes(user?.role),
    isParent: user?.role === ROLES.PARENT
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
