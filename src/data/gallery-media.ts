// Verified editorial/lifestyle photography for the bundled SEED/DEMO
// profiles only (Amara, Julian, Sienna, Theo, Isabelle, Marcus) — these are
// the one seeded demo account's discovery pool, clearly separate from real
// user data. A real member's own profile never reads from this file; it
// reads their actual uploads from Firestore (see lib/media/mediaService.ts).
// Every URL was fetched and visually inspected before use. Uses the same
// category taxonomy as real uploads (see data/mediaCategories.ts) so both
// share one MasonryGallery/FullscreenMediaViewer implementation.
import type { DisplayMediaItem } from '@/types/media'
import { DEFAULT_MEDIA_CATEGORIES } from './mediaCategories'

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

function img(id: string, url: string, category: string, caption?: string): DisplayMediaItem {
  return { id, url, thumbnailUrl: url, category, type: 'image', caption, processingStatus: 'ready' }
}

function buildGallery(seed: number): DisplayMediaItem[] {
  const items: DisplayMediaItem[] = [
    img('m1', pool.candidHoodie, 'moments', "Sunday errands, unreasonably good mood"),
    img('m2', pool.foodBoard, 'moments', 'Cheese board o\'clock'),
    img('m3', pool.fineDining, 'moments'),
    img('t1', pool.travelBridge, 'travel', 'San Francisco, last spring'),
    img('t2', pool.mountainSunset, 'travel', 'Above the clouds'),
    img('t3', pool.lakeReflection, 'travel', 'A morning of doing absolutely nothing'),
    img('t4', pool.citySkyline, 'travel'),
    img('mem1', pool.cinematicSunset, 'memories', 'Best sunset of the year'),
    img('mem2', pool.natureField, 'memories'),
    img('mem3', pool.lakeReflection, 'memories'),
    img('l1', pool.petDogFlower, 'lifestyle', 'My shadow, most days'),
    img('l2', pool.petDogsRun, 'lifestyle'),
    img('l3', pool.petCat, 'lifestyle', 'She runs the household'),
    img('l4', pool.petPuppy, 'lifestyle'),
    img('a1', pool.handsTouching, 'adventures', 'A favourite kind of quiet'),
    img('a2', pool.natureField, 'adventures'),
    img('f1', pool.coupleGoldenLight, 'food', 'Golden-hour dinner'),
    img('h1', pool.foodBoard, 'hobbies'),
  ]

  const offset = seed % items.length
  return [...items.slice(offset), ...items.slice(0, offset)]
}

function seedFromId(id: string): number {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0
  return hash
}

/** Deterministic per-profile gallery, so the same demo profile always shows the same media. */
export function getProfileGallery(id: string): DisplayMediaItem[] {
  return buildGallery(seedFromId(id))
}

/** A wide, editorial cover image for the profile header — pulled from the travel/memories pool. */
export function getCoverImage(id: string): string {
  const gallery = getProfileGallery(id)
  const cover = gallery.find((g) => g.category === 'memories' || g.category === 'travel')
  return cover?.url ?? pool.cinematicSunset
}

export const DEMO_GALLERY_CATEGORIES = DEFAULT_MEDIA_CATEGORIES
