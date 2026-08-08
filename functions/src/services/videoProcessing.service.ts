/**
 * Real server-side video transcoding — actual ffmpeg re-encoding, not a
 * file-extension swap. Runs inside the Storage-triggered Cloud Function in
 * index.ts (processVideoUpload).
 *
 * Encodes H.264/AAC mp4 (not H.265/AV1): ffmpeg-static's bundled binary is
 * built for portability across Cloud Functions' container image, and H.264
 * is the one codec guaranteed to decode instantly in every browser/device
 * without a client-side software fallback — the right tradeoff for a
 * function with a hard timeout and no GPU. Produces up to three renditions
 * (480p/720p/1080p, capped by the source's own resolution) plus a poster
 * frame, and the client picks a rendition per `video.p1080 ?? p720 ?? p480`.
 */
import { promises as fs } from 'fs'
import * as os from 'os'
import * as path from 'path'
import { randomUUID } from 'crypto'
import ffmpegPath from 'ffmpeg-static'
import ffprobeInstaller from '@ffprobe-installer/ffprobe'
import ffmpeg from 'fluent-ffmpeg'
import { getStorage } from 'firebase-admin/storage'
import type { Bucket } from '@google-cloud/storage'
import { getFirestore } from 'firebase-admin/firestore'
import { log } from '../utils/logger'

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath)
ffmpeg.setFfprobePath(ffprobeInstaller.path)

interface Rendition {
  name: '480p' | '720p' | '1080p'
  height: number
}

// Mirrors MAX_VIDEO_DURATION_SECONDS in src/lib/media/mediaService.ts — the
// client already enforces this, but a direct/bypassed upload should still
// be rejected server-side rather than silently transcoding an over-length
// clip.
const MAX_DURATION_SECONDS = 15.5

const RENDITIONS: Rendition[] = [
  { name: '480p', height: 480 },
  { name: '720p', height: 720 },
  { name: '1080p', height: 1080 },
]

function probe(filePath: string): Promise<{ width: number; height: number; duration: number }> {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, data) => {
      if (err) return reject(err)
      const stream = data.streams.find((s) => s.codec_type === 'video')
      resolve({
        width: stream?.width ?? 0,
        height: stream?.height ?? 0,
        duration: data.format.duration ?? 0,
      })
    })
  })
}

function transcode(inputPath: string, outputPath: string, targetHeight: number): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .videoCodec('libx264')
      .audioCodec('aac')
      .outputOptions([
        `-vf scale=-2:${targetHeight}`,
        '-preset veryfast',
        '-crf 23',
        '-movflags +faststart',
        '-pix_fmt yuv420p',
      ])
      .on('error', reject)
      .on('end', () => resolve())
      .save(outputPath)
  })
}

/** Uploads a file and returns a Firebase-style `firebasestorage.googleapis.com`
 *  download URL using the same download-token mechanism the client SDK's
 *  `getDownloadURL()` relies on — deliberately NOT `file.getSignedUrl()`,
 *  which needs `iam.serviceAccounts.signBlob` on the function's service
 *  account (a separate IAM grant Cloud Functions doesn't have by default). */
async function uploadWithDownloadUrl(
  bucket: Bucket,
  localPath: string,
  destPath: string,
  contentType: string
): Promise<string> {
  const token = randomUUID()
  await bucket.upload(localPath, {
    destination: destPath,
    metadata: { contentType, metadata: { firebaseStorageDownloadTokens: token } },
  })
  const encodedPath = encodeURIComponent(destPath)
  return `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodedPath}?alt=media&token=${token}`
}

function extractPoster(inputPath: string, outputPath: string, atSeconds: number): Promise<void> {
  return new Promise((resolve, reject) => {
    ffmpeg(inputPath)
      .screenshots({
        timestamps: [atSeconds],
        filename: path.basename(outputPath),
        folder: path.dirname(outputPath),
        size: '640x?',
      })
      .on('error', reject)
      .on('end', () => resolve())
  })
}

/** Called from the Storage trigger. `objectPath` looks like
 *  `users/{uid}/media/{mediaId}/incoming.<ext>`. */
export async function processUploadedVideo(objectPath: string, bucketName: string) {
  const match = objectPath.match(/^users\/([^/]+)\/media\/([^/]+)\/incoming\.[^/]+$/)
  if (!match) return // not an incoming-video path — ignore (e.g. our own output files)

  const [, uid, mediaId] = match
  const bucket = getStorage().bucket(bucketName)
  const db = getFirestore()
  const mediaRef = db.collection('media').doc(mediaId)

  const workDir = await fs.mkdtemp(path.join(os.tmpdir(), `perennia-${mediaId}-`))
  const inputPath = path.join(workDir, 'input')

  try {
    await bucket.file(objectPath).download({ destination: inputPath })
    const { height, duration } = await probe(inputPath)
    if (!height) throw new Error('ffprobe could not read video dimensions')
    if (duration > MAX_DURATION_SECONDS) {
      await mediaRef.update({ processingStatus: 'error' })
      await bucket.file(objectPath).delete({ ignoreNotFound: true })
      log.warn('video_rejected_too_long', { uid, mediaId, duration })
      return
    }

    const posterPath = path.join(workDir, 'poster.jpg')
    await extractPoster(inputPath, posterPath, 0.5)

    const applicable = RENDITIONS.filter((r) => r.height <= height || r.name === '480p')
    const variants: Record<string, string> = {}

    for (const rendition of applicable) {
      const outPath = path.join(workDir, `${rendition.name}.mp4`)
      await transcode(inputPath, outPath, rendition.height)
      const destPath = `users/${uid}/media/${mediaId}/${rendition.name}.mp4`
      const url = await uploadWithDownloadUrl(bucket, outPath, destPath, 'video/mp4')
      variants[rendition.name === '480p' ? 'p480' : rendition.name === '720p' ? 'p720' : 'p1080'] = url
    }

    const posterDest = `users/${uid}/media/${mediaId}/poster.jpg`
    const posterUrl = await uploadWithDownloadUrl(bucket, posterPath, posterDest, 'image/jpeg')

    const bestUrl = variants.p1080 ?? variants.p720 ?? variants.p480

    await mediaRef.update({
      url: bestUrl,
      thumbnailUrl: posterUrl,
      processingStatus: 'ready',
      video: { poster: posterUrl, ...variants },
    })

    await bucket.file(objectPath).delete({ ignoreNotFound: true })
    log.info('video_processed', { uid, mediaId, renditions: Object.keys(variants) })
  } catch (err) {
    log.error('video_processing_failed', { uid, mediaId, message: err instanceof Error ? err.message : String(err) })
    await mediaRef.update({ processingStatus: 'error' }).catch(() => {})
    throw err
  } finally {
    await fs.rm(workDir, { recursive: true, force: true }).catch(() => {})
  }
}
