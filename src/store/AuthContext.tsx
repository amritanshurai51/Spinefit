import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  User,
} from 'firebase/auth';
import { auth } from '../api/firebase';
import { Api, Profile } from '../api/endpoints';
import { signInWithGoogle } from '../services/googleAuth';

const Ctx = createContext<any>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);
  const [fbUser, setFbUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const registering = useRef(false);
  const googleLoginInProgress = useRef(false);

  useEffect(() => onAuthStateChanged(auth, async user => {
    setFbUser(user);
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    // Google sign-in validates /auth/me in googleAuth before releasing the
    // navigator from its loading state.
    if (googleLoginInProgress.current) return;
    if (!registering.current) {
      try { setProfile(await Api.me()); }
      catch { setProfile(null); }
    }
    setLoading(false);
  }), []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    googleLoginInProgress.current = true;
    setLoading(true);
    try {
      const verifiedProfile = await signInWithGoogle();
      if (verifiedProfile) setProfile(verifiedProfile);
      return Boolean(verifiedProfile);
    } finally {
      googleLoginInProgress.current = false;
      setLoading(false);
    }
  };

   const register = async (name: string, email: string, password: string) => {
    registering.current = true;
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      const me = await Api.me();
      setProfile(name?.trim() ? await Api.setName(name.trim()) : me);
    } finally {
      registering.current = false;
    }
  };

  const resetPassword = (email: string) => sendPasswordResetEmail(auth, email);
  const logout = () => signOut(auth);
  const updateName = async (name: string) => setProfile(await Api.setName(name));

  const deleteAccount = async (password: string) => {
    const user = auth.currentUser;
    if (!user?.email) throw new Error('Please sign in again.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
    await user.getIdToken(true);
    try {
      await Api.deleteMe();
    } catch (error: any) {
      if (error?.code !== 'account_not_found') throw error;
    }
    await signOut(auth);
  };

  return (
    <Ctx.Provider value={{
      loading,
      token: fbUser ? fbUser.uid : null,
      user: fbUser,
      profile,
      login,
      loginWithGoogle,
      register,
      resetPassword,
      logout,
      updateName,
      deleteAccount,
    }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => useContext(Ctx);
