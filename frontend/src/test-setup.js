import '@testing-library/jest-dom'
import { vi } from 'vitest'

/**
 * Global Firebase SDK mock.
 *
 * firebase.js (src/firebase.js) is the SDK initialisation module. It calls
 * initializeApp(), getAuth(), getAnalytics(), and isSupported() at module
 * evaluation time, which fail in the jsdom test environment because:
 *   - Firebase requires real browser APIs (IndexedDB, fetch, etc.)
 *   - VITE_FIREBASE_* env vars are not present in tests
 *
 * By mocking these modules here (in setupFiles, which runs before any test
 * file is collected), every test file that transitively imports firebase.js
 * (e.g. via api.js -> firebase.js) gets the stub instead of the real SDK.
 *
 * Individual tests that need specific behaviour can override with vi.mock().
 */

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApp: vi.fn(() => ({})),
}))

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({ currentUser: null, signOut: vi.fn() })),
  GoogleAuthProvider: vi.fn(function GoogleAuthProvider() {
    return {
      setCustomParameters: vi.fn(),
    }
  }),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  onAuthStateChanged: vi.fn((_auth, cb) => {
    cb(null)
    return vi.fn()
  }),
  signOut: vi.fn(),
}))

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => ({})),
  isSupported: vi.fn(() => Promise.resolve(false)),
  logEvent: vi.fn(),
}))
