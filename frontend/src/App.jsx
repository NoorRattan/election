/**
 * Root application component. Defines all routes using React Router v6.
 * All page components are lazy-loaded for code splitting.
 * Protected routes redirect to /login when user is not authenticated.
 * Public routes: /, /topics, /topics/:slug, /timeline, /login, /privacy, /accessibility.
 */

import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'

import Layout from './components/layout/Layout'
import { useAuth } from './hooks/useAuth'

// Lazy-load all page components - each becomes a separate JS chunk
const Home = lazy(() => import('./pages/Home'))
const Topics = lazy(() => import('./pages/Topics'))
const TopicDetail = lazy(() => import('./pages/TopicDetail'))
const Timeline = lazy(() => import('./pages/Timeline'))
const Quiz = lazy(() => import('./pages/Quiz'))
const Profile = lazy(() => import('./pages/Profile'))
const Login = lazy(() => import('./pages/Login'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const AccessibilityStatement = lazy(() => import('./pages/AccessibilityStatement'))
const NotFound = lazy(() => import('./pages/NotFound'))

/**
 * Wraps a route element to require authentication.
 * Shows a spinner while auth state is loading.
 * Redirects to /login (with return path in state) if not authenticated.
 */
function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        role="status"
        aria-label="Loading"
      >
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"
          aria-hidden="true"
        />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}

/**
 * Full-page loading fallback used by Suspense while lazy chunks are loading.
 */
function PageLoader() {
  return (
    <div
      className="flex items-center justify-center min-h-[60vh]"
      role="status"
      aria-label="Loading page"
    >
      <div
        className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600"
        aria-hidden="true"
      />
    </div>
  )
}

export default function App() {
  return (
    <Layout>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/topics" element={<Topics />} />
          <Route path="/topics/:slug" element={<TopicDetail />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/accessibility" element={<AccessibilityStatement />} />

          {/* Protected routes - require authentication */}
          <Route
            path="/quiz/:topicId"
            element={
              <ProtectedRoute>
                <Quiz />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* 404 catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
