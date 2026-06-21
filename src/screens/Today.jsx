import { useState, useEffect } from 'react'
import { db } from '../db'
import { getDailySubtitle, greetingByTime, formatDate, todayISO } from '../utils/motivational'
import ClassFlow from '../flows/ClassFlow'
import BuildOwnFlow from '../flows/BuildOwnFlow'
import ClassTemplateForm from '../components/ClassTemplateForm'
import { Settings, ChevronRight, Flame, PenLine, Plus, Trash2 } from 'lucide-react'

export default function Today({ onSettings }) {
  const [templates, setTemplates] = useState([])
  const [activeFlow, setActiveFlow] = useState(null)
  const [showAddClass, setShowAddClass] = useState(false)
  const [streak, setStreak] = useState(0)
  const [backupBanner, setBackupBanner] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null) // template id pending delete

  async function load() {
    const [tpls, sessions] = await Promise.all([
      db.classTemplates.toArray(),
      db.sessions.orderBy('date').toArray(),
    ])
    setTemplates(tpls)

    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const monthSessions = sessions.filter(s => s.date?.startsWith(thisMonth))
    setStreak(monthSessions.length)

    const total = sessions.length
    const lastNag = localStorage.getItem('last_backup_nag')
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
    if (total > 0 && total % 10 === 0 && (!lastNag || +lastNag < weekAgo)) {
      setBackupBanner(true)
    }
  }

  useEffect(() => { load() }, [])

  function dismissBanner() {
    localStorage.setItem('last_backup_nag', String(Date.now()))
    setBackupBanner(false)
  }

  async function saveNewTemplate(data) {
    await db.classTemplates.add(data)
    setShowAddClass(false)
    load()
  }

  async function deleteTemplate(id) {
    await db.classTemplates.delete(id)
    // Also clean up associated template exercises
    await db.templateExercises.where('classTemplateId').equals(id).delete()
    setDeleteConfirm(null)
    load()
  }

  if (showAddClass) {
    return (
      <ClassTemplateForm
        onSave={saveNewTemplate}
        onBack={() => setShowAddClass(false)}
      />
    )
  }

  if (activeFlow?.type === 'class') {
    return (
      <ClassFlow
        template={activeFlow.template}
        onDone={() => { setActiveFlow(null); load() }}
      />
    )
  }

  if (activeFlow?.type === 'build') {
    return (
      <BuildOwnFlow
        onDone={() => { setActiveFlow(null); load() }}
      />
    )
  }

  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{greetingByTime()} 👋</h1>
            <p className="text-sm text-gray-500 mt-0.5">{today}</p>
            <p className="text-base text-teal-700 font-medium mt-2 italic">{getDailySubtitle()}</p>
          </div>
          <button
            onClick={onSettings}
            className="min-tap w-12 h-12 flex items-center justify-center text-gray-400 -mt-1"
          >
            <Settings size={22} />
          </button>
        </div>

        {streak > 0 && (
          <div className="mt-3 inline-flex items-center gap-2 bg-orange-50 px-4 py-2 rounded-full">
            <Flame size={18} className="text-orange-500" />
            <span className="text-orange-700 font-semibold text-sm">{streak} workout{streak !== 1 ? 's' : ''} this month</span>
          </div>
        )}
      </div>

      {/* Backup banner */}
      {backupBanner && (
        <div className="mx-5 mb-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <span className="text-xl">💾</span>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-800">Back up your data</p>
            <p className="text-xs text-amber-600">It's been a while since your last backup.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onSettings} className="text-xs font-semibold text-amber-700 underline">Save</button>
            <button onClick={dismissBanner} className="text-xs text-gray-400">Later</button>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteConfirm && (
        <div className="mx-5 mb-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="font-semibold text-red-800 mb-1">Delete this class?</p>
          <p className="text-xs text-red-600 mb-3">Your past workouts will be kept. Only the class template is removed.</p>
          <div className="flex gap-3">
            <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">Cancel</button>
            <button onClick={() => deleteTemplate(deleteConfirm)} className="flex-1 py-2 rounded-xl bg-red-500 text-white font-semibold text-sm">Delete</button>
          </div>
        </div>
      )}

      {/* Class cards */}
      <div className="px-5 space-y-3 pb-4">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Choose a class</p>
        {templates.map(tpl => (
          <div key={tpl.id} className="relative group">
            <button
              onClick={() => setActiveFlow({ type: 'class', template: tpl })}
              className="w-full flex items-center gap-4 bg-white rounded-2xl border border-gray-200 shadow-sm px-5 py-4 active:bg-gray-50 transition-all"
            >
              <span className="text-3xl">{tpl.icon}</span>
              <div className="flex-1 text-left">
                <p className="font-bold text-gray-900 text-lg">{tpl.name}</p>
                {tpl.venue && <p className="text-sm text-gray-500">{tpl.venue}</p>}
              </div>
              <ChevronRight size={20} className="text-gray-300" />
            </button>
            {/* Delete button — shown as a small trash icon to the right */}
            <button
              onClick={() => setDeleteConfirm(tpl.id)}
              className="absolute right-14 top-1/2 -translate-y-1/2 min-tap w-10 h-10 flex items-center justify-center text-gray-300 active:text-red-400"
              aria-label={`Delete ${tpl.name}`}
            >
              <Trash2 size={17} />
            </button>
          </div>
        ))}

        {/* Add class */}
        <button
          onClick={() => setShowAddClass(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-teal-200 text-teal-700 font-semibold text-base active:bg-teal-50"
        >
          <Plus size={20} /> Add a class
        </button>
      </div>

      <div className="px-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-sm text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>
        <button
          onClick={() => setActiveFlow({ type: 'build' })}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-teal-200 text-teal-700 font-semibold text-base active:bg-teal-50"
        >
          <PenLine size={20} />
          Build my own workout
        </button>
      </div>
    </div>
  )
}
