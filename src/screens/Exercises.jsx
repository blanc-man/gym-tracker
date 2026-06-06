import { useState, useEffect } from 'react'
import { db } from '../db'
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react'

const CATEGORIES = ['Living Stronger', 'Body Pump', 'General', 'My Exercises']

export default function Exercises() {
  const [exercises, setExercises] = useState([])
  const [expanded, setExpanded] = useState({ 'Living Stronger': true })
  const [showAdd, setShowAdd] = useState(false)
  const [newEx, setNewEx] = useState({ name: '', category: 'My Exercises', description: '' })
  const [expandedEx, setExpandedEx] = useState(null)

  useEffect(() => { load() }, [])

  async function load() {
    const exs = await db.exercises.toArray()
    setExercises(exs)
  }

  async function addExercise() {
    if (!newEx.name.trim()) return
    await db.exercises.add({ ...newEx, isCustom: true, icon: '⭐' })
    setNewEx({ name: '', category: 'My Exercises', description: '' })
    setShowAdd(false)
    load()
  }

  async function deleteExercise(ex) {
    if (!ex.isCustom) return
    if (!confirm(`Delete "${ex.name}"?`)) return
    await db.exercises.delete(ex.id)
    load()
  }

  const grouped = {}
  exercises.forEach(ex => {
    const cat = ex.isCustom ? 'My Exercises' : (ex.category || 'General')
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(ex)
  })

  const visibleCategories = CATEGORIES.filter(c => grouped[c]?.length > 0)

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Exercises</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your exercise library</p>
      </div>

      <div className="px-5 flex-1 pb-6">
        {visibleCategories.map(cat => {
          const exs = grouped[cat] || []
          const isOpen = expanded[cat]
          return (
            <div key={cat} className="mb-3 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <button
                onClick={() => setExpanded(e => ({ ...e, [cat]: !e[cat] }))}
                className="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50"
              >
                <div className="flex items-center gap-2">
                  <p className="font-bold text-gray-900 text-lg">{cat}</p>
                  <span className="text-xs bg-gray-100 text-gray-500 rounded-full px-2 py-0.5">{exs.length}</span>
                </div>
                {isOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
              </button>

              {isOpen && (
                <div className="border-t border-gray-100">
                  {exs.map(ex => (
                    <div key={ex.id} className="border-b border-gray-100 last:border-0">
                      <button
                        onClick={() => setExpandedEx(expandedEx === ex.id ? null : ex.id)}
                        className="w-full flex items-center gap-3 px-5 py-3 active:bg-gray-50"
                      >
                        <span className="text-2xl w-9 text-center">{ex.icon || '🏋️'}</span>
                        <div className="flex-1 text-left">
                          <p className="font-semibold text-gray-900">{ex.name}</p>
                          {ex.muscleGroup && <p className="text-xs text-gray-400">{ex.muscleGroup}</p>}
                        </div>
                        {ex.isCustom && (
                          <button
                            onClick={e => { e.stopPropagation(); deleteExercise(ex) }}
                            className="min-tap w-8 h-8 flex items-center justify-center text-gray-300 active:text-red-400"
                          >
                            <X size={16} />
                          </button>
                        )}
                      </button>
                      {expandedEx === ex.id && ex.description && (
                        <div className="px-5 pb-4 pt-0">
                          <p className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3">{ex.description}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Add exercise button */}
        {!showAdd ? (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 py-4 mt-2 rounded-2xl bg-teal-700 text-white font-bold text-base active:bg-teal-600"
          >
            <Plus size={20} /> Add my own exercise
          </button>
        ) : (
          <div className="bg-white rounded-2xl border border-teal-200 shadow-sm p-5 mt-2">
            <h3 className="font-bold text-gray-900 text-lg mb-4">New exercise</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Name *</label>
                <input
                  value={newEx.name}
                  onChange={e => setNewEx(n => ({ ...n, name: e.target.value }))}
                  placeholder="Exercise name"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Category</label>
                <select
                  value={newEx.category}
                  onChange={e => setNewEx(n => ({ ...n, category: e.target.value }))}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-teal-500"
                >
                  <option>Living Stronger</option>
                  <option>General</option>
                  <option>My Exercises</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Notes / description (optional)</label>
                <textarea
                  value={newEx.description}
                  onChange={e => setNewEx(n => ({ ...n, description: e.target.value }))}
                  placeholder="Any tips or reminders..."
                  rows={3}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 outline-none focus:border-teal-500 resize-none"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setShowAdd(false); setNewEx({ name: '', category: 'My Exercises', description: '' }) }}
                  className="flex-1 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold active:bg-gray-50"
                >Cancel</button>
                <button
                  onClick={addExercise}
                  disabled={!newEx.name.trim()}
                  className="flex-1 py-3 rounded-xl bg-teal-700 text-white font-bold active:bg-teal-600 disabled:opacity-50"
                >Add</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
