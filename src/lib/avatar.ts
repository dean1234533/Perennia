const AVATARS = {
  male: 'https://images.unsplash.com/photo-1463453091185-61582044d556?w=300&q=80&auto=format&fit=crop',
  female: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=300&q=80&auto=format&fit=crop',
} as const

export function selfAvatarUrl(gender: 'male' | 'female' | ''): string {
  return gender === 'male' ? AVATARS.male : AVATARS.female
}
