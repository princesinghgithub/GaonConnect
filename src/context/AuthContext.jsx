import React, { createContext, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

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

      // Redirect to correct dashboard based on role if on login page
      const currentPath = window.location.pathname;
      if (currentPath === '/') {
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

  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    
    // Note: Navigation now handled in LoginForm component
  };

  const logout = () => {
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
