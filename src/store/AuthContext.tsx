import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { AuthApi } from '../api/endpoints';
import { TOKEN_KEY } from '../api/client';

const Ctx = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<{ name?: string; email?: string } | null>(null);

  useEffect(() => { SecureStore.getItemAsync(TOKEN_KEY).then(t => { setToken(t); setLoading(false); }); }, []);
  const persist = async (r: { token: string; user: any }) => { await SecureStore.setItemAsync(TOKEN_KEY, r.token); setUser(r.user); setToken(r.token); };

  const login = async (email: string, pw: string) => persist(await AuthApi.login(email, pw));
  const register = async (name: string, email: string, pw: string) => persist(await AuthApi.register(name, email, pw));
  const logout = async () => { await SecureStore.deleteItemAsync(TOKEN_KEY); setToken(null); setUser(null); };
  // DEV ONLY: skip the backend while it's being built. Remove before release.
  const devBypass = async () => persist({ token: 'dev', user: { name: 'Demo User', email: 'demo@spinefit.app' } });

  return <Ctx.Provider value={{ loading, token, user, login, register, logout, devBypass }}>{children}</Ctx.Provider>;
};
export const useAuth = () => useContext(Ctx);
