import { NavLink } from 'react-router-dom'
import { Home, ArrowDownToLine, ArrowUpFromLine, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: '대시보드', icon: Home, end: true },
  { to: '/inbound', label: '입고', icon: ArrowDownToLine },
  { to: '/outbound', label: '출고', icon: ArrowUpFromLine },
  { to: '/more', label: '더보기', icon: Menu }
]

export default function BottomTabs() {
  return (
    <nav className="fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-slate-200 safe-bottom">
      <ul className="grid grid-cols-4 max-w-2xl mx-auto">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center gap-1 min-h-[64px] text-xs',
                  isActive ? 'text-brand-900 font-semibold' : 'text-slate-500'
                )
              }
            >
              <Icon className="w-5 h-5" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
