/**
 * Tests for contexts/AuthContext.jsx
 *
 * Verifies that:
 * - Auth state is initialized correctly via onAuthStateChanged
 * - Loading state is managed correctly
 * - The context provides Firebase auth wrappers (signIn, signOut, etc.)
 * - Profile synchronization occurs on login (fetching country, emitting event, updating displayName)
 */
import { render, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { useContext } from 'react'
import '@testing-library/jest-dom'

import { AuthProvider, AuthContext } from '../contexts/AuthContext'
import { COUNTRY_SYNC_EVENT } from '../contexts/CountryContext'

// --- Mock Dependencies ---
const mockFirebaseUser = vi.hoisted(() => ({
  uid: 'user-123',
  displayName: 'Test User',
  getIdToken: vi.fn().mockResolvedValue('fake-token'),
}))

let authStateCallback = null

vi.mock('firebase/auth', () => ({
  onAuthStateChanged: vi.fn((auth, cb) => {
    authStateCallback = cb
    return vi.fn() // unsubscribe function
  }),
  signInWithPopup: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
}))

vi.mock('../firebase', () => ({
  auth: { currentUser: mockFirebaseUser },
  googleProvider: {},
}))

const mockGetProfile = vi.fn()
const mockUpdateProfile = vi.fn()

vi.mock('../services/api', () => ({
  userApi: {
    getProfile: (...args) => mockGetProfile(...args),
    updateProfile: (...args) => mockUpdateProfile(...args),
  },
}))

// --- Test Helper Component ---
function TestConsumer() {
  const auth = useContext(AuthContext)
  if (!auth) return <div>No context</div>
  return (
    <div>
      <span data-testid="loading">{auth.loading ? 'Loading' : 'Ready'}</span>
      <span data-testid="user">{auth.user ? auth.user.displayName : 'Logged Out'}</span>
      <button onClick={auth.signInWithGoogle}>Google Sign In</button>
      <button onClick={() => auth.signInWithEmail('a@b.com', 'pass')}>Email Sign In</button>
      <button onClick={auth.signOut}>Sign Out</button>
    </div>
  )
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    authStateCallback = null
  })

  it('initializes with loading true and no user', () => {
    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )
    expect(screen.getByTestId('loading')).toHaveTextContent('Loading')
    expect(screen.getByTestId('user')).toHaveTextContent('Logged Out')
  })

  it('updates state when user is authenticated (without country sync side-effects if none exists)', async () => {
    mockGetProfile.mockResolvedValueOnce({ country: null })
    mockUpdateProfile.mockResolvedValueOnce({})

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    // Trigger auth state change
    await act(async () => {
      await authStateCallback(mockFirebaseUser)
    })

    expect(screen.getByTestId('loading')).toHaveTextContent('Ready')
    expect(screen.getByTestId('user')).toHaveTextContent('Test User')

    // Should have updated profile with display name
    expect(mockUpdateProfile).toHaveBeenCalledWith({ display_name: 'Test User' })
  })

  it('syncs country to localStorage and dispatches event if user has country on server', async () => {
    mockGetProfile.mockResolvedValueOnce({ country: 'US' })
    mockUpdateProfile.mockResolvedValueOnce({})

    const dispatchSpy = vi.spyOn(window, 'dispatchEvent')

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    // Trigger auth state change
    await act(async () => {
      await authStateCallback(mockFirebaseUser)
    })

    // Local storage should be updated
    expect(localStorage.getItem('electra_country')).toBe('US')

    // Custom event should have been dispatched
    expect(dispatchSpy).toHaveBeenCalled()
    const eventArg = dispatchSpy.mock.calls.find((call) => call[0].type === COUNTRY_SYNC_EVENT)
    expect(eventArg).toBeDefined()
    expect(eventArg[0].detail.country).toBe('US')

    dispatchSpy.mockRestore()
  })

  it('handles profile fetch failure gracefully', async () => {
    // API throws an error
    mockGetProfile.mockRejectedValueOnce(new Error('Network error'))

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await act(async () => {
      await authStateCallback(mockFirebaseUser)
    })

    // User should still be logged in despite profile failure
    expect(screen.getByTestId('user')).toHaveTextContent('Test User')
    expect(screen.getByTestId('loading')).toHaveTextContent('Ready')
  })

  it('passes through auth methods', async () => {
    const { signInWithPopup, signInWithEmailAndPassword, signOut } = await import('firebase/auth')
    const user = userEvent.setup()

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>
    )

    await user.click(screen.getByText('Google Sign In'))
    expect(signInWithPopup).toHaveBeenCalled()

    await user.click(screen.getByText('Email Sign In'))
    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'a@b.com', 'pass')

    await user.click(screen.getByText('Sign Out'))
    expect(signOut).toHaveBeenCalled()
  })
})
