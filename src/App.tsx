import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '@/domains/auth/AuthProvider'
import { RequireAuth } from '@/domains/auth/RequireAuth'
import { LoginPage } from '@/domains/auth/LoginPage'
import { AppLayout } from '@/shared/AppLayout'

const EventsDashboard = lazy(async () => {
  const mod = await import('@/domains/events')
  return { default: mod.EventsDashboard }
})

const EventDetailPage = lazy(async () => {
  const mod = await import('@/domains/events')
  return { default: mod.EventDetailPage }
})

const CalendarPage = lazy(async () => {
  const mod = await import('@/domains/calendar')
  return { default: mod.CalendarPage }
})

const PlacesPage = lazy(async () => {
  const mod = await import('@/domains/places')
  return { default: mod.PlacesPage }
})

function LayoutWrapper() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  )
}

function RootRedirect() {
  return <Navigate to="/dashboard" replace />
}

function RouteLoader() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<RequireAuth />}>
              <Route element={<LayoutWrapper />}>
                <Route index element={<RootRedirect />} />
                <Route
                  path="/dashboard"
                  element={
                    <Suspense fallback={<RouteLoader />}>
                      <EventsDashboard />
                    </Suspense>
                  }
                />
                <Route
                  path="/events/:id"
                  element={
                    <Suspense fallback={<RouteLoader />}>
                      <EventDetailPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/calendar"
                  element={
                    <Suspense fallback={<RouteLoader />}>
                      <CalendarPage />
                    </Suspense>
                  }
                />
                <Route
                  path="/places"
                  element={
                    <Suspense fallback={<RouteLoader />}>
                      <PlacesPage />
                    </Suspense>
                  }
                />
              </Route>
            </Route>

            <Route path="*" element={<RootRedirect />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
