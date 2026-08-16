import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Camera, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { CircularCropper } from '@/components/shared/CircularCropper'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { firebaseConfigured } from '@/lib/firebase'
import { uploadProfilePhoto } from '@/lib/media/mediaService'
import { hasDevelopmentVerificationBypass } from '@/lib/developmentVerification'

export function ProfilePhoto() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell step={9} totalSteps={12}>
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
        await updateOnboarding({ profilePhotoUrl: url, profilePhotoThumbUrl: thumbUrl })
      } else {
        // No backend configured — keep the real cropped/compressed bytes
        // in-memory for this session only (nothing to persist to).
        const dataUrl = await blobToDataUrl(blob)
        setPreview(dataUrl)
        await updateOnboarding({ profilePhotoUrl: dataUrl, profilePhotoThumbUrl: dataUrl })
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
      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl px-4 pb-6 text-center sm:px-8 sm:pb-10"
      >
        <button
          type="button"
          onClick={() => navigate('/about-you')}
          className="mb-5 inline-flex min-h-11 w-full items-center gap-2 self-start text-left text-sm text-champagne/75 transition-colors hover:text-champagne focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-4 focus-visible:ring-offset-midnight sm:absolute sm:left-0 sm:top-0 sm:mb-0 sm:w-auto"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back
        </button>

        <header className="mx-auto mb-7 max-w-lg sm:mb-8 sm:pt-3">
          <h1 className="font-serif-display mb-3 text-4xl tracking-wide text-champagne sm:text-5xl">Profile Photo</h1>
          <p className="mx-auto max-w-md text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
            Start with a clear, recent profile photo.<br className="hidden sm:block" /> You can add more photos and videos from your finished profile.
          </p>
        </header>

        <label className="group relative mx-auto mb-7 flex h-60 w-60 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gold/65 bg-midnight/10 shadow-[0_0_34px_rgba(224,183,94,0.10)] transition duration-300 hover:border-gold hover:shadow-[0_0_44px_rgba(224,183,94,0.20)] focus-within:border-gold focus-within:outline-none focus-within:ring-2 focus-within:ring-gold/55 focus-within:ring-offset-4 focus-within:ring-offset-midnight active:scale-[0.985] sm:h-[17rem] sm:w-[17rem]">
          {preview ? (
            <>
              <img src={preview} alt="Your profile" className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 flex h-16 translate-y-full items-center justify-center gap-2 bg-midnight/75 text-xs font-medium text-champagne opacity-0 backdrop-blur-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Change photo
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-champagne transition-transform duration-300 group-hover:scale-105">
              <Camera className="h-11 w-11 stroke-[1.4]" aria-hidden="true" />
              <span className="text-sm tracking-wide sm:text-base">Select a photo</span>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            aria-label={preview ? 'Change profile photo' : 'Select a profile photo'}
            className="absolute inset-0 cursor-pointer rounded-full opacity-0"
            onChange={(e) => handleSelect(e.target.files)}
          />
        </label>

        {error && (
          <p role="alert" className="mx-auto mb-5 max-w-md rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs text-rose-200">
            {error}
          </p>
        )}

        <div className="mx-auto mb-6 flex w-52 items-center gap-3" aria-hidden="true">
          <span className="h-px flex-1 bg-gradient-to-r from-transparent to-gold/55" />
          <span className="h-1.5 w-1.5 rotate-45 bg-gold shadow-[0_0_12px_rgba(224,183,94,0.85)]" />
          <span className="h-px flex-1 bg-gradient-to-l from-transparent to-gold/55" />
        </div>

        <button
          type="button"
          disabled={!preview || saving}
          onClick={() => navigate(
            hasDevelopmentVerificationBypass() || (onboarding.verification.status === 'verified' && onboarding.verification.detailsConfirmedAt)
              ? '/your-story'
              : '/verify'
          )}
          className="profile-photo-continue-button mx-auto inline-flex min-h-14 w-full max-w-xs items-center justify-center gap-3 rounded-full px-8 text-base font-medium tracking-wide transition duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-200/70 focus-visible:ring-offset-4 focus-visible:ring-offset-midnight active:scale-[0.985] disabled:cursor-not-allowed"
        >
          {saving ? 'Saving…' : (<>Continue <ArrowRight className="h-4 w-4" /></>)}
        </button>
      </motion.main>

      {file && (
        <CircularCropper
          file={file}
          onConfirm={handleConfirm}
          onCancel={() => setFile(null)}
          variant="profile-photo"
        />
      )}
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
