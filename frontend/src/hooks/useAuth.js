import { useContext } from 'react'
import { AuthContext } from '../contexts/AuthContext'

/**
 * Read the current authentication context.
 *
 * @returns {object} Current auth state and actions.
 * @throws {Error} If the hook is used outside AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
