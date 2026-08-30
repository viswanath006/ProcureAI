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
  const [user, setUser] = useState<User | null>(null);
  const [accessTokenState, setAccessTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Attempt silent refresh on initial application load
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const response = await api.refresh();
        if (isMounted && response.success && response.data) {
          const { user: refreshedUser, accessToken } = response.data;
          setAccessToken(accessToken);
          setAccessTokenState(accessToken);
          setUser(refreshedUser);
        } else {
          setAccessToken(null);
          setAccessTokenState(null);
          setUser(null);
        }
      } catch {
        if (isMounted) {
          setAccessToken(null);
          setAccessTokenState(null);
          setUser(null);
        }
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
        const { user: loggedInUser, accessToken } = response.data;
        setAccessToken(accessToken);
        setAccessTokenState(accessToken);
        setUser(loggedInUser);
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
          const { user: registeredUser, accessToken } = response.data;
          setAccessToken(accessToken);
          setAccessTokenState(accessToken);
          setUser(registeredUser);
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
    try {
      await api.logout();
    } finally {
      setAccessToken(null);
      setAccessTokenState(null);
      setUser(null);
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
