import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, ArrowRight, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { Button } from '@/components/ui/button'
import { CircularCropper } from '@/components/shared/CircularCropper'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { firebaseConfigured } from '@/lib/firebase'
import { uploadProfilePhoto } from '@/lib/media/mediaService'

export function ProfilePhoto() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell step={2} totalSteps={12}>
      {!profileLoaded ? <Loader2 className="h-6 w-6 animate-spin text-gold" /> : <ProfilePhotoForm />}
    </OnboardingShell>
  )
}

// Only mounted once profileLoaded — otherwise a refresh after already
// uploading a photo would seed `preview` blank (real data hasn't arrived
// yet), forcing a redundant re-upload before Continue re-enables.
function ProfilePhotoForm() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { updateOnboarding, onboarding } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(onboarding.profilePhotoThumbUrl || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSelect = (files: FileList | null) => {
    const f = files?.[0]
    if (!f) return
    setError('')
    setFile(f)
  }

  const handleConfirm = async (blob: Blob) => {
    setSaving(true)
    setError('')
    try {
      if (firebaseConfigured && user) {
        const { url, thumbUrl } = await uploadProfilePhoto(user.uid, blob)
        setPreview(thumbUrl)
        updateOnboarding({ profilePhotoUrl: url, profilePhotoThumbUrl: thumbUrl })
      } else {
        // No backend configured — keep the real cropped/compressed bytes
        // in-memory for this session only (nothing to persist to).
        const dataUrl = await blobToDataUrl(blob)
        setPreview(dataUrl)
        updateOnboarding({ profilePhotoUrl: dataUrl, profilePhotoThumbUrl: dataUrl })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload your photo. Please try again.')
    } finally {
      setSaving(false)
      setFile(null)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-md rounded-[2rem] p-8 text-center md:p-10"
      >
        <h1 className="font-serif-display mb-2 text-3xl">Add Your Photo</h1>
        <p className="mb-8 text-sm leading-relaxed text-white/55">
          This becomes the centre of your Perennia orbit — the first thing people see. Choose a
          clear, recent photo of your face.
        </p>

        <label className="mx-auto mb-6 flex h-40 w-40 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gold/30 bg-white/[0.02] transition-colors hover:border-gold/50">
          {preview ? (
            <img src={preview} alt="Your profile" className="h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-white/35">
              <Camera className="h-8 w-8" />
              <span className="text-xs">Select a photo</span>
            </div>
          )}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleSelect(e.target.files)} />
        </label>

        {error && (
          <p className="mb-4 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-300">
            {error}
          </p>
        )}

        <Button size="lg" className="w-full" disabled={!preview || saving} onClick={() => navigate('/verify')}>
          {saving ? 'Saving…' : (<>Continue <ArrowRight className="h-4 w-4" /></>)}
        </Button>
      </motion.div>

      {file && <CircularCropper file={file} onConfirm={handleConfirm} onCancel={() => setFile(null)} />}
    </>
  )
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}
