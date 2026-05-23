import { Navigate, Route, Routes } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import InboundPage from './pages/InboundPage'
import OutboundPage from './pages/OutboundPage'
import MorePage from './pages/MorePage'
import InventoryPage from './pages/InventoryPage'
import HistoryPage from './pages/HistoryPage'
import ItemsPage from './pages/ItemsPage'
import LocationsPage from './pages/LocationsPage'
import AppShell from './components/layout/AppShell'
import RequireAuth from './features/auth/RequireAuth'
import SyncManager from './features/offline/SyncManager'

export default function App() {
  return (
    <>
      <SyncManager />
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
          <Route path="/more" element={<MorePage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/items" element={<ItemsPage />} />
          <Route path="/locations" element={<LocationsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
