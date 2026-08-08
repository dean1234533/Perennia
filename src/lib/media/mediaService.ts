import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import { storage } from '@/lib/firebase'
import { processImage, validateImageFile } from './imageProcessing'
import {
  createMediaDoc,
  updateMediaDoc,
  deleteMediaDoc,
  reorderMediaDocs,
  setProfilePhotoRemote,
  type MediaDoc,
} from '@/lib/firestore'

export const ACCEPTED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm']
export const MAX_VIDEO_BYTES = 500 * 1024 * 1024 // 500MB raw upload cap

export class VideoValidationError extends Error {}

export function validateVideoFile(file: File) {
  if (!ACCEPTED_VIDEO_TYPES.includes(file.type)) {
    throw new VideoValidationError(`Unsupported video type "${file.type || 'unknown'}". Use MP4, MOV, or WebM.`)
  }
  if (file.size > MAX_VIDEO_BYTES) {
    throw new VideoValidationError(`Video is too large (${Math.round(file.size / 1024 / 1024)}MB). Max is 500MB.`)
  }
}

function newMediaId(uid: string) {
  return `${uid}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

/** Full real pipeline: validate -> compress (client-side, real re-encode) ->
 *  upload optimized bytes to Storage -> create the Firestore media doc ->
 *  caller gets it back immediately for optimistic UI, backed by the
 *  onSnapshot subscription for persistence-on-refresh. */
export async function uploadImageMedia(uid: string, file: File, category: string, order: number): Promise<MediaDoc> {
  const processed = await processImage(file)
  const id = newMediaId(uid)

  const displayRef = ref(storage, `users/${uid}/media/${id}/display.webp`)
  const thumbRef = ref(storage, `users/${uid}/media/${id}/thumb.webp`)

  await uploadBytes(displayRef, processed.display, { contentType: 'image/webp' })
  await uploadBytes(thumbRef, processed.thumbnail, { contentType: 'image/webp' })

  const [url, thumbnailUrl] = await Promise.all([getDownloadURL(displayRef), getDownloadURL(thumbRef)])

  const media: MediaDoc = {
    id,
    userId: uid,
    type: 'image',
    url,
    thumbnailUrl,
    category,
    caption: '',
    createdAt: Date.now(),
    order,
    processingStatus: 'ready',
  }
  await createMediaDoc(media)
  return media
}

/** Uploads the raw video to a Storage path that the server-side
 *  `processVideoUpload` Cloud Function is triggered on. The Firestore doc is
 *  created up front with `processingStatus: 'processing'`; the function
 *  flips it to `ready` (with poster + resolution variants) once ffmpeg
 *  finishes, and the UI reflects that automatically via the onSnapshot
 *  subscription — no polling. */
export async function uploadVideoMedia(uid: string, file: File, category: string, order: number): Promise<MediaDoc> {
  validateVideoFile(file)
  const id = newMediaId(uid)
  const ext = file.name.split('.').pop()?.toLowerCase() || 'mp4'
  const incomingRef = ref(storage, `users/${uid}/media/${id}/incoming.${ext}`)
  await uploadBytes(incomingRef, file, { contentType: file.type })

  const media: MediaDoc = {
    id,
    userId: uid,
    type: 'video',
    url: '',
    thumbnailUrl: '',
    category,
    caption: '',
    createdAt: Date.now(),
    order,
    processingStatus: 'processing',
  }
  await createMediaDoc(media)
  return media
}

export async function deleteMedia(media: MediaDoc) {
  await deleteMediaDoc(media.id)
  const basePath = `users/${media.userId}/media/${media.id}`
  const candidates =
    media.type === 'image'
      ? ['display.webp', 'thumb.webp']
      : ['incoming.mp4', 'incoming.mov', 'incoming.webm', 'poster.jpg', '480p.mp4', '720p.mp4', '1080p.mp4']
  await Promise.all(
    candidates.map((name) =>
      deleteObject(ref(storage, `${basePath}/${name}`)).catch(() => {
        /* file may not exist for this media's variant set — fine */
      })
    )
  )
}

export async function reorderMedia(updates: { id: string; order: number }[]) {
  await reorderMediaDocs(updates)
}

export async function updateMediaCategory(mediaId: string, category: string) {
  await updateMediaDoc(mediaId, { category })
}

export async function updateMediaCaption(mediaId: string, caption: string) {
  await updateMediaDoc(mediaId, { caption })
}

/** Sets a photo already in the user's media library as their central
 *  orbit/profile photo (reuses its already-optimized display+thumb URLs). */
export async function setProfilePhotoFromMedia(uid: string, media: MediaDoc) {
  if (media.type !== 'image') throw new Error('Profile photo must be an image')
  await setProfilePhotoRemote(uid, media.url, media.thumbnailUrl)
}

/** Used by onboarding / "replace photo": uploads a freshly cropped image
 *  directly as the profile photo (not tied to a gallery media doc). */
export async function uploadProfilePhoto(uid: string, blob: Blob): Promise<{ url: string; thumbUrl: string }> {
  validateImageFile(new File([blob], 'profile.webp', { type: 'image/webp' }))
  const stamp = Date.now()
  const fullRef = ref(storage, `users/${uid}/profile/photo_${stamp}.webp`)
  await uploadBytes(fullRef, blob, { contentType: 'image/webp' })
  const url = await getDownloadURL(fullRef)
  await setProfilePhotoRemote(uid, url, url)
  return { url, thumbUrl: url }
}
