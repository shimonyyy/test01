import { Outlet } from 'react-router-dom'
import BottomTabs from './BottomTabs'

export default function AppShell() {
  return (
    <div className="flex flex-col h-full">
      <main className="flex-1 overflow-y-auto pb-[calc(64px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>
      <BottomTabs />
    </div>
  )
}
