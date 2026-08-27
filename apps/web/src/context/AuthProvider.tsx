'use client';

import type { AuthUser, LearnerState, LoginDto, RegisterDto } from '@kia-academy/shared';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api, ApiError } from '@/lib/api';
import { clearTokens, getAccessToken } from '@/lib/auth';
import { ensureDemoSession } from '@/lib/demoApi';
import { isDemoMode } from '@/lib/demoMode';

interface AuthContextValue {
  user: AuthUser | null;
  learnerState: LearnerState | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (dto: LoginDto) => Promise<AuthUser>;
  register: (dto: RegisterDto) => Promise<AuthUser>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [learnerState, setLearnerState] = useState<LearnerState | null>(null);
  const [loading, setLoading] = useState(true);

  const applyLearnerState = useCallback((state: LearnerState) => {
    setUser(state.user);
    setLearnerState(state);
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setLearnerState(null);
    clearTokens();
  }, []);

  const refreshSession = useCallback(async () => {
    try {
      if (isDemoMode()) {
        ensureDemoSession();
      } else if (!getAccessToken()) {
        await api.refresh();
      }
      const state = await api.me();
      applyLearnerState(state);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearSession();
        return;
      }
      throw err;
    }
  }, [applyLearnerState, clearSession]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        if (isDemoMode()) {
          ensureDemoSession();
        }
        await refreshSession();
      } catch {
        if (!cancelled) clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshSession, clearSession]);

  const login = useCallback(
    async (dto: LoginDto) => {
      const res = await api.login(dto);
      setUser(res.user);
      const state = await api.me();
      applyLearnerState(state);
      return state.user;
    },
    [applyLearnerState],
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      const res = await api.register(dto);
      setUser(res.user);
      const state = await api.me();
      applyLearnerState(state);
      return state.user;
    },
    [applyLearnerState],
  );

  const logout = useCallback(async () => {
    try {
      await api.logout();
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      learnerState,
      loading,
      isAuthenticated: !!user,
      login,
      register,
      logout,
      refreshSession,
    }),
    [user, learnerState, loading, login, register, logout, refreshSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
