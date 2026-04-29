/**
 * Firebase initialisation for Electra.
 *
 * Exports:
 *   app           — Firebase app instance
 *   auth          — Firebase Auth instance (used by AuthContext and api.js interceptor)
 *   googleProvider — GoogleAuthProvider (used by signInWithGoogle in AuthContext)
 *   analytics     — Firebase Analytics (lazily initialised after consent check)
 *
 * Analytics is lazy: isSupported() is checked first because Analytics requires a browser
 * environment with certain APIs. This prevents errors in SSR or restricted environments.
 *
 * IMPORTANT: api.js imports `auth` from this file directly (not via useAuth hook)
 * to attach Bearer tokens in the axios request interceptor. React hooks cannot be
 * called outside React components — this is the correct pattern.
 */

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Analytics: initialise only if supported AND after consent (consent checked in analytics.js)
export let analytics = null;
let analyticsPromise = null;

export function getAnalyticsInstance() {
  if (analytics) return Promise.resolve(analytics);

  if (!analyticsPromise) {
    analyticsPromise = isSupported()
      .then((supported) => {
        if (!supported) return null;
        analytics = getAnalytics(app);
        return analytics;
      })
      .catch(() => null);
  }

  return analyticsPromise;
}
