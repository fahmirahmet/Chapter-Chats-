import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Refresh profile from backend endpoint /users/me/
  const refreshProfile = async () => {
    try {
      const res = await apiClient.get('/users/me/');
      if (res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
        setIsAuthenticated(true);
        return res.data;
      }
    } catch (err) {
      console.warn('Could not refresh user profile:', err);
      throw err;
    }
  };

  // Immediate in-memory user update helper
  const updateUser = (fields) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...fields };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  // Phone-based Login Function with optional Admin verification
  const login = async (phoneOrIdentifier, password, asAdmin = false) => {
    try {
      const cleanPhone = (phoneOrIdentifier || '').trim();
      if (!cleanPhone) {
        return { success: false, error: 'Please enter your phone number.' };
      }

      let res;
      try {
        res = await apiClient.post('/accounts/login/', { 
          phone_number: cleanPhone, 
          username: cleanPhone, 
          password 
        });
      } catch (firstErr) {
        res = await apiClient.post('/auth/token/', { 
          phone_number: cleanPhone, 
          username: cleanPhone, 
          password 
        });
      }

      if (res.data && res.data.access) {
        const { access, refresh } = res.data;
        localStorage.setItem('access_token', access);
        if (refresh) localStorage.setItem('refresh_token', refresh);
        setTokens({ access, refresh });

        const profileData = await refreshProfile();

        // If login requested as Admin, verify executive/staff permissions
        if (asAdmin) {
          const isStaffOrAdmin = profileData?.is_staff || profileData?.is_superuser || profileData?.role === 'ADMIN' || profileData?.role === 'OFFICER' || profileData?.role === 'OWNER';
          if (!isStaffOrAdmin) {
            logout();
            return {
              success: false,
              error: 'Access restricted to executive officers and administrators.'
            };
          }
        }

        return { success: true, user: profileData };
      }

      return { success: false, error: 'No access token received.' };
    } catch (err) {
      console.error('Login error:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.non_field_errors?.[0] || 'Invalid login credentials';
      return { success: false, error: errorMsg };
    }
  };

  // Direct Registration Function
  const register = async (registerData) => {
    try {
      const res = await apiClient.post('/accounts/apply/', registerData);
      if (res.data) {
        if (res.data.access) {
          const { access, refresh } = res.data;
          localStorage.setItem('access_token', access);
          if (refresh) localStorage.setItem('refresh_token', refresh);
          setTokens({ access, refresh });
          setUser(res.data.user || null);
          setIsAuthenticated(true);
        }
        return { success: true, data: res.data };
      }
    } catch (err) {
      console.error('Registration error:', err);
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.phone_number?.[0] || 'Registration failed';
      return { success: false, error: errorMsg };
    }
  };

  // Telegram Verification Code submission
  const verifyCode = async (phoneNumber, code) => {
    try {
      const res = await apiClient.post('/accounts/verify-code/', {
        phone_number: phoneNumber,
        code
      });
      if (res.data && res.data.access) {
        const { access, refresh } = res.data;
        localStorage.setItem('access_token', access);
        if (refresh) localStorage.setItem('refresh_token', refresh);
        setTokens({ access, refresh });
        setUser(res.data.user || null);
        setIsAuthenticated(true);
        return { success: true, message: res.data.message, user: res.data.user };
      }
      return { success: true, message: res.data.message };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Invalid verification code.';
      return { success: false, error: msg };
    }
  };

  // Dispatch / Request Telegram verification code
  const sendVerificationCode = async (phoneNumber) => {
    try {
      const res = await apiClient.post('/accounts/send-verification/', {
        phone_number: phoneNumber
      });
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to dispatch Telegram code.';
      return { success: false, error: msg };
    }
  };

  // Password reset request
  const resetPasswordRequest = async (phoneNumber) => {
    try {
      const res = await apiClient.post('/accounts/password-reset/request/', {
        phone_number: phoneNumber
      });
      return { success: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.phone_number?.[0] || err.response?.data?.detail || 'Failed to request password reset.';
      return { success: false, error: msg };
    }
  };

  // Password reset confirm
  const resetPasswordConfirm = async (phoneNumber, code, newPassword) => {
    try {
      const res = await apiClient.post('/accounts/password-reset/confirm/', {
        phone_number: phoneNumber,
        code,
        new_password: newPassword
      });
      return { success: true, message: res.data?.message || 'Password reset successfully!' };
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.detail || 'Failed to reset password.';
      return { success: false, error: msg };
    }
  };

  // Logout Function: Clears all tokens and resets user to null
  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setTokens(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  // Update Reading Progress
  const updateReadingProgress = async (pageNumber) => {
    const page = parseInt(pageNumber, 10);
    setUser(prev => prev ? { ...prev, current_page_read: page } : prev);

    try {
      const res = await apiClient.patch('/users/me/progress/', { current_page_read: page });
      if (res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.warn('Failed to persist progress on backend:', err);
    }
  };

  // Auth Initialization: Strictly check localStorage token; default to true Guest (null)
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      setIsLoading(true);
      const existingToken = localStorage.getItem('access_token');

      if (existingToken) {
        try {
          await refreshProfile();
        } catch (e) {
          console.warn('Stored token invalid or expired. Resetting to guest.');
          if (isMounted) {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('user');
            setTokens(null);
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        if (isMounted) {
          localStorage.removeItem('user');
          setUser(null);
          setIsAuthenticated(false);
        }
      }

      if (isMounted) setIsLoading(false);
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        verifyCode,
        sendVerificationCode,
        resetPasswordRequest,
        resetPasswordConfirm,
        logout,
        updateReadingProgress,
        refreshProfile,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
