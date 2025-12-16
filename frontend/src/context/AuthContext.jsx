import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

const TOKEN_KEY = "venus_token";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken) {
      setToken(storedToken);
      // If token exists, assume user is authenticated
      // In a real app, you might want to validate the token with the backend
      setUser({ username: "admin" });
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Validation
      if (!username || !username.trim() || !password || !password.trim()) {
        return false;
      }

      // ⚠️ GEÇİCİ ÇÖZÜM: Backend login endpoint'i olmadığı için mock authentication kullanılıyor
      // TODO: Backend'de /api/auth/login endpoint'i oluşturulduğunda bu kısım API çağrısı ile değiştirilecek
      // Example: 
      //   const response = await apiClient.post('/auth/login', { username, password });
      //   if (response.data.success && response.data.token) {
      //     localStorage.setItem(TOKEN_KEY, response.data.token);
      //     setToken(response.data.token);
      //     setUser({ username: username.trim() });
      //     return true;
      //   }
      //   return false;

      // GEÇİCİ: Sadece admin/admin123 kabul et
      const trimmedUsername = username.trim();
      const trimmedPassword = password.trim();
      
      if (trimmedUsername === "admin" && trimmedPassword === "admin123") {
        // Başarılı login - token set et
        const mockToken = `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem(TOKEN_KEY, mockToken);
        setToken(mockToken);
        setUser({ username: trimmedUsername });
        return true;
      }

      // Başarısız login - token set ETME
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}

