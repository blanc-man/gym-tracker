import { useState, useEffect } from 'react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import { db, seedDatabase } from './db'
import TabBar from './components/TabBar'
import Today from './screens/Today'
import Progress from './screens/Progress'
import Exercises from './screens/Exercises'
import Settings from './screens/Settings'

// SETUP: Add VITE_GOOGLE_CLIENT_ID to your .env file for Google Drive backup
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function AppContent() {
  const [tab, setTab] = useState('today')
  const [showSettings, setShowSettings] = useState(false)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    seedDatabase().then(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-3xl mb-3">💪</p>
          <p className="text-gray-400">Loading…</p>
        </div>
      </div>
    )
  }

  if (showSettings) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <Settings onBack={() => setShowSettings(false)} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-hidden">
        {tab === 'today'     && <Today onSettings={() => setShowSettings(true)} />}
        {tab === 'progress'  && <Progress />}
        {tab === 'exercises' && <Exercises />}
      </div>
      <TabBar active={tab} onChange={setTab} />
    </div>
  )
}

export default function App() {
  if (!GOOGLE_CLIENT_ID) {
    // Run without Google OAuth if client ID not configured
    return <AppContent />
  }
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppContent />
    </GoogleOAuthProvider>
  )
}
