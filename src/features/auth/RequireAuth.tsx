import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { useProfile } from './useProfile'
import PendingApprovalPage from './PendingApprovalPage'

export default function RequireAuth({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth()
  const { data: profile, isLoading: profileLoading } = useProfile()
  const location = useLocation()

  if (loading || (session && profileLoading)) {
    return (
      <div className="flex h-full items-center justify-center text-slate-500 text-sm">
        불러오는 중…
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  if (profile && profile.is_approved === false) {
    return <PendingApprovalPage />
  }
  return <>{children}</>
}
