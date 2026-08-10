/**
 * Transactional email via Resend's REST API — no SDK dependency needed,
 * Node 20's global `fetch` is enough for a single call type like this.
 *
 * Requires RESEND_API_KEY to be set (see functions/README.md). Until then,
 * throws a failed-precondition error rather than pretending to send.
 */
import { failedPrecondition, internal } from '../utils/errors'

const UNSET_SENTINEL = 'not_configured'
const RESEND_API_URL = 'https://api.resend.com/emails'
const FROM_ADDRESS = 'Perennia <onboarding@resend.dev>'

export async function sendOtpEmail(toEmail: string, code: string, apiKey: string): Promise<void> {
  if (!apiKey || apiKey === UNSET_SENTINEL) {
    throw failedPrecondition(
      'Email delivery is not configured yet. An administrator needs to set RESEND_API_KEY (see functions/README.md).'
    )
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [toEmail],
      subject: 'Your Perennia verification code',
      text: `Your verification code is ${code}. It expires in 10 minutes. If you didn't request this, you can ignore this email.`,
      html: `<p>Your verification code is <strong style="font-size:20px;letter-spacing:2px;">${code}</strong>.</p><p>It expires in 10 minutes. If you didn't request this, you can ignore this email.</p>`,
    }),
  })

  if (!response.ok) {
    const body = await response.text().catch(() => '')
    throw internal(`Resend send failed: ${response.status} ${body}`)
  }
}
