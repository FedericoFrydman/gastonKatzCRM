import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { AuthProvider } from '@/domains/auth/AuthProvider'
import { RequireAuth } from '@/domains/auth/RequireAuth'
import { LoginPage } from '@/domains/auth/LoginPage'
import { AppLayout } from '@/shared/AppLayout'
import { EventsDashboard } from '@/domains/events'
import { EventDetailPage } from '@/domains/events'
import { CalendarPage } from '@/domains/calendar'
import { PlacesPage } from '@/domains/places'

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
                <Route path="/dashboard" element={<EventsDashboard />} />
                <Route path="/events/:id" element={<EventDetailPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/places" element={<PlacesPage />} />
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
