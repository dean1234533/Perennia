import { useId } from 'react'
import './InterestHeartsIcon.css'

export type InterestHeartState = 'neutral' | 'interested' | 'matched'

type InterestHeartsIconProps = {
  state: InterestHeartState
  className?: string
}

const APPROVED_DOUBLE_HEART = '/perennia-double-heart-connection.png'
const YOU_HEART_MASK = '/perennia-double-heart-you-mask.png'
const THEM_HEART_MASK = '/perennia-double-heart-them-mask.png'

export function InterestHeartsIcon({ state, className = '' }: InterestHeartsIconProps) {
  const instanceId = useId().replace(/:/g, '')
  const youMaskId = `interest-heart-you-${instanceId}`
  const themMaskId = `interest-heart-them-${instanceId}`
  const youFillId = `interest-heart-you-fill-${instanceId}`
  const themFillId = `interest-heart-them-fill-${instanceId}`

  return (
    <span
      className={`interest-hearts-icon interest-hearts-icon--${state} ${className}`}
      data-interest-state={state}
      aria-hidden="true"
    >
      <svg viewBox="0 0 1295 1214" focusable="false">
        <defs>
          <mask id={youMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1295" height="1214">
            <image href={YOU_HEART_MASK} width="1295" height="1214" />
          </mask>
          <mask id={themMaskId} maskUnits="userSpaceOnUse" x="0" y="0" width="1295" height="1214">
            <image href={THEM_HEART_MASK} width="1295" height="1214" />
          </mask>
          <radialGradient id={youFillId} cx="43%" cy="34%" r="76%">
            <stop offset="0%" stopColor="#f2b0f7" stopOpacity=".82" />
            <stop offset="48%" stopColor="#b45bd5" stopOpacity=".74" />
            <stop offset="100%" stopColor="#6f2eaa" stopOpacity=".66" />
          </radialGradient>
          <radialGradient id={themFillId} cx="45%" cy="35%" r="78%">
            <stop offset="0%" stopColor="#f1a1b1" stopOpacity=".76" />
            <stop offset="48%" stopColor="#c94f70" stopOpacity=".68" />
            <stop offset="100%" stopColor="#872a50" stopOpacity=".58" />
          </radialGradient>
        </defs>
        {state === 'matched' && (
          <rect width="1295" height="1214" fill={`url(#${themFillId})`} mask={`url(#${themMaskId})`} />
        )}
        {state !== 'neutral' && (
          <rect width="1295" height="1214" fill={`url(#${youFillId})`} mask={`url(#${youMaskId})`} />
        )}
        <image className="interest-hearts-icon__foundation" href={APPROVED_DOUBLE_HEART} width="1295" height="1214" />
      </svg>
    </span>
  )
}
