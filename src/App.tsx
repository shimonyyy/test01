import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import InboundPage from './pages/InboundPage'
import OutboundPage from './pages/OutboundPage'
import TransferPage from './pages/TransferPage'
import MorePage from './pages/MorePage'
import InventoryPage from './pages/InventoryPage'
import HistoryPage from './pages/HistoryPage'
import ItemsPage from './pages/ItemsPage'
import LocationsPage from './pages/LocationsPage'
import SettingsPage from './pages/SettingsPage'
import AppShell from './components/layout/AppShell'
import RequireAuth from './features/auth/RequireAuth'
import SyncManager from './features/offline/SyncManager'
import { useRealtimeSync } from './features/realtime/useRealtimeSync'

// xlsx / 관리자 페이지는 lazy 로딩으로 메인 번들에서 분리
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const ImportPage = lazy(() => import('./pages/ImportPage'))
const AuditPage = lazy(() => import('./pages/AuditPage'))
const UsersPage = lazy(() => import('./pages/UsersPage'))

function RealtimeBridge() {
  useRealtimeSync()
  return null
}

function PageLoading() {
  return (
    <div className="flex h-full items-center justify-center text-sm text-slate-500 p-8">
      불러오는 중…
    </div>
  )
}

export default function App() {
  return (
    <>
      <SyncManager />
      <RealtimeBridge />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/" element={<DashboardPage />} />
          <Route path="/inbound" element={<InboundPage />} />
          <Route path="/outbound" element={<OutboundPage />} />
          <Route path="/transfer" element={<TransferPage />} />
          <Route path="/more" element={<MorePage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/locations" element={<LocationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/reports" element={<Suspense fallback={<PageLoading />}><ReportsPage /></Suspense>} />
          <Route path="/import" element={<Suspense fallback={<PageLoading />}><ImportPage /></Suspense>} />
          <Route path="/audits" element={<Suspense fallback={<PageLoading />}><AuditPage /></Suspense>} />
          <Route path="/users" element={<Suspense fallback={<PageLoading />}><UsersPage /></Suspense>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
