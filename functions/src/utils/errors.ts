import { HttpsError } from 'firebase-functions/v2/https'

/**
 * Thin wrappers around HttpsError so call sites read as intent, not codes,
 * and so we never accidentally leak internal detail (stack traces, sheet
 * structure, Firestore paths) into an error message a client can see.
 */

export function invalidArgument(message: string): HttpsError {
  return new HttpsError('invalid-argument', message)
}

export function unauthenticated(message = 'Sign in required.'): HttpsError {
  return new HttpsError('unauthenticated', message)
}

export function permissionDenied(message = 'You do not have permission to do this.'): HttpsError {
  return new HttpsError('permission-denied', message)
}

export function notFound(message: string): HttpsError {
  return new HttpsError('not-found', message)
}

export function resourceExhausted(message = 'Too many requests. Please slow down.'): HttpsError {
  return new HttpsError('resource-exhausted', message)
}

/** Catch-all for anything unexpected — deliberately generic for the client. */
export function internal(logMessage: string, cause?: unknown): HttpsError {
  // eslint-disable-next-line no-console
  console.error(logMessage, cause)
  return new HttpsError('internal', 'Something went wrong. Please try again.')
}
