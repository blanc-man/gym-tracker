import { useState, useEffect, useMemo } from 'react'
import { db } from '../db'
import { formatShortDate } from '../utils/motivational'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Dot } from 'recharts'
import { ChevronDown, ChevronUp } from 'lucide-react'

const RANGES = [
  { label: 'Last 4 weeks', weeks: 4 },
  { label: '3 months',     weeks: 13 },
  { label: 'All time',     weeks: 999 },
]

export default function Progress() {
  const [exercises, setExercises] = useState([])
  const [selectedExId, setSelectedExId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [sets, setSets] = useState([])
  const [pbs, setPbs] = useState([])
  const [range, setRange] = useState(0)
  const [expandedSession, setExpandedSession] = useState(null)

  useEffect(() => {
    async function load() {
      const [exs, sess, allSets, allPbs] = await Promise.all([
        db.exercises.toArray(),
        db.sessions.orderBy('date').reverse().toArray(),
        db.sets.toArray(),
        db.pbs.toArray(),
      ])
      setExercises(exs)
      setSessions(sess)
      setSets(allSets)
      setPbs(allPbs)
      if (exs.length) setSelectedExId(exs[0].id)
    }
    load()
  }, [])

  const cutoff = useMemo(() => {
    const weeks = RANGES[range].weeks
    if (weeks === 999) return null
    const d = new Date()
    d.setDate(d.getDate() - weeks * 7)
    return d.toISOString().slice(0, 10)
  }, [range])

  const chartData = useMemo(() => {
    if (!selectedExId) return []
    const exSets = sets.filter(s => s.exerciseId === selectedExId)
    const bySession = {}
    exSets.forEach(s => {
      if (!bySession[s.sessionId] || s.weight > bySession[s.sessionId]) {
        bySession[s.sessionId] = s.weight
      }
    })
    const sessMap = Object.fromEntries(sessions.map(s => [s.id, s]))
    return Object.entries(bySession)
      .map(([sid, weight]) => ({ date: sessMap[+sid]?.date, weight }))
      .filter(d => d.date && (!cutoff || d.date >= cutoff))
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(d => ({ ...d, label: formatShortDate(d.date) }))
  }, [selectedExId, sets, sessions, cutoff])

  const pb = useMemo(() => {
    if (!selectedExId) return null
    const exPbs = pbs.filter(p => p.exerciseId === selectedExId)
    if (!exPbs.length) return null
    return exPbs.reduce((best, p) => (!best || p.weight > best.weight) ? p : best, null)
  }, [selectedExId, pbs])

  const selectedEx = exercises.find(e => e.id === selectedExId)

  // Session history (filtered by range)
  const filteredSessions = useMemo(() => {
    return sessions.filter(s => !cutoff || s.date >= cutoff)
  }, [sessions, cutoff])

  function getSetsForSession(sid) {
    return sets.filter(s => s.sessionId === sid)
  }

  function getExName(exId) {
    return exercises.find(e => e.id === exId)?.name || 'Exercise'
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your strength journey</p>
      </div>

      {exercises.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <div>
            <p className="text-4xl mb-4">💪</p>
            <p className="text-gray-500 text-lg">Your strength journey starts with one workout.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Exercise selector */}
          <div className="px-5 mb-4">
            <div className="relative">
              <select
                value={selectedExId || ''}
                onChange={e => setSelectedExId(+e.target.value)}
                className="w-full appearance-none bg-white border-2 border-teal-200 rounded-xl px-4 py-3 text-base font-semibold text-gray-900 outline-none pr-10"
              >
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.icon} {ex.name}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Chart */}
          <div className="px-5 mb-4">
            {chartData.length > 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                {pb && (
                  <p className="text-sm text-amber-600 font-semibold mb-3">
                    🌟 Your best: {pb.weight}kg on {formatShortDate(pb.achievedAt)}
                  </p>
                )}
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 14 }}
                      formatter={v => [`${v}kg`, 'Weight']}
                    />
                    <Line
                      type="monotone"
                      dataKey="weight"
                      stroke="#0f766e"
                      strokeWidth={2.5}
                      dot={<Dot r={4} fill="#0f766e" />}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-2xl p-6 text-center">
                <p className="text-gray-400">No data for {selectedEx?.name} in this period.</p>
              </div>
            )}
          </div>

          {/* Range filter */}
          <div className="px-5 mb-5">
            <div className="flex gap-2">
              {RANGES.map((r, i) => (
                <button
                  key={r.label}
                  onClick={() => setRange(i)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all
                    ${range === i ? 'bg-teal-700 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Session history */}
          <div className="px-5 pb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Workout history</p>
            {filteredSessions.length === 0 ? (
              <p className="text-gray-400 text-center py-6">No workouts in this period.</p>
            ) : (
              filteredSessions.map(sess => {
                const sessSets = getSetsForSession(sess.id)
                const exIds = [...new Set(sessSets.map(s => s.exerciseId))]
                const isExpanded = expandedSession === sess.id

                return (
                  <div key={sess.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-3 overflow-hidden">
                    <button
                      onClick={() => setExpandedSession(isExpanded ? null : sess.id)}
                      className="w-full flex items-center gap-3 p-4 active:bg-gray-50"
                    >
                      <div className="flex-1 text-left">
                        <p className="font-bold text-gray-900">{formatShortDate(sess.date)}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {exIds.length} exercise{exIds.length !== 1 ? 's' : ''} · {sessSets.length} sets
                          {sess.notes && sess.notes !== 'Custom workout' ? ` · ${sess.notes.slice(0, 30)}` : ''}
                        </p>
                      </div>
                      {isExpanded ? <ChevronUp size={18} className="text-gray-400" /> : <ChevronDown size={18} className="text-gray-400" />}
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-gray-100 space-y-2 pt-3">
                        {exIds.map(exId => {
                          const exSets = sessSets.filter(s => s.exerciseId === exId)
                          const max = Math.max(...exSets.map(s => s.weight))
                          return (
                            <div key={exId} className="flex items-center gap-3">
                              <span className="text-lg">{exercises.find(e => e.id === exId)?.icon || '🏋️'}</span>
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">{getExName(exId)}</p>
                                <p className="text-xs text-gray-400">
                                  {exSets.length} sets · up to {max}kg × {exSets[0]?.reps} reps
                                </p>
                              </div>
                            </div>
                          )
                        })}
                        {sess.notes && sess.notes !== 'Custom workout' && (
                          <p className="text-sm text-gray-500 italic border-t border-gray-100 pt-2 mt-2">{sess.notes}</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </>
      )}
    </div>
  )
}
