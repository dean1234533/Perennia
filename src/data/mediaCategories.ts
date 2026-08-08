export interface MediaCategoryDef {
  id: string
  label: string
  emoji: string
}

/** Default story-orbit categories seeded for every new member. Users can
 *  rename them (see `renameCategory` in mediaService.ts); custom names are
 *  persisted on `users/{uid}.categories`, not here. */
export const DEFAULT_MEDIA_CATEGORIES: MediaCategoryDef[] = [
  { id: 'moments', label: 'Moments', emoji: '✨' },
  { id: 'travel', label: 'Travel', emoji: '✈️' },
  { id: 'lifestyle', label: 'Lifestyle', emoji: '🌙' },
  { id: 'music', label: 'Music', emoji: '🎵' },
  { id: 'food', label: 'Food', emoji: '🍽️' },
  { id: 'hobbies', label: 'Hobbies', emoji: '🎨' },
  { id: 'memories', label: 'Memories', emoji: '📸' },
  { id: 'adventures', label: 'Adventures', emoji: '🏔️' },
]
