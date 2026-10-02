export interface ProfileAboutValues {
  education?: string | null
  languages?: string[] | null
  profession?: string | null
  heightCm?: number | null
  childrenStatus?: string | null
  wantsChildren?: string | null
  faithOrBeliefs?: string | null
  maritalBackground?: string | null
}

export function hasProfileAboutValues(values: ProfileAboutValues) {
  return Boolean(
    values.education?.trim() ||
    values.languages?.some((language) => language.trim()) ||
    values.profession?.trim() ||
    values.heightCm ||
    values.childrenStatus?.trim() ||
    values.wantsChildren?.trim() ||
    values.faithOrBeliefs?.trim() ||
    values.maritalBackground?.trim()
  )
}
