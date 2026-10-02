import { profileAstrologyAsset, type ProfileAstrologyKind } from '@/data/profileAstrologyAssets'

export function ProfileAstrologyIdentity({
  kind,
  value,
  label,
}: {
  kind: ProfileAstrologyKind
  value: string
  label: string
}) {
  const imageSrc = profileAstrologyAsset(kind, value)

  return (
    <span className="profile-astrology-identity">
      {imageSrc ? (
        <span
          className={`profile-astrology-artwork profile-astrology-artwork--${kind}`}
          aria-hidden="true"
        >
          <img src={imageSrc} alt="" draggable={false} />
        </span>
      ) : (
        <b aria-hidden="true">✦</b>
      )}
      <span><strong>{value}</strong><small>{label}</small></span>
    </span>
  )
}
