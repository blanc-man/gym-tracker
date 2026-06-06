// Google Drive backup using drive.appdata scope
// SETUP: Set VITE_GOOGLE_CLIENT_ID in your .env file
// The app folder is hidden from normal Drive browsing — no clutter for the user.

const BACKUP_FILENAME = 'gym-tracker-backup.json'
const DRIVE_APPDATA_SCOPE = 'https://www.googleapis.com/auth/drive.appdata'

export function isGDriveConfigured() {
  return Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID)
}

// Store the Google access token in sessionStorage so it survives navigation
export function saveGDriveToken(token) {
  sessionStorage.setItem('gdrive_token', token)
  localStorage.setItem('gdrive_connected', '1')
}

export function getGDriveToken() {
  return sessionStorage.getItem('gdrive_token')
}

export function isGDriveConnected() {
  return Boolean(localStorage.getItem('gdrive_connected'))
}

export function disconnectGDrive() {
  sessionStorage.removeItem('gdrive_token')
  localStorage.removeItem('gdrive_connected')
  localStorage.removeItem('gdrive_last_backup')
}

export function getLastBackupTime() {
  return localStorage.getItem('gdrive_last_backup')
}

async function driveRequest(url, options = {}) {
  const token = getGDriveToken()
  if (!token) throw new Error('Not connected to Google Drive.')
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Drive API error ${res.status}: ${text}`)
  }
  return res
}

async function findBackupFileId() {
  const res = await driveRequest(
    `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=name='${BACKUP_FILENAME}'&fields=files(id,name,modifiedTime)`
  )
  const data = await res.json()
  return data.files?.[0] || null
}

export async function backupToGDrive(data) {
  const json = JSON.stringify(data)
  const blob = new Blob([json], { type: 'application/json' })
  const existing = await findBackupFileId()

  if (existing) {
    // Update existing file
    await driveRequest(
      `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`,
      { method: 'PATCH', body: blob }
    )
  } else {
    // Create new file in appDataFolder
    const metadata = { name: BACKUP_FILENAME, parents: ['appDataFolder'] }
    const form = new FormData()
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
    form.append('file', blob)
    await driveRequest(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      { method: 'POST', body: form }
    )
  }

  localStorage.setItem('gdrive_last_backup', new Date().toISOString())
}

export async function restoreFromGDrive() {
  const file = await findBackupFileId()
  if (!file) throw new Error('No backup found in Google Drive.')
  const res = await driveRequest(
    `https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`
  )
  return res.json()
}

export { DRIVE_APPDATA_SCOPE }
