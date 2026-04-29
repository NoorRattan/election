/**
 * Manual mock for src/firebase.js.
 *
 * Placed in src/__mocks__/firebase.js so that vitest can find it when
 * vi.mock('../firebase') is called, or when the alias in vite.config.js
 * redirects src/firebase to this stub.
 *
 * Provides minimal stubs for every named export used across the app.
 */
import { vi } from 'vitest';

export const app = {};

export const auth = {
  currentUser: null,
  signOut: vi.fn().mockResolvedValue(undefined),
};

export const googleProvider = {
  setCustomParameters: vi.fn(),
};

export let analytics = null;

export function getAnalyticsInstance() {
  return Promise.resolve(analytics);
}
