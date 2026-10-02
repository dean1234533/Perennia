import {
  Baby,
  BriefcaseBusiness,
  GraduationCap,
  Heart,
  HeartHandshake,
  Languages,
  Ruler,
  UsersRound,
  type LucideIcon,
} from 'lucide-react'
import type { ProfileAboutValues } from '@/data/profileAbout'

function formatHeight(cm: number) {
  const inches = Math.round(cm / 2.54)
  return `${Math.floor(inches / 12)}'${inches % 12}" (${cm} cm)`
}

function ProfileFact({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <p>
      <Icon aria-hidden="true" />
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  )
}

export function ProfileAboutFacts(values: ProfileAboutValues) {
  const languages = values.languages?.map((language) => language.trim()).filter(Boolean) ?? []

  return (
    <div className="profile-about-facts">
      {values.education?.trim() && <ProfileFact icon={GraduationCap} label="Education" value={values.education.trim()} />}
      {languages.length > 0 && <ProfileFact icon={Languages} label="Languages" value={languages.join(', ')} />}
      {values.profession?.trim() && <ProfileFact icon={BriefcaseBusiness} label="Job title" value={values.profession.trim()} />}
      {values.heightCm ? <ProfileFact icon={Ruler} label="Height" value={formatHeight(values.heightCm)} /> : null}
      {values.childrenStatus?.trim() && <ProfileFact icon={Baby} label="Children" value={values.childrenStatus.trim()} />}
      {values.wantsChildren?.trim() && <ProfileFact icon={UsersRound} label="Wants children" value={values.wantsChildren.trim()} />}
      {values.faithOrBeliefs?.trim() && <ProfileFact icon={Heart} label="Faith or beliefs" value={values.faithOrBeliefs.trim()} />}
      {values.maritalBackground?.trim() && <ProfileFact icon={HeartHandshake} label="Marital background" value={values.maritalBackground.trim()} />}
    </div>
  )
}
