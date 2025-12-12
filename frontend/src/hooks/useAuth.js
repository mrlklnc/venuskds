import { useState, useEffect } from 'react';

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    setLoading(false);
  }, []);

  const login = (username, password) => {
    // Simple authentication - in production, this would call an API
    if (username === 'admin' && password === 'admin123') {
      localStorage.setItem('authToken', 'mock-token-' + Date.now());
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
  };

  return { isAuthenticated, loading, login, logout };
};

