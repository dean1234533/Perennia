import { getFirestore } from 'firebase-admin/firestore'
import { failedPrecondition, permissionDenied } from '../utils/errors'

export type AccountPauseDuration = '14-days' | '1-month' | '2-months' | '3-months' | '4-months'

const MAX_PAUSES_PER_YEAR = 3
const ROLLING_YEAR_MS = 365 * 24 * 60 * 60 * 1000

function pauseEnd(start: Date, duration: AccountPauseDuration): Date {
  const end = new Date(start)
  if (duration === '14-days') {
    end.setUTCDate(end.getUTCDate() + 14)
    return end
  }

  const months = Number.parseInt(duration, 10)
  const day = end.getUTCDate()
  end.setUTCDate(1)
  end.setUTCMonth(end.getUTCMonth() + months)
  const lastDay = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth() + 1, 0)).getUTCDate()
  end.setUTCDate(Math.min(day, lastDay))
  return end
}

export async function pauseAccount(uid: string, duration: AccountPauseDuration) {
  const db = getFirestore()
  const userRef = db.collection('users').doc(uid)
  const memberRef = db.collection('foundingMembers').doc(uid)

  return db.runTransaction(async (tx) => {
    const [userSnap, memberSnap] = await Promise.all([tx.get(userRef), tx.get(memberRef)])
    if (!userSnap.exists) throw failedPrecondition('Your account could not be found.')
    if (!memberSnap.exists || memberSnap.get('canceledAt')) {
      throw permissionDenied('Pause Account is available with an active Perennia membership.')
    }

    const now = new Date()
    const currentPause = userSnap.get('accountPausedUntil')
    if (typeof currentPause === 'string' && new Date(currentPause).getTime() > now.getTime()) {
      return { pausedUntil: currentPause }
    }

    const historyValue = userSnap.get('accountPauseHistory')
    const history = Array.isArray(historyValue)
      ? historyValue.filter((entry): entry is string => typeof entry === 'string')
      : []
    const rollingHistory = history.filter((entry) => {
      const timestamp = new Date(entry).getTime()
      return Number.isFinite(timestamp) && now.getTime() - timestamp < ROLLING_YEAR_MS
    })
    if (rollingHistory.length >= MAX_PAUSES_PER_YEAR) {
      throw failedPrecondition('You have already used all three account pauses available in the last 12 months.')
    }

    const startedAt = now.toISOString()
    const pausedUntil = pauseEnd(now, duration).toISOString()
    tx.update(userRef, {
      accountPausedUntil: pausedUntil,
      accountPauseHistory: [...rollingHistory, startedAt],
    })
    return { pausedUntil }
  })
}

export async function resumeAccount(uid: string) {
  const userRef = getFirestore().collection('users').doc(uid)
  await userRef.update({ accountPausedUntil: null })
  return { resumed: true as const }
}
