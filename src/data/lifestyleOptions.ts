/** Configurable lifestyle categories + option sets, collected during
 *  onboarding and stored as SelfProfile.lifestyle ({label, value}[]). */
export interface LifestyleCategory {
  label: string
  options: string[]
}

export const LIFESTYLE_CATEGORIES: LifestyleCategory[] = [
  { label: 'Drinking', options: ['Never', 'Rarely', 'Socially', 'Often'] },
  { label: 'Smoking', options: ['Never', 'Socially', 'Regularly', 'Trying to quit'] },
  { label: 'Exercise', options: ['Rarely', 'Sometimes', 'Often', 'Daily'] },
  { label: 'Diet', options: ['Omnivore', 'Vegetarian', 'Vegan', 'Pescatarian', 'Other'] },
  { label: 'Pets', options: ['Has pets', 'Wants pets', 'No pets', 'Not a pet person'] },
  { label: 'Children', options: ['Has children', 'No children'] },
  { label: 'Wants Children', options: ['Wants children', 'Open to it', 'Not sure', "Doesn't want children"] },
  { label: 'Living Situation', options: ['Lives alone', 'With roommates', 'With family', 'Other'] },
]
