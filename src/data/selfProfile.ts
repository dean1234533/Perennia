/** Public, editable profile content shared by the owner and visitor views.
 *  Sensitive lifestyle answers live separately (users/{uid}/private/lifestyle,
 *  see lib/firestore.ts) since they have a real privacy setting. */
export interface SelfProfile {
  about: string
  interests: string[]
  lifestyleVibe: string
  openToNewThings: boolean
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
  children: string
  wantsChildren: string
  maritalBackground: string
  location: string
}

/** True default for a brand-new real member — intentionally empty. Filling
 *  this in is a real, persisted edit the user makes in MyProfile; nothing
 *  here is presented as if it were their content. */
export const emptySelfProfile: SelfProfile = {
  about: '',
  interests: [],
  lifestyleVibe: '',
  openToNewThings: false,
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
  children: '',
  wantsChildren: '',
  maritalBackground: '',
  location: '',
}
