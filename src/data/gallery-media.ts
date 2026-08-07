// Verified editorial/lifestyle photography for profile galleries.
// Every URL was fetched and visually inspected before use. Shared across
// mock profiles for this prototype — real production media would be
// per-user uploads (see MediaPipeline notes in ProfileEdit).

export type GalleryCategory = 'moments' | 'videos' | 'travel' | 'highlights' | 'lifestyle' | 'favorites'

export interface GalleryItem {
  id: string
  url: string
  category: GalleryCategory
  isVideo?: boolean
  caption?: string
}

const pool = {
  travelBridge: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=1200&q=80&auto=format&fit=crop',
  natureField: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=1200&q=80&auto=format&fit=crop',
  foodBoard: 'https://images.unsplash.com/photo-1496412705862-e0088f16f791?w=1200&q=80&auto=format&fit=crop',
  petDogFlower: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&q=80&auto=format&fit=crop',
  fineDining: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=80&auto=format&fit=crop',
  petDogsRun: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&q=80&auto=format&fit=crop',
  candidHoodie: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=1200&q=80&auto=format&fit=crop',
  mountainSunset: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80&auto=format&fit=crop',
  lakeReflection: 'https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=1200&q=80&auto=format&fit=crop',
  petPuppy: 'https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=1200&q=80&auto=format&fit=crop',
  petCat: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=1200&q=80&auto=format&fit=crop',
  coupleGoldenLight: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=80&auto=format&fit=crop',
  handsTouching: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=1200&q=80&auto=format&fit=crop',
  citySkyline: 'https://images.unsplash.com/photo-1470219556762-1771e7f9427d?w=1200&q=80&auto=format&fit=crop',
  cinematicSunset: 'https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1200&q=80&auto=format&fit=crop',
}

/** Builds a consistent, varied gallery for a given profile using a seeded subset of the pool. */
export function buildGallery(seed: number): GalleryItem[] {
  const items: GalleryItem[] = [
    { id: 'm1', url: pool.candidHoodie, category: 'moments', caption: 'Sunday errands, unreasonably good mood' },
    { id: 'm2', url: pool.foodBoard, category: 'moments', caption: 'Cheese board o\'clock' },
    { id: 'm3', url: pool.fineDining, category: 'moments' },
    { id: 'v1', url: pool.mountainSunset, category: 'videos', isVideo: true, caption: 'Sunrise from the ridge' },
    { id: 'v2', url: pool.coupleGoldenLight, category: 'videos', isVideo: true },
    { id: 't1', url: pool.travelBridge, category: 'travel', caption: 'San Francisco, last spring' },
    { id: 't2', url: pool.mountainSunset, category: 'travel', caption: 'Above the clouds' },
    { id: 't3', url: pool.lakeReflection, category: 'travel', caption: 'A morning of doing absolutely nothing' },
    { id: 't4', url: pool.citySkyline, category: 'travel' },
    { id: 'h1', url: pool.cinematicSunset, category: 'highlights', caption: 'Best sunset of the year' },
    { id: 'h2', url: pool.natureField, category: 'highlights' },
    { id: 'h3', url: pool.lakeReflection, category: 'highlights' },
    { id: 'l1', url: pool.petDogFlower, category: 'lifestyle', caption: 'My shadow, most days' },
    { id: 'l2', url: pool.petDogsRun, category: 'lifestyle' },
    { id: 'l3', url: pool.petCat, category: 'lifestyle', caption: 'She runs the household' },
    { id: 'l4', url: pool.petPuppy, category: 'lifestyle' },
    { id: 'f1', url: pool.handsTouching, category: 'favorites', caption: 'A favourite kind of quiet' },
    { id: 'f2', url: pool.natureField, category: 'favorites' },
  ]

  // Rotate the array based on the seed so different profiles feel distinct
  // without needing entirely separate media sets.
  const offset = seed % items.length
  return [...items.slice(offset), ...items.slice(0, offset)]
}

function seedFromId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash
}

/** Deterministic per-profile gallery, so the same profile always shows the same media. */
export function getProfileGallery(id: string): GalleryItem[] {
  return buildGallery(seedFromId(id))
}

/** A wide, editorial cover image for the profile header — pulled from the travel/highlights pool. */
export function getCoverImage(id: string): string {
  const gallery = getProfileGallery(id)
  const cover = gallery.find((g) => g.category === 'highlights' || g.category === 'travel')
  return cover?.url ?? pool.cinematicSunset
}

export const GALLERY_TABS: { key: GalleryCategory; label: string; emoji: string }[] = [
  { key: 'moments', label: 'Moments', emoji: '📷' },
  { key: 'videos', label: 'Videos', emoji: '🎬' },
  { key: 'travel', label: 'Travel', emoji: '✈️' },
  { key: 'highlights', label: 'Highlights', emoji: '✨' },
  { key: 'lifestyle', label: 'Lifestyle', emoji: '🌿' },
  { key: 'favorites', label: 'Favorites', emoji: '💛' },
]
