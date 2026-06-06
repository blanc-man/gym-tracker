import { useState, useRef } from 'react'
import { ChevronLeft, AlertTriangle } from 'lucide-react'
import { exportToJSON, importFromJSON } from '../utils/backup'
import {
  isGDriveConfigured, isGDriveConnected, disconnectGDrive,
  saveGDriveToken, getLastBackupTime, restoreFromGDrive, backupToGDrive, DRIVE_APPDATA_SCOPE
} from '../utils/gdrive'
import { GoogleLogin } from '@react-oauth/google'
import { db } from '../db'

export default function Settings({ onBack }) {
  const [status, setStatus] = useState('')
  const [gConnected, setGConnected] = useState(isGDriveConnected())
  const [lastBackup] = useState(getLastBackupTime())
  const fileRef = useRef()

  async function handleExport() {
    try {
      await exportToJSON()
      setStatus('✓ Backup file downloaded.')
    } catch (e) {
      setStatus('Export failed: ' + e.message)
    }
  }

  async function handleImport(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('This will replace all your current data. Are you sure?')) return
    try {
      await importFromJSON(file)
      setStatus('✓ Restored! Welcome back.')
    } catch (err) {
      setStatus('Restore failed: ' + err.message)
    }
    fileRef.current.value = ''
  }

  async function handleGDriveRestore() {
    try {
      setStatus('Restoring from Google Drive…')
      const data = await restoreFromGDrive()
      if (!data?.exercises) { setStatus('No valid backup found.'); return }
      if (!confirm('This will replace all your current data. Are you sure?')) { setStatus(''); return }
      // Re-use importFromJSON logic
      await db.transaction('rw', db.exercises, db.sessions, db.sets, db.pbs, db.classTemplates, db.templateExercises, async () => {
        await Promise.all([db.exercises.clear(), db.sessions.clear(), db.sets.clear(), db.pbs.clear(), db.classTemplates.clear(), db.templateExercises.clear()])
        if (data.exercises?.length)         await db.exercises.bulkAdd(data.exercises)
        if (data.sessions?.length)          await db.sessions.bulkAdd(data.sessions)
        if (data.sets?.length)              await db.sets.bulkAdd(data.sets)
        if (data.pbs?.length)               await db.pbs.bulkAdd(data.pbs)
        if (data.classTemplates?.length)    await db.classTemplates.bulkAdd(data.classTemplates)
        if (data.templateExercises?.length) await db.templateExercises.bulkAdd(data.templateExercises)
      })
      setStatus('✓ Restored from Google Drive!')
    } catch (err) {
      setStatus('Restore failed: ' + err.message)
    }
  }

  async function handleDeleteAll() {
    if (!confirm('Delete ALL your workout data? This cannot be undone.')) return
    await db.transaction('rw', db.sessions, db.sets, db.pbs, async () => {
      await db.sessions.clear()
      await db.sets.clear()
      await db.pbs.clear()
    })
    setStatus('✓ All workout data deleted.')
  }

  function handleGDriveSuccess(tokenResponse) {
    // tokenResponse.access_token is the Bearer token for Drive API
    saveGDriveToken(tokenResponse.access_token)
    setGConnected(true)
    setStatus('✓ Connected to Google Drive! Data will back up automatically after each workout.')
  }

  function handleDisconnect() {
    disconnectGDrive()
    setGConnected(false)
    setStatus('Google Drive disconnected.')
  }

  function formatBackupTime(iso) {
    if (!iso) return null
    const d = new Date(iso)
    const today = new Date()
    const isToday = d.toDateString() === today.toDateString()
    if (isToday) return `Today ${d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })}`
    return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) +
      ' ' + d.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="flex items-center gap-3 px-5 pt-5 pb-4 flex-shrink-0 border-b border-gray-100">
        <button onClick={onBack} className="min-tap w-10 h-10 flex items-center justify-center text-gray-500">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      {status && (
        <div className="mx-5 mt-4 bg-teal-50 text-teal-800 rounded-2xl px-4 py-3 text-sm font-medium">
          {status}
        </div>
      )}

      <div className="px-5 py-5 space-y-6 flex-1">
        {/* Backup section */}
        <Section title="BACKUP">
          <Row label="Back up my data" sublabel="Downloads a .json file you can save anywhere">
            <button onClick={handleExport} className="bg-teal-700 text-white font-semibold px-4 py-2 rounded-xl text-sm active:bg-teal-600">
              Export file
            </button>
          </Row>
          <Row label="Restore from backup" sublabel="Choose a .json backup file">
            <button onClick={() => fileRef.current?.click()} className="bg-gray-100 text-gray-800 font-semibold px-4 py-2 rounded-xl text-sm active:bg-gray-200">
              Choose file
            </button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </Row>
        </Section>

        {/* Google Drive */}
        <Section title="GOOGLE DRIVE">
          {!isGDriveConfigured() ? (
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-amber-800 text-sm font-medium">Google Drive backup requires setup.</p>
              {/* SETUP REQUIRED: Add VITE_GOOGLE_CLIENT_ID to your .env file */}
              <p className="text-amber-600 text-xs mt-1">Add VITE_GOOGLE_CLIENT_ID to your .env file to enable this feature.</p>
            </div>
          ) : gConnected ? (
            <>
              <Row label="Google Drive" sublabel={lastBackup ? `Last backup: ${formatBackupTime(lastBackup)}` : 'Connected'}>
                <span className="text-teal-700 font-semibold text-sm">Connected ✓</span>
              </Row>
              <Row label="Restore from Google Drive" sublabel="Fetch your latest cloud backup">
                <button onClick={handleGDriveRestore} className="bg-gray-100 text-gray-800 font-semibold px-4 py-2 rounded-xl text-sm active:bg-gray-200">
                  Restore
                </button>
              </Row>
              <Row label="" sublabel="">
                <button onClick={handleDisconnect} className="text-gray-400 text-sm underline">
                  Disconnect
                </button>
              </Row>
            </>
          ) : (
            <div className="py-2">
              <p className="text-sm text-gray-500 mb-3">Connect to automatically back up your data after each workout.</p>
              {/* @react-oauth/google handles the OAuth flow */}
              <GoogleLogin
                onSuccess={handleGDriveSuccess}
                onError={() => setStatus('Google sign-in failed.')}
                scope={DRIVE_APPDATA_SCOPE}
                useOneTap={false}
                text="Connect Google Drive"
              />
            </div>
          )}
        </Section>

        {/* Data */}
        <Section title="DATA">
          <Row label="Delete all my data" sublabel="Removes all sessions, sets, and personal bests">
            <button onClick={handleDeleteAll} className="text-red-500 font-semibold text-sm border border-red-200 px-4 py-2 rounded-xl active:bg-red-50">
              Delete all
            </button>
          </Row>
        </Section>

        {/* About */}
        <Section title="ABOUT">
          <Row label="Version" sublabel="">
            <span className="text-gray-400 text-sm">1.0</span>
          </Row>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{title}</p>
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm divide-y divide-gray-100">
        {children}
      </div>
    </div>
  )
}

function Row({ label, sublabel, children }) {
  return (
    <div className="flex items-center justify-between px-4 py-4 gap-3">
      <div className="flex-1 min-w-0">
        {label && <p className="font-semibold text-gray-900">{label}</p>}
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  )
}
