import { Dumbbell, TrendingUp, BookOpen } from 'lucide-react'

const TABS = [
  { id: 'today',     label: 'Today',     Icon: Dumbbell },
  { id: 'progress',  label: 'Progress',  Icon: TrendingUp },
  { id: 'exercises', label: 'Exercises', Icon: BookOpen },
]

export default function TabBar({ active, onChange }) {
  return (
    <nav className="flex border-t border-gray-200 bg-white pb-safe" style={{ flexShrink: 0 }}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 min-tap transition-colors
              ${isActive ? 'text-teal-700' : 'text-gray-400'}`}
          >
            <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
            <span className={`text-xs leading-none ${isActive ? 'font-bold' : 'font-normal'}`}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
