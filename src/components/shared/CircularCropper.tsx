import { useEffect, useRef, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Check, X, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cropAndEncode } from '@/lib/media/imageProcessing'

const FRAME_SIZE = 280

interface CircularCropperProps {
  file: File
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

/** A real, functional circular crop tool — drag to reposition, slider to
 *  zoom, live circular preview. Produces an actual re-encoded crop (see
 *  cropAndEncode), not a cosmetic-only mock. */
export function CircularCropper({ file, onConfirm, onCancel }: CircularCropperProps) {
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
      onConfirm(blob)
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-black/90 p-6 backdrop-blur-xl"
    >
      <p className="font-serif-display text-xl text-champagne">Position Your Photo</p>

      <div
        className="relative touch-none overflow-hidden rounded-full border-2 border-gold/50 shadow-2xl"
        style={{ width: FRAME_SIZE, height: FRAME_SIZE, cursor: dragState.current ? 'grabbing' : 'grab' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
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
        <ZoomIn className="h-4 w-4 text-white/50" />
        <input
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={zoom}
          onChange={(e) => handleZoomChange(Number(e.target.value))}
          className="w-full accent-gold"
        />
      </div>

      <p className="text-xs text-white/40">Drag to reposition · use the slider to zoom</p>

      <div className="flex gap-3">
        <Button variant="glass" onClick={onCancel} disabled={saving}>
          <X className="h-4 w-4" /> Cancel
        </Button>
        <Button onClick={handleConfirm} disabled={saving || !imgUrl}>
          <Check className="h-4 w-4" /> {saving ? 'Saving…' : 'Use This Photo'}
        </Button>
      </div>
    </motion.div>
  )
}
