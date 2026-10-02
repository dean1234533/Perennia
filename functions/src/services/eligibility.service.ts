import { getFirestore } from 'firebase-admin/firestore'
import { permissionDenied } from '../utils/errors'

/** Server-side gate for protected actions (liking, friend requests,
 *  compatibility). The client route guards are only a convenience; this is
 *  the real check that the caller has verified their identity and finished
 *  onboarding, so a half-registered or forged account can't use the API
 *  directly. */
export async function assertEligibleMember(uid: string): Promise<void> {
  const snap = await getFirestore().collection('users').doc(uid).get()
  const data = snap.data() as { onboardingComplete?: boolean; verification?: { status?: string } } | undefined
  if (!snap.exists || data?.onboardingComplete !== true || data?.verification?.status !== 'verified') {
    throw permissionDenied('Finish verifying your identity and setting up your profile first.')
  }
}
