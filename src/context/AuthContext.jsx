import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // 🔥 Page refresh ke baad auto login aur redirect
  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('currentUser');

    if (token && storedUser) {
      const userData = JSON.parse(storedUser);
      setUser(userData);
      setIsAuthenticated(true);

      // Redirect to correct dashboard based on role if on the landing page,
      // or if already logged in but sent back to /auth (e.g. clicking
      // "Book Ride" on the landing hero widget) — no need to log in again.
      const currentPath = window.location.pathname;
      if (currentPath === '/' || currentPath === '/auth') {
        redirectToDashboard(userData.role);
      }
    }
    
    setIsLoading(false);
  }, []);

  const redirectToDashboard = (role) => {
    switch (role) {
      case 'customer':
        navigate('/customer', { replace: true });
        break;
      case 'provider':
        navigate('/driver', { replace: true });
        break;
      case 'admin':
        navigate('/admin', { replace: true });
        break;
      default:
        navigate('/', { replace: true });
    }
  };

  const login = (userData, token, refreshToken) => {
    localStorage.setItem('token', token);
    if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);

    // Note: Navigation now handled in LoginForm component
  };

  const logout = async () => {
    try {
      await authAPI.logout(localStorage.getItem('refreshToken'));
    } catch (error) {
      console.error('Logout API error:', error);
    }

    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
    navigate('/', { replace: true });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
