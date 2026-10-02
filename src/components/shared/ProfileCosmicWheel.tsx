const PROFILE_COSMIC_WHEEL_ASSET = '/astrology/perennia-zodiac-wheel-blue-approved.png'

export function ProfileCosmicWheel() {
  return (
    <span className="profile-cosmic-wheel" aria-hidden="true">
      <img src={PROFILE_COSMIC_WHEEL_ASSET} alt="" draggable={false} />
    </span>
  )
}
