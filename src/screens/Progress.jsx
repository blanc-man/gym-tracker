import { useState, useEffect, useMemo } from 'react'
import { db } from '../db'
import { formatShortDate } from '../utils/motivational'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Dot, Legend
} from 'recharts'
import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react'

const RANGES = [
  { label: 'Last 4 weeks', weeks: 4 },
  { label: '3 months',     weeks: 13 },
  { label: 'All time',     weeks: 999 },
]

const PRESET_COLORS = {
  light:  '#38bdf8', // sky
  medium: '#0d9488', // teal
  heavy:  '#7c3aed', // violet
}

const PRESET_LABELS = { light: 'Light', medium: 'Medium', heavy: 'Heavy' }

function cutoffDate(weeks) {
  if (weeks === 999) return null
  const d = new Date()
  d.setDate(d.getDate() - weeks * 7)
  return d.toISOString().slice(0, 10)
}

// Custom tooltip for the preset chart
function PresetTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
          {PRESET_LABELS[p.dataKey]}: {p.value}kg
        </p>
      ))}
    </div>
  )
}

export default function Progress() {
  const [templates, setTemplates] = useState([])
  const [selectedTplId, setSelectedTplId] = useState(null)
  const [exercises, setExercises] = useState([])
  const [selectedExId, setSelectedExId] = useState(null)
  const [sessions, setSessions] = useState([])
  const [sets, setSets] = useState([])
  const [pbs, setPbs] = useState([])
  const [sessionPresets, setSessionPresets] = useState([])
  const [range, setRange] = useState(0)
  const [expandedSession, setExpandedSession] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [showExDetail, setShowExDetail] = useState(false)

  async function load() {
    const [tpls, exs, sess, allSets, allPbs, allPresets] = await Promise.all([
      db.classTemplates.toArray(),
      db.exercises.toArray(),
      db.sessions.orderBy('date').reverse().toArray(),
      db.sets.toArray(),
      db.pbs.toArray(),
      db.sessionPresets.toArray(),
    ])
    setTemplates(tpls)
    setExercises(exs)
    setSessions(sess)
    setSets(allSets)
    setPbs(allPbs)
    setSessionPresets(allPresets)
    if (tpls.length && !selectedTplId) setSelectedTplId(tpls[0].id)
    if (exs.length && !selectedExId) setSelectedExId(exs[0].id)
  }

  useEffect(() => { load() }, [])

  async function deleteSession(id) {
    await db.sets.where('sessionId').equals(id).delete()
    await db.sessionPresets.where('sessionId').equals(id).delete()
    await db.sessions.delete(id)
    setDeleteConfirm(null)
    setExpandedSession(null)
    load()
  }

  const cutoff = useMemo(() => cutoffDate(RANGES[range].weeks), [range])

  // ── Preset chart data ──────────────────────────────────────────────────────
  const presetChartData = useMemo(() => {
    if (!selectedTplId) return []
    const sessMap = Object.fromEntries(sessions.map(s => [s.id, s]))
    return sessionPresets
      .filter(p => p.classTemplateId === selectedTplId)
      .filter(p => {
        const sess = sessMap[p.sessionId]
        return sess && (!cutoff || sess.date >= cutoff)
      })
      .map(p => ({
        label: formatShortDate(sessMap[p.sessionId]?.date),
        date: sessMap[p.sessionId]?.date,
        light: +(p.light || 0).toFixed(1),
        medium: +(p.medium || 0).toFixed(1),
        heavy: +(p.heavy || 0).toFixed(1),
      }))
      .sort((a, b) => a.date?.localeCompare(b.date))
  }, [selectedTplId, sessionPresets, sessions, cutoff])

  // Progress summary (first vs latest)
  const presetSummary = useMemo(() => {
    if (presetChartData.length < 2) return null
    const first = presetChartData[0]
    const last = presetChartData[presetChartData.length - 1]
    return ['light', 'medium', 'heavy'].map(level => ({
      level,
      first: first[level],
      last: last[level],
      delta: +(last[level] - first[level]).toFixed(1),
    })).filter(s => s.last > 0)
  }, [presetChartData])

  // ── Per-exercise chart data ────────────────────────────────────────────────
  const exerciseChartData = useMemo(() => {
    if (!selectedExId) return []
    const exSets = sets.filter(s => s.exerciseId === selectedExId)
    const bySession = {}
    exSets.forEach(s => {
      if (!bySession[s.sessionId] || s.weight > bySession[s.sessionId])
        bySession[s.sessionId] = s.weight
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

  const selectedTpl = templates.find(t => t.id === selectedTplId)
  const selectedEx = exercises.find(e => e.id === selectedExId)

  const filteredSessions = useMemo(() => {
    return sessions.filter(s => !cutoff || s.date >= cutoff)
  }, [sessions, cutoff])

  function getSetsForSession(sid) { return sets.filter(s => s.sessionId === sid) }
  function getExName(exId) { return exercises.find(e => e.id === exId)?.name || 'Exercise' }

  const hasAnyData = sessions.length > 0

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="px-5 pt-5 pb-3 flex-shrink-0">
        <h1 className="text-2xl font-bold text-gray-900">Progress</h1>
        <p className="text-sm text-gray-500 mt-0.5">Your strength journey</p>
      </div>

      {!hasAnyData ? (
        <div className="flex-1 flex items-center justify-center px-8 text-center">
          <div>
            <p className="text-4xl mb-4">💪</p>
            <p className="text-gray-500 text-lg">Your strength journey starts with one workout.</p>
          </div>
        </div>
      ) : (
        <>
          {/* ── Class selector ─────────────────────────────────────────────── */}
          <div className="px-5 mb-4">
            <div className="relative">
              <select
                value={selectedTplId || ''}
                onChange={e => setSelectedTplId(+e.target.value)}
                className="w-full appearance-none bg-white border-2 border-teal-200 rounded-xl px-4 py-3 text-base font-semibold text-gray-900 outline-none pr-10"
              >
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                ))}
              </select>
              <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* ── Range filter ───────────────────────────────────────────────── */}
          <div className="px-5 mb-4">
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

          {/* ── L/M/H hero chart ───────────────────────────────────────────── */}
          <div className="px-5 mb-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">{selectedTpl?.icon}</span>
                <p className="font-bold text-gray-900">{selectedTpl?.name}</p>
              </div>
              <p className="text-sm text-gray-400 mb-4">Weight progression — Light / Medium / Heavy</p>

              {presetChartData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={presetChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<PresetTooltip />} />
                      {['light', 'medium', 'heavy'].map(level => (
                        <Line
                          key={level}
                          type="monotone"
                          dataKey={level}
                          stroke={PRESET_COLORS[level]}
                          strokeWidth={2.5}
                          dot={<Dot r={4} fill={PRESET_COLORS[level]} />}
                          activeDot={{ r: 6 }}
                          connectNulls
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>

                  {/* Colour key */}
                  <div className="flex gap-4 mt-3 justify-center">
                    {['light', 'medium', 'heavy'].map(level => (
                      <div key={level} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-full" style={{ background: PRESET_COLORS[level] }} />
                        <span className="text-xs text-gray-500 capitalize">{level}</span>
                      </div>
                    ))}
                  </div>

                  {/* Progress summary */}
                  {presetSummary && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {presetSummary.map(s => (
                        <div key={s.level} className="rounded-xl p-3 text-center"
                          style={{ background: PRESET_COLORS[s.level] + '18' }}>
                          <p className="text-xs capitalize font-semibold mb-1"
                            style={{ color: PRESET_COLORS[s.level] }}>{s.level}</p>
                          <p className="text-lg font-bold text-gray-900">{s.last}kg</p>
                          {s.delta !== 0 && (
                            <p className={`text-xs font-semibold ${s.delta > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                              {s.delta > 0 ? '+' : ''}{s.delta}kg
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-gray-400 text-sm">
                    No weight data yet for {selectedTpl?.name} in this period.
                  </p>
                  <p className="text-gray-300 text-xs mt-1">
                    L/M/H progress tracks from the next session you log.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Per-exercise detail (collapsible) ─────────────────────────── */}
          <div className="px-5 mb-4">
            <button
              onClick={() => setShowExDetail(v => !v)}
              className="w-full flex items-center justify-between py-3 text-sm font-semibold text-gray-500"
            >
              <span>Exercise detail</span>
              {showExDetail ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showExDetail && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                <div className="relative mb-4">
                  <select
                    value={selectedExId || ''}
                    onChange={e => setSelectedExId(+e.target.value)}
                    className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-base font-semibold text-gray-900 outline-none pr-10"
                  >
                    {exercises.map(ex => (
                      <option key={ex.id} value={ex.id}>{ex.icon} {ex.name}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>

                {exerciseChartData.length > 0 ? (
                  <>
                    {pb && (
                      <p className="text-sm text-amber-600 font-semibold mb-3">
                        🌟 Best: {pb.weight}kg on {formatShortDate(pb.achievedAt)}
                      </p>
                    )}
                    <ResponsiveContainer width="100%" height={150}>
                      <LineChart data={exerciseChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} tickLine={false} axisLine={false} />
                        <Tooltip
                          contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}
                          formatter={v => [`${v}kg`, 'Weight']}
                        />
                        <Line type="monotone" dataKey="weight" stroke="#0f766e" strokeWidth={2.5}
                          dot={<Dot r={4} fill="#0f766e" />} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <p className="text-gray-400 text-center py-4 text-sm">No data for {selectedEx?.name} in this period.</p>
                )}
              </div>
            )}
          </div>

          {/* ── Session history ────────────────────────────────────────────── */}
          <div className="px-5 pb-6">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Workout history</p>
            {filteredSessions.length === 0 ? (
              <p className="text-gray-400 text-center py-6">No workouts in this period.</p>
            ) : (
              filteredSessions.map(sess => {
                const sessSets = getSetsForSession(sess.id)
                const exIds = [...new Set(sessSets.map(s => s.exerciseId))]
                const isExpanded = expandedSession === sess.id
                const isPendingDelete = deleteConfirm === sess.id
                const sessPreset = sessionPresets.find(p => p.sessionId === sess.id)

                return (
                  <div key={sess.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm mb-3 overflow-hidden">
                    <button
                      onClick={() => setExpandedSession(isExpanded ? null : sess.id)}
                      className="w-full flex items-center gap-3 p-4 active:bg-gray-50"
                    >
                      <div className="flex-1 text-left">
                        <p className="font-bold text-gray-900">{formatShortDate(sess.date)}</p>
                        <p className="text-sm text-gray-500 mt-0.5">
                          {exIds.length > 0
                            ? `${exIds.length} exercise${exIds.length !== 1 ? 's' : ''} · ${sessSets.length} sets`
                            : sess.notes?.includes('Duration') ? sess.notes.split('\n')[0] : 'Cardio session'}
                        </p>
                        {sessPreset && (
                          <div className="flex gap-2 mt-1">
                            {['light','medium','heavy'].map(l => sessPreset[l] > 0 && (
                              <span key={l} className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                                style={{ background: PRESET_COLORS[l] + '22', color: PRESET_COLORS[l] }}>
                                {l.charAt(0).toUpperCase()} {sessPreset[l]}kg
                              </span>
                            ))}
                          </div>
                        )}
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
                        {sess.notes && !sess.notes.startsWith('Custom') && (
                          <p className="text-sm text-gray-500 italic border-t border-gray-100 pt-2 mt-2">{sess.notes}</p>
                        )}

                        {!isPendingDelete ? (
                          <button
                            onClick={() => setDeleteConfirm(sess.id)}
                            className="mt-3 flex items-center gap-2 text-red-400 text-sm font-medium active:text-red-600"
                          >
                            <Trash2 size={15} /> Delete this workout
                          </button>
                        ) : (
                          <div className="mt-3 bg-red-50 rounded-xl p-3">
                            <p className="text-sm text-red-700 font-semibold mb-2">Delete this workout?</p>
                            <div className="flex gap-2">
                              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm font-semibold">Cancel</button>
                              <button onClick={() => deleteSession(sess.id)} className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold">Delete</button>
                            </div>
                          </div>
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
