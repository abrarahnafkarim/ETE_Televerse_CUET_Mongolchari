import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import type { Admin, LoginCredentials, AuthState } from '../types';
import apiService from '../services/api';
import mockApiService from '../services/mockApi';
import websocketService from '../services/websocket';

const USE_MOCK = import.meta.env.VITE_USE_MOCK_DATA === 'true';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    admin: null,
    token: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const decoded: any = jwtDecode(token);
        const isExpired = decoded.exp * 1000 < Date.now();

        if (!isExpired) {
          const adminData = localStorage.getItem('admin_data');
          if (adminData) {
            const admin = JSON.parse(adminData);
            setAuthState({
              isAuthenticated: true,
              admin,
              token,
            });
            websocketService.connect(token);
          }
        } else {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('admin_data');
        }
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('admin_data');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      const service = USE_MOCK ? mockApiService : apiService;
      const response = await service.login(credentials);

      if (response.success && response.data) {
        const { token, admin } = response.data as any;
        
        localStorage.setItem('auth_token', token);
        localStorage.setItem('admin_data', JSON.stringify(admin));

        setAuthState({
          isAuthenticated: true,
          admin,
          token,
        });

        websocketService.connect(token);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(error.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('admin_data');
    websocketService.disconnect();

    setAuthState({
      isAuthenticated: false,
      admin: null,
      token: null,
    });

    // Call logout endpoint (fire and forget)
    const service = USE_MOCK ? mockApiService : apiService;
    service.logout().catch(console.error);
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

