/** Real client-side image processing: validation, resize, and re-encode to
 *  WebP via the Canvas API. This actually re-samples pixels and re-encodes —
 *  it is not a filename/extension swap. Runs before any upload, so the
 *  bytes that reach Storage are always the optimized version. */

export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024 // 25MB original upload cap

export const DISPLAY_MAX_DIMENSION = 1600
export const THUMBNAIL_MAX_DIMENSION = 480
const DISPLAY_QUALITY = 0.82
const THUMBNAIL_QUALITY = 0.75

export class ImageValidationError extends Error {}

export function validateImageFile(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    throw new ImageValidationError(`Unsupported image type "${file.type || 'unknown'}". Use JPG, PNG, WebP, or HEIC.`)
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new ImageValidationError(`Image is too large (${Math.round(file.size / 1024 / 1024)}MB). Max is 25MB.`)
  }
}

async function decodeToBitmap(file: File): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(file)
  } catch {
    // HEIC/HEIF decoding isn't supported by every browser's canvas pipeline.
    throw new ImageValidationError(
      `This browser can't decode "${file.type}" for processing. Try a JPG/PNG/WebP export of this photo.`
    )
  }
}

function resizedDimensions(width: number, height: number, maxDimension: number) {
  if (width <= maxDimension && height <= maxDimension) return { width, height }
  const scale = maxDimension / Math.max(width, height)
  return { width: Math.round(width * scale), height: Math.round(height * scale) }
}

async function renderToWebp(bitmap: ImageBitmap, maxDimension: number, quality: number): Promise<Blob> {
  const { width, height } = resizedDimensions(bitmap.width, bitmap.height, maxDimension)
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(bitmap, 0, 0, width, height)

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  if (!blob) throw new Error('WebP encoding failed')
  return blob
}

export interface ProcessedImage {
  display: Blob
  thumbnail: Blob
  width: number
  height: number
  originalBytes: number
  processedBytes: number
}

export async function processImage(file: File): Promise<ProcessedImage> {
  validateImageFile(file)
  const bitmap = await decodeToBitmap(file)
  try {
    const [display, thumbnail] = await Promise.all([
      renderToWebp(bitmap, DISPLAY_MAX_DIMENSION, DISPLAY_QUALITY),
      renderToWebp(bitmap, THUMBNAIL_MAX_DIMENSION, THUMBNAIL_QUALITY),
    ])
    return {
      display,
      thumbnail,
      width: bitmap.width,
      height: bitmap.height,
      originalBytes: file.size,
      processedBytes: display.size,
    }
  } finally {
    bitmap.close()
  }
}

/** Crops a circular region from an image per the given center/zoom (used by
 *  the profile-photo cropper) and re-encodes it to WebP. `offsetX`/`offsetY`
 *  are in source-image pixels for the crop box's top-left corner. */
export async function cropAndEncode(
  file: File,
  crop: { sourceX: number; sourceY: number; sourceSize: number },
  outputSize = 720
): Promise<Blob> {
  validateImageFile(file)
  const bitmap = await decodeToBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(
      bitmap,
      crop.sourceX,
      crop.sourceY,
      crop.sourceSize,
      crop.sourceSize,
      0,
      0,
      outputSize,
      outputSize
    )
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp', 0.88))
    if (!blob) throw new Error('WebP encoding failed')
    return blob
  } finally {
    bitmap.close()
  }
}
