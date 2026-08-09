/** Mock "your own" profile content — the editable side of the profile experience. */
export interface SelfProfile {
  about: string
  interests: string[]
  values: string[]
  lifestyle: { label: string; value: string }[]
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
  lifestyle: [],
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
