import { useState, useEffect } from 'react'
import { db } from '../db'
import { formatDate, todayISO, yesterdayISO } from '../utils/motivational'
import ExercisePicker from '../components/ExercisePicker'
import { ChevronLeft, Plus, Check } from 'lucide-react'

// ─── Preset helpers (stored in localStorage per template) ────────────────────

const PRESET_LABELS = ['light', 'medium', 'heavy']
const PRESET_DISPLAY = { light: 'L', medium: 'M', heavy: 'H' }
const PRESET_DEFAULTS = { light: 5, medium: 10, heavy: 15 }

function loadPresets(templateId) {
  try {
    const raw = localStorage.getItem(`presets_${templateId}`)
    return raw ? JSON.parse(raw) : { ...PRESET_DEFAULTS }
  } catch { return { ...PRESET_DEFAULTS } }
}

function savePresets(templateId, presets) {
  localStorage.setItem(`presets_${templateId}`, JSON.stringify(presets))
}

// Per-exercise: remember whether they used preset/custom and which preset
function loadExMode(templateId, exerciseId) {
  return localStorage.getItem(`exmode_${templateId}_${exerciseId}`) || 'preset'
}
function saveExMode(templateId, exerciseId, mode) {
  localStorage.setItem(`exmode_${templateId}_${exerciseId}`, mode)
}
function loadExPreset(templateId, exerciseId) {
  return localStorage.getItem(`expreset_${templateId}_${exerciseId}`) || null
}
function saveExPreset(templateId, exerciseId, preset) {
  localStorage.setItem(`expreset_${templateId}_${exerciseId}`, preset)
}

// ─── Step 1: Date picker ─────────────────────────────────────────────────────

function DateStep({ template, onNext, onBack }) {
  const [selected, setSelected] = useState(todayISO())
  const today = todayISO()
  const yesterday = yesterdayISO()

  const OPTIONS = [
    { label: 'Today',     emoji: '☀️', value: today,     sub: formatDate(today) },
    { label: 'Yesterday', emoji: '🌙', value: yesterday, sub: formatDate(yesterday) },
  ]

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0">
        <button onClick={onBack} className="min-tap w-10 h-10 flex items-center justify-center text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <div>
          <p className="text-sm text-gray-500">When did you go?</p>
          <h1 className="text-xl font-bold text-gray-900">{template.icon} {template.name}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => setSelected(opt.value)}
            className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
              ${selected === opt.value ? 'border-teal-700 bg-teal-50' : 'border-gray-200 bg-white'}`}
          >
            <span className="text-2xl">{opt.emoji}</span>
            <div className="flex-1 text-left">
              <p className="font-semibold text-gray-900">{opt.label}</p>
              <p className="text-sm text-gray-500">{opt.sub}</p>
            </div>
            {selected === opt.value && <Check size={20} className="text-teal-700" />}
          </button>
        ))}

        <button
          onClick={() => {
            const d = prompt('Enter date (YYYY-MM-DD):')
            if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) setSelected(d)
          }}
          className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
            ${!OPTIONS.find(o => o.value === selected) ? 'border-teal-700 bg-teal-50' : 'border-gray-200 bg-white'}`}
        >
          <span className="text-2xl">📅</span>
          <div className="flex-1 text-left">
            <p className="font-semibold text-gray-900">Choose a date</p>
            {!OPTIONS.find(o => o.value === selected) && (
              <p className="text-sm text-teal-700">{formatDate(selected)}</p>
            )}
          </div>
        </button>
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0">
        <button
          onClick={() => onNext(selected)}
          className="w-full bg-teal-700 text-white font-bold text-lg py-4 rounded-2xl active:bg-teal-600"
        >
          Next →
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Set Light / Medium / Heavy weights ──────────────────────────────

function PresetsStep({ template, onNext, onBack }) {
  const [presets, setPresets] = useState(() => loadPresets(template.id))

  function setLevel(level, val) {
    setPresets(p => ({ ...p, [level]: Math.max(0, +(val).toFixed(1)) }))
  }

  function handleNext() {
    savePresets(template.id, presets)
    onNext(presets)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="min-tap w-10 h-10 flex items-center justify-center text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{template.icon} {template.name}</h1>
          <p className="text-sm text-gray-500">Set today's weights</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6">
        <p className="text-gray-500 mb-6">
          Enter your Light, Medium, and Heavy weights for today. You can use these as quick-select options for each exercise.
        </p>

        <div className="space-y-5">
          {PRESET_LABELS.map(level => {
            const colors = {
              light:  { bg: 'bg-sky-50',    border: 'border-sky-200',   text: 'text-sky-700',   btn: 'bg-sky-600'   },
              medium: { bg: 'bg-teal-50',   border: 'border-teal-200',  text: 'text-teal-700',  btn: 'bg-teal-600'  },
              heavy:  { bg: 'bg-violet-50', border: 'border-violet-200',text: 'text-violet-700',btn: 'bg-violet-600'},
            }
            const c = colors[level]
            const val = presets[level]
            return (
              <div key={level} className={`${c.bg} border ${c.border} rounded-2xl p-4`}>
                <p className={`font-bold ${c.text} capitalize text-lg mb-3`}>{level}</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLevel(level, val - 0.5)}
                    className="min-tap w-12 h-12 rounded-full bg-white text-xl font-bold text-gray-700 flex items-center justify-center shadow-sm active:bg-gray-50"
                  >−</button>
                  <span className={`flex-1 text-center text-2xl font-bold ${c.text}`}>
                    {(+val).toFixed(1)} <span className="text-base font-normal text-gray-500">kg</span>
                  </span>
                  <button
                    onClick={() => setLevel(level, val + 0.5)}
                    className={`min-tap w-12 h-12 rounded-full ${c.btn} text-xl font-bold text-white flex items-center justify-center active:opacity-80`}
                  >+</button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0">
        <button
          onClick={handleNext}
          className="w-full bg-teal-700 text-white font-bold text-lg py-4 rounded-2xl active:bg-teal-600"
        >
          Next — Fill in exercises →
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Weight quick-fill ───────────────────────────────────────────────

const PRESET_CHIP_COLORS = {
  light:  { base: 'bg-sky-100 text-sky-700 border-sky-200',   active: 'bg-sky-600 text-white border-sky-600'   },
  medium: { base: 'bg-teal-100 text-teal-700 border-teal-200', active: 'bg-teal-600 text-white border-teal-600' },
  heavy:  { base: 'bg-violet-100 text-violet-700 border-violet-200', active: 'bg-violet-600 text-white border-violet-600' },
}

function WeightStep({ template, date, presets, onSave, onBack }) {
  const [rows, setRows] = useState([])
  const [showPicker, setShowPicker] = useState(false)
  const [allExercises, setAllExercises] = useState([])
  const [defaultSets] = useState(template.defaultSets || 3)
  const [defaultReps] = useState(template.defaultReps || 12)
  const [saving, setSaving] = useState(false)
  const [pbMap, setPbMap] = useState({})

  useEffect(() => {
    async function load() {
      const [allEx, templateExs] = await Promise.all([
        db.exercises.toArray(),
        db.templateExercises.where('classTemplateId').equals(template.id).sortBy('order'),
      ])
      setAllExercises(allEx)
      const exMap = Object.fromEntries(allEx.map(e => [e.id, e]))

      const lastSession = await db.sessions
        .where('classTemplateId').equals(template.id)
        .reverse().first()

      const lastWeightMap = {}
      if (lastSession) {
        const lastSets = await db.sets.where('sessionId').equals(lastSession.id).toArray()
        lastSets.forEach(s => {
          if (!lastWeightMap[s.exerciseId] || s.weight > lastWeightMap[s.exerciseId])
            lastWeightMap[s.exerciseId] = s.weight
        })
      }

      const visible = templateExs.filter(te => te.skipCount < 2)
      const initialRows = visible.map(te => {
        const ex = exMap[te.exerciseId]
        if (!ex) return null

        const lastWeight = lastWeightMap[ex.id] ?? 0
        const rememberedMode   = loadExMode(template.id, ex.id)
        const rememberedPreset = loadExPreset(template.id, ex.id)

        // Determine which preset chip matches lastWeight (if any)
        const matchingPreset = presets
          ? PRESET_LABELS.find(l => Math.abs((presets[l] || 0) - lastWeight) < 0.01)
          : null

        return {
          templateExerciseId: te.id,
          exerciseId: ex.id,
          exercise: ex,
          weight: lastWeight,
          reps: defaultReps,
          skipped: false,
          lastWeight: lastWeight || null,
          isNew: false,
          // preset UI state
          mode: rememberedMode,                                      // 'preset' | 'custom'
          selectedPreset: rememberedPreset || matchingPreset || null, // 'light'|'medium'|'heavy'|null
        }
      }).filter(Boolean)

      setRows(initialRows)
    }
    load()

    db.pbs.toArray().then(pbs => {
      const map = {}
      pbs.forEach(pb => { if (!map[pb.exerciseId] || pb.weight > map[pb.exerciseId]) map[pb.exerciseId] = pb.weight })
      setPbMap(map)
    })
  }, [template, defaultReps])

  function updateRow(idx, patch) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, ...patch } : row))
  }

  function toggleSkip(idx) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, skipped: !row.skipped } : row))
  }

  function selectPreset(idx, level) {
    const row = rows[idx]
    const w = presets?.[level] ?? 0
    updateRow(idx, { weight: w, selectedPreset: level, mode: 'preset' })
    saveExMode(template.id, row.exerciseId, 'preset')
    saveExPreset(template.id, row.exerciseId, level)
  }

  function switchToCustom(idx) {
    const row = rows[idx]
    updateRow(idx, { mode: 'custom', selectedPreset: null })
    saveExMode(template.id, row.exerciseId, 'custom')
  }

  function switchToPreset(idx) {
    const row = rows[idx]
    updateRow(idx, { mode: 'preset' })
    saveExMode(template.id, row.exerciseId, 'preset')
  }

  function addExercise(ex) {
    const mode = loadExMode(template.id, ex.id)
    const rememberedPreset = loadExPreset(template.id, ex.id)
    setRows(r => [...r, {
      exerciseId: ex.id,
      exercise: ex,
      weight: (mode === 'preset' && rememberedPreset && presets) ? (presets[rememberedPreset] ?? 0) : 0,
      reps: defaultReps,
      skipped: false,
      lastWeight: null,
      isNew: true,
      mode,
      selectedPreset: rememberedPreset || null,
    }])
    setShowPicker(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const sessionId = await db.sessions.add({ date, classTemplateId: template.id, notes: '' })

      if (presets) {
        await db.sessionPresets.add({
          sessionId,
          classTemplateId: template.id,
          light: presets.light ?? 0,
          medium: presets.medium ?? 0,
          heavy: presets.heavy ?? 0,
          savedAt: new Date().toISOString(),
        })
      }

      const newPbs = []

      for (const row of rows) {
        if (row.skipped) continue
        for (let s = 1; s <= defaultSets; s++) {
          await db.sets.add({
            sessionId, exerciseId: row.exerciseId, setNumber: s,
            weight: row.weight, reps: row.reps, completedAt: new Date().toISOString(),
          })
        }
        const curPb = pbMap[row.exerciseId] || 0
        if (row.weight > curPb) {
          await db.pbs.add({ exerciseId: row.exerciseId, weight: row.weight, reps: row.reps, achievedAt: new Date().toISOString() })
          newPbs.push({ name: row.exercise.name, weight: row.weight })
        }
      }

      for (const row of rows) {
        if (row.templateExerciseId) {
          if (row.skipped) {
            const te = await db.templateExercises.get(row.templateExerciseId)
            if (te) await db.templateExercises.update(row.templateExerciseId, { skipCount: te.skipCount + 1 })
          } else {
            await db.templateExercises.update(row.templateExerciseId, { skipCount: 0 })
          }
        } else if (row.isNew && !row.skipped) {
          const maxOrder = Math.max(0, ...rows.map((_, i) => i))
          await db.templateExercises.add({ classTemplateId: template.id, exerciseId: row.exerciseId, order: maxOrder + 1, skipCount: 0 })
        }
      }

      const exercisesDone = rows.filter(r => !r.skipped).length
      onSave({ sessionId, date, template, exercisesDone, setsDone: exercisesDone * defaultSets, newPbs })
    } finally {
      setSaving(false)
    }
  }

  const recentNames = rows.map(r => r.exercise?.name).filter(Boolean)
  const hasPresets = presets && PRESET_LABELS.some(l => (presets[l] || 0) > 0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="min-tap w-10 h-10 flex items-center justify-center text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{template.icon} {template.name}</h1>
          <p className="text-sm text-gray-500">{formatDate(date)} · {defaultSets} sets · {defaultReps} reps each</p>
          {hasPresets && (
            <div className="flex gap-2 mt-1.5 flex-wrap">
              {PRESET_LABELS.map(l => (
                <span key={l} className={`text-xs font-semibold px-2 py-0.5 rounded-full ${PRESET_CHIP_COLORS[l].active}`}>
                  {l.charAt(0).toUpperCase() + l.slice(1)} {(+presets[l]).toFixed(1)}kg
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {rows.map((row, idx) => {
          const isPbBeaten = row.weight > 0 && pbMap[row.exerciseId] && row.weight > pbMap[row.exerciseId]

          return (
            <div
              key={`${row.exerciseId}-${idx}`}
              className={`rounded-2xl border p-4 transition-all
                ${row.skipped ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 bg-white shadow-sm'}`}
            >
              {/* Header row — tap to skip */}
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleSkip(idx)}>
                <span className="text-2xl">{row.exercise.icon || '🏋️'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{row.exercise.name}</p>
                  <p className="text-xs text-gray-400">
                    {defaultSets} × {row.reps} reps
                    {row.lastWeight ? ` · last: ${row.lastWeight}kg` : ''}
                  </p>
                </div>
                {row.skipped && <span className="text-sm text-gray-400 font-medium">Skipped</span>}
                {!row.skipped && isPbBeaten && <span className="text-xs text-amber-500 font-bold">PB! 🌟</span>}
              </div>

              {!row.skipped && (
                <div className="mt-3" onClick={e => e.stopPropagation()}>
                  {/* Preset mode */}
                  {row.mode === 'preset' && hasPresets && (
                    <div>
                      <div className="flex gap-2">
                        {PRESET_LABELS.map(level => {
                          const isSelected = row.selectedPreset === level
                          const c = PRESET_CHIP_COLORS[level]
                          return (
                            <button
                              key={level}
                              onClick={() => selectPreset(idx, level)}
                              className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all active:opacity-80
                                ${isSelected ? c.active : c.base}`}
                            >
                              <span className="block text-xs font-semibold opacity-75 capitalize">{level}</span>
                              <span className="block text-base leading-tight">{(+presets[level]).toFixed(1)}kg</span>
                            </button>
                          )
                        })}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        {row.selectedPreset ? (
                          <span className={`text-sm font-bold ${isPbBeaten ? 'text-amber-500' : 'text-gray-600'}`}>
                            {(+row.weight).toFixed(1)}kg{isPbBeaten ? ' 🌟' : ''}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">Tap a weight above</span>
                        )}
                        <button onClick={() => switchToCustom(idx)} className="text-xs text-gray-400 underline">
                          Enter custom weight
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Custom mode (or no presets) */}
                  {(row.mode === 'custom' || !hasPresets) && (
                    <div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateRow(idx, { weight: Math.max(0, +(row.weight - 0.5).toFixed(1)) })}
                          className="min-tap w-11 h-11 rounded-full bg-gray-100 text-xl font-bold text-gray-700 flex items-center justify-center"
                        >−</button>
                        <div className="flex-1 text-center">
                          <span className={`text-xl font-bold ${isPbBeaten ? 'text-amber-500' : 'text-gray-900'}`}>
                            {(+row.weight).toFixed(1)}kg
                          </span>
                        </div>
                        <button
                          onClick={() => updateRow(idx, { weight: +(row.weight + 0.5).toFixed(1) })}
                          className="min-tap w-11 h-11 rounded-full bg-teal-700 text-xl font-bold text-white flex items-center justify-center"
                        >+</button>
                      </div>
                      {hasPresets && (
                        <div className="mt-2 text-right">
                          <button onClick={() => switchToPreset(idx)} className="text-xs text-gray-400 underline">
                            Use L / M / H
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}

        <button
          onClick={() => setShowPicker(true)}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed border-gray-300 text-teal-700 font-semibold active:bg-gray-50"
        >
          <Plus size={20} /> Add an exercise
        </button>
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-teal-700 text-white font-bold text-lg py-4 rounded-2xl active:bg-teal-600 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? 'Saving…' : <><Check size={20} /> Save Session</>}
        </button>
      </div>

      <ExercisePicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={addExercise}
        exercises={allExercises}
        recentNames={recentNames}
      />
    </div>
  )
}

// ─── Step 4: Aqua / cardio-only ──────────────────────────────────────────────

function AquaStep({ template, date, onSave, onBack }) {
  const [duration, setDuration] = useState(45)
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    setSaving(true)
    const sessionId = await db.sessions.add({
      date,
      classTemplateId: template.id,
      notes: `Duration: ${duration} min${notes ? '\n' + notes : ''}`,
    })
    onSave({ sessionId, date, template, exercisesDone: 0, setsDone: 0, newPbs: [] })
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="min-tap w-10 h-10 flex items-center justify-center text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{template.icon} {template.name}</h1>
          <p className="text-sm text-gray-500">{formatDate(date)}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
        <div>
          <p className="font-semibold text-gray-700 mb-4">Duration (optional)</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setDuration(d => Math.max(0, d - 5))} className="min-tap w-12 h-12 rounded-full bg-gray-100 text-xl font-bold text-gray-700 flex items-center justify-center">−</button>
            <span className="flex-1 text-center text-2xl font-bold text-gray-900">{duration} <span className="text-lg font-normal text-gray-500">mins</span></span>
            <button onClick={() => setDuration(d => d + 5)} className="min-tap w-12 h-12 rounded-full bg-teal-700 text-xl font-bold text-white flex items-center justify-center">+</button>
          </div>
        </div>
        <div>
          <p className="font-semibold text-gray-700 mb-2">Notes (optional)</p>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="How did it feel? Anything to remember..."
            rows={4}
            className="w-full rounded-xl border border-gray-200 p-4 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-teal-500 resize-none"
          />
        </div>
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-teal-700 text-white font-bold text-lg py-4 rounded-2xl active:bg-teal-600 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {saving ? 'Saving…' : <><Check size={20} /> Save Session</>}
        </button>
      </div>
    </div>
  )
}

// ─── Step 5: Celebration ─────────────────────────────────────────────────────

function CelebrationStep({ result, onDone }) {
  const { date, template, exercisesDone, setsDone, newPbs } = result
  const messages = [
    "You should be really proud.",
    "That was a great session!",
    "Look at you go! 💪",
    "Every workout counts.",
  ]
  const msg = messages[Math.floor(Math.random() * messages.length)]

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center space-y-6">
      <div className="text-6xl animate-bounce">🎉</div>
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Workout saved!</h1>
        <p className="text-gray-500">{template.icon} {template.name} · {formatDate(date)}</p>
        <p className="text-teal-700 font-medium mt-2">"{msg}"</p>
      </div>

      {(exercisesDone > 0 || setsDone > 0 || newPbs.length > 0) && (
        <div className="flex gap-4 w-full max-w-xs justify-center">
          {exercisesDone > 0 && (
            <div className="flex-1 bg-teal-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-teal-700">{exercisesDone}</p>
              <p className="text-xs text-teal-600 font-medium">Exercises</p>
            </div>
          )}
          {setsDone > 0 && (
            <div className="flex-1 bg-green-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{setsDone}</p>
              <p className="text-xs text-green-500 font-medium">Sets</p>
            </div>
          )}
          {newPbs.length > 0 && (
            <div className="flex-1 bg-amber-50 rounded-2xl p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{newPbs.length}</p>
              <p className="text-xs text-amber-500 font-medium">New PBs</p>
            </div>
          )}
        </div>
      )}

      {newPbs.length > 0 && (
        <div className="bg-amber-50 rounded-2xl p-4 w-full max-w-xs">
          <p className="font-bold text-amber-600 mb-2">🌟 New personal bests!</p>
          {newPbs.map(pb => (
            <p key={pb.name} className="text-amber-700 text-sm">{pb.name}: {pb.weight}kg</p>
          ))}
        </div>
      )}

      <button
        onClick={onDone}
        className="w-full max-w-xs bg-teal-700 text-white font-bold text-lg py-4 rounded-2xl active:bg-teal-600"
      >
        Back to Today
      </button>
    </div>
  )
}

// ─── ClassFlow orchestrator ──────────────────────────────────────────────────

export default function ClassFlow({ template, onDone }) {
  const [step, setStep] = useState('date')
  const [date, setDate] = useState(null)
  const [presets, setPresets] = useState(null)
  const [result, setResult] = useState(null)
  const isCardio = template.isCardioOnly

  if (step === 'date') {
    return (
      <DateStep
        template={template}
        onNext={d => { setDate(d); setStep(isCardio ? 'weights' : 'presets') }}
        onBack={onDone}
      />
    )
  }

  if (step === 'presets') {
    return (
      <PresetsStep
        template={template}
        onNext={p => { setPresets(p); setStep('weights') }}
        onBack={() => setStep('date')}
      />
    )
  }

  if (step === 'weights') {
    const WeightComponent = isCardio ? AquaStep : WeightStep
    return (
      <WeightComponent
        template={template}
        date={date}
        presets={presets}
        onSave={res => { setResult(res); setStep('celebrate') }}
        onBack={() => setStep(isCardio ? 'date' : 'presets')}
      />
    )
  }

  if (step === 'celebrate') {
    return <CelebrationStep result={result} onDone={onDone} />
  }

  return null
}
