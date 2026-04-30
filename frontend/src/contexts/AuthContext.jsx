/**
 * Authentication context. Provides Firebase Auth state and methods to the entire app.
 *
 * Country-sync design:
 *   After a successful sign-in, the user's country preference from their Firestore profile
 *   is written to localStorage and then broadcast via a CustomEvent (COUNTRY_SYNC_EVENT).
 *   A CustomEvent is required instead of the native 'storage' event because the native
 *   event only fires across different browser tabs, never within the same browsing context.
 *   CountryContext listens for this event and updates its React state from the event payload.
 */

import React, { createContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth'

import { auth, googleProvider } from '../firebase'
import { userApi } from '../services/api'
import { COUNTRY_SYNC_EVENT } from './CountryContext'

const COUNTRY_STORAGE_KEY = 'electra_country'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      setLoading(false)

      if (firebaseUser) {
        try {
          // Step 1: Fetch profile from backend to get server-side country preference
          const profile = await userApi.getProfile()

          // Step 2: Sync country to localStorage if the user has one on the server
          //         but this device hasn't set one yet (new device / cleared storage).
          if (profile?.country && !localStorage.getItem(COUNTRY_STORAGE_KEY)) {
            localStorage.setItem(COUNTRY_STORAGE_KEY, profile.country)
            // Dispatch a CustomEvent so CountryContext updates React state immediately
            // without waiting for a page reload. The native 'storage' event does NOT
            // fire in the same tab - only CustomEvent reliably crosses component boundaries.
            window.dispatchEvent(
              new CustomEvent(COUNTRY_SYNC_EVENT, {
                detail: { country: profile.country },
              })
            )
          }

          // Step 3: PUT to keep lastSeen / displayName up to date (fire-and-forget)
          await userApi.updateProfile({ display_name: firebaseUser.displayName })
        } catch {
          // Non-fatal - profile sync failure doesn't block the user
        }
      }
    })

    return unsubscribe // Cleanup listener on unmount
  }, [])

  const signInWithGoogle = useCallback(async () => {
    return signInWithPopup(auth, googleProvider)
  }, [])

  const signInWithEmail = useCallback(async (email, password) => {
    return signInWithEmailAndPassword(auth, email, password)
  }, [])

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth)
  }, [])

  const getIdToken = useCallback(async () => {
    if (!auth.currentUser) return null
    return auth.currentUser.getIdToken()
  }, [])

  const value = { user, loading, signInWithGoogle, signInWithEmail, signOut, getIdToken }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export { AuthContext }
