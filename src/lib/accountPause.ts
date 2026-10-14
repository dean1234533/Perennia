import { httpsCallable, type HttpsCallableResult } from 'firebase/functions'
import { firebaseConfigured, functions } from '@/lib/firebase'

export type AccountPauseDuration = '14-days' | '1-month' | '2-months' | '3-months' | '4-months'

const LOCAL_PAUSE_KEY = 'perennia-account-paused-until'

function localPauseEnd(duration: AccountPauseDuration) {
  const end = new Date()
  if (duration === '14-days') end.setDate(end.getDate() + 14)
  else {
    const day = end.getDate()
    end.setDate(1)
    end.setMonth(end.getMonth() + Number.parseInt(duration, 10))
    const lastDay = new Date(end.getFullYear(), end.getMonth() + 1, 0).getDate()
    end.setDate(Math.min(day, lastDay))
  }
  return end.toISOString()
}

const pauseAccountCallable = httpsCallable<{ duration: AccountPauseDuration }, { pausedUntil: string }>(functions, 'pauseAccount')
const resumeAccountCallable = httpsCallable<unknown, { resumed: true }>(functions, 'resumeAccount')

export function getLocalAccountPause(): string | null {
  if (firebaseConfigured) return null
  const pausedUntil = localStorage.getItem(LOCAL_PAUSE_KEY)
  if (!pausedUntil || new Date(pausedUntil).getTime() <= Date.now()) {
    localStorage.removeItem(LOCAL_PAUSE_KEY)
    return null
  }
  return pausedUntil
}

export async function pauseAccount(duration: AccountPauseDuration): Promise<{ pausedUntil: string }> {
  if (!firebaseConfigured) {
    const pausedUntil = localPauseEnd(duration)
    localStorage.setItem(LOCAL_PAUSE_KEY, pausedUntil)
    return { pausedUntil }
  }
  const result: HttpsCallableResult<{ pausedUntil: string }> = await pauseAccountCallable({ duration })
  return result.data
}

export async function resumeAccount(): Promise<{ resumed: true }> {
  if (!firebaseConfigured) {
    localStorage.removeItem(LOCAL_PAUSE_KEY)
    return { resumed: true }
  }
  const result: HttpsCallableResult<{ resumed: true }> = await resumeAccountCallable({})
  return result.data
}
