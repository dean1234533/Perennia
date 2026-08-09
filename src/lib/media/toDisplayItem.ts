import type { MediaDoc } from '@/lib/firestore'
import type { DisplayMediaItem } from '@/types/media'

/** Maps a real Firestore media doc to the shape the gallery/orbit/viewer
 *  components render — shared by MyProfile.tsx (the signed-in member's own
 *  media) and ProfileDetail.tsx (another real member's media), so both
 *  screens display real uploaded content identically. */
export function toDisplayItem(m: MediaDoc): DisplayMediaItem {
  return {
    id: m.id,
    url: m.url,
    thumbnailUrl: m.thumbnailUrl || m.video?.poster || '',
    category: m.category,
    type: m.type,
    caption: m.caption,
    processingStatus: m.processingStatus,
  }
}
