/** Official Perennia celestial-heart logo. The generous negative space is
 * part of the supplied artwork, so object-fit preserves it without crop or
 * recolouring. */
export function CelestialHeart({ className = 'h-20 w-20' }: { className?: string }) {
  return (
    <span className={`${className} inline-flex shrink-0 items-center justify-center overflow-hidden`}>
      <img
        src="/perennia-logo-transparent-v2.png?v=1"
        alt="Perennia"
        className="h-full w-full scale-[1.28] object-contain"
      />
    </span>
  )
}
