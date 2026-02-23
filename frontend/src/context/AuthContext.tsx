/**
 * Auth context: user state, tokens, and session restore on load.
 * Exposes useAuth() for components needing login state.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { User } from '../types'
import { getMe } from '../api/auth'

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  setTokens: (access: string, refresh: string, user: User) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

/** Provides auth state and token helpers to the tree. */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const logout = useCallback(() => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    setUser(null)
  }, [])

  const setTokens = useCallback((access: string, refresh: string, userData: User) => {
    localStorage.setItem('access_token', access)
    localStorage.setItem('refresh_token', refresh)
    setUser(userData)
  }, [])

  // On mount, attempt to restore session
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      setIsLoading(false)
      return
    }
    getMe()
      .then(setUser)
      .catch(logout)
      .finally(() => setIsLoading(false))
  }, [logout])

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, setTokens, logout }}
    >
      {children}
    </AuthContext.Provider>
  )
}

/** Hook to access auth context; must be inside AuthProvider. */
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
