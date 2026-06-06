import { useState, useEffect, useCallback } from 'react'
import { db } from '../db'
import { formatDate, todayISO, yesterdayISO } from '../utils/motivational'
import Stepper from '../components/Stepper'
import ExercisePicker from '../components/ExercisePicker'
import { ChevronLeft, Plus, Check } from 'lucide-react'

// ─── Step 1: Date picker ────────────────────────────────────────────────────

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
              ${selected === opt.value
                ? 'border-teal-700 bg-teal-50'
                : 'border-gray-200 bg-white'}`}
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
            ${!OPTIONS.find(o => o.value === selected)
              ? 'border-teal-700 bg-teal-50'
              : 'border-gray-200 bg-white'}`}
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
          Next — Fill in weights →
        </button>
      </div>
    </div>
  )
}

// ─── Step 2: Weight quick-fill ──────────────────────────────────────────────

function WeightStep({ template, date, onSave, onBack }) {
  const [rows, setRows] = useState([]) // { exercise, weight, reps, skipped, lastWeight, pb }
  const [showPicker, setShowPicker] = useState(false)
  const [allExercises, setAllExercises] = useState([])
  const [defaultSets] = useState(template.defaultSets || 3)
  const [defaultReps] = useState(template.defaultReps || 12)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      const [allEx, templateExs] = await Promise.all([
        db.exercises.toArray(),
        db.templateExercises.where('classTemplateId').equals(template.id).sortBy('order'),
      ])
      setAllExercises(allEx)

      const exMap = Object.fromEntries(allEx.map(e => [e.id, e]))

      // Get last session for this template to pre-fill weights
      const lastSession = await db.sessions
        .where('classTemplateId').equals(template.id)
        .reverse().first()

      const lastWeightMap = {}
      if (lastSession) {
        const lastSets = await db.sets.where('sessionId').equals(lastSession.id).toArray()
        lastSets.forEach(s => {
          if (!lastWeightMap[s.exerciseId] || s.weight > lastWeightMap[s.exerciseId]) {
            lastWeightMap[s.exerciseId] = s.weight
          }
        })
      }

      const visible = templateExs.filter(te => te.skipCount < 2)
      const initialRows = visible.map(te => {
        const ex = exMap[te.exerciseId]
        if (!ex) return null
        return {
          templateExerciseId: te.id,
          exerciseId: ex.id,
          exercise: ex,
          weight: lastWeightMap[ex.id] ?? 0,
          reps: defaultReps,
          skipped: false,
          lastWeight: lastWeightMap[ex.id] ?? null,
          isNew: false,
        }
      }).filter(Boolean)

      setRows(initialRows)
    }
    load()
  }, [template, defaultReps])

  // Load PBs for amber highlight
  const [pbMap, setPbMap] = useState({})
  useEffect(() => {
    db.pbs.toArray().then(pbs => {
      const map = {}
      pbs.forEach(pb => { if (!map[pb.exerciseId] || pb.weight > map[pb.exerciseId]) map[pb.exerciseId] = pb.weight })
      setPbMap(map)
    })
  }, [])

  function updateRow(idx, patch) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, ...patch } : row))
  }

  function toggleSkip(idx) {
    setRows(r => r.map((row, i) => i === idx ? { ...row, skipped: !row.skipped } : row))
  }

  function addExercise(ex) {
    setRows(r => [...r, {
      exerciseId: ex.id,
      exercise: ex,
      weight: 0,
      reps: defaultReps,
      skipped: false,
      lastWeight: null,
      isNew: true,
    }])
    setShowPicker(false)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const sessionId = await db.sessions.add({
        date,
        classTemplateId: template.id,
        notes: '',
      })

      const newPbs = []

      for (const row of rows) {
        if (row.skipped) continue
        for (let s = 1; s <= defaultSets; s++) {
          await db.sets.add({
            sessionId,
            exerciseId: row.exerciseId,
            setNumber: s,
            weight: row.weight,
            reps: row.reps,
            completedAt: new Date().toISOString(),
          })
        }
        // Check PB
        const curPb = pbMap[row.exerciseId] || 0
        if (row.weight > curPb) {
          await db.pbs.add({ exerciseId: row.exerciseId, weight: row.weight, reps: row.reps, achievedAt: new Date().toISOString() })
          newPbs.push({ name: row.exercise.name, weight: row.weight })
        }
      }

      // Update template: increment skipCount for skipped rows, add new exercises
      for (const row of rows) {
        if (row.templateExerciseId) {
          if (row.skipped) {
            const te = await db.templateExercises.get(row.templateExerciseId)
            if (te) await db.templateExercises.update(row.templateExerciseId, { skipCount: te.skipCount + 1 })
          } else {
            await db.templateExercises.update(row.templateExerciseId, { skipCount: 0 })
          }
        } else if (row.isNew && !row.skipped) {
          // New exercise added mid-session — add to template
          const maxOrder = Math.max(0, ...rows.map((r, i) => i))
          await db.templateExercises.add({
            classTemplateId: template.id,
            exerciseId: row.exerciseId,
            order: maxOrder + 1,
            skipCount: 0,
          })
        }
      }

      const exercisesDone = rows.filter(r => !r.skipped).length
      onSave({ sessionId, date, template, exercisesDone, setsDone: exercisesDone * defaultSets, newPbs })
    } finally {
      setSaving(false)
    }
  }

  const recentNames = rows.map(r => r.exercise?.name).filter(Boolean)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="min-tap w-10 h-10 flex items-center justify-center text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-gray-900">{template.icon} {template.name}</h1>
          <p className="text-sm text-gray-500">{formatDate(date)} · {defaultSets} sets · {defaultReps} reps each</p>
          <p className="text-sm text-gray-500 mt-0.5">Fill in the weight you used. Skip anything you didn't do.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {rows.map((row, idx) => {
          const isPbBeaten = row.weight > 0 && pbMap[row.exerciseId] && row.weight > pbMap[row.exerciseId]
          return (
            <div
              key={`${row.exerciseId}-${idx}`}
              onClick={() => toggleSkip(idx)}
              className={`rounded-2xl border p-4 transition-all cursor-pointer
                ${row.skipped ? 'border-gray-200 bg-gray-50 opacity-60' : 'border-gray-200 bg-white shadow-sm'}`}
            >
              <div className="flex items-center gap-3">
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
                <div className="mt-3 flex items-center gap-3" onClick={e => e.stopPropagation()}>
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

// ─── Step 3: Aqua / cardio-only ─────────────────────────────────────────────

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

// ─── Step 4: Celebration ─────────────────────────────────────────────────────

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
  const [result, setResult] = useState(null)
  const isCardio = template.isCardioOnly

  if (step === 'date') {
    return (
      <DateStep
        template={template}
        onNext={d => { setDate(d); setStep('weights') }}
        onBack={onDone}
      />
    )
  }

  if (step === 'weights') {
    const WeightComponent = isCardio ? AquaStep : WeightStep
    return (
      <WeightComponent
        template={template}
        date={date}
        onSave={res => { setResult(res); setStep('celebrate') }}
        onBack={() => setStep('date')}
      />
    )
  }

  if (step === 'celebrate') {
    return <CelebrationStep result={result} onDone={onDone} />
  }

  return null
}
