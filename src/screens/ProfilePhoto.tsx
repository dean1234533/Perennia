import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Camera, Loader2 } from 'lucide-react'
import { OnboardingShell } from '@/components/layout/OnboardingShell'
import { CircularCropper } from '@/components/shared/CircularCropper'
import { OnboardingBackButton, OnboardingPrimaryButton } from '@/components/ui/onboarding-buttons'
import { useAuth } from '@/context/AuthContext'
import { useApp } from '@/context/AppContext'
import { firebaseConfigured } from '@/lib/firebase'
import { uploadProfilePhoto } from '@/lib/media/mediaService'
import { hasDevelopmentVerificationBypass } from '@/lib/developmentVerification'
import { getOnboardingStep } from '@/lib/onboardingFlow'

export function ProfilePhoto() {
  const { profileLoaded } = useApp()

  return (
    <OnboardingShell>
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
  const { isDesignPreview, saveOnboarding, onboarding, profileExtras, profileLoaded, onboardingComplete } = useApp()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(onboarding.profilePhotoThumbUrl || null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const photoComplete = isDesignPreview || getOnboardingStep('profilePhoto').isComplete({
    onboarding,
    profileExtras,
    user,
    profileLoaded,
    onboardingComplete,
    backendConfigured: firebaseConfigured,
    localPreviewBypassEnabled: hasDevelopmentVerificationBypass(),
  })

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
        await saveOnboarding({ profilePhotoUrl: url, profilePhotoThumbUrl: thumbUrl })
        setPreview(thumbUrl)
      } else {
        // No backend configured — keep the real cropped/compressed bytes
        // in-memory for this session only (nothing to persist to).
        const dataUrl = await blobToDataUrl(blob)
        await saveOnboarding({ profilePhotoUrl: dataUrl, profilePhotoThumbUrl: dataUrl })
        setPreview(dataUrl)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload your photo. Please try again.')
    } finally {
      setSaving(false)
      setFile(null)
    }
  }

  const handleContinue = () => {
    if (
      saving ||
      !preview ||
      !photoComplete
    ) return
    navigate(getOnboardingStep('profilePhoto').nextRoute!)
  }

  return (
    <>
      <motion.main
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-2xl px-4 pb-6 text-center sm:px-8 sm:pb-10"
      >
        <OnboardingBackButton
          to={getOnboardingStep('profilePhoto').previousRoute!}
          className="mb-5 w-full justify-start self-start sm:absolute sm:left-0 sm:top-0 sm:mb-0 sm:w-auto"
        />

        <header className="mx-auto mb-7 max-w-lg sm:mb-8 sm:pt-3">
          <h1 className="font-serif-display mb-3 text-4xl tracking-wide text-champagne sm:text-5xl">Profile Photo</h1>
          <p className="mx-auto max-w-md text-sm leading-6 text-white/65 sm:text-base sm:leading-7">
            Start with a clear, recent profile photo.<br className="hidden sm:block" /> You can add more photos and videos from your finished profile.
          </p>
        </header>

        <label className="group relative mx-auto mb-7 flex h-60 w-60 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-gold/65 bg-midnight/10 shadow-[0_0_34px_rgba(224,183,94,0.10)] transition duration-300 hover:border-gold hover:shadow-[0_0_44px_rgba(224,183,94,0.20)] focus-within:border-gold focus-within:outline-none focus-within:ring-2 focus-within:ring-gold/55 focus-within:ring-offset-4 focus-within:ring-offset-midnight active:scale-[0.985] motion-reduce:transform-none motion-reduce:transition-none sm:h-[17rem] sm:w-[17rem]">
          {preview ? (
            <>
              <img src={preview} alt="Your profile" className="h-full w-full object-cover" />
              <span className="absolute inset-x-0 bottom-0 flex h-16 translate-y-full items-center justify-center gap-2 bg-midnight/75 text-xs font-medium text-champagne opacity-0 backdrop-blur-sm transition duration-300 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 motion-reduce:translate-y-0 motion-reduce:transition-none">
                <Camera className="h-4 w-4" aria-hidden="true" />
                Change photo
              </span>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 text-champagne transition-transform duration-300 group-hover:scale-105 motion-reduce:transform-none motion-reduce:transition-none">
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

        <OnboardingPrimaryButton
          disabled={!preview || !photoComplete}
          loading={saving}
          loadingLabel="Saving…"
          showArrow
          onClick={handleContinue}
          className="mx-auto w-full max-w-xs"
        >
          Continue
        </OnboardingPrimaryButton>
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
