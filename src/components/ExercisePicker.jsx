import { useState, useMemo } from 'react'
import { Search } from 'lucide-react'
import BottomSheet from './BottomSheet'

export default function ExercisePicker({ open, onClose, onSelect, exercises, recentNames = [] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!exercises) return []
    const q = query.toLowerCase()
    return q ? exercises.filter(e => e.name.toLowerCase().includes(q)) : exercises
  }, [exercises, query])

  const recent = useMemo(() => {
    if (!exercises || !recentNames.length) return []
    return recentNames.map(n => exercises.find(e => e.name === n)).filter(Boolean)
  }, [exercises, recentNames])

  const grouped = useMemo(() => {
    const groups = {}
    filtered.forEach(ex => {
      const g = ex.muscleGroup || ex.category || 'Other'
      if (!groups[g]) groups[g] = []
      groups[g].push(ex)
    })
    return groups
  }, [filtered])

  function handle(ex) {
    onSelect(ex)
    setQuery('')
  }

  return (
    <BottomSheet open={open} onClose={() => { setQuery(''); onClose() }} title="Add exercise">
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-2 bg-gray-100 rounded-xl px-4 py-3">
          <Search size={18} className="text-gray-400 flex-shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-base text-gray-900 placeholder-gray-400"
            placeholder="Search exercises..."
            value={query}
            onChange={e => setQuery(e.target.value)}
          />
        </div>
      </div>

      {!query && recent.length > 0 && (
        <div className="px-4 pb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Previously used</p>
          {recent.map(ex => (
            <ExRow key={ex.id} ex={ex} onSelect={handle} />
          ))}
        </div>
      )}

      <div className="px-4 pb-6">
        {!query && recent.length > 0 && (
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 mt-2">All exercises</p>
        )}
        {Object.entries(grouped).map(([group, exs]) => (
          <div key={group}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mt-4 mb-1">{group}</p>
            {exs.map(ex => <ExRow key={ex.id} ex={ex} onSelect={handle} />)}
          </div>
        ))}
        {filtered.length === 0 && (
          <p className="text-gray-400 text-center py-8">No exercises found.</p>
        )}
      </div>
    </BottomSheet>
  )
}

function ExRow({ ex, onSelect }) {
  return (
    <button
      onClick={() => onSelect(ex)}
      className="w-full flex items-center gap-3 py-3 border-b border-gray-100 last:border-0 active:bg-gray-50"
    >
      <span className="text-2xl w-9 text-center">{ex.icon || '🏋️'}</span>
      <div className="flex-1 text-left">
        <p className="font-semibold text-gray-900">{ex.name}</p>
        {ex.description && <p className="text-sm text-gray-400 line-clamp-1">{ex.description}</p>}
      </div>
    </button>
  )
}
