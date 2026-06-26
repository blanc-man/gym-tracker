import Dexie from 'dexie'

export const db = new Dexie('GymTracker')

db.version(1).stores({
  exercises:         '++id, name, category, isCustom',
  sessions:          '++id, date, classTemplateId, notes',
  sets:              '++id, sessionId, exerciseId, setNumber, weight, reps, completedAt',
  pbs:               '++id, exerciseId, weight, reps, achievedAt',
  classTemplates:    '++id, name, icon, venue',
  templateExercises: '++id, classTemplateId, exerciseId, order, skipCount',
  meta:              'key'
})

db.version(2).stores({
  exercises:         '++id, name, category, isCustom',
  sessions:          '++id, date, classTemplateId, notes',
  sets:              '++id, sessionId, exerciseId, setNumber, weight, reps, completedAt',
  pbs:               '++id, exerciseId, weight, reps, achievedAt',
  classTemplates:    '++id, name, icon, venue',
  templateExercises: '++id, classTemplateId, exerciseId, order, skipCount',
  meta:              'key',
  sessionPresets:    '++id, sessionId, classTemplateId'
})

// ─── Seed data ────────────────────────────────────────────────────────────────

const LIVING_STRONGER = [
  { name: 'Sit to Stand',         category: 'Living Stronger', muscleGroup: 'Legs',             description: 'Hold chair if needed. Stand fully upright each rep.',       icon: '🪑', isCustom: false },
  { name: 'Step Up',              category: 'Living Stronger', muscleGroup: 'Legs',             description: 'Use a step or low bench. Alternate legs.',                   icon: '🦶', isCustom: false },
  { name: 'Wall Push Up',         category: 'Living Stronger', muscleGroup: 'Upper Body',       description: 'Stand arm\'s length from wall. Keep body straight.',          icon: '🧱', isCustom: false },
  { name: 'Chest Press (machine)',category: 'Living Stronger', muscleGroup: 'Upper Body',       description: 'Adjust seat so handles are at chest height.',                 icon: '💪', isCustom: false },
  { name: 'Seated Row',           category: 'Living Stronger', muscleGroup: 'Back',             description: 'Pull handles to lower chest. Keep back straight.',           icon: '🚣', isCustom: false },
  { name: 'Lat Pulldown',         category: 'Living Stronger', muscleGroup: 'Back',             description: 'Pull bar to upper chest. Lean back slightly.',               icon: '⬇️', isCustom: false },
  { name: 'Shoulder Press',       category: 'Living Stronger', muscleGroup: 'Shoulders',        description: 'Press dumbbells overhead. Keep core tight.',                 icon: '⬆️', isCustom: false },
  { name: 'Bicep Curl',           category: 'Living Stronger', muscleGroup: 'Arms',             description: 'Curl slowly up and down. Keep elbows at your sides.',        icon: '💪', isCustom: false },
  { name: 'Tricep Extension',     category: 'Living Stronger', muscleGroup: 'Arms',             description: 'Extend arms fully. Control the movement on the way down.',   icon: '🏋️', isCustom: false },
  { name: 'Calf Raise',           category: 'Living Stronger', muscleGroup: 'Legs',             description: 'Rise onto toes slowly. Hold a chair for balance if needed.', icon: '🦵', isCustom: false },
  { name: 'Balance Stand',        category: 'Living Stronger', muscleGroup: 'Balance',          description: 'Stand on one foot. Aim for 30 seconds each side.',           icon: '🧘', isCustom: false },
  { name: 'Farmer\'s Carry',      category: 'Living Stronger', muscleGroup: 'Core/Grip',        description: 'Walk with weights at your sides. Keep shoulders back.',       icon: '🛍️', isCustom: false },
  { name: 'Hip Hinge / Deadlift', category: 'Living Stronger', muscleGroup: 'Posterior Chain',  description: 'Hinge at hips, keep back flat. Lower weight to mid-shin.',    icon: '🏗️', isCustom: false },
  { name: 'Goblet Squat',         category: 'Living Stronger', muscleGroup: 'Legs',             description: 'Hold weight at chest. Squat deep, keep chest up.',           icon: '🏆', isCustom: false },
]

const BODY_PUMP = [
  { name: 'Squat',          category: 'Body Pump', muscleGroup: 'Legs',       description: 'Barbell squat. Keep feet shoulder-width apart.',      icon: '🦵', isCustom: false },
  { name: 'Chest Press',    category: 'Body Pump', muscleGroup: 'Upper Body', description: 'Barbell bench press. Control the movement.',           icon: '💪', isCustom: false },
  { name: 'Back / Row',     category: 'Body Pump', muscleGroup: 'Back',       description: 'Bent over row with barbell.',                          icon: '🚣', isCustom: false },
  { name: 'Lunge',          category: 'Body Pump', muscleGroup: 'Legs',       description: 'Alternate legs. Keep front knee over ankle.',          icon: '🏃', isCustom: false },
  { name: 'Core / Plank',   category: 'Body Pump', muscleGroup: 'Core',       description: 'Plank hold. Keep hips level.',                         icon: '🧱', isCustom: false },
]

const GENERAL = [
  { name: 'Chest Fly (machine)',  category: 'General', muscleGroup: 'Upper Body', description: 'Open arms wide, squeeze at the top.',            icon: '🦋', isCustom: false },
  { name: 'Leg Press',            category: 'General', muscleGroup: 'Legs',       description: 'Push platform away. Don\'t lock knees.',          icon: '🦵', isCustom: false },
  { name: 'Leg Curl',             category: 'General', muscleGroup: 'Legs',       description: 'Curl heels toward glutes. Controlled pace.',      icon: '🦵', isCustom: false },
  { name: 'Leg Extension',        category: 'General', muscleGroup: 'Legs',       description: 'Extend legs fully. Lower with control.',          icon: '🦵', isCustom: false },
  { name: 'Seated Calf Raise',    category: 'General', muscleGroup: 'Legs',       description: 'Use the seated calf raise machine.',              icon: '🦵', isCustom: false },
  { name: 'Face Pull',            category: 'General', muscleGroup: 'Shoulders',  description: 'Pull rope to face level. Great for posture.',     icon: '🎯', isCustom: false },
  { name: 'Cable Row',            category: 'General', muscleGroup: 'Back',       description: 'Sit at cable machine, pull to lower chest.',      icon: '🚣', isCustom: false },
]

const CLASS_TEMPLATES = [
  { name: 'Body Pump',       icon: '🏋️', venue: 'Glen Eira Rec Centre', defaultSets: 3, defaultReps: 12 },
  { name: 'Living Stronger', icon: '💪', venue: 'Glen Eira Rec Centre', defaultSets: 3, defaultReps: 12 },
  { name: 'Aqua Class',      icon: '🌊', venue: 'Carnegie Pool',         defaultSets: 0, defaultReps: 0, isCardioOnly: true },
]

// Exercises to include in each template (by name)
const TEMPLATE_EXERCISE_NAMES = {
  'Body Pump':       ['Squat', 'Chest Press', 'Back / Row', 'Tricep Extension', 'Bicep Curl', 'Lunge', 'Shoulder Press', 'Core / Plank'],
  'Living Stronger': ['Sit to Stand', 'Chest Press (machine)', 'Seated Row', 'Shoulder Press', 'Bicep Curl', 'Calf Raise', 'Balance Stand'],
  'Aqua Class':      [],
}

let _seedPromise = null

export async function seedDatabase() {
  if (_seedPromise) return _seedPromise
  _seedPromise = _doSeed()
  return _seedPromise
}

async function _doSeed() {
  const seeded = await db.meta.get('seeded')
  if (seeded) return

  const allExercises = [...LIVING_STRONGER, ...BODY_PUMP, ...GENERAL]
  const exerciseIds = await db.exercises.bulkAdd(allExercises, { allKeys: true })

  // Build name→id map
  const nameToId = {}
  allExercises.forEach((ex, i) => { nameToId[ex.name] = exerciseIds[i] })

  const templateIds = await db.classTemplates.bulkAdd(CLASS_TEMPLATES, { allKeys: true })

  for (let ti = 0; ti < CLASS_TEMPLATES.length; ti++) {
    const tpl = CLASS_TEMPLATES[ti]
    const tplId = templateIds[ti]
    const names = TEMPLATE_EXERCISE_NAMES[tpl.name] || []
    const rows = names
      .filter(n => nameToId[n] !== undefined)
      .map((n, order) => ({ classTemplateId: tplId, exerciseId: nameToId[n], order, skipCount: 0 }))
    if (rows.length) await db.templateExercises.bulkAdd(rows)
  }

  await db.meta.put({ key: 'seeded', value: true })
}
