/** Mock "your own" profile content — the editable side of the profile experience.
 *  Lifestyle lives separately (users/{uid}/private/lifestyle, see
 *  lib/firestore.ts) since it's the one field with a real privacy setting —
 *  keeping it off this doc is what makes "private" actually private at the
 *  Firestore-rules level, not just hidden in the UI. */
export interface SelfProfile {
  about: string
  interests: string[]
  values: string[]
  music: string[]
  languages: string[]
  favoritePlaces: string[]
  dreamDestinations: string[]
  fitness: string
  books: string
  movies: string
  goals: string
  profession: string
  education: string
  location: string
}

/** True default for a brand-new real member — intentionally empty. Filling
 *  this in is a real, persisted edit the user makes in MyProfile; nothing
 *  here is presented as if it were their content. */
export const emptySelfProfile: SelfProfile = {
  about: '',
  interests: [],
  values: [],
  music: [],
  languages: [],
  favoritePlaces: [],
  dreamDestinations: [],
  fitness: '',
  books: '',
  movies: '',
  goals: '',
  profession: '',
  education: '',
  location: '',
}
