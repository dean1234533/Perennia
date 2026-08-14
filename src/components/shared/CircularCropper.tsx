import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { Check, X, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cropAndEncode } from '@/lib/media/imageProcessing'

const FRAME_SIZE = 280

interface CircularCropperProps {
  file: File
  onConfirm: (blob: Blob) => void | Promise<void>
  onCancel: () => void
  variant?: 'default' | 'profile-photo'
}

/** A real, functional circular crop tool — drag to reposition, slider to
 *  zoom, live circular preview. Produces an actual re-encoded crop (see
 *  cropAndEncode), not a cosmetic-only mock. */
export function CircularCropper({ file, onConfirm, onCancel, variant = 'default' }: CircularCropperProps) {
  const isProfilePhoto = variant === 'profile-photo'
  const [imgUrl, setImgUrl] = useState<string | null>(null)
  const [natural, setNatural] = useState({ width: 0, height: 0 })
  const [coverScale, setCoverScale] = useState(1)
  const [zoom, setZoom] = useState(1) // multiplier over coverScale
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [saving, setSaving] = useState(false)
  const dragState = useRef<{ startX: number; startY: number; startOffset: { x: number; y: number } } | null>(null)

  useEffect(() => {
    const url = URL.createObjectURL(file)
    setImgUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [])

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const w = e.currentTarget.naturalWidth
    const h = e.currentTarget.naturalHeight
    const cover = FRAME_SIZE / Math.min(w, h)
    setNatural({ width: w, height: h })
    setCoverScale(cover)
    setOffset({ x: (FRAME_SIZE - w * cover) / 2, y: (FRAME_SIZE - h * cover) / 2 })
  }

  const clampOffset = useCallback(
    (next: { x: number; y: number }, scale: number) => {
      const dispW = natural.width * scale
      const dispH = natural.height * scale
      const minX = Math.min(0, FRAME_SIZE - dispW)
      const minY = Math.min(0, FRAME_SIZE - dispH)
      return {
        x: Math.max(minX, Math.min(0, next.x)),
        y: Math.max(minY, Math.min(0, next.y)),
      }
    },
    [natural]
  )

  const scale = coverScale * zoom

  const handleZoomChange = (value: number) => {
    setZoom(value)
    setOffset((prev) => clampOffset(prev, coverScale * value))
  }

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    dragState.current = { startX: e.clientX, startY: e.clientY, startOffset: offset }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current) return
    const dx = e.clientX - dragState.current.startX
    const dy = e.clientY - dragState.current.startY
    setOffset(clampOffset({ x: dragState.current.startOffset.x + dx, y: dragState.current.startOffset.y + dy }, scale))
  }

  const onPointerUp = () => {
    dragState.current = null
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      const sourceSize = FRAME_SIZE / scale
      const sourceX = -offset.x / scale
      const sourceY = -offset.y / scale
      const blob = await cropAndEncode(file, { sourceX, sourceY, sourceSize })
      await onConfirm(blob)
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cropper-title"
      className={`fixed inset-0 z-[140] flex flex-col items-center justify-center gap-5 overflow-y-auto bg-[#050b1d] p-5 sm:gap-6 sm:p-6 ${
        isProfilePhoto ? '' : 'bg-black'
      }`}
    >
      <p id="cropper-title" className={`font-serif-display text-champagne ${isProfilePhoto ? 'text-2xl tracking-wide sm:text-3xl' : 'text-xl'}`}>
        Position Your Photo
      </p>

      <div
        className={`relative shrink-0 touch-none overflow-hidden rounded-full border-2 ${
          isProfilePhoto
            ? 'border-gold/80 shadow-[0_0_42px_rgba(224,183,94,0.30)]'
            : 'border-gold/50 shadow-2xl'
        }`}
        style={{ width: FRAME_SIZE, height: FRAME_SIZE, cursor: dragState.current ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        {imgUrl && (
          <img
            src={imgUrl}
            onLoad={onImageLoad}
            alt="Crop preview"
            draggable={false}
            className="absolute select-none"
            style={{
              width: natural.width * scale,
              height: natural.height * scale,
              left: offset.x,
              top: offset.y,
              maxWidth: 'none',
            }}
          />
        )}
      </div>

      <div className="flex w-full max-w-xs items-center gap-3">
        <ZoomIn className={`h-4 w-4 shrink-0 ${isProfilePhoto ? 'text-gold/80' : 'text-white/50'}`} />
        <input
          type="range"
          aria-label="Zoom photo"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => handleZoomChange(Number(e.target.value))}
          className={isProfilePhoto
            ? 'h-1.5 w-full cursor-pointer appearance-none rounded-full border border-gold/20 bg-white/15 accent-gold outline-none transition focus-visible:ring-2 focus-visible:ring-gold/60 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-gold [&::-moz-range-thumb]:shadow-[0_0_12px_rgba(224,183,94,0.65)] [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gold [&::-webkit-slider-thumb]:shadow-[0_0_12px_rgba(224,183,94,0.65)]'
            : 'w-full accent-gold'}
        />
      </div>

      <p className={`text-center text-xs ${isProfilePhoto ? 'text-white/70' : 'text-white/40'}`}>
        Drag to reposition · use the slider to zoom
      </p>

      {isProfilePhoto ? (
        <div className="flex w-full max-w-sm flex-col-reverse gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/[0.03] px-7 text-sm font-medium text-white/75 transition hover:border-white/40 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <X className="h-4 w-4" aria-hidden="true" /> Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || !imgUrl}
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-gold/80 bg-gold/[0.06] px-7 text-sm font-medium text-champagne shadow-[0_0_20px_rgba(224,183,94,0.22),inset_0_0_15px_rgba(224,183,94,0.06)] transition hover:border-gold hover:bg-gold/[0.11] hover:shadow-[0_0_28px_rgba(224,183,94,0.34)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/65 disabled:cursor-not-allowed disabled:border-white/15 disabled:text-white/30 disabled:shadow-none"
          >
            <Check className="h-4 w-4" aria-hidden="true" /> {saving ? 'Saving…' : 'Use This Photo'}
          </button>
        </div>
      ) : (
        <div className="flex gap-3">
          <Button variant="glass" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4" /> Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={saving || !imgUrl}>
            <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Use This Photo'}
          </Button>
        </div>
      )}
    </motion.div>,
    document.body
  )
}
