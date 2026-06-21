import { useState } from 'react'
import { ChevronLeft, Check } from 'lucide-react'
import Stepper from './Stepper'

const EMOJI_OPTIONS = [
  '🏋️','💪','🌊','🧘','🏃','🚴','🤸','🥊','🏊','🧗',
  '⚽','🎯','🏌️','⛹️','🎽','🏒','🤾','🏇','🛹','🤺',
  '🌟','🔥','❤️','⚡','🎵','🏆','🌈','🦁','🐺','🦅',
]

export default function ClassTemplateForm({ onSave, onBack }) {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [icon, setIcon] = useState('🏋️')
  const [defaultSets, setDefaultSets] = useState(3)
  const [defaultReps, setDefaultReps] = useState(12)
  const [isCardio, setIsCardio] = useState(false)
  const [showEmoji, setShowEmoji] = useState(false)

  function handleSave() {
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      venue: location.trim(),
      icon,
      defaultSets: isCardio ? 0 : defaultSets,
      defaultReps: isCardio ? 0 : defaultReps,
      isCardioOnly: isCardio,
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="min-tap w-10 h-10 flex items-center justify-center text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-gray-900">New class</h1>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

        {/* Icon picker */}
        <div>
          <p className="text-sm font-semibold text-gray-600 mb-3">Icon</p>
          <button
            onClick={() => setShowEmoji(e => !e)}
            className="text-4xl p-3 bg-gray-100 rounded-2xl active:bg-gray-200"
          >
            {icon}
          </button>
          {showEmoji && (
            <div className="mt-3 grid grid-cols-8 gap-2">
              {EMOJI_OPTIONS.map(e => (
                <button
                  key={e}
                  onClick={() => { setIcon(e); setShowEmoji(false) }}
                  className={`text-2xl p-2 rounded-xl transition-all
                    ${e === icon ? 'bg-teal-100 ring-2 ring-teal-500' : 'bg-gray-100 active:bg-gray-200'}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Name */}
        <div>
          <label className="text-sm font-semibold text-gray-600 block mb-2">Class name *</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Pilates, Yoga, Spin..."
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-teal-500"
          />
        </div>

        {/* Location */}
        <div>
          <label className="text-sm font-semibold text-gray-600 block mb-2">Location (optional)</label>
          <input
            value={location}
            onChange={e => setLocation(e.target.value)}
            placeholder="e.g. Glen Eira Rec Centre"
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-teal-500"
          />
        </div>

        {/* Cardio toggle */}
        <div>
          <button
            onClick={() => setIsCardio(c => !c)}
            className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-200 active:bg-gray-50"
          >
            <div className="text-left">
              <p className="font-semibold text-gray-900">Cardio / no weights</p>
              <p className="text-xs text-gray-400 mt-0.5">Like Aqua Class — logs duration and notes only</p>
            </div>
            <div className={`w-12 h-7 rounded-full transition-colors flex items-center px-1
              ${isCardio ? 'bg-teal-600' : 'bg-gray-300'}`}>
              <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform
                ${isCardio ? 'translate-x-5' : 'translate-x-0'}`} />
            </div>
          </button>
        </div>

        {/* Sets & reps — hidden if cardio */}
        {!isCardio && (
          <div className="space-y-5">
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-4">Default sets</p>
              <Stepper value={defaultSets} onChange={setDefaultSets} step={1} min={1} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-4">Default reps</p>
              <Stepper value={defaultReps} onChange={setDefaultReps} step={1} min={1} />
            </div>
          </div>
        )}
      </div>

      <div className="px-5 pb-6 pt-3 flex-shrink-0">
        <button
          onClick={handleSave}
          disabled={!name.trim()}
          className="w-full bg-teal-700 text-white font-bold text-lg py-4 rounded-2xl active:bg-teal-600 disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Check size={20} /> Save class
        </button>
      </div>
    </div>
  )
}
