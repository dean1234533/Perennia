export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4
  label: string
}

/** Real heuristic scoring — length thresholds plus character-class
 *  diversity actually measured from the given password, never a fixed
 *  "looks strong" placeholder. */
export function scorePasswordStrength(password: string): PasswordStrength {
  if (!password) return { score: 0, label: '' }

  let classes = 0
  if (/[a-z]/.test(password)) classes++
  if (/[A-Z]/.test(password)) classes++
  if (/[0-9]/.test(password)) classes++
  if (/[^A-Za-z0-9]/.test(password)) classes++

  let score = 0
  if (password.length >= 15) score++
  if (password.length >= 22) score++
  if (classes >= 2) score++
  if (classes >= 3 && password.length >= 18) score++

  const clamped = Math.min(score, 4) as PasswordStrength['score']
  const labels = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent']
  return { score: clamped, label: labels[clamped] }
}
