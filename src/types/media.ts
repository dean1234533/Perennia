/** Shared shape between real uploaded media (MediaDoc, from Firestore) and
 *  the bundled seed/demo profiles' gallery data — lets MasonryGallery and
 *  FullscreenMediaViewer work for both without caring which one it is. */
export interface DisplayMediaItem {
  id: string
  url: string
  thumbnailUrl: string
  category: string
  type: 'image' | 'video'
  caption?: string
  processingStatus?: 'processing' | 'ready' | 'error'
}

export interface DisplayCategory {
  id: string
  label: string
  emoji: string
}
