/**
 * Tests for hooks/useAuth.js
 *
 * Verifies that:
 *  1. useAuth() throws when used outside AuthProvider
 *  2. useAuth() returns the context value when used inside AuthProvider
 *  3. The returned object has the expected shape
 */
import { renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import '@testing-library/jest-dom'

import { useAuth } from '../hooks/useAuth'
import { AuthProvider } from '../contexts/AuthContext'

// The firebase module is imported by AuthContext - mock it to avoid real SDK calls
import { vi } from 'vitest'

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    cb(null) // immediately resolve with null user
    return vi.fn() // unsubscribe
  }),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('../firebase', () => ({
  auth: { currentUser: null },
  googleProvider: {},
  analytics: null,
}))

vi.mock('../services/api', () => ({
  userApi: {
    getProfile: vi.fn().mockResolvedValue({ country: null }),
    updateProfile: vi.fn().mockResolvedValue({}),
  },
}))

describe('useAuth', () => {
  it('throws a meaningful error when used outside AuthProvider', () => {
    const { result } = renderHook(() => {
      try {
        useAuth()
        return null
      } catch (error) {
        return error.message
      }
    })

    expect(result.current).toBe('useAuth must be used within an AuthProvider')
  })

  it('returns context value when used inside AuthProvider', () => {
    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current).toHaveProperty('user')
    expect(result.current).toHaveProperty('loading')
    expect(result.current).toHaveProperty('signOut')
    expect(result.current).toHaveProperty('getIdToken')
    expect(result.current).toHaveProperty('signInWithGoogle')
    expect(result.current).toHaveProperty('signInWithEmail')
  })

  it('initially returns loading=true before auth resolves', async () => {
    // Override onAuthStateChanged to never call the callback
    const { onAuthStateChanged } = await import('firebase/auth')
    const original = onAuthStateChanged.getMockImplementation()
    onAuthStateChanged.mockImplementation(() => vi.fn()) // never fires

    const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>
    const { result } = renderHook(() => useAuth(), { wrapper })
    expect(result.current.loading).toBe(true)

    onAuthStateChanged.mockImplementation(original) // restore
  })
})
