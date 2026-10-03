import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api, { storage, setSessionExpiredHandler } from '../api/api';
import { useToast } from './ToastContext';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const toast = useToast();
  const [session, setSession] = useState(null);   // { user, clinic, permissions, modules }
  const [booting, setBooting] = useState(Boolean(storage.getToken()));

  const logout = useCallback(() => {
    storage.clearToken();
    setSession(null);
  }, []);

  // Token rejected by the server (expired, disabled, password reset…)
  useEffect(() => {
    setSessionExpiredHandler((message) => {
      setSession((s) => {
        if (s) toast(message);
        return null;
      });
    });
  }, [toast]);

  // Restore the session when the app opens
  useEffect(() => {
    if (!storage.getToken()) return;
    api.auth.me()
      .then(setSession)
      .catch(() => {})
      .finally(() => setBooting(false));
  }, []);

  const login = useCallback(async (clinicCode, loginId, password) => {
    const { token, ...rest } = await api.auth.login(clinicCode, loginId, password);
    storage.setToken(token);
    storage.setClinicCode(clinicCode);
    setSession(rest);
    return rest;
  }, []);

  const refresh = useCallback(() => api.auth.me().then(setSession), []);

  const value = useMemo(() => {
    const perms = session?.permissions;
    return {
      session,
      user: session?.user,
      clinic: session?.clinic,
      perms,
      booting,
      login,
      logout,
      refresh,
      setClinic: (clinic) => setSession((s) => ({ ...s, clinic: { ...s.clinic, ...clinic } })),
      /** can('appointments') / can('appointments', 'edit') */
      can: (module, level = 'view') => {
        const a = perms?.modules?.[module];
        return level === 'edit' ? a === 'edit' : Boolean(a);
      },
    };
  }, [session, booting, login, logout, refresh]);

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
