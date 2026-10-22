import { getApp, getApps, initializeApp } from 'firebase/app';
// @ts-ignore Firebase exposes React Native persistence at runtime.
import { getAuth, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { firebaseConfig } from '../config';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = (() => {
  try {
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
})();

export const friendlyAuthError = (e: any): string => {
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/invalid-email': 'Please enter a valid email.',
    'auth/email-already-in-use': 'An account with this email already exists. Please login.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'No internet connection.',
    'auth/requires-recent-login': 'Please enter your password again.',
  };
  return map[e?.code] ?? e?.detail ?? e?.message ?? 'Something went wrong. Please try again.';
};
