import { GoogleSignin, isErrorWithCode, statusCodes } from '@react-native-google-signin/google-signin';
import { GoogleAuthProvider, signInWithCredential, signOut } from 'firebase/auth';
import { auth } from '../api/firebase';
import { Profile } from '../api/endpoints';
import { BASE_URL } from '../config';

const GOOGLE_WEB_CLIENT_ID = '532964959512-98inim78d01rfjnabj0g4rpn49336q54.apps.googleusercontent.com';

// This module is imported by AuthContext at app startup, so configure native
// Google sign-in once before the login screen can invoke it.
GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

export class GoogleSignInError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.name = 'GoogleSignInError';
    this.code = options?.code;
    this.status = options?.status;
  }
}

export async function signInWithGoogle(): Promise<Profile | null> {
  let firebaseSignedIn = false;

  try {
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const result = await GoogleSignin.signIn();
    const response = result as unknown as {
      type?: string;
      data?: { idToken?: string | null } | null;
      idToken?: string | null;
    };

    if (response.type === 'cancelled' || response.type === 'canceled') return null;

    // v16 returns `{ type, data }`; older versions returned the user fields at
    // the top level. Supporting both avoids coupling this flow to one shape.
    const idToken = response.data?.idToken ?? response.idToken;
    if (!idToken) {
      throw new GoogleSignInError('Google did not return an ID token. Check the Google Web client ID configuration.', { code: 'missing_google_id_token' });
    }

    const credential = GoogleAuthProvider.credential(idToken);
    const userCred = await signInWithCredential(auth, credential);
    firebaseSignedIn = true;

    const firebaseIdToken = await userCred.user.getIdToken();
    const responseFromApi = await fetch(`${BASE_URL}/auth/me`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${firebaseIdToken}`, Accept: 'application/json' },
    });
    const body = await responseFromApi.json().catch(() => ({}));

    if (!responseFromApi.ok) {
      const detail = typeof body?.detail === 'string' ? body.detail : 'The SpineFit server could not verify your account.';
      throw new GoogleSignInError(
        responseFromApi.status === 401
          ? `Google sign-in succeeded, but the SpineFit server rejected the Firebase token (HTTP 401). Check that the backend uses the same Firebase project. ${detail}`
          : `Google sign-in succeeded, but account verification failed (HTTP ${responseFromApi.status}). ${detail}`,
        { code: body?.code, status: responseFromApi.status },
      );
    }

    return body as Profile;
  } catch (error: any) {
    const isCancelled = error?.code === statusCodes.SIGN_IN_CANCELLED ||
      error?.code === 'SIGN_IN_CANCELLED' || error?.code === 'SIGN_IN_CANCELED';
    if (isCancelled) return null;

    // Do not leave Firebase authenticated if the backend did not accept the
    // session; RootNavigator uses Firebase auth state to enter the app.
    if (firebaseSignedIn) {
      try { await signOut(auth); } catch { /* keep the original sign-in error */ }
    }

    throw error;
  }
}

export function googleSignInErrorMessage(error: any): string {
  if (error instanceof GoogleSignInError) return error.message;

  if (isErrorWithCode(error)) {
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      return 'Google Play services are unavailable or need an update on this phone.';
    }
    if (error.code === 'DEVELOPER_ERROR') {
      return 'Google sign-in setup failed (DEVELOPER_ERROR). Verify the Android package name, SHA-1 certificate, and Firebase Google client settings.';
    }
    if (error.code === statusCodes.IN_PROGRESS) return 'Google sign-in is already in progress.';
  }

  if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/invalid-idp-response') {
    return 'Google authenticated, but Firebase rejected the credential. Check the Firebase project and Google provider configuration.';
  }
  if (error?.message?.includes('Network request failed') || error?.message?.includes('fetch')) {
    return 'Could not reach the SpineFit server. Check your internet connection and try again.';
  }

  return error?.message ?? 'Google sign-in failed. Please try again.';
}
