export const DAILY_SUBTITLES = [
  "Every rep is an investment in your future self.",
  "Showing up is the hardest part. You're here.",
  "Stronger every week. Keep going.",
  "Your body is capable of more than you think.",
  "Today's effort is tomorrow's strength.",
  "You're building something lasting.",
  "Movement is medicine. You're doing great.",
  "One workout at a time.",
]

export const POST_SET_MESSAGES = [
  "Great work! 💪",
  "That's the way! ✨",
  "Set logged! You're on a roll.",
  "Keep it up! 🌟",
  "Excellent! One set closer to stronger.",
]

export function getDailySubtitle() {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  )
  return DAILY_SUBTITLES[dayOfYear % DAILY_SUBTITLES.length]
}

export function randomPostSetMessage() {
  return POST_SET_MESSAGES[Math.floor(Math.random() * POST_SET_MESSAGES.length)]
}

export function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatShortDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export function yesterdayISO() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

export function greetingByTime() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
