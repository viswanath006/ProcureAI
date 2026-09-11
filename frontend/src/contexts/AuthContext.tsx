import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { api, setAccessToken, User } from '../api/client';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<{ success: boolean; error?: string }>;
  register: (payload: {
    email: string;
    password: string;
    full_name: string;
    role_code: string;
    company_id?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  switchDemoRole: (email: string, roleName: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('procureai_user');
      return saved ? (JSON.parse(saved) as User) : null;
    } catch {
      return null;
    }
  });

  const [accessTokenState, setAccessTokenState] = useState<string | null>(() => {
    try {
      const token = localStorage.getItem('procureai_access_token');
      if (token) setAccessToken(token);
      return token;
    } catch {
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('procureai_user');
    } catch {
      return true;
    }
  });

  // Attempt silent refresh in background or on initial application load
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const savedRefreshToken = (() => {
        try {
          return localStorage.getItem('procureai_refresh_token');
        } catch {
          return null;
        }
      })();

      try {
        const response = await api.refresh(savedRefreshToken);
        if (isMounted && response.success && response.data) {
          const { user: refreshedUser, accessToken, refreshToken } = response.data;
          setAccessToken(accessToken);
          setAccessTokenState(accessToken);
          setUser(refreshedUser);
          try {
            localStorage.setItem('procureai_user', JSON.stringify(refreshedUser));
            localStorage.setItem('procureai_access_token', accessToken);
            if (refreshToken) {
              localStorage.setItem('procureai_refresh_token', refreshToken);
            }
          } catch {}
        } else {
          // Only clear if the refresh was rejected due to an invalid/expired token
          const code = response.error?.code;
          if (code === 'TOKEN_INVALID' || code === 'TOKEN_EXPIRED' || code === 'TOKEN_REUSE') {
            setAccessToken(null);
            setAccessTokenState(null);
            setUser(null);
            try {
              localStorage.removeItem('procureai_user');
              localStorage.removeItem('procureai_access_token');
              localStorage.removeItem('procureai_refresh_token');
            } catch {}
          }
        }
      } catch {
        // Network offline — keep cached offline session
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(async (credentials: { email: string; password: string }) => {
    setIsLoading(true);
    try {
      const response = await api.login(credentials);
      if (response.success && response.data) {
        const { user: loggedInUser, accessToken, refreshToken } = response.data;
        setAccessToken(accessToken);
        setAccessTokenState(accessToken);
        setUser(loggedInUser);
        try {
          localStorage.setItem('procureai_user', JSON.stringify(loggedInUser));
          localStorage.setItem('procureai_access_token', accessToken);
          if (refreshToken) {
            localStorage.setItem('procureai_refresh_token', refreshToken);
          }
        } catch {}
        setIsLoading(false);
        return { success: true };
      } else {
        setIsLoading(false);
        return {
          success: false,
          error: response.error?.message || 'Login failed. Please check your credentials.',
        };
      }
    } catch (err) {
      setIsLoading(false);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unexpected login error',
      };
    }
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      password: string;
      full_name: string;
      role_code: string;
      company_id?: string;
    }) => {
      setIsLoading(true);
      try {
        const response = await api.register(payload);
        if (response.success && response.data) {
          const { user: registeredUser, accessToken, refreshToken } = response.data;
          setAccessToken(accessToken);
          setAccessTokenState(accessToken);
          setUser(registeredUser);
          try {
            localStorage.setItem('procureai_user', JSON.stringify(registeredUser));
            localStorage.setItem('procureai_access_token', accessToken);
            if (refreshToken) {
              localStorage.setItem('procureai_refresh_token', refreshToken);
            }
          } catch {}
          setIsLoading(false);
          return { success: true };
        } else {
          setIsLoading(false);
          return {
            success: false,
            error: response.error?.message || 'Registration failed.',
          };
        }
      } catch (err) {
        setIsLoading(false);
        return {
          success: false,
          error: err instanceof Error ? err.message : 'Unexpected registration error',
        };
      }
    },
    []
  );

  const logout = useCallback(async () => {
    const savedRefreshToken = (() => {
      try {
        return localStorage.getItem('procureai_refresh_token');
      } catch {
        return null;
      }
    })();

    try {
      await api.logout(savedRefreshToken);
    } finally {
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
      try {
        localStorage.removeItem('procureai_user');
        localStorage.removeItem('procureai_access_token');
        localStorage.removeItem('procureai_refresh_token');
      } catch {}
    }
  }, []);

  // Quick switch between demo roles for pairing / evaluation testing
  const switchDemoRole = useCallback(
    async (email: string) => {
      await login({ email, password: 'ProcureAI_Dev_2026!' });
    },
    [login]
  );

  const value: AuthContextType = {
    user,
    accessToken: accessTokenState,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    switchDemoRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
