import { db } from '../db'

export async function exportToJSON() {
  const [exercises, sessions, sets, pbs, classTemplates, templateExercises] = await Promise.all([
    db.exercises.toArray(),
    db.sessions.toArray(),
    db.sets.toArray(),
    db.pbs.toArray(),
    db.classTemplates.toArray(),
    db.templateExercises.toArray(),
  ])

  const data = {
    exportedAt: new Date().toISOString(),
    version: 1,
    exercises,
    sessions,
    sets,
    pbs,
    classTemplates,
    templateExercises,
  }

  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const dateStr = new Date().toISOString().slice(0, 10)
  a.download = `gym-backup-${dateStr}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function importFromJSON(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = JSON.parse(e.target.result)
        if (!data.version || !data.exercises) {
          reject(new Error('Invalid backup file.'))
          return
        }
        await db.transaction('rw', db.exercises, db.sessions, db.sets, db.pbs, db.classTemplates, db.templateExercises, async () => {
          await db.exercises.clear()
          await db.sessions.clear()
          await db.sets.clear()
          await db.pbs.clear()
          await db.classTemplates.clear()
          await db.templateExercises.clear()
          if (data.exercises?.length)         await db.exercises.bulkAdd(data.exercises)
          if (data.sessions?.length)          await db.sessions.bulkAdd(data.sessions)
          if (data.sets?.length)              await db.sets.bulkAdd(data.sets)
          if (data.pbs?.length)               await db.pbs.bulkAdd(data.pbs)
          if (data.classTemplates?.length)    await db.classTemplates.bulkAdd(data.classTemplates)
          if (data.templateExercises?.length) await db.templateExercises.bulkAdd(data.templateExercises)
        })
        resolve()
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(new Error('Could not read file.'))
    reader.readAsText(file)
  })
}
