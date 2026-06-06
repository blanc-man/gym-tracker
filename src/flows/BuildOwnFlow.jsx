import { useState, useEffect } from 'react'
import { db } from '../db'
import { formatDate, todayISO, yesterdayISO, randomPostSetMessage } from '../utils/motivational'
import Stepper from '../components/Stepper'
import ExercisePicker from '../components/ExercisePicker'
import { ChevronLeft, Check, Plus } from 'lucide-react'

// ─── Date picker (reused from ClassFlow style) ───────────────────────────────

function DateStep({ onNext, onBack }) {
  const [selected, setSelected] = useState(todayISO())
  const today = todayISO()
  const yesterday = yesterdayISO()

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0">
        <button onClick={onBack} className="min-tap w-10 h-10 flex items-center justify-center text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <div>
          <p className="text-sm text-gray-500">Building your own workout</p>
          <h1 className="text-xl font-bold text-gray-900">✏️ When was this?</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {[
          { label: 'Today', emoji: '☀️', value: today, sub: formatDate(today) },
          { label: 'Yesterday', emoji: '🌙', value: yesterday, sub: formatDate(yesterday) },
        ].map(opt => (
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
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0">
        <button
          onClick={() => onNext(selected)}
          className="w-full bg-teal-700 text-white font-bold text-lg py-4 rounded-2xl active:bg-teal-600"
        >
          Next — Choose exercises →
        </button>
      </div>
    </div>
  )
}

// ─── Set logger for one exercise ─────────────────────────────────────────────

function SetLogger({ exercise, sessionId, onDone, onBack }) {
  const [weight, setWeight] = useState(0)
  const [reps, setReps] = useState(12)
  const [setsLogged, setSetsLogged] = useState(0)
  const [message, setMessage] = useState('')
  const [pb, setPb] = useState(null)

  useEffect(() => {
    async function load() {
      // Pre-fill from last use
      const lastSet = await db.sets
        .where('exerciseId').equals(exercise.id)
        .reverse().first()
      if (lastSet) { setWeight(lastSet.weight); setReps(lastSet.reps) }

      const bestPb = await db.pbs.where('exerciseId').equals(exercise.id).reverse().first()
      if (bestPb) setPb(bestPb)
    }
    load()
  }, [exercise.id])

  async function logSet() {
    await db.sets.add({
      sessionId,
      exerciseId: exercise.id,
      setNumber: setsLogged + 1,
      weight,
      reps,
      completedAt: new Date().toISOString(),
    })

    // Check PB
    const curPbWeight = pb?.weight ?? 0
    if (weight > curPbWeight) {
      await db.pbs.add({ exerciseId: exercise.id, weight, reps, achievedAt: new Date().toISOString() })
      setPb({ weight, reps })
      setMessage('🌟 New personal best! Look at you go!')
    } else {
      setMessage(randomPostSetMessage())
    }

    setSetsLogged(n => n + 1)
    setTimeout(() => setMessage(''), 2500)
  }

  const dots = Array.from({ length: Math.max(setsLogged, 3) }, (_, i) => i < setsLogged)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="min-tap w-10 h-10 flex items-center justify-center text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <div>
          <span className="text-3xl">{exercise.icon}</span>
          <h1 className="text-xl font-bold text-gray-900 inline ml-2">{exercise.name}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
        {pb && (
          <div className="bg-amber-50 rounded-2xl p-4">
            <p className="text-amber-700 font-medium">Personal best: {pb.weight}kg × {pb.reps} reps</p>
          </div>
        )}

        <div>
          <p className="font-semibold text-gray-700 mb-4 text-lg">Weight (kg)</p>
          <Stepper value={weight} onChange={setWeight} step={0.5} min={0} />
        </div>

        <div>
          <p className="font-semibold text-gray-700 mb-4 text-lg">Reps</p>
          <Stepper value={reps} onChange={setReps} step={1} min={1} />
        </div>

        <div className="flex items-center gap-2">
          <p className="text-gray-500 mr-2">Sets:</p>
          {dots.map((done, i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${done ? 'bg-teal-700' : 'bg-gray-200'}`}
            />
          ))}
        </div>

        {message && (
          <div className={`rounded-2xl p-4 text-center font-semibold transition-all
            ${message.includes('personal best') ? 'bg-amber-50 text-amber-700' : 'bg-teal-50 text-teal-700'}`}>
            {message}
          </div>
        )}
      </div>

      <div className="px-5 pb-3 pt-2 space-y-3 flex-shrink-0">
        <button
          onClick={logSet}
          className="w-full bg-teal-700 text-white font-bold text-lg py-4 rounded-2xl active:bg-teal-600"
        >
          LOG SET
        </button>
        <button
          onClick={onDone}
          className="w-full bg-white border-2 border-gray-200 text-gray-700 font-semibold text-base py-3 rounded-2xl active:bg-gray-50"
        >
          Done with this exercise
        </button>
      </div>
    </div>
  )
}

// ─── BuildOwnFlow orchestrator ───────────────────────────────────────────────

export default function BuildOwnFlow({ onDone }) {
  const [step, setStep] = useState('date')
  const [date, setDate] = useState(null)
  const [sessionId, setSessionId] = useState(null)
  const [showPicker, setShowPicker] = useState(false)
  const [currentExercise, setCurrentExercise] = useState(null)
  const [allExercises, setAllExercises] = useState([])
  const [doneExercises, setDoneExercises] = useState([])

  useEffect(() => {
    db.exercises.toArray().then(setAllExercises)
  }, [])

  async function startSession(d) {
    const id = await db.sessions.add({ date: d, classTemplateId: null, notes: 'Custom workout' })
    setDate(d)
    setSessionId(id)
    setStep('pick')
    setShowPicker(true)
  }

  function pickExercise(ex) {
    setCurrentExercise(ex)
    setShowPicker(false)
    setStep('log')
  }

  function finishedSet() {
    setDoneExercises(prev => [...prev, currentExercise])
    setCurrentExercise(null)
    setStep('pick')
    setShowPicker(true)
  }

  if (step === 'date') {
    return <DateStep onNext={startSession} onBack={onDone} />
  }

  if (step === 'pick') {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-3 px-5 pt-5 pb-3 flex-shrink-0 border-b border-gray-100">
          <button onClick={onDone} className="min-tap w-10 h-10 flex items-center justify-center text-gray-500">
            <ChevronLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">✏️ Your workout</h1>
            <p className="text-sm text-gray-500">{formatDate(date)}</p>
          </div>
          <button
            onClick={onDone}
            className="bg-teal-700 text-white font-semibold px-4 py-2 rounded-xl text-sm active:bg-teal-600"
          >
            Finish
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {doneExercises.length > 0 && (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Done ✓</p>
              {doneExercises.map((ex, i) => (
                <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-100 last:border-0">
                  <span className="text-xl">{ex.icon}</span>
                  <p className="text-gray-600">{ex.name}</p>
                  <Check size={16} className="ml-auto text-teal-700" />
                </div>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowPicker(true)}
            className="w-full flex items-center justify-center gap-2 py-5 rounded-2xl border-2 border-dashed border-teal-300 text-teal-700 font-semibold text-lg active:bg-teal-50"
          >
            <Plus size={22} /> Add an exercise
          </button>
        </div>

        <ExercisePicker
          open={showPicker}
          onClose={() => { setShowPicker(false); if (doneExercises.length === 0) onDone() }}
          onSelect={pickExercise}
          exercises={allExercises}
          recentNames={doneExercises.map(e => e.name)}
        />
      </div>
    )
  }

  if (step === 'log' && currentExercise) {
    return (
      <SetLogger
        exercise={currentExercise}
        sessionId={sessionId}
        onDone={finishedSet}
        onBack={() => { setStep('pick'); setCurrentExercise(null) }}
      />
    )
  }

  return null
}
